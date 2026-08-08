# Auth Documentation — Magie Klayn Admin Authentication

> Full audit of the admin authentication system, generated from a direct read of every auth-related file in this repository. If this document and the code ever disagree, the code wins — but please update this file when that happens (see `CLAUDE.md`'s Documentation Sync Policy).

There is exactly **one role** in this application: `admin`. There is no customer-account system — checkout is fully anonymous (see `PROJECT_DOCUMENTATION.md` §9). Everything in this document concerns the single `/admin` back-office and the API routes it depends on.

---

## 1. Overview

Magie Klayn needed a login for exactly one privileged user type (the store owner/admin), backed by a database the app already depended on (Supabase), without hand-rolling a full session/cookie/JWT system from scratch.

The chosen design is a **hybrid**:

- **`admin_users`** (a plain Postgres table, own schema, `bcrypt`-hashed passwords) is the **real source of truth** for "who is allowed to log in." This is what a login attempt is actually checked against.
- **Supabase Auth** is used purely as a session-cookie mechanism. On every successful login, the app silently creates or updates a matching **shadow user** inside Supabase's own `auth.users` table, using a password the app computes deterministically from the admin's email — then signs in against Supabase with that computed password, purely to get Supabase's `@supabase/ssr` cookie-session machinery "for free."

In other words: `admin_users` decides *if* you can log in; Supabase Auth exists only to hand out and verify the resulting session cookie. Every protected route re-checks *both* — see §5 and §6.

This buys real convenience (no custom cookie/JWT code to write or maintain) at the cost of a genuinely awkward, security-relevant workaround: the "synthetic password" bridging the two systems (§4). The code's own comment calls this out directly:

```ts
// Simple consistent password for Supabase Auth
// In production, use a more secure approach
```
— `src/infrastructure/auth/supabase-auth.ts:19-20`

---

## 2. Architecture at a Glance

All auth logic lives in **one file**: `src/infrastructure/auth/supabase-auth.ts` (218 lines). Nothing elsewhere in the app talks to Supabase Auth or `admin_users` directly — every consumer goes through this module's exports.

Three different Supabase client constructions exist inside it, each with a distinct purpose and privilege level:

| Client | Function | Key used | Cookie-aware? | Purpose |
|---|---|---|---|---|
| Cookie-bound client | `createAuthClient()` (28-47, **exported**) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon/publishable) | Yes — wired to `next/headers` `cookies()` | Real login sessions (`signInWithPassword`), session checks (`getUser()`), sign-out. This is the client that actually sets/reads the browser's session cookies. |
| Service-role client | `createAdminClient()` (52-59, **module-private, never exported**) | `SUPABASE_SERVICE_ROLE_KEY` (full-privilege service key) | No — `autoRefreshToken: false`, `persistSession: false` | User-management only: listing/creating/updating the shadow Supabase Auth user inside `adminLogin`. Never touches cookies, never leaves this module. |
| One-off manual client | inside `isAuthenticated()` (198-217) | anon/publishable key | Partially — manually constructed around a single cookie value | A leftover helper "for middleware" (its own doc comment says so). **Unused** — no middleware file exists anywhere in the project to call it (confirmed: no `middleware.ts`/`proxy.ts` at project root or `src/`). |

`admin_users` (Postgres, via Drizzle — see §8) and Supabase's own `auth.users` (managed entirely by Supabase, opaque to this app) are correlated **only by matching email strings in application code** — there is no foreign key or database-level link between them (`PROJECT_DOCUMENTATION.md` §7 confirms this independently). A row can exist in one and not the other; the app's own logic is what keeps them roughly in sync (see §3, §10).

---

## 3. The Login Flow, Step by Step

Entry point: `app/admin/login/page.tsx`, a client component rendering a form (`data-testid="login-form"`) with email/password fields. Its `handleSubmit` calls the `loginAdmin` server action.

1. **Form submit → server action.** `app/admin/actions.ts`:
   ```ts
   export async function loginAdmin(email: string, password: string) {
     const result = await adminLogin(email, password);
     if (result.success) {
       revalidatePath("/admin");
     }
     return result;
   }
   ```
   A thin wrapper — all real logic is in `adminLogin`.

2. **Look up the admin by email.** `adminLogin` (`supabase-auth.ts:110-184`) queries `admin_users` for a row matching the submitted email (113-117). If none exists, it returns a **generic** `"Invalid email or password"` error (120) — it does not reveal whether the email itself was wrong, which is the correct practice for not leaking which emails are valid admin accounts.

3. **Verify the password with bcrypt.** `bcrypt.compare(password, admin[0].passwordHash)` (124-127). Same generic error on mismatch (129-131).

4. **Compute the synthetic Supabase password.** `const supabasePassword = getSupabaseAuthPassword(email);` (135) — see §4 for exactly what this is.

5. **Find or create the shadow Supabase Auth user.** Using the service-role `createAdminClient()` (134):
   - Lists all Supabase Auth users and looks for one matching this email (138-139).
   - **If found**: force-resets that user's password to the freshly computed synthetic password via `updateUserById` (143-146) — *every single login* re-syncs it, unconditionally. If this update fails, the error is logged but login **continues anyway** (148-151, comment: `"Continue anyway - might still work"`).
   - **If not found**: creates a new Supabase Auth user with `email_confirm: true` and `user_metadata: { role: "admin" }` (154-159). If creation fails for any reason other than "already been registered," login is aborted with `"Authentication setup failed"` (161-164).

6. **Sign in for real, to set cookies.** Using the *cookie-bound* `createAuthClient()` (not the service-role one), the app calls `signInWithPassword({ email, password: supabasePassword })` (168-172). This is the step that actually writes the Supabase session cookies into the response, via the `setAll` cookie handler wired up in `createAuthClient()` (36-40).

7. **Return success/failure.** `{ success: true, user: data.user }` on success (179), or the specific `signInError.message` if the sign-in itself failed (174-177). Any unexpected exception anywhere in the function is caught and returned as `{ success: false, error: error.message || "An error occurred" }` (180-183).

8. **Client-side redirect.** Back in `app/admin/login/page.tsx`, on `result.success` the form does `router.push(callbackUrl); router.refresh();` (default `callbackUrl` is `/admin`). On failure, it displays `result.error` in a `data-testid="login-error"` alert box.

A subtle but important detail: **step 5 always runs before step 6**, and step 5's shadow-user password reset happens *unconditionally* on every login (not just the first). This means the shadow user's Supabase Auth password is always freshly synced to `getSupabaseAuthPassword(email)` immediately before the real sign-in — a self-healing mechanism that also happens to paper over the `fix-auth.ts` drift issue described in §10.

---

## 4. The Synthetic Password: What and Why

```ts
// supabase-auth.ts:21-23
function getSupabaseAuthPassword(email: string) {
  return `auth_${email}_fixed_password_v1`;
}
```

**What it is**: a password for the *shadow Supabase Auth user*, computed deterministically from nothing but the admin's email address. It is never chosen by a human, never stored anywhere as a "real" credential, and has no relationship to the actual login password a human types in (that's checked separately against `admin_users.passwordHash`, in step 3 of §3).

**Why it exists**: Supabase Auth's `signInWithPassword` needs *some* password to authenticate against, but this app doesn't want two independently-set passwords (one bcrypt-hashed in `admin_users`, one set inside Supabase) that could drift out of sync or need separately managing. The fix chosen here is to make the Supabase-side password **computable from public information (the email) plus this fixed source code** — so the app never has to remember or store it; it just recomputes and re-syncs it on every login (§3 step 5).

**The security implication — read this carefully**: because the template is fully deterministic and the source code is available to anyone with repository access (and this exact pattern, once known, is guessable even without repo access), **anyone who knows an admin's email and this template can compute their Supabase Auth password.** That is a genuinely weak credential by design — it is *not* a secret in any meaningful sense.

**Why this hasn't been a real-world breach vector so far — the containment layer**: `getAdminSession()` (§5) does not trust a valid Supabase session alone. It additionally re-checks that the session's email exists in `admin_users`. So even if someone computed the synthetic password and signed in directly against Supabase's own auth endpoint (bypassing `adminLogin`/`bcrypt` entirely), `getAdminSession()` would still deny them access to any API route **unless their email also happens to be a real row in `admin_users`** — which is the actual gate that matters.

**Where this containment does *not* apply**: the dashboard *page* layout (`app/admin/(dashboard)/layout.tsx`) does **not** call `getAdminSession()` — it only checks `createAuthClient().auth.getUser()`. See §6 and §10 for why this specific gap matters in combination with the synthetic-password weakness.

---

## 5. Session Verification

Three related functions exist; only one is actually used in practice.

### `getAdminSession()` — the real gate (64-91)

```ts
export async function getAdminSession() {
  const supabase = await createAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Verify user exists in admin_users table
  const admin = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, user.email!))
    .limit(1);

  if (admin.length === 0) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    role: "admin",
  };
}
```

Two-step check, **in this exact order**:
1. Is there a valid Supabase session at all? (`getUser()` — this validates the session cookie against Supabase's own servers, it's not just reading a cookie value blindly.)
2. **Only if step 1 passes**, is that session's email present in `admin_users`?

Both must pass. If either fails, `null` is returned — callers treat `null` as "not authenticated" uniformly. This is the function every protected API route calls (§6).

### `requireAdmin()` — defined, unused (96-104)

```ts
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
```
A convenience wrapper that would redirect instead of returning `null`. **Confirmed zero call sites anywhere else in the repository.** Dead code — worth knowing about so a future reader doesn't assume it's part of the active protection path.

### `isAuthenticated()` — defined, unused, and weaker (198-217)

Manually reads an `sb-access-token` cookie and checks it against Supabase, entirely independent of the `createAuthClient()`/`getAdminSession()` pattern. Its own doc comment says `"for middleware"` — but **no middleware file exists in this project** (confirmed: no `middleware.ts` or `proxy.ts` anywhere outside `node_modules`). It also does **not** cross-check `admin_users`, so even if it were wired up today it would be a strictly weaker gate than `getAdminSession()`. Dead code, and a landmine if someone resurrects it thinking it's equivalent to the real gate.

---

## 6. Route Protection

There is **no shared authentication middleware** anywhere in this project — this is a deliberate architectural choice, confirmed and documented independently in `CLAUDE.md`: *"No shared auth middleware — every admin-only route calls `getAdminSession()` inline."* Protection is split into two independently-implemented layers that are **not equivalent to each other**:

### Page-level protection — `app/admin/(dashboard)/layout.tsx`

```tsx
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }
  // ...renders AdminSidebarWrapper + children
}
```

**This is a real gap, not a stylistic choice**: this layout checks *only* that a valid Supabase session exists. It does **not** call `getAdminSession()` and does **not** re-verify `admin_users` membership. Every page under the `(dashboard)` route group (the whole `/admin` UI except `/admin/login`) is gated by this weaker check alone.

**Why it matters**: if an admin's row is ever deleted from `admin_users` (revoking their access, the intended way to do so — see §9), their existing Supabase session cookie is still valid and will still pass *this* layout's check. They would still be able to view dashboard pages — the sidebar, the shell, any client-side-rendered data already in the page — right up until they trigger an API call, at which point every one of those calls (§6, API-level table below) correctly rejects them via `getAdminSession()`'s `admin_users` re-check. The practical blast radius today is limited (a revoked admin sees UI shells but no live data, since the pages fetch their real data from the protected API routes), but it is a real, documented inconsistency between two gates that are supposed to enforce the same policy.

### API-level protection — inline `getAdminSession()` checks

Every admin-only API route repeats the same three-line pattern at the very top of its handler, before any other logic:

```ts
const admin = await getAdminSession();
if (!admin) {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
```

Confirmed present in **all** of the following (no gaps found):

| Route | Method(s) | File |
|---|---|---|
| Upload | `POST` | `app/api/upload/route.ts` |
| Create product | `POST` | `app/api/products/route.ts` |
| Update / delete product | `PUT`, `DELETE` | `app/api/products/[id]/route.ts` |
| List orders (admin) | `GET` | `app/api/orders/route.ts` |
| Get / update / delete order | `GET`, `PUT`, `DELETE` | `app/api/orders/[id]/route.ts` |
| Order stats | `GET` | `app/api/orders/stats/route.ts` |
| List all products (incl. inactive) | `GET` | `app/api/admin/products/route.ts` |

Public, unauthenticated routes (`GET /api/products`, `GET /api/products/[id]`, `POST /api/orders` — public checkout, `GET /api/delivery/*`) correctly have no such check, by design.

---

## 7. Logout Flow

```ts
// supabase-auth.ts:189-193
export async function adminLogout() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

Called via the `logoutAdmin` server action in `app/admin/actions.ts` (a one-line wrapper). `signOut()` invalidates the Supabase session (clearing/expiring the session cookies via the same cookie handlers `createAuthClient()` wired up); the subsequent `redirect` sends the browser back to the login page. Nothing here touches `admin_users` — logout only affects the Supabase-Auth side of the hybrid.

---

## 8. Password Storage

`admin_users` table (`src/infrastructure/db/schema.ts:160-165`):

```ts
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

No foreign keys in or out. `bcryptjs` (`^3.0.3` in `package.json`) is the sole password-hashing dependency in the entire repository, and it is used in exactly one place: `bcrypt.compare(password, admin[0].passwordHash)` inside `adminLogin` (§3 step 3).

**There is no `bcrypt.hash()` call anywhere in the application code** (`app/`, `src/`, or `scripts/`) — confirmed by a full-repo grep. This means:
- There is **no self-serve admin signup UI** and no in-app "create admin" or "reset password" flow.
- New admin rows (and their bcrypt hashes) must be inserted directly against the database out-of-band — e.g. via a one-off script or the Supabase/Postgres dashboard, hashing the chosen password with `bcryptjs` separately before inserting.

---

## 9. Cookie & Session Management

All session-cookie behavior — issuance, format, expiry, and refresh — is **fully delegated to Supabase Auth's defaults** via the `@supabase/ssr` package's `createServerClient`. This app writes no custom expiry, no custom rotation logic, and no idle-timeout logic anywhere.

Practical consequences worth knowing:
- **No session invalidation on password change.** If an admin's `admin_users.passwordHash` is changed directly in the database (e.g. to lock them out), any Supabase session they already hold **remains valid** until it naturally expires per Supabase's own token lifetime — because `getAdminSession()` only checks that the session's email is *present* in `admin_users`, not that any hash or version number matches. The only way to immediately revoke access is to delete their `admin_users` row entirely (which `getAdminSession()` — but not the dashboard layout, see §6 — will notice on their very next request).
- **No custom CSRF token.** Login and logout are both implemented as Next.js Server Actions (`app/admin/actions.ts`), invoked from client components. There is no explicit CSRF token generated or checked anywhere in this code; protection against cross-site submission relies entirely on Next.js's own built-in Server Action origin-checking, not on anything this app added itself.
- **No rate-limiting or brute-force protection on login.** `adminLogin` has no attempt counter, lockout, exponential backoff, or IP/account throttling of any kind. A confirmed full-repo grep for rate-limiting logic only turns up unrelated code (the Yalidine courier API client's own outbound rate-limiting, nothing to do with login).

---

## 10. Known Security Gaps & Risks

Ranked roughly by how directly exploitable each is, given everything above:

1. **The synthetic Supabase password is a guessable, non-secret credential by design** (§4). Its only real protection is that `getAdminSession()` cross-checks `admin_users` — so this is contained *today*, but it's a landmine: any future code path that trusts a Supabase session without also checking `admin_users` inherits this weakness immediately. (This has already happened once — see #2.)
2. **The dashboard page layout is a weaker gate than every API route** (§6). It grants page access on a Supabase session alone, without the `admin_users` cross-check that closes gap #1. A revoked-but-still-Supabase-session-holding user gets further into the UI than intended, even though they can't pull live data.
3. **`scripts/fix-auth.ts` uses a *different, incompatible* synthetic-password formula** than `supabase-auth.ts`'s own `getSupabaseAuthPassword()`:

   | | `supabase-auth.ts` | `scripts/fix-auth.ts` (line 55) |
   |---|---|---|
   | Template | `` `auth_${email}_fixed_password_v1` `` | `` `admin_${email}_secret_${SERVICE_ROLE_KEY.slice(0,10)}` `` |

   Running this script deletes and recreates the shadow Supabase Auth user with a password `adminLogin()` cannot itself reproduce — the *next real login* self-heals it via the update-password branch (§3 step 5), but there's a window where the shadow user's password matches neither scheme a developer might expect. The script's own final log line, `"Password: admin123"`, is also misleading — it refers to the `admin_users.passwordHash` value a developer is expected to already know, not either synthetic-password formula, and reads as if it's telling you the login credential when it's really just a hint. This script appears **stale relative to the current `supabase-auth.ts` implementation** and should be treated with caution, not assumed correct.
4. **No rate-limiting or brute-force protection on login** (§9). `adminLogin` will happily `bcrypt.compare` against an unlimited number of guesses with no delay or lockout.
5. **No app-level CSRF token** (§9) — relies entirely on Next.js's framework-level Server Action protection, with no additional layer this app controls.
6. **No session expiry/rotation/revocation-on-password-change logic** (§9) — a changed `admin_users.passwordHash` does not invalidate sessions already issued under the old one.
7. **The login page itself displays default credentials**: `app/admin/login/page.tsx` renders the hint text `"Default: admin@magieklayn.com / admin123"` directly on the page. If this is ever deployed with real default credentials still active, this is a direct, visible pointer to them for anyone who loads `/admin/login`.

---

## 11. Recommendations

In rough priority order:

1. **Retire the synthetic-password bridge.** Either (a) go fully Supabase-Auth-native — store admins as real Supabase Auth users with real, independently-set passwords, and drop `admin_users`/bcrypt entirely — or (b) drop the Supabase Auth dependency for admin sessions altogether and issue a custom signed cookie tied directly to `admin_users`. The current hybrid is more code and more moving parts than either alternative, for no actual security benefit over them (this mirrors `PROJECT_DOCUMENTATION.md`'s own architecture-decision retrospective on this exact point).
2. **Close the dashboard-layout gap**: have `app/admin/(dashboard)/layout.tsx` call `getAdminSession()` (or at minimum, re-run the same `admin_users` check it does) instead of just `createAuthClient().auth.getUser()`, so page access and API access enforce the identical policy.
3. **Fix or delete `scripts/fix-auth.ts`**: either update its password formula to call `getSupabaseAuthPassword()` from `supabase-auth.ts` directly (single source of truth), or remove the script if it's no longer needed now that `adminLogin` self-heals the shadow user's password on every login.
4. **Add basic login rate-limiting** — even a simple in-memory or DB-backed attempt counter with a short lockout window would close the current unlimited-guessing gap.
5. **Remove the hardcoded default-credentials hint** from the production build of the login page, or gate it behind a development-only environment check.
6. **Consider session revocation on password change** — e.g. by having `getAdminSession()` also compare a stored session-issued-at timestamp against `admin_users.updatedAt` (would require adding that column), so changing a password actually invalidates existing sessions rather than just blocking new ones after a full `admin_users` deletion.

---

## 12. Environment Variables Reference

| Variable | Exposure | Used by | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Client-exposed** (`NEXT_PUBLIC_` prefix — bundled into the browser) | `createAuthClient()`, `createAdminClient()`, `isAuthenticated()` | Just a project URL; non-sensitive by design. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Client-exposed** (`NEXT_PUBLIC_` prefix) | `createAuthClient()`, `isAuthenticated()` | Supabase's anon/publishable key — meant to be public; security relies on Supabase's own access rules (Row Level Security) and this app's `admin_users` checks, not on this key being secret. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** (no `NEXT_PUBLIC_` prefix — never sent to the browser) | `createAdminClient()` only | Full-privilege key, bypasses Supabase's own access rules entirely. Correctly confined to the module-private `createAdminClient()`, never exported, never used outside `adminLogin`'s user-management calls. **Never read or echo this value into chat, logs, or generated files.** |

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **`admin_users`** | The Postgres table this app actually authenticates real login attempts against — email + bcrypt password hash. The genuine source of truth for "who can log in." |
| **Shadow user** | The Supabase Auth user (`auth.users` row, managed entirely by Supabase) this app silently creates/updates for each admin, purely to obtain a Supabase session — not the same account as its `admin_users` row, only correlated by matching email. |
| **Synthetic password** | The deterministic, email-derived password (`` `auth_${email}_fixed_password_v1` ``) used to sign the shadow user into Supabase Auth. Never typed by a human, never the real login credential — see §4. |
| **Anon / publishable key** | Supabase's low-privilege API key, safe to expose to browsers, whose access is meant to be constrained by Supabase's Row Level Security policies (or, as here, by this app's own `admin_users` checks layered on top). |
| **Service-role key** | Supabase's highest-privilege API key — bypasses Row Level Security entirely. Must never be exposed client-side; in this app it's confined to `createAdminClient()`. |
| **RLS (Row Level Security)** | Postgres/Supabase's built-in per-row access-control mechanism. Not directly relevant to this app's own `admin_users` table (which has no RLS policies of its own — access is gated entirely in application code), but is the mechanism the anon key's safety normally depends on for Supabase-native tables. |
| **`getAdminSession()`** | The single real access-control gate for API routes: valid Supabase session **and** matching `admin_users` row. See §5. |
