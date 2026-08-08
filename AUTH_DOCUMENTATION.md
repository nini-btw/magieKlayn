# Auth Documentation — Magie Klayn Admin Authentication

> Full audit of the admin authentication system, generated from a direct read of every auth-related file in this repository. If this document and the code ever disagree, the code wins — but please update this file when that happens (see `CLAUDE.md`'s Documentation Sync Policy).

There is exactly **one role** in this application: `admin`. There is no customer-account system — checkout is fully anonymous (see `PROJECT_DOCUMENTATION.md` §9). Everything in this document concerns the single `/admin` back-office and the API routes it depends on.

---

## 1. Overview

Magie Klayn needed a login for exactly one privileged user type (the store owner/admin), backed by a database the app already depended on (Supabase), without hand-rolling a full session/cookie/JWT system from scratch.

The chosen design is a **hybrid**:

- **`admin_users`** (a plain Postgres table, own schema, `bcrypt`-hashed passwords) is the **real source of truth** for "who is allowed to log in." This is what a login attempt is actually checked against.
- **Supabase Auth** is used purely as a session-cookie mechanism. On every successful login, the app creates or updates a matching **shadow user** inside Supabase's own `auth.users` table, using a random secret unique to that admin — generated once (first login after `admin_users.supabase_auth_secret` is added/empty) and reused thereafter — then signs in against Supabase with that secret, purely to get Supabase's `@supabase/ssr` cookie-session machinery "for free."

In other words: `admin_users` decides *if* you can log in; Supabase Auth exists only to hand out and verify the resulting session cookie. Every protected route re-checks *both* — see §5 and §6.

This buys real convenience (no custom cookie/JWT code to write or maintain) at the cost of a genuinely awkward workaround: the secret bridging the two systems (§4). **This used to be a security-relevant weakness** — a deterministic, email-derived password rather than a real secret — which has since been fixed; §4 covers both the current mechanism and that history.

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

4. **Resolve this admin's shadow-user secret.** Reads `admin[0].supabaseAuthSecret`; if empty (first login since the column existed, or a brand-new admin), generates a fresh `crypto.randomBytes(32).toString("hex")` secret — see §4 for exactly what this is and why it replaced the old deterministic formula.

5. **Find or create the shadow Supabase Auth user.** Using the service-role `createAdminClient()`:
   - Lists all Supabase Auth users and looks for one matching this email.
   - **If found**: only sets that user's password to the newly generated secret **when this is a first-time secret** (`isFirstTimeSecret`) — an already-established secret is *not* re-pushed to Supabase on every login anymore. If the update does run and fails, the error is logged but login **continues anyway** (comment: `"Continue anyway - might still work"`).
   - **If not found**: creates a new Supabase Auth user with `email_confirm: true` and `user_metadata: { role: "admin" }`, using the (first-time) secret as its password. If creation fails for any reason other than "already been registered," login is aborted with `"Authentication setup failed"`.
   - If this was a first-time secret, it's then persisted to `admin_users.supabaseAuthSecret` via a Drizzle `update`.

6. **Sign in for real, to set cookies.** Using the *cookie-bound* `createAuthClient()` (not the service-role one), the app calls `signInWithPassword({ email, password: supabasePassword })`. This is the step that actually writes the Supabase session cookies into the response, via the `setAll` cookie handler wired up in `createAuthClient()`.

7. **Return success/failure.** `{ success: true, user: data.user }` on success, or the specific `signInError.message` if the sign-in itself failed. Any unexpected exception anywhere in the function is caught and returned as `{ success: false, error: error.message || "An error occurred" }`.

8. **Client-side redirect.** Back in `app/admin/login/page.tsx`, on `result.success` the form does `router.push(callbackUrl); router.refresh();` (default `callbackUrl` is `/admin`). On failure, it displays `result.error` in a `data-testid="login-error"` alert box.

**A behavior change worth flagging**: step 5's shadow-user password sync used to run *unconditionally on every login*, which incidentally self-healed any drift (e.g. from `scripts/fix-auth.ts` setting a different password directly). That's no longer true — the secret is written to Supabase exactly once, at generation time, and never touched again. See §10.3 for why this makes `scripts/fix-auth.ts` more dangerous to run than it used to be.

---

## 4. The Shadow-User Secret: What and Why

**RESOLVED as of migration `0013`** — this section previously described a deterministic, guessable password scheme. That's fixed; the mechanism and the history are both documented below so the reasoning isn't lost.

### Current mechanism

```ts
// supabase-auth.ts, inside adminLogin()
let supabasePassword = admin[0].supabaseAuthSecret;
const isFirstTimeSecret = !supabasePassword;
if (!supabasePassword) {
  supabasePassword = randomBytes(32).toString("hex");
}
// ...create/update the Supabase Auth user's password with it, only on
// isFirstTimeSecret — then persist it to admin_users.supabaseAuthSecret
```

**What it is**: a random 32-byte secret (`crypto.randomBytes`), one per admin, stored in the new `admin_users.supabase_auth_secret` column (nullable — `null` until an admin's first login after the column existed). Generated exactly once per admin and reused on every subsequent login; **never re-derived from the email and never overwritten** once set. Still has no relationship to the actual login password a human types in (that's checked separately against `admin_users.passwordHash`, in step 3 of §3).

**Why this design**: keeps the same convenience the old scheme wanted (the app never needs a human to separately manage a second password) without the password being computable from public information. The randomness lives in a DB column instead of a source-code formula, so knowing the email and reading the code no longer gets you anywhere.

### Historical context — the deterministic scheme this replaced

```ts
// supabase-auth.ts (removed)
function getSupabaseAuthPassword(email: string) {
  return `auth_${email}_fixed_password_v1`;
}
```

This computed the shadow password deterministically from nothing but the admin's email, and `adminLogin()` re-ran `updateUserById` to overwrite the Supabase Auth user's password to this value **on every single login** — meaning even a manual workaround (setting a different password directly on the Supabase Auth user) would get silently reverted the next time anyone logged in through the app. Because the template was fully deterministic and the source was readable by anyone with repo access, **anyone who knew an admin's email and this template could compute their Supabase Auth password** and sign in directly against Supabase's own auth endpoint — bypassing `adminLogin`/`bcrypt` entirely. It was contained only by `getAdminSession()`'s independent `admin_users` re-check (§5) and, for a period, undermined further by the dashboard-layout gap (§6, also since resolved) which didn't perform that re-check at the page level.

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

**RESOLVED** (previously the single biggest gap in this document — see the rest of this subsection for the historical context). The layout now calls `requireAdmin()`:

```tsx
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  // ...renders AdminSidebarWrapper + children
}
```

`requireAdmin()` wraps `getAdminSession()` — meaning it now re-verifies `admin_users` membership, not just "has a valid Supabase session" — and redirects to `/admin/login` itself if that check fails. `/api-docs` (the Swagger UI console, capable of executing real admin requests via the ambient session cookie) got the same treatment via its own `app/api-docs/layout.tsx`.

**What this used to say, for context**: this layout previously checked *only* that a valid Supabase session existed (`createAuthClient().auth.getUser()`), without re-verifying `admin_users` membership — meaning a revoked admin (row deleted from `admin_users`) whose Supabase session cookie was still valid could still view the dashboard shell, though every API call would still correctly reject them via `getAdminSession()`'s re-check. That inconsistency is what's fixed above.

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

1. ~~The synthetic Supabase password is a guessable, non-secret credential by design~~ (§4) — **RESOLVED.** Replaced with a random per-admin secret (`admin_users.supabase_auth_secret`), generated once and reused, no longer derivable from the email.
2. ~~The dashboard page layout is a weaker gate than every API route~~ (§6) — **RESOLVED.** Now calls `requireAdmin()`, same `admin_users` re-check every API route already performs.
3. **`scripts/fix-auth.ts` uses a *different, incompatible* password formula** than `supabase-auth.ts`, and its assumptions are now more badly out of date than before: it still writes its own computed password directly onto the shadow Supabase Auth user, but `adminLogin()` **no longer overwrites the Supabase Auth password on every login** — only the first time (when `admin_users.supabase_auth_secret` is empty). So running this script today would desync the shadow user's actual Supabase password from the value stored in `admin_users.supabase_auth_secret`, and **the old self-healing "next login fixes it" behavior no longer applies** — the mismatch would persist until `supabase_auth_secret` is manually cleared (forcing `adminLogin()` to regenerate) or the script itself is fixed to read/write that column. This script should be treated as **stale and unsafe to run** until updated or removed; see recommendation §11.3.
4. **No rate-limiting or brute-force protection on login** (§9). `adminLogin` will happily `bcrypt.compare` against an unlimited number of guesses with no delay or lockout.
5. **No app-level CSRF token** (§9) — relies entirely on Next.js's framework-level Server Action protection, with no additional layer this app controls.
6. **No session expiry/rotation/revocation-on-password-change logic** (§9) — a changed `admin_users.passwordHash` does not invalidate sessions already issued under the old one.
7. **The login page itself displays default credentials**: `app/admin/login/page.tsx` renders the hint text `"Default: admin@magieklayn.com / admin123"` directly on the page. If this is ever deployed with real default credentials still active, this is a direct, visible pointer to them for anyone who loads `/admin/login`.

---

## 11. Recommendations

In rough priority order:

1. ~~Retire the synthetic-password bridge~~ — **DONE (partially).** The deterministic email-derived password is gone, replaced with a random per-admin secret stored in `admin_users.supabase_auth_secret`. The *architectural* critique still stands, though — the hybrid two-system design (Supabase Auth session cookies + a separate `admin_users`/bcrypt source of truth) remains more code and more moving parts than either going fully Supabase-Auth-native or dropping Supabase Auth for a custom signed cookie tied directly to `admin_users`. That larger redesign is still open, just no longer urgent now that the specific guessable-credential weakness is fixed.
2. ~~Close the dashboard-layout gap~~ — **DONE.** `app/admin/(dashboard)/layout.tsx` now calls `requireAdmin()`.
3. **Fix or delete `scripts/fix-auth.ts`** — now higher-priority than before (§10.3): its hardcoded formula no longer matches how `adminLogin()` manages the shadow password at all, and the previous "next login self-heals it" safety net no longer applies since the password isn't overwritten every login anymore. Either update it to read/write `admin_users.supabase_auth_secret` the same way `adminLogin()` does, or delete it if it's no longer needed.
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
| **Shadow-user secret** | The random, per-admin secret (`admin_users.supabase_auth_secret`) used to sign the shadow user into Supabase Auth — generated once via `crypto.randomBytes(32)` and reused thereafter. Never typed by a human, never the real login credential — see §4. Previously a deterministic, email-derived value (`` `auth_${email}_fixed_password_v1` ``, no longer used). |
| **Anon / publishable key** | Supabase's low-privilege API key, safe to expose to browsers, whose access is meant to be constrained by Supabase's Row Level Security policies (or, as here, by this app's own `admin_users` checks layered on top). |
| **Service-role key** | Supabase's highest-privilege API key — bypasses Row Level Security entirely. Must never be exposed client-side; in this app it's confined to `createAdminClient()`. |
| **RLS (Row Level Security)** | Postgres/Supabase's built-in per-row access-control mechanism. Not directly relevant to this app's own `admin_users` table (which has no RLS policies of its own — access is gated entirely in application code), but is the mechanism the anon key's safety normally depends on for Supabase-native tables. |
| **`getAdminSession()`** | The single real access-control gate for API routes: valid Supabase session **and** matching `admin_users` row. See §5. |
