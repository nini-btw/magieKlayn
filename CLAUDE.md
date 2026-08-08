# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> **A much deeper reference already exists: [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md).** It's a full read-through of the codebase (architecture decisions & trade-offs, complete DB schema, full API reference, known issues/technical debt, glossary of Algerian delivery domain terms). Consult it before making non-trivial changes — this file only summarizes what's needed to get moving.

## What this is

Magie Klayn: a Next.js 16 / React 19 e-commerce storefront for a luxury fragrance brand in Oran, Algeria. Customers check out with no account, choosing home delivery, Yalidine stop-desk pickup, or free in-store pickup (Alger/Oran only). A single-admin back-office at `/admin` manages products and orders. New orders trigger a best-effort Telegram alert and a best-effort Yalidine parcel-creation call.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build         # production build
npm run start          # run production build

npm run db:generate     # generate a Drizzle migration from schema.ts changes
npm run db:migrate       # apply tracked drizzle/ migrations (unreliable against Supabase's pooler — see below)
npm run db:push           # push schema directly, skipping migration files (fastest for local dev)
npm run db:studio          # open Drizzle Studio against DATABASE_URL
```

There is **no test suite, no lint script, and no CI** — nothing to run beyond the above. Standalone maintenance scripts (Yalidine zone sync, auth repair, etc.) live in `scripts/` and are run manually via `npx tsx scripts/<file>.ts`.

**Migrations, in practice**: neither `db:migrate` nor `db:push` reliably completes against this project's Supabase database — `db:migrate` hangs/fails against the transaction-mode pooler, and `db:push` can crash mid-introspection on a drizzle-kit bug unrelated to whatever column is actually being added. The working fallback for real changes: push the raw SQL directly via a one-off `postgres` client script, then manually insert a matching row into `drizzle.__drizzle_migrations` so `db:generate` stays consistent afterward. Separately, two hand-written SQL files in `src/infrastructure/db/migrations/` (`add_delivery_zones.sql`, `make_delivery_zone_id_not_null.sql`) are **not** tracked by Drizzle Kit at all and must be applied manually on any fresh database.

## Architecture

Single Next.js app (App Router, deployed to Vercel) with an internal hexagonal/clean-architecture split for business logic:

- **`app/`** — the actual Next.js routing tree: pages, layouts, server actions (`actions.ts`), API route handlers (`api/**/route.ts`). This is where routing lives, **not** `src/app/`.
- **`src/domain/`** — pure, framework-free business rules and types (`entities/`, `ports/repositories.ts` interfaces, `rules/cart.rules.ts`).
- **`src/application/`** — just `cart.service.ts` (used by the Redux cart slice). A `use-cases/` layer was built but never wired up and has since been deleted — API routes call repositories directly.
- **`src/infrastructure/`** — concrete adapters: `db/` (Drizzle schema + `*.adapter.ts` repositories implementing the domain ports), `auth/supabase-auth.ts`, `storage/supabase-storage.ts`, `telegram/`, `yalidine/`.
- **`src/presentation/`** — all React UI: `components/{features,ui}/`, Redux `store/` (`cart`, `ui` slices), `lib/` (utils/animations/color helpers).

Path alias `"@/*"` → `./src/*` **only** — `app/` code always uses relative imports.

Data reaches the UI two ways: Server Components/Server Actions (`app/actions.ts`, cached with React's `cache()`) for SEO-relevant reads like product listing/detail, and REST-ish JSON `fetch()` calls to `app/api/**/route.ts` for everything else (admin tables, checkout, cascading delivery-zone dropdowns). No shared auth middleware — every admin-only route calls `getAdminSession()` inline. No GraphQL/tRPC/WebSockets.

### Domain specifics worth knowing before touching checkout/delivery code

- **Coffret** ("gift box") is an order-level packaging upsell, not a product — a box always holds exactly 4 bottles; `coffretFee = 800 × boxColors.length`, always recomputed **server-side** in `POST /api/orders`, never trusted from the client. Same anti-tamper treatment for `deliveryFee`, which is forced to `0` server-side for `store_pickup`.
- **Stop-desk** delivery uses the real Yalidine center (`stopdeskCenterId`/`stopdeskCommuneName`) picked by the customer at checkout time and stored on the order — this is the primary path; the fuzzy commune-name resolver (`stopdesk-resolver.ts`) is a fallback for pre-migration orders only.
- Yalidine parcel creation (`scripts/create-parcel.ts`, imported directly by `app/api/orders/route.ts`) and Telegram order notifications are both **fire-and-forget** — they never throw, so checkout always succeeds even if either integration fails. There's no retry mechanism for a silently-failed parcel.
- `POST /api/orders` is the **single** order-creation path (the old `app/actions.ts` `createOrder` server action was an unused, incomplete duplicate — no validation, no Yalidine parcel, no anti-tamper fee checks — and has been deleted). Any new order-creation UI must call this route, not reintroduce a server action that bypasses it.
- Auth is a hybrid: `admin_users` (bcrypt) is the source of truth, shadowed by a synthetic Supabase Auth session created with a **deterministic, email-derived password** purely to get a Supabase session cookie. `getAdminSession()` re-checks `admin_users` membership, so this is contained today, but don't extend trust to the Supabase session alone.
- This Next.js version (16.2.11) has real breaking changes vs. typical training data — e.g. `middleware.ts` has been renamed to `proxy.ts`. Consult `node_modules/next/dist/docs/` before assuming standard conventions apply (see `AGENTS.md`).

### Database

PostgreSQL via Supabase, Drizzle ORM, `postgres`(-js) driver with `{ prepare: false }` (required for Supabase's pooler). Schema source of truth: `src/infrastructure/db/schema.ts`. Key tables: `products`, `orders` (+ `order_items`, cascade-deleted with the order; `product_id` deliberately has no FK so history survives product deletion), `admin_users`, `delivery_zones`. If `DATABASE_URL` is unset/a placeholder, the client falls back to a "mock mode" (`db = null`, logs a warning) instead of crashing.

### Environment variables

No `.env.example` exists. Minimum for local dev: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Optional: `YALIDINE_*` (parcel creation, gated by `YALIDINE_ENABLED=true`), `TELEGRAM_BOT_TOKEN`/`TELEGRAM_OWNER_CHAT_ID` (order alerts), `NEXT_PUBLIC_FEATURE_*` (feature flags, default enabled). Full variable list with purposes: PROJECT_DOCUMENTATION.md §6. Never read or echo `.env.local`/`.env.sentry-build-plugin` contents.

### i18n

`next-intl`, locales `en`/`fr`/`ar` (RTL for Arabic), catalogs in `messages/{en,fr,ar}.json`. Locale resolution is a manual cookie read in `app/layout.tsx` (`NEXT_LOCALE`, default `en`) — not middleware-based negotiation. Note `app/template.tsx` has a second, independent `<html dir>` mechanism (localStorage/custom event) not guaranteed to stay in sync with the cookie.

## Naming history

This codebase was adapted from a prior project ("Crumbleivable"). All known leftover references to that name (cart `localStorage` key, admin metadata, DB schema comments, a maintenance script's hardcoded email, mismatched baked-goods shop copy) have been cleaned up — see PROJECT_DOCUMENTATION.md §20 for the resolved list. If you spot another one, it's a genuine miss, not an intentional leftover.

## Documentation Sync Policy

Four documents must stay accurate to the current codebase: `PROJECT_DOCUMENTATION.md` (full technical reference), `MagieKlayn-MARKETING.md` (business/marketing overview), `portfolio_description.md` (client-facing portfolio entry + Sanity JSON), and `CHANGELOG.md` (version history). **Before committing any change that touches tech stack, architecture, the API surface, the DB schema, or a major feature**, update whichever of these it affects — and treat this as a two-sided check, not a one-time gate:

- **Before a commit**: update the affected doc(s) as part of the same change, so the commit and its documentation land together.
- **After a commit**: `CHANGELOG.md` specifically should always reflect what's actually been committed — once work that was sitting under `[Unreleased]` is committed (and especially once pushed), convert that section into a real dated version entry and open a fresh `[Unreleased]` for whatever comes next. Don't leave shipped work parked under `[Unreleased]` indefinitely.
- **If a commit ever lands without its doc update** (caught later, or done by a different session), reconcile it at the very next opportunity — the next commit or the next time any of these four files is touched — rather than letting the gap compound. The goal is that at any point in time, all four files describe the *current* state of the code, not some earlier snapshot.
- **Update in place — don't regenerate from scratch.** Edit only the specific section(s)/field(s) the change actually affects; leave everything else untouched. This matters most for `PROJECT_DOCUMENTATION.md`, which is long and already accurate — a full rewrite is both wasteful and a good way to silently lose correct detail.
- **`PROJECT_DOCUMENTATION.md`** — edit the specific numbered section(s) affected (§2 tech stack, §5 folder structure, §7 database, §8 API reference, §20 known issues, etc.).
- **`CHANGELOG.md`** — add a new dated entry (or extend `[Unreleased]`) categorized Added/Changed/Removed/Fixed/Security, following Keep a Changelog conventions already established in that file.
- **`portfolio_description.md`** and **`MagieKlayn-MARKETING.md`** — update only the fields/sections that actually changed (tech stack, capabilities, metrics); keep the rest as-is.
- **Consistency rule**: all four must describe the same tech stack and feature set. `PROJECT_DOCUMENTATION.md` §2 is the source of truth for tech stack — if the others disagree with it, they're the ones that are stale.

## Translation Parity

Whenever a new user-facing string/translation key is added anywhere in the app, add it to **all three** locale files in the same change — `messages/en.json`, `messages/fr.json`, `messages/ar.json` — never just one or two, and keep the same key structure/namespace across all three. A key present in one locale and missing in another either falls back silently or renders the raw key to a real user — this is a correctness rule, not a tidiness one.
