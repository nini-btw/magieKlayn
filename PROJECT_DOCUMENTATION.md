# Magie Klayn — Project Documentation

> Generated from a full read-through of the codebase on 2026-08-07. This file is the single source of truth for both human developers and AI coding agents working on this repository. If something here disagrees with the code, the code wins — but please update this file when that happens.

---

## 1. Project Overview

**Project name:** Magie Klayn (repo/package name: `magie_klayn`)

**What it is:** A direct-to-consumer e-commerce storefront for a luxury fragrance ("parfums de luxe") brand based in **Oran, Algeria**. Customers browse a small catalogue of perfumes, add them to a cart, optionally choose a "coffret" (luxury gift box) packaging option, and check out with no account required. Orders are fulfilled either by home delivery, a Yalidine stop-desk (pickup-point) delivery, or in-store pickup in Alger or Oran. The storefront is fully trilingual (French, English, Arabic with RTL support), reflecting its Algerian market. A separate authenticated admin back-office lets the store owner manage products and orders.

Source of truth for this description is the site's own metadata (`app/layout.tsx`):
> "Magie Klayn — Fragrances de Luxe à Oran" / "Découvrez Magie Klayn, une maison de parfums de luxe livrée directement chez vous à Oran, Algérie. Commandez en ligne, sans compte requis."

**Target user / audience:**
- **Storefront**: Algerian consumers (primarily French-speaking, with Arabic/English support) buying fragrances online, ordering without creating an account, and paying cash-on-delivery (implied by the Yalidine COD integration — no payment gateway exists in the codebase).
- **Admin**: a single store owner/operator (or small staff) who logs into `/admin` to manage the product catalogue and process orders. There is only one role (`admin`) — no multi-tenant or staff-permission tiers.

**Problem it solves:** Gives a small, single-brand Algerian retailer (no existing e-commerce platform, no dev team) a bespoke storefront + minimal back-office + last-mile delivery integration (Yalidine, Algeria's dominant courier/API for e-commerce), replacing what would otherwise be manual order-taking over Instagram/WhatsApp with a real checkout flow, inventory management, and automatic courier parcel creation. It specifically solves: (a) wilaya/commune-aware delivery-fee calculation, (b) stop-desk vs. home vs. in-store pickup logistics, (c) instant order alerts to the owner via Telegram instead of needing to babysit an inbox or admin panel.

**Current status: Active development / pre-production MVP.** There is no automated test suite, no CI/CD, no `.env.example`, and the most recent commit (`0a87015`, HEAD of the `yalidine` branch) is titled *"the domicile with yalidine is working but not for stopdesk"* — i.e., home delivery via Yalidine works, but stop-desk delivery is a known-broken/in-progress feature as of this writing. The git history (26 commits, single author) shows a straight-line incremental build: UI → product/shop pages → i18n → admin → Telegram notifications → Sentry error monitoring → delivery-zone/Yalidine integration (most recent, still unstable). This reads as a solo-developer project actively being built toward a production launch, not yet hardened for one.

**Domain knowledge a developer needs:**
- **Wilaya / Commune**: Algeria's administrative divisions — a wilaya is a province (58 total, numbered 01–58), a commune is a municipality within it. Delivery fees and availability are keyed by wilaya+commune pairs, stored in the `delivery_zones` table.
- **Yalidine**: a real third-party Algerian courier/shipping API used for wilaya/commune reference data, fee lookups, stop-desk (pickup-point) center lookups, and parcel (shipment) creation. Yalidine also does the cash-on-delivery ("COD") collection — the app never has its own payment processor.
- **Coffret**: French for "gift box." In this app it is **not a product** — it's an order-level packaging upsell. A box always holds exactly 4 bottles; once the cart holds 4 or more, the customer can choose one or more boxes (each independently white/black), adding `800 × boxCount` DA to `coffretFee`, with any leftover bottles shipping unboxed. This rule is enforced in application code (`src/domain/rules/cart.rules.ts`), not as a database constraint.
- **Stop-desk**: a Yalidine pickup point (point relais) — the customer picks a physical Yalidine-network location to retrieve their parcel from, as an alternative to home delivery.
- **"Crumbleivable"**: an unrelated prior project/brand name that this codebase appears to have been bootstrapped or adapted from. It leaks into a few places that were never renamed (a `localStorage` cart key, a code comment, an admin page `<title>`) — see [§20 Known Issues](#20-known-issues--technical-debt).

---

## 2. Tech Stack

All versions below are transcribed directly from `package.json` (exact `dependencies`/`devDependencies`) unless marked "runtime-resolved."

| Technology | Version | Role |
|---|---|---|
| Next.js | `16.3.0` | Framework — App Router, Server Components, Server Actions, Route Handlers |
| React | `19.2.4` | UI library |
| React DOM | `19.2.4` | DOM renderer |
| TypeScript | `^5` | Language, strict mode |
| Tailwind CSS | `^4` (`@tailwindcss/postcss`) | Utility-first styling, CSS-first config (no `tailwind.config.js`) |
| Drizzle ORM | `^0.45.2` | Type-safe SQL query builder / schema definition |
| Drizzle Kit | `^0.31.10` | Migration generation/push/studio CLI (dev dependency) |
| `postgres` (postgres-js) | `^3.4.9` | Postgres driver used by Drizzle |
| Supabase (`@supabase/supabase-js`) | `^2.110.8` | Postgres hosting, Auth, Storage |
| Supabase SSR (`@supabase/ssr`) | `^0.12.3` | Cookie-aware Supabase client for server components/routes |
| `bcryptjs` | `^3.0.3` | Password hashing for the `admin_users` table |
| Redux Toolkit (`@reduxjs/toolkit`) | `^2.12.0` | Global client state (cart, UI) |
| `react-redux` | `^9.3.0` | React bindings for Redux |
| `react-hook-form` | `^7.83.0` | Form state management (used in 2 forms) |
| `@hookform/resolvers` | `^5.4.3` | Zod↔RHF resolver bridge |
| `zod` | `^4.4.3` | Schema validation (client-side forms only) |
| `next-intl` | `^4.13.4` | i18n — French/English/Arabic, RTL |
| `framer-motion` | `^12.42.2` | Animations/transitions |
| `lucide-react` | `^1.26.0` | Icon set |
| `clsx` + `tailwind-merge` | `^2.1.1` / `^3.6.0` | Conditional/merged Tailwind class composition (`cn()` helper) |
| `@sentry/nextjs`, `@sentry/react` | `^10.69.0` | Error monitoring (client, server, edge) |
| `dotenv` | `^17.4.2` | Loads `.env.local` for standalone scripts (`scripts/*.ts`, `drizzle.config.ts`) |
| `tsx` | `^4.23.1` | Runs standalone TypeScript scripts in `scripts/` (dev dependency) |
| `babel-plugin-react-compiler` | `1.0.0` | Powers Next's `reactCompiler: true` auto-memoization (dev dependency) |

**Not present / explicitly absent:** no ESLint config (`.eslintrc*`/`eslint.config.*` — none exist, despite Next.js normally scaffolding one), no test framework (Jest/Vitest/Playwright/Cypress — none in `package.json`), no ORM alternative (no Prisma/TypeORM/Mongoose), no state-management alternative (no Zustand/Jotai/plain Context store), no component library (no shadcn/ui, no Radix, no MUI/Chakra — all UI primitives are hand-rolled), no GraphQL/tRPC, no Docker, no `vercel.json` (site deploys to Vercel via zero-config detection).

### Why these choices (trade-offs)

- **Next.js App Router over a separate SPA + API server**: one deployable unit (Vercel), Server Components let product data render without a client-side fetch waterfall on `/shop/[slug]`, and Server Actions (`app/actions.ts`, `app/admin/actions.ts`) avoid hand-rolling some API routes for reads/mutations. Trade-off: App Router + React 19 + `reactCompiler: true` is bleeding-edge (this specific Next version even renames the `middleware.ts` convention — see [§3](#3-architecture-decisions--trade-offs)), so the project inherits instability/documentation risk in exchange for the latest DX.
- **Drizzle ORM over Prisma**: Drizzle's schema-as-TypeScript-code and thin SQL-like query builder keeps the codebase lightweight (no separate schema DSL, no generated client to keep in sync) and pairs naturally with `postgres-js` against Supabase's connection pooler. Trade-off: less tooling/community magic than Prisma (e.g., no Prisma Studio-equivalent polish, though `drizzle-kit studio` exists), and migrations are less automatic — this project in fact has **two parallel migration mechanisms** (Drizzle-generated SQL in `drizzle/`, plus hand-written stray SQL files in `src/infrastructure/db/migrations/`), a symptom of that manual-migration trade-off.
- **Supabase over a bespoke Postgres+auth stack**: gets managed Postgres, file storage, and an Auth service in one product, useful for a solo developer. Trade-off: the app doesn't actually use Supabase Auth's own user model as the source of truth — it layers a custom `admin_users` table on top and synthesizes Supabase sessions with a per-admin secret password (see [§9](#9-authentication--authorization)) — a workaround that suggests Supabase Auth wasn't a perfect fit for a single-admin-account use case, adding complexity rather than removing it.
- **Redux Toolkit over Context/Zustand**: cart state needs to survive across many disconnected components (header badge, drawer, cart page, product cards) with derived/memoized totals — RTK's `createSlice`/`createSelector` gives structured reducers and memoized selectors "for free." Trade-off: RTK is heavier than Zustand for what is, in practice, two small slices (`cart`, `ui`); a context-free store like Zustand would have meant less boilerplate (no `Provider`, no store `index.ts`) for the same effective footprint.
- **Tailwind v4 (CSS-first) alongside one large hand-written `globals.css`**: v4's `@theme`/`@import "tailwindcss"` model removes the JS config file, but this project also carries ~2200+ lines of hand-authored component CSS (buttons, hero, bottle illustration, admin shell) rather than expressing everything as Tailwind utilities/`@apply`. This is a pragmatic trade-off for a visually bespoke, illustration-heavy brand site (CSS custom properties like `--liquid`/`--product-color` drive per-product dynamic colors that are awkward to express as static Tailwind classes) at the cost of two loosely-coupled styling systems that must be kept mentally in sync (see [§11](#11-ui--ux-design)).
- **`next-intl` over `next-i18next` or a bespoke solution**: App-Router-native, supports RTL locales (Arabic) cleanly, and ships a middleware-based locale-negotiation story out of the box. Trade-off: that middleware story is **not actually wired up** in this codebase (see [§3](#3-architecture-decisions--trade-offs) and [§20](#20-known-issues--technical-debt)) — locale is instead read from a cookie manually in `app/layout.tsx`, so the library's main convenience feature goes unused.
- **Zod + React Hook Form on the client, but plain `if` checks on the server**: RHF+Zod gives instant, typed client-side validation UX for the two most user-facing forms (checkout, contact). Server-side, the API routes re-validate with hand-written `if` statements rather than sharing the same Zod schemas — faster to write initially, but it means the two validation layers can silently drift out of sync (a field valid on the client could still be malformed by the time it reaches the DB, or vice versa). See [§14](#14-security--data-privacy).
- **Sentry over no monitoring / a simpler logger**: full client+server+edge instrumentation (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) gives production error visibility for a solo developer who can't manually watch logs. Trade-off: adds build-time complexity (source-map upload via `SENTRY_AUTH_TOKEN`, `withSentryConfig` wrapping `next.config.ts`) for a project with no other observability tooling (no analytics service wired up despite a `NEXT_PUBLIC_FEATURE_ANALYTICS` flag existing).
- **Telegram Bot API over email/SMS for order alerts**: `TelegramNotificationService` posts new-order alerts to one or more owner chat IDs. Zero-infrastructure (no SMTP/SMS provider account needed), instant push notification to a phone the owner already checks. Trade-off: notification delivery is entirely best-effort — the service is explicitly designed to **never throw** (swallow-and-log), so a Telegram outage silently loses the alert with no fallback channel or retry queue.

---

## 3. Architecture Decisions & Trade-offs

### Decision: Clean/Hexagonal layering (`domain` / `application` / `infrastructure` / `presentation`) under `src/`, with Next.js routing kept at the repo-root `app/`
- **Context**: the developer wanted business logic (cart rules, order/product entities, delivery-fee calculation) decoupled from Next.js and from the specific DB/auth/storage vendor, so the domain rules could be tested or ported independently.
- **Alternatives considered** (inferred from structure): a conventional flat Next.js layout (`app/` with colocated `lib/`, `components/`, `db/` folders and no formal layer boundaries) — the more common, lower-ceremony Next.js pattern.
- **Reason for choice**: the layering pays off concretely in a few places — `src/domain/rules/cart.rules.ts` and `src/domain/entities/*.ts` have zero framework imports and are reused by both API routes and (intended to be) server actions; `src/domain/ports/repositories.ts` defines interfaces (`IProductRepository`, `IOrderRepository`, etc.) that `src/infrastructure/db/*.adapter.ts` implement, so swapping Drizzle/Postgres for another store would only touch the infrastructure layer in theory.
- **Trade-offs accepted**: the layering was only partially followed through. API routes (`app/api/orders/route.ts`, `app/api/products/route.ts`, etc.) import repositories (`orderRepository`, `productRepository`) directly rather than going through use-case classes. ~~An entire `src/application/use-cases/` layer existed but was unused~~ — **resolved**: that unused use-case layer and the stray `create-next-app` scaffold at `src/application/{layout.tsx,page.tsx,favicon.ico}` were deleted as dead code (see [§20](#20-known-issues--technical-debt)) rather than left as clutter.
- **Trigger for revisiting**: if the team grows beyond one developer and repository calls scattered across route handlers become hard to test/reuse, reintroduce a use-case layer deliberately (and route every mutation through it), rather than letting one accumulate half-used again.

### Decision: Server Actions + Route Handlers coexisting for the same operations (no single API style)
- **Context**: needed both server-rendered pages with direct data access (product listing/detail) and a client-fetchable JSON API (admin dashboard tables, checkout POST, delivery lookups).
- **Alternatives considered**: REST-only (all data access through `app/api/**/route.ts`, even for server components); or Server-Actions-only (no REST API at all, since Next.js supports invoking actions from client components too).
- **Reason for choice**: Server Components fetching via `app/actions.ts`'s `getAllProducts`/`getProductBySlug` (wrapped in React's `cache()`) avoids a client-side fetch waterfall for SEO-relevant pages (`/shop/[slug]` uses this for `generateMetadata` and the page body). Route Handlers under `app/api/**` serve everything that needs to be called from client components with `fetch()` — admin dashboards, cascading wilaya/commune/stop-desk selects, checkout submission.
- **Trade-offs accepted**: **duplicate order-creation code paths** exist — `app/actions.ts`'s `createOrder` server action and `app/api/orders/route.ts`'s `POST` handler both create orders via `orderRepository.create`, but only the API route also fires `createParcelForOrder` (Yalidine parcel creation). If any UI surface calls the server action instead of the API route, that order silently never gets a Yalidine parcel. This is a real correctness risk that should be resolved by making one the single source of truth (see [§20](#20-known-issues--technical-debt)).
- **Trigger for revisiting**: if a second developer joins and needs one clear rule for "server action vs. route handler," or if the duplicate-order-creation bug above causes a real missed shipment.

### Decision: Custom hybrid authentication — `admin_users` table (bcrypt) as source of truth, shadowed by a synthetic Supabase Auth session
- **Context**: needed a login for exactly one role (admin), backed by Supabase (already in use for Postgres/Storage) without building a full custom session/cookie system from scratch.
- **Alternatives considered**: (a) use Supabase Auth natively as the sole source of truth (store admin emails directly as Supabase users, no separate table); (b) roll a fully custom JWT/cookie session with no Supabase dependency; (c) NextAuth/Clerk.
- **Reason for choice**: the developer wanted the `admin_users` table (with `bcrypt` password hashing they control) to remain authoritative, while still getting Supabase's cookie-session machinery "for free" instead of hand-rolling one. The chosen approach: verify the password against `admin_users.passwordHash`, then create/update a **shadow Supabase Auth user** so `signInWithPassword` can be called to mint a real Supabase session cookie.
- **Trade-offs accepted, since resolved**: this was the single biggest security wart in the codebase — the shadow-user password used to be a deterministic synthetic string (`` `auth_${email}_fixed_password_v1` ``), derivable by anyone who knew an admin's email and had read the source. **RESOLVED**: the shadow password is now a random secret (`crypto.randomBytes(32)`) generated once per admin and stored in `admin_users.supabase_auth_secret` (migration `0013`), reused on every subsequent login rather than re-derived or overwritten — it's no longer computable from the email at all. `getAdminSession()` still independently re-verifies `admin_users` membership on every request regardless, as defense in depth.
- **Trigger for revisiting**: before any real production launch handling real customer/order data — this should be replaced with either a native Supabase Auth admin account (drop `admin_users`) or a fully custom session (drop the Supabase Auth dependency for admin), not this hybrid.

### Decision: REST-ish JSON API (Route Handlers) over GraphQL/tRPC
- **Context**: needed typed, callable endpoints for admin tables and public delivery lookups.
- **Alternatives considered**: tRPC (would give end-to-end type safety with the same TypeScript codebase), GraphQL (would give flexible querying for admin tables).
- **Reason for choice**: Route Handlers are the lowest-ceremony option in Next.js, need no extra library, and the API surface is small (10 route files) — the overhead of a GraphQL schema or tRPC router wasn't justified for this scope.
- **Trade-offs accepted**: manual response-shape consistency (each route hand-writes `{ success, data, error }` — mostly consistent but not type-shared between client and server), no automatic client-side type inference (the frontend `fetch()` calls are untyped against the actual route response shapes), and no batching/caching layer (no SWR/React Query) — every admin page re-fetches from scratch on mount with plain `useEffect`.
- **Trigger for revisiting**: if the admin UI grows more complex (more filters, real-time updates, optimistic mutations), a typed client (tRPC) or a fetch-caching layer (React Query/SWR) would pay for itself quickly.

### Decision: `next-intl` locale resolved via manual cookie read, not via Next.js middleware
- **Context**: needed French/English/Arabic support with a persisted user locale choice.
- **Alternatives considered**: wire up `next-intl`'s recommended middleware-based locale negotiation (URL-prefixed locales, `Accept-Language` detection).
- **Reason for choice** (as implemented, likely unintentional): a `src/middleware/i18n.ts` file used to set up `createMiddleware(i18nConfig)` correctly as next-intl expects — but it lived at `src/middleware/i18n.ts`, not at the Next.js-recognized location. **This specific Next.js version (16.3.0) has renamed the `middleware.ts` file convention to `proxy.ts`** (per this repo's own `AGENTS.md` warning to consult `node_modules/next/dist/docs/` before assuming standard Next.js conventions apply). Because there was no `proxy.ts`/`middleware.ts` at the project root or `src/` root, that file was **never executed** — it was dead code, and has since been deleted (see [§20](#20-known-issues--technical-debt)). Locale resolution runs entirely through `app/layout.tsx`'s `getLocaleAndMessages()`, which reads a `NEXT_LOCALE` cookie server-side (falling back to `defaultLocale = "en"`), and `<LanguageSwitcher>` sets that cookie and reloads the page.
- **Trade-offs accepted**: locale detection is cookie-only — a first-time visitor always gets `en` regardless of browser language, until they manually switch. There is also a **second, independent locale mechanism** in `app/template.tsx` that manages `<html dir>` via `localStorage`/a custom event, separate from the cookie the layout reads — the two are not obviously kept in sync (see [§20](#20-known-issues--technical-debt)).
- **Trigger for revisiting**: if real `Accept-Language`-based locale negotiation becomes a requirement, add a working `proxy.ts` at the project root (the current Next.js convention) rather than resurrecting the deleted `src/middleware/i18n.ts` in its old location.

### Decision: Yalidine parcel creation is fire-and-forget, non-blocking, and best-effort
- **Context**: order creation must succeed and return quickly to the customer even if the courier API is slow, down, or rejects the request (e.g., an unresolvable stop-desk commune name).
- **Alternatives considered**: block the checkout response until the Yalidine parcel is confirmed created (guarantees consistency but couples checkout latency/availability to a third-party API); queue parcel creation for a background job/cron.
- **Reason for choice**: `scripts/create-parcel.ts`'s `createParcelForOrder(order)` never throws to its caller — it's called with `await` immediately after order insertion in `POST /api/orders`, but any failure inside is caught and logged, not surfaced. This guarantees the customer always gets an order confirmation regardless of Yalidine's health.
- **Trade-offs accepted**: **silent partial failure** — an order can exist in the DB with `yalidineTracking = null` and no parcel ever created, with no retry mechanism and no admin-visible alert distinguishing "no parcel yet" from "parcel not needed" (e.g. store pickup). The admin would have to notice a missing tracking number manually. Stop-desk orders now carry a checkout-time-resolved real center id/commune, so `resolveStopdeskId`'s fuzzy matching is only a fallback for pre-migration orders — the current live risk is Yalidine's own request validation/oversize-fee display, being actively debugged (see [§20](#20-known-issues--technical-debt) item 19).
- **Trigger for revisiting**: once order volume is non-trivial, this needs either a retry queue, an admin-visible "shipping pending/failed" order status, or a scheduled job that finds `yalidineTracking IS NULL` orders and retries.

### Decision: Deployment target — Vercel, zero-config
- **Context**: Next.js app needing minimal ops overhead for a solo developer.
- **Alternatives considered**: self-hosted Node server, Docker container on a VPS, other Next-friendly PaaS (Netlify, Railway, Render).
- **Reason for choice**: `next.config.ts`'s Sentry config explicitly sets `automaticVercelMonitors: true`, and `app/layout.tsx`'s fallback `NEXT_PUBLIC_SITE_URL` is `"https://magie-klayn.vercel.app"` — the project is built and deployed against Vercel specifically, with zero-config Next.js detection (no `vercel.json` needed for the basic app).
- **Trade-offs accepted**: no containerization story exists (no Dockerfile) if the project ever needs to move off Vercel; database migrations are run manually via `drizzle-kit` CLI commands rather than as a deploy-pipeline step (no CI/CD config exists at all — no `.github/workflows/`).
- **Trigger for revisiting**: if a self-hosted or multi-cloud deployment becomes a requirement, or if build/deploy needs to be gated by tests (which don't currently exist).

### Shortcuts / technical debt intentionally (or implicitly) taken, and why they were acceptable for now
- **No automated tests**: acceptable for a solo developer moving fast pre-launch, but the presence of `data-testid` attributes throughout components (`checkout-button`, `place-order-button`, `login-form`, etc.) suggests an E2E suite was planned. See [§16](#16-testing).
- **No shared validation schema between client (Zod) and server (manual `if`s)**: acceptable short-term since the two currently agree by inspection, but is a latent source of drift bugs.
- **Manual/ad-hoc Postgres migrations alongside Drizzle-generated ones**: acceptable for a single-developer, single-environment (or few-environment) setup, but risky if a second environment (staging) needs the exact same schema history reproduced.
- ~~Hardcoded store-pickup addresses as `"TODO: Alger store address"` / `"TODO: Oran store address"`~~ — **RESOLVED**: `STORE_LOCATIONS` in `src/domain/entities/delivery.ts` now holds the real name/address/phone/Maps link for both stores, shared by checkout and `/shipping`.

---

## 4. Project Architecture

**High-level shape:** A **fullstack, serverless-oriented Next.js monolith** (single deployable unit on Vercel) with an internal **hexagonal/clean-architecture split** for business logic. Not a monorepo (single `package.json`, no workspaces), not microservices — one Next.js app serving both the public storefront, the admin back-office, and the JSON API, plus a handful of standalone maintenance scripts (`scripts/*.ts`, run manually via `tsx`, outside the Next.js request lifecycle) for one-off data operations (delivery-zone sync from Yalidine, auth repair, DB migrations).

**Frontend ↔ backend communication:**
- **Server Components + Server Actions** for SEO-relevant reads (product listing, product detail, admin login) — no network hop visible to the client; data comes from Postgres via Drizzle directly inside the React render on the server.
- **REST-ish JSON over `fetch()`** to Next.js Route Handlers (`app/api/**/route.ts`) for everything else — admin dashboards, checkout submission, cascading wilaya/commune/stop-desk dropdowns, product/order CRUD from the admin UI.
- **No WebSockets, no GraphQL, no tRPC.**
- **External HTTP**: the app itself makes outbound HTTP calls to three third parties — **Supabase** (Postgres pooler + Auth + Storage REST APIs), **Yalidine** (delivery reference data + parcel creation), and the **Telegram Bot API** (order alerts).

### System diagram

```
                                   ┌─────────────────────────────┐
                                   │        Customer Browser      │
                                   │  (storefront: /, /shop, /cart)│
                                   └───────────────┬──────────────┘
                                                    │ HTTPS
                                                    ▼
                        ┌───────────────────────────────────────────────────┐
                        │                Next.js 16 App (Vercel)             │
                        │                                                     │
                        │  app/                       src/                   │
                        │  ├─ page.tsx, shop/, cart/  ├─ domain/  (entities,  │
                        │  │   → Server Components &    ports, rules — pure)  │
                        │  │     Server Actions         ├─ application/       │
                        │  ├─ admin/(dashboard)/      │   (cart.service)     │
                        │  │   → Supabase-gated         ├─ infrastructure/    │
                        │  │     Server Components      │   ├─ db/*.adapter.ts │
                        │  └─ api/**/route.ts         │   │  (Drizzle repos) │
                        │      → Route Handlers        │   ├─ auth/           │
                        │      (REST-ish JSON)         │   │  supabase-auth │
                        │                               │   ├─ storage/       │
                        │                               │   │  supabase-     │
                        │                               │   │  storage       │
                        │                               │   ├─ telegram/      │
                        │                               │   └─ yalidine/     │
                        │                               │      client, config,│
                        │                               │      stopdesk-     │
                        │                               │      resolver       │
                        │                               └─ presentation/     │
                        │                                   (Redux store,     │
                        │                                    components, UI)  │
                        └───────────────┬───────────────┬───────────────┬────┘
                                         │               │               │
                          Postgres wire  │  HTTPS REST   │  HTTPS REST   │
                          protocol       ▼               ▼               ▼
                     ┌────────────────────┐  ┌──────────────────┐ ┌─────────────────┐
                     │  Supabase Postgres  │  │  Yalidine API     │ │  Telegram Bot   │
                     │  (via postgres-js,   │  │  (wilayas,        │ │  API             │
                     │   Drizzle ORM)       │  │   communes, fees, │ │  (order alerts   │
                     │  + Supabase Auth     │  │   centers,        │ │   to owner's     │
                     │  + Supabase Storage  │  │   parcels)        │ │   chat)           │
                     └────────────────────┘  └──────────────────┘ └─────────────────┘

  Also: Sentry (error monitoring, client+server+edge) receives events from every layer above.
  Also: scripts/*.ts (standalone, run via `tsx`, NOT part of the deployed app) talk directly
        to Postgres + Yalidine for zone-sync/maintenance tasks — see §18.
```

### Data flow for the most important user action: **checkout / order creation**

1. **Cart page** (`app/cart/page.tsx`, client component) — customer reviews cart items (from Redux `cart` slice, persisted to `localStorage`), optionally adds one or more "coffret" boxes (each independently colored) via `BoxPackagingSelector`, and fills out the checkout form (first/last name, phone, `WilayaCommuneSelect` for delivery zone/type/stop-desk center). The form is validated client-side with `checkoutSchema` (Zod) via `react-hook-form`.
2. On submit, the page issues `fetch("/api/orders", { method: "POST", body: CreateOrderPayload })`.
3. **`POST /api/orders`** (`app/api/orders/route.ts`) re-validates required fields manually (customer name/phone present, delivery fields present; stop-desk center id/commune present for `deliveryType === "stop_desk"`; `boxColors` non-empty and within `getMaxBoxCount(items)` if `packagingType === "luxury_coffret"`, with `coffretFee` recomputed server-side rather than trusted from the client).
4. It resolves the submitted `deliveryZoneId` against the `delivery_zones` table via `deliveryRepository.getZone()`, and **recomputes `deliveryFee` server-side as `0` for `store_pickup`** regardless of what the client sent — an explicit anti-tampering guard.
5. `orderRepository.create()` (Drizzle) inserts one row into `orders` and one row per cart line into `order_items`, computing `totalAmount = cartTotal + deliveryFee + coffretFee`.
6. **Fire-and-forget, non-blocking for the response**: `telegramNotificationService.notifyNewOrder(order)` posts an HTML-formatted alert to the configured Telegram chat(s), including the stop-desk pickup point's commune when applicable; `createParcelForOrder(order)` (from `scripts/create-parcel.ts`) builds a Yalidine parcel payload (customer address, COD price = `totalAmount - deliveryFee`, the real stop-desk center id/commune already resolved at checkout) and calls `yalidineClient.createParcels()`, storing the returned tracking number back onto the order via `orderRepository.setYalidineTracking()`. Both of these **never throw** — a failure here is logged but does not fail the checkout response.
7. The API responds `201 { success: true, data: order }`.
8. The **Cart page** clears the Redux cart (`clearCart`) and shows an order-success confirmation state (`data-testid="order-success"`).
9. Later, the **admin** (`/admin/orders`) fetches `GET /api/orders` to see the new order, can update its `status` (`PUT /api/orders/[id]`) as it moves through `pending → confirmed → preparing → ready → delivered` (or `cancelled`), and sees the Yalidine tracking number if a parcel was successfully created.

---

## 5. Folder & File Structure

```
magie_klayn/
├── AGENTS.md                        Warns this Next.js version has breaking changes vs. training data
├── CLAUDE.md                        @AGENTS.md import
├── README.md                        Default create-next-app boilerplate (not project-specific)
├── package.json / package-lock.json
├── tsconfig.json                    strict TS, path alias "@/*" → "./src/*"
├── next.config.ts                   reactCompiler: true, Supabase image remotePattern, Sentry wrap
├── postcss.config.mjs               Tailwind v4 plugin only
├── drizzle.config.ts                Drizzle Kit config (schema/out/dialect/DATABASE_URL)
├── i18n.config.ts                   locales ['en','fr','ar'], defaultLocale 'en', tz 'Africa/Algiers'
├── instrumentation.ts               Sentry: registers server/edge config by NEXT_RUNTIME
├── instrumentation-client.ts        Sentry client init
├── sentry.server.config.ts / sentry.edge.config.ts
├── next-env.d.ts                    auto-generated (gitignored)
├── delivery_zones_backup_20260804.sql   (0 bytes — empty stray file)
│
├── app/                              Next.js App Router root (NOT src/app)
│   ├── layout.tsx                    Root layout: fonts, locale-from-cookie, <Providers>
│   ├── providers.tsx                 Redux + next-intl + cart persistence + conditional Header/Footer
│   ├── template.tsx                  Page-transition wrapper (Framer Motion) + separate RTL mechanism
│   ├── global-error.tsx              Sentry-integrated root error boundary
│   ├── not-found.tsx                 Branded 404
│   ├── globals.css                   ~2200+ line global stylesheet (design tokens + component CSS)
│   ├── actions.ts                    Server actions: getAllProducts, getProductBySlug, createOrder, getRecentOrders
│   ├── favicon.ico
│   ├── HeroSection.tsx, CollectionVisual.tsx, StoryGlowField.tsx   Homepage-only visual subcomponents
│   ├── page.tsx                      Home page
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── faq/page.tsx
│   ├── shipping/page.tsx
│   ├── cart/page.tsx                 Cart + checkout (single page, RHF+Zod form)
│   ├── shop/
│   │   ├── layout.tsx                 Metadata (mismatched "cookie/box" copy — see §20)
│   │   ├── page.tsx                    Product grid, client-fetches /api/products
│   │   └── [slug]/
│   │       ├── page.tsx                 Server component, getProductBySlug, generateMetadata
│   │       └── ProductDetail.tsx         Client component: visuals + add-to-cart
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── actions.ts                  loginAdmin, logoutAdmin server actions
│   │   └── (dashboard)/                Route group, no URL segment
│   │       ├── layout.tsx               Auth gate (Supabase getUser + redirect)
│   │       ├── AdminSidebar.tsx / AdminSidebarWrapper.tsx / AdminTopBar.tsx
│   │       ├── page.tsx                  Dashboard (stats, recent orders/products)
│   │       ├── orders/page.tsx           Order management table
│   │       └── products/page.tsx          Product management table
│   ├── api-docs/page.tsx              Swagger UI (swagger-ui-react, dynamic/no-SSR) against /api/openapi
│   └── api/                            Route Handlers (JSON API)
│       ├── admin/products/route.ts       GET admin: all products incl. inactive
│       ├── delivery/
│       │   ├── wilayas/route.ts
│       │   ├── communes/[wilayaCode]/route.ts
│       │   └── stopdesk-centers/[wilayaCode]/route.ts   (live Yalidine call)
│       ├── orders/
│       │   ├── route.ts                  GET (admin, filtered) / POST (public checkout)
│       │   ├── [id]/route.ts              GET/PUT/DELETE (admin)
│       │   └── stats/route.ts             GET (admin)
│       ├── products/
│       │   ├── route.ts                   GET (public, paginated) / POST (admin)
│       │   └── [id]/route.ts               GET (public) / PUT/DELETE (admin)
│       ├── upload/route.ts                 POST (admin) — Supabase Storage upload
│       ├── openapi/route.ts                GET — serves the compiled Swagger/OpenAPI spec
│       ├── auth/                            EMPTY — no route.ts (placeholder)
│       └── messages/                        EMPTY — no route.ts (placeholder)
│
├── drizzle/                            Drizzle Kit output: 13 SQL migrations (0000–0012) + meta/*.json snapshots
│
├── messages/                            next-intl translation catalogs
│   ├── en.json (612 lines)
│   ├── fr.json (612 lines)
│   └── ar.json (617 lines)
│
├── public/                              Default create-next-app SVGs only — no custom brand assets
│                                          (product/brand images are served from Supabase Storage instead)
│
├── scripts/                             Standalone maintenance scripts, run via `tsx scripts/<file>.ts`
│   ├── add-order-wilaya-details.ts
│   ├── apply-migration.ts
│   ├── create-parcel.ts                  Order → Yalidine parcel bridge (imported by app/api/orders/route.ts)
│   ├── fix-auth.ts                        Clears an admin's Supabase Auth shadow-user secret so next login resyncs it
│   ├── resolve-duplicate-communes.ts
│   ├── seed-inspired-by.ts                Dry-run vs. --write one-time backfill of products.inspired_by
│   ├── sync-zones.ts / sync-zones-write.ts   Dry-run vs. write delivery_zones sync from Yalidine
│   ├── test-connection.ts, test-yalidine.ts, test-create-parcel.ts
│   └── data/algeria_cities.json
│
└── src/                                  Hexagonal/clean-architecture business logic + all UI
    ├── domain/                            Framework-free business rules
    │   ├── entities/ (product.ts, order.ts, delivery.ts)
    │   ├── ports/ (repositories.ts, notifications.ts)     Interfaces the infrastructure layer implements
    │   ├── rules/cart.rules.ts               getMaxBoxCount, calculateCoffretFee, cart totals
    │   ├── data/story-palette.ts             Static About-page ribbon colors (STORY_PALETTE) — the former INSPIRED_BY array now lives as products.inspired_by
    │   └── config/features.ts               Feature flags from NEXT_PUBLIC_FEATURE_* env vars
    ├── application/
    │   └── services/cart.service.ts            Used by the Redux cart slice
    │       (the unused use-cases/ layer and stray layout.tsx/page.tsx/favicon.ico
    │        scaffold that used to live here were deleted as dead code — see §20)
    ├── infrastructure/                        Adapters implementing domain ports
    │   ├── db/
    │   │   ├── client.ts                       Drizzle+postgres client, mock-mode fallback
    │   │   ├── schema.ts                        Full DB schema (source of truth — see §7)
    │   │   ├── product.adapter.ts, order.adapter.ts, delivery.adapter.ts
    │   │   └── migrations/ (add_delivery_zones.sql, make_delivery_zone_id_not_null.sql)  Hand-written, outside Drizzle's own migration folder
    │   ├── auth/supabase-auth.ts                Admin auth (see §9)
    │   ├── storage/supabase-storage.ts           Supabase Storage upload/delete
    │   ├── telegram/telegram-notification.service.ts
    │   ├── swagger/config.ts                     getApiDocs() — compiles @swagger JSDoc into an OpenAPI spec
    │   └── yalidine/ (client.ts, config.ts, stopdesk-resolver.ts, types.ts, zone-sync-helpers.ts)
    └── presentation/
        ├── components/
        │   ├── features/ (Header, Footer, CartDrawer, ProductCard, ProductForm,
        │   │              DiscoverySection, LanguageSwitcher, StepIndicator, ToastContainer,
        │   │              WilayaCommuneSelect, StoryColorStrip, index.ts barrel)
        │   └── ui/ (Badge, Button, EmptyState, Input, Logo, QuantityStepper, Select)
        ├── lib/ (animations.ts, color.ts, utils.ts)
        └── store/ (index.ts, cart/cart.slice.ts, ui/ui.slice.ts)   Redux Toolkit
```

### Purpose of top-level folders
- **`app/`** — the actual Next.js App Router tree: every URL-addressable page, layout, and API route lives here (not under `src/`). This is the framework-mandated location and takes priority over `src/application/`'s decoy files.
- **`src/domain/`** — pure TypeScript business rules and types with zero framework/library imports; the theoretical "core" of the hexagonal architecture.
- **`src/application/`** — originally intended to hold use-cases orchestrating domain + ports; now holds only `cart.service.ts` (used by the Redux slice) after the unused `use-cases/` layer and stray `create-next-app` scaffold files (`layout.tsx`, `page.tsx`, `favicon.ico`) that used to live here were deleted as dead code.
- **`src/infrastructure/`** — all concrete integrations: the database (Drizzle/Postgres/Supabase), auth (Supabase), file storage (Supabase Storage), notifications (Telegram), and the delivery courier (Yalidine).
- **`src/presentation/`** — all React UI: components, the Redux store, and presentation-only utility/animation helpers. Despite the name suggesting it might contain page-level code, actual pages live in `app/` — `presentation/` supplies the components those pages compose.
- **`drizzle/`** — generated SQL migration history and Drizzle Kit metadata snapshots; do not hand-edit these files (regenerate via `npm run db:generate`).
- **`messages/`** — flat JSON translation dictionaries, one per locale, consumed by `next-intl`.
- **`scripts/`** — one-off/maintenance TypeScript scripts run manually via `tsx` (never imported by the Next.js app itself, except `scripts/create-parcel.ts` which the `POST /api/orders` route imports directly via a relative path — an unusual cross-boundary import worth noting).
- **`public/`** — static assets served at the site root; currently only the unmodified default Next.js SVGs, since real product imagery lives in Supabase Storage.

### Naming conventions
- **Files**: React components use `PascalCase.tsx` (`ProductCard.tsx`, `WilayaCommuneSelect.tsx`); Next.js special files use the framework's required lowercase names (`page.tsx`, `layout.tsx`, `route.ts`, `template.tsx`, `not-found.tsx`); non-component TypeScript modules use `kebab-case.ts` or `camelCase.ts` inconsistently (`supabase-auth.ts`, `cart.slice.ts`, `order.use-case.ts` vs. `client.ts`, `types.ts`).
- **Routes/folders**: dynamic segments use Next.js bracket syntax (`[slug]`, `[id]`, `[wilayaCode]`), consistently lowercase across the whole `app/api/delivery/` folder — `stopdesk-centers` originally used a capitalized `[WilayaCode]` param name, which was **not just cosmetic**: it meant the route handler's destructured `params.wilayaCode` never matched the actual params key (`WilayaCode`), so the route always returned a 400 `"Invalid wilaya code"` error (see [§20](#20-known-issues--technical-debt) item 15 — fixed by renaming the folder to lowercase). Route groups use parentheses (`(dashboard)`) to nest a layout without adding a URL segment.
- **Domain types**: PascalCase interfaces/types (`Product`, `Order`, `DeliveryZone`, `CreateOrderPayload`), SCREAMING_SNAKE_CASE for true constants (`MAX_BOX_CAPACITY`, `STORE_PICKUP_WILAYAS`).
- **Redux**: slice files are `<domain>.slice.ts` inside a folder named after the domain (`cart/cart.slice.ts`, `ui/ui.slice.ts`); selectors are prefixed `select*` (`selectCartTotal`, `selectIsBoxEligible`).
- **DB**: `snake_case` column names in Postgres (via Drizzle's second string argument, e.g. `varchar("color_hex", ...)`), mapped to `camelCase` TypeScript field names by Drizzle automatically.

### Non-obvious structural choices worth flagging
- The path alias `"@/*"` in `tsconfig.json` maps to `./src/*` **only** — `app/` code is imported via relative paths (`../../i18n.config`, `../providers`), not the alias. A developer reaching for `@/app/...` will get a module-not-found error.
- `scripts/create-parcel.ts` is imported directly by `app/api/orders/route.ts` via `@/../scripts/create-parcel` (the route file's own comment even says *"adjust path to your actual import alias"*, suggesting this was copy-pasted from elsewhere and not fully cleaned up) — a script folder being imported by production route code blurs the "scripts are standalone/manual" boundary.
- Two independent, redundant Postgres migration histories coexist: Drizzle Kit's own `drizzle/0000-0008` and hand-written SQL in `src/infrastructure/db/migrations/` — anyone provisioning a new database must apply both, in the right order, by inspection (there's no single `npm run db:setup` that does both).

---

## 6. Configuration & Environment

### Environment variables (names only — see [§14](#14-security--data-privacy) for why values are never included here)

| Variable | Purpose | Used by |
|---|---|---|
| `DATABASE_URL` | Postgres connection string (Supabase pooler) | `src/infrastructure/db/client.ts`, `drizzle.config.ts` |
| `POSTGRES_URL` | Fallback alternate name for the same, checked in one script | `scripts/sync-zones.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `src/infrastructure/auth/supabase-auth.ts`, storage service |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | Supabase server + client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role (admin) key — full DB/auth bypass privileges | `supabase-auth.ts`'s `createAdminClient()`, used to create/update the shadow admin auth user |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata/OG tags | `app/layout.tsx` (`metadataBase`) |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | `telegram-notification.service.ts` |
| `TELEGRAM_OWNER_CHAT_ID` | Comma-separated Telegram chat ID(s) to alert on new orders | same |
| `SENTRY_AUTH_TOKEN` | Sentry source-map upload auth (build-time only) | `next.config.ts` / Sentry build plugin |
| `CI` | Suppresses Sentry plugin log noise outside CI | `next.config.ts` |
| `NEXT_RUNTIME` | Next.js built-in — selects server vs. edge Sentry config | `instrumentation.ts` |
| `YALIDINE_API_BASE_URL` | Yalidine API base URL | `src/infrastructure/yalidine/client.ts` |
| `YALIDINE_API_ID` / `YALIDINE_API_TOKEN` | Yalidine API credentials (`X-API-ID`/`X-API-TOKEN` headers) | same |
| `YALIDINE_ENABLED` | Feature-gates all Yalidine parcel creation (`"true"` required) | `scripts/create-parcel.ts` |
| `YALIDINE_DEFAULT_ORIGIN_WILAYA_ID` | Default wilaya a parcel ships from (default 16 = Alger) | `src/infrastructure/yalidine/config.ts` |
| `YALIDINE_OVERRIDE_ORIGIN_WILAYA_ID` | Alternate ship-from wilaya (default 31 = Oran) | same |
| `YALIDINE_OVERRIDE_DESTINATION_IDS` | Comma-separated destination wilaya IDs that trigger the override origin | same |
| `NEXT_PUBLIC_FEATURE_WEEKLY_DROP` | Feature flag: weekly product drop | `src/domain/config/features.ts` |
| `NEXT_PUBLIC_FEATURE_VOTE` | Feature flag: community voting | same |
| `NEXT_PUBLIC_FEATURE_CUSTOM_BUILDER` | Feature flag: custom box builder — its former component (`BoxBuilder.tsx`) was deleted as dead code (see §20), so this flag currently gates nothing | same |
| `NEXT_PUBLIC_FEATURE_ANALYTICS` | Feature flag: admin analytics dashboard | same |

All four `NEXT_PUBLIC_FEATURE_*` flags default to **enabled** unless explicitly set to the string `"false"`.

There is **no `.env.example`** file in the repository — a new developer must reconstruct the required variable names from this document or from grepping `process.env` usage. Creating one (names only) is recommended as a follow-up.

### Configuration files

- **`next.config.ts`** — `reactCompiler: true` (enables the React Compiler / auto-memoization, paired with the `babel-plugin-react-compiler` dev dependency); `images.remotePatterns` allow-lists exactly one remote image host, the project's own Supabase Storage bucket (`https://gaquniefolcmosxhctmg.supabase.co/storage/v1/object/public/**`) — any other image host will fail Next's Image Optimization; wrapped in `withSentryConfig(...)` with `org: "me-mdv"`, `project: "magieklayn"`, source-map upload silenced outside CI, `automaticVercelMonitors: true`, and debug-log tree-shaking.
- **`tsconfig.json`** — `target: ES2017`, `strict: true`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, Next's TS plugin registered, single path alias `"@/*": ["./src/*"]`.
- **`postcss.config.mjs`** — single plugin, `"@tailwindcss/postcss": {}` (Tailwind v4's CSS-first setup; there is no `tailwind.config.js/ts` because v4 doesn't require one — theme customization instead lives inline in `app/globals.css`'s `@theme`/`:root` blocks).
- **`drizzle.config.ts`** — loads `.env.local` explicitly via `dotenv` (since Drizzle Kit runs outside the Next.js runtime and doesn't get automatic env loading); points `schema` at `./src/infrastructure/db/schema.ts`, migration output at `./drizzle`, `dialect: "postgresql"`, credentials from `DATABASE_URL`.
- **`i18n.config.ts`** — `locales = ['en', 'fr', 'ar']`, `defaultLocale = 'en'`, `timeZone: 'Africa/Algiers'`.
- **`instrumentation.ts` / `instrumentation-client.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`** — Sentry SDK initialization split by runtime (`NEXT_RUNTIME === "nodejs"` vs `"edge"`), plus `onRequestError = Sentry.captureRequestError` for automatic server-error capture.
- **`.gitignore`** — ignores `.env*` (so `.env.local` and `.env.sentry-build-plugin` are never committed) and standard Next.js build artifacts.
- **No ESLint/Prettier config**, **no `vercel.json`**, **no Dockerfile/`docker-compose.yml`**, **no `.env.example`**, **no CI workflow files**.

### Local development setup, from scratch

1. **Prerequisites**: Node.js (version compatible with Next 16 / React 19 — Node 20+ recommended, matching `@types/node: ^20`), a Supabase project (Postgres + Auth + Storage), Yalidine API credentials (optional — the app runs with Yalidine disabled via `YALIDINE_ENABLED=false`/unset), a Telegram bot (optional — notifications just log-and-skip if unset).
2. **Clone and install**: `git clone <repo>` then `npm install` (uses `package-lock.json`, so plain `npm install` — no `pnpm`/`yarn` lockfile present).
3. **Create `.env.local`** at the project root with at minimum: `DATABASE_URL` (Supabase Postgres pooler connection string, `?pgbouncer=true` typically), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Without `DATABASE_URL`, `src/infrastructure/db/client.ts` falls back to a **mock mode** (`db = null`, logs a warning) rather than crashing — useful for pure-frontend work but means DB-backed pages/routes will error or return empty data.
4. **Provision the database**: run `npm run db:push` (pushes the Drizzle schema directly, fastest for local dev) or `npm run db:migrate` (applies the tracked `drizzle/0000`–`0008` SQL migrations in order) — then **also manually apply** the two stray SQL files in `src/infrastructure/db/migrations/` (`add_delivery_zones.sql`, `make_delivery_zone_id_not_null.sql`), since these are not part of either automated migration path.
5. **Create at least one admin user**: insert a row into `admin_users` directly (email + `bcrypt`-hashed password) — there is no self-serve admin signup UI. If the corresponding Supabase Auth shadow user ever gets into a broken state, `npx tsx scripts/fix-auth.ts <email>` clears that admin's `supabase_auth_secret` so the next real login regenerates and re-syncs it (see [§9](#9-authentication--authorization)).
6. **(Optional) Yalidine**: set `YALIDINE_ENABLED=true`, `YALIDINE_API_BASE_URL`, `YALIDINE_API_ID`, `YALIDINE_API_TOKEN`, and run `npx tsx scripts/sync-zones-write.ts` to populate `delivery_zones` from live Yalidine fee data (or `scripts/sync-zones.ts` first for a dry-run diff).
7. **(Optional) Telegram**: set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_OWNER_CHAT_ID` to receive order alerts; omit to have notifications silently no-op.
8. **Run the dev server**: `npm run dev` (Next.js dev server, default `http://localhost:3000`).
9. **Inspect the database** at any time with `npm run db:studio` (Drizzle Studio, opens a browser UI against your configured `DATABASE_URL`).

---

## 7. Database & Data Layer

**Database type**: PostgreSQL, hosted on **Supabase**, connected via the `postgres` (postgres-js) driver wrapped by **Drizzle ORM**. The client (`src/infrastructure/db/client.ts`) explicitly sets `{ prepare: false }` on the `postgres()` connection — required because Supabase's connection pooler (transaction mode, port 6543) doesn't support prepared statements. If `DATABASE_URL` is unset, contains the literal substring `"mock"`, or contains the literal placeholder `"[YOUR_DB_PASSWORD]"`, the client sets `db = null` and logs a warning instead of connecting — a deliberate "run without a real DB" escape hatch for local frontend-only work (repositories that don't explicitly null-check `db` will throw at call time in that mode).

### Tables (from `src/infrastructure/db/schema.ts`, verified against source)

**`products`**
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `defaultRandom()` |
| `name` | `varchar(255)` NOT NULL | |
| `slug` | `varchar(255)` NOT NULL UNIQUE | URL identifier |
| `description` | `text` NOT NULL | |
| `notes` | `jsonb` (`string[]`) NOT NULL, default `[]` | Fragrance notes, e.g. `["Vanille","Musc blanc"]` |
| `price` | `integer` NOT NULL | Smallest currency unit (DA — Algerian Dinar) |
| `gender` | `product_gender` enum, nullable | `male \| female \| unisex` |
| `color_hex` | `varchar(7)` NOT NULL | Signature brand color per fragrance, e.g. `"#D0223A"` |
| `size_ml` | `integer` NOT NULL | Bottle size |
| `images` | `jsonb` (`string[]`) NOT NULL, default `[]` | Supabase Storage public URLs |
| `is_active` | `boolean` NOT NULL, default `true` | Visible in public catalogue |
| `is_new` | `boolean` NOT NULL, default `false` | "New" badge |
| `is_sold_out` | `boolean` NOT NULL, default `false` | "Sold out" badge |
| `inspired_by` | `varchar(255)`, nullable | Optional fragrance icon this mist draws from, e.g. `"Dior Lucky"` — curated per product in the admin, shown on the product detail page and the About page's "Inspired By" section (migration `0012`) |
| `created_at` / `updated_at` | `timestamp` NOT NULL, default `now()` | |

**`orders`**
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `full_name` | `varchar(255)` NOT NULL | Legacy combined-name field |
| `first_name` / `last_name` | `varchar(150)`, nullable | Added later; null on pre-migration rows |
| `phone` | `varchar(50)` NOT NULL | |
| `gift_note` | `text`, nullable | |
| `status` | `order_status` enum NOT NULL, default `pending` | `pending \| confirmed \| preparing \| ready \| delivered \| cancelled` |
| `total_amount` | `integer` NOT NULL | = cart total + delivery fee + coffret fee |
| `packaging_type` | `packaging_type` enum NOT NULL, default `standard` | `standard \| luxury_coffret` |
| `coffret_fee` | `integer`, nullable | Only set when `packaging_type = luxury_coffret`; recomputed server-side in `POST /api/orders` as `800 × boxColors.length`, never trusted from the client |
| `box_colors` | `box_color` enum **array**, nullable | One entry per box (`white \| black`), each box holding exactly 4 bottles — replaced the old single `box_color` scalar column (migrations `0010`/`0011`) to support multiple boxes per order |
| `delivery_zone_id` | `uuid` FK → `delivery_zones.id`, **NOT NULL** | Made NOT NULL by a later hand-written migration that deleted orphan rows |
| `delivery_type` | `delivery_type` enum, nullable | `stop_desk \| home \| store_pickup` |
| `delivery_fee` | `integer`, nullable | |
| `wilaya_code` | `varchar(2)`, nullable | |
| `wilaya_name` / `commune_name` | `varchar(255)`, nullable | ASCII-normalized snapshot from the resolved zone; for `stop_desk` orders this is the **customer's own** commune, not the pickup center's (see `stopdesk_commune_name` below) |
| `stopdesk_center_id` | `integer`, nullable | The real Yalidine center id the customer picked in `WilayaCommuneSelect` at checkout; only set when `delivery_type = stop_desk` |
| `stopdesk_commune_name` | `varchar(255)`, nullable | The picked **center's own** commune (not the customer's) — required by Yalidine's `createParcels` as `to_commune_name` for stop-desk shipments |
| `yalidine_tracking` | `varchar(50)`, nullable | Set post-hoc by `createParcelForOrder` |
| `order_date` | `timestamp`, default `now()` | |
| `deleted_at` | `timestamp`, nullable | Soft delete |
| `created_at` / `updated_at` | `timestamp` NOT NULL, default `now()` | |

Note: an `address` column existed in an early migration and was dropped in a later one — delivery has since become wilaya/commune/zone-based rather than free-text address-based.

**`order_items`**
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `order_id` | `uuid` FK → `orders.id`, **ON DELETE CASCADE** | |
| `product_id` | `uuid` NOT NULL | **No FK constraint** to `products.id` — intentionally decoupled so a product can be deleted without breaking historical orders |
| `product_name` / `product_slug` | `varchar(255)` NOT NULL | Snapshot at time of order |
| `product_image` | `varchar(500)`, nullable | Snapshot |
| `product_color_hex` | `varchar(7)`, nullable | Snapshot, survives later product recoloring |
| `quantity` | `integer` NOT NULL | |
| `price_snapshot` | `integer` NOT NULL | Price at time of order, immune to later price changes |

**`admin_users`**
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `email` | `varchar(255)` NOT NULL UNIQUE | |
| `password_hash` | `varchar(255)` NOT NULL | bcrypt |
| `created_at` | `timestamp` NOT NULL, default `now()` | |
| `supabase_auth_secret` | `varchar(255)`, nullable | Random per-admin secret used as this admin's Supabase Auth "shadow" password (migration `0013`) — generated lazily on first login, then reused; replaces the earlier deterministic `auth_${email}_fixed_password_v1` scheme |

**`delivery_zones`**
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `wilaya_code` | `varchar(2)` NOT NULL | |
| `wilaya_name_ascii` / `wilaya_name` | `varchar(255)` NOT NULL | Diacritic-stripped + display versions |
| `commune_name_ascii` / `commune_name` | `varchar(255)` NOT NULL | |
| `stop_desk_fee` / `home_fee` | `integer` NOT NULL | |
| `has_stop_desk` / `has_home_delivery` | `boolean` NOT NULL, default `true` | |

Indexes: `idx_delivery_zones_wilaya_code` (btree on `wilaya_code`); `idx_delivery_zones_wilaya_commune` (**unique**, on `wilaya_code` + `commune_name_ascii`) — this is the real uniqueness guarantee (an earlier named constraint was dropped in favor of this index).

### ERD (text form)

```
products  ──(1:N, no FK — snapshot only)──>  order_items  <──(N:1, FK, CASCADE DELETE)──  orders
                                                                                              │
                                                                                    (N:1, FK, NOT NULL)
                                                                                              ▼
                                                                                     delivery_zones

admin_users  — standalone table, joined to Supabase Auth users by email at the
               application layer (no DB-level FK to any Supabase auth schema)
```
- One `order` has many `order_items` (cascade-deleted with the order).
- `order_items.product_id` deliberately has **no FK** to `products` — order history must survive product deletion; all display-relevant product data is snapshotted onto the `order_items` row at order time.
- Every `order` belongs to exactly one `delivery_zones` row (required, NOT NULL).
- `admin_users` has no foreign keys in either direction; it's correlated with Supabase's own `auth.users` table purely by matching email strings in application code (`getAdminSession()`), not by a database constraint.

### Migrations
Two parallel mechanisms coexist (see [§3](#3-architecture-decisions--trade-offs) and [§20](#20-known-issues--technical-debt) for the risk this creates):
1. **Drizzle Kit-generated**: `drizzle/0000_bored_shadow_king.sql` through `drizzle/0013_polite_punisher.sql`, with matching `meta/*_snapshot.json` files and a `_journal.json` tracking them. Run via `npm run db:generate` (create from schema diff) and `npm run db:migrate` (apply) or `npm run db:push` (direct schema push, skipping migration files — convenient for local dev, riskier for tracked history). **In practice, neither `db:migrate` nor `db:push` reliably completes against this project's Supabase database** — `db:migrate` hangs/fails against the transaction-mode pooler (advisory-lock based), and `db:push` (as of migration `0012`) crashes during its own schema-introspection step with a drizzle-kit bug parsing an existing CHECK constraint, unrelated to whatever column is actually being added. The working fallback (used for `0013`, `0012`, and several before it): apply the raw SQL directly via a one-off `postgres` client script, then manually insert a matching row (sha256 hash of the migration file + the journal's `when` timestamp) into `drizzle.__drizzle_migrations` so Drizzle's own bookkeeping stays consistent for the next `db:generate`.
2. **Hand-written, untracked by Drizzle Kit**: `src/infrastructure/db/migrations/add_delivery_zones.sql` and `make_delivery_zone_id_not_null.sql` — must be applied manually (e.g. via `scripts/apply-migration.ts` or a direct `psql`/Supabase SQL editor run); there is no automated step that guarantees these ran.

### Seed data / fixtures
No general seed mechanism — no seed script exists in `package.json` scripts, and an earlier commit message literally says *"remove the seed"* (`6d332a4`), confirming one once existed and was deliberately removed. `scripts/data/algeria_cities.json` is static reference data (wilaya/commune names) used by the Yalidine zone-sync scripts, not application seed data. One narrow, one-time exception: `scripts/seed-inspired-by.ts` backfills `products.inspired_by` for the 14 launch mists from a hardcoded mist→inspiration list (dry-run by default, `--write` to apply) — not a repeatable seed for fresh databases, just the migration path for data that used to live in a static file.

### Caching strategy
No caching layer (no Redis, no in-memory cache, no `unstable_cache`/`revalidateTag` usage found beyond React's request-scoped `cache()` wrapper around `getAllProducts`/`getProductBySlug` in `app/actions.ts`, which only dedupes calls within a single render pass, not across requests). `app/layout.tsx` sets `export const dynamic = "force-dynamic"`, meaning the whole app opts out of Next.js's static/ISR caching by default — every request re-renders server-side.

### Known query performance considerations
- `delivery_zones` has a unique composite index on `(wilaya_code, commune_name_ascii)` and a plain index on `wilaya_code` — appropriate for the lookup patterns used (`getZone(id)`, `getCommunesByWilaya`, `getWilayas` dedup).
- `orderRepository.getTopWilayas(limit)` runs a `GROUP BY` aggregate over `orders` — fine at current volume, but has **no index on `orders.wilaya_code`** or `orders.status`, so this and `getAllWithFilters` (which filters by `wilayaCode`/`status`/date range) will do full or partial table scans as order volume grows.
- `orderRepository`'s stats logic in `GET /api/orders/stats` (non-wilaya branch) computes `totalOrders`/`totalRevenue`/`pendingOrders` by **fetching all orders into memory and reducing in JavaScript**, rather than an aggregate SQL query — this will not scale past a few thousand orders.
- No pagination on `GET /api/orders` (`limit` param, default 100, no `offset`/cursor) — the admin orders table effectively loads "everything up to `limit`" rather than paging through history.
- `products` GET is properly paginated (`page`/`limit`, capped at 100) via `getAllActivePaginated` + a separate `getActiveCount` — the one place pagination is done correctly.

---

## 8. API Reference

All routes are Next.js Route Handlers under `app/api/`. Response envelope convention (mostly consistent, hand-written per route, not shared via a schema): `{ success: boolean, data?: T, error?: string, message?: string, pagination?: {...} }`. **No route uses a shared auth middleware** — each admin-only route calls `getAdminSession()` (Supabase-session + `admin_users` membership check) inline at the top of its handler.

**Interactive API docs**: every route below (plus `delivery/*` and `upload`) carries a `@swagger` JSDoc block, compiled by `next-swagger-doc` (`src/infrastructure/swagger/config.ts`'s `getApiDocs()`) and served as a spec at `GET /api/openapi`, rendered as a browsable/testable UI at `/api-docs` (`swagger-ui-react`, dynamically imported client-side to avoid SSR issues). **Both `GET /api/openapi` and `/api-docs` are admin-gated** (`getAdminSession()`/`requireAdmin()` respectively) — the spec documents every route including admin-only ones, and the UI's "Try it out" can execute real requests using the browser's ambient session cookie, so both were treated as admin-only surfaces rather than left public. Keep new/changed routes' `@swagger` blocks in sync with this table by hand — nothing enforces the two stay consistent.

### Products

**`GET /api/products`**
- Purpose: public product catalogue, active products only.
- Query params: `page` (default `1`), `limit` (default `20`, capped at `100`).
- Response `200`: `{ success: true, data: Product[], pagination: { page, limit, totalCount, totalPages } }`.
- Auth: none.

**`POST /api/products`**
- Purpose: create a product.
- Body: `{ name, slug, description, price, colorHex, sizeMl, images, notes?, gender?, isActive?, isNew?, isSoldOut?, inspiredBy? }` — `name/slug/description/price/colorHex/sizeMl/images` are required (manual `if` check, not Zod). `inspiredBy` is an optional curated fragrance-icon name (e.g. `"Dior Lucky"`), shown on the product detail page and the About page's "Inspired By" section when set.
- Response `201`: `{ success: true, data: Product, message }`. `409` on duplicate `slug` (Postgres unique-constraint code `23505`). `401` if not admin. `400` on missing required field.
- Auth: admin (`getAdminSession()`).

**`GET /api/products/[id]`**
- Purpose: fetch one product by id.
- Response `200`: `{ success: true, data: Product }`; `404` if not found.
- Auth: none.

**`PUT /api/products/[id]`**
- Purpose: update a product.
- Body: partial `Product` fields.
- Response `200`: `{ success: true, data: Product }`; `409` on duplicate slug; `401` if not admin.
- Auth: admin.

**`DELETE /api/products/[id]`**
- Purpose: delete a product.
- Response `200`: `{ success: true }`; `401` if not admin.
- Auth: admin.

**`GET /api/admin/products`**
- Purpose: fetch **all** products including inactive ones (used by the admin product table, unlike the public paginated/active-only `GET /api/products`).
- Response `200`: `{ success: true, data: Product[] }`.
- Auth: admin.

### Orders

**`GET /api/orders`**
- Purpose: list orders with optional filters, admin dashboard.
- Query params: `limit` (default `100`), `wilayaCode`, `status` (one of the 6 `order_status` values), `startDate`, `endDate` (ISO date strings, parsed to `Date`).
- Response `200`: `{ success: true, data: Order[] }`. `401` if not admin.
- Auth: admin.

**`POST /api/orders`**
- Purpose: create an order (checkout) — the primary customer-facing write endpoint.
- Body (`CreateOrderPayload`): `{ customer: { firstName, lastName, phone }, items: CartItem[], deliveryZoneId (uuid), deliveryType ("stop_desk"|"home"|"store_pickup"), deliveryFee (number), packagingType? ("standard"|"luxury_coffret"), boxColors? ("white"|"black")[], giftNote?, stopdeskCenterId?, stopdeskCommuneName? }`.
- Validation: customer name/phone required; delivery zone/type/fee required; `items` must be non-empty, and **each item's price is now re-fetched server-side from `products` via `productRepository.getById()`** rather than trusted from `item.product.price` in the request body (closes a prior gap where `coffretFee`/`deliveryFee` were anti-tamper-protected but per-item price wasn't) — an item referencing a nonexistent, inactive, or sold-out product is rejected with `400`; if `deliveryType === "stop_desk"`, `stopdeskCenterId`/`stopdeskCommuneName` are required (the real Yalidine center the customer picked in `WilayaCommuneSelect`, needed for parcel creation to find the right center and `to_commune_name`); if `packagingType === "luxury_coffret"`, `boxColors` must be a non-empty array of `"white"`/`"black"` values whose length doesn't exceed `Math.floor(totalQuantity / 4)` (each box holds exactly 4 bottles — see `src/domain/rules/cart.rules.ts`'s `getMaxBoxCount`), and `coffretFee` is **recomputed server-side** as `800 × boxColors.length`, never trusted from the client; `deliveryZoneId` must resolve to a real `delivery_zones` row; `deliveryFee` is **forced to `0` server-side** when `deliveryType === "store_pickup"` regardless of the submitted value.
- Side effects: inserts `orders` + `order_items` rows; fires `telegramNotificationService.notifyNewOrder()` (best-effort, never throws — includes the stop-desk pickup point's commune name when applicable); fires `createParcelForOrder()` (Yalidine parcel creation — best-effort, never throws, skipped for `store_pickup` and for `YALIDINE_ENABLED !== "true"`; currently omits `length`/`width`/`height`/`weight` from the Yalidine payload entirely as a live test of whether sending them at all is what makes Yalidine's own platform always flag parcels as exceeding 5kg — see `scripts/create-parcel.ts`'s inline revert note).
- Response `201`: `{ success: true, data: Order, message }`. `400` on validation failure. `500` on unexpected error.
- Auth: none (public checkout).

**`GET /api/orders/[id]`**
- Purpose: fetch one order.
- Response `200`: `{ success: true, data: Order }`; `404` if not found.
- Auth: admin.

**`PUT /api/orders/[id]`**
- Purpose: update order status.
- Body: `{ status: OrderStatus }` — validated against the 6 enum values.
- Response `200`: `{ success: true, data: Order }`; `400` on invalid status.
- Auth: admin.

**`DELETE /api/orders/[id]`**
- Purpose: delete an order. Repository-enforced rule: **only orders with `status = "cancelled"` may be deleted.**
- Response `200`: `{ success: true }`; error if the order isn't cancelled.
- Auth: admin.

**`GET /api/orders/stats`**
- Purpose: dashboard statistics.
- Query params: `type=wilayas&limit=N` → top-N wilayas by order count/revenue (SQL `GROUP BY` aggregate). Without `type`, returns `{ totalOrders, totalRevenue, pendingOrders }` (computed in-memory over all fetched orders — see [§7](#7-database--data-layer) performance note).
- Response `200`: `{ success: true, data: {...} }`.
- Auth: admin.

### Delivery

**`GET /api/delivery/wilayas`**
- Purpose: list distinct wilayas that have at least one `delivery_zones` row (i.e., are deliverable).
- Response `200`: `{ success: true, data: { wilayaCode, wilayaName }[] }`.
- Auth: none (public — needed by the checkout form).

**`GET /api/delivery/communes/[wilayaCode]`**
- Purpose: list communes (with fees/flags) within a given wilaya, from the `delivery_zones` table.
- Response `200`: `{ success: true, data: DeliveryZone[] }`.
- Auth: none.

**`GET /api/delivery/stopdesk-centers/[wilayaCode]`**
- Purpose: list **live** Yalidine stop-desk pickup centers for a wilaya — calls Yalidine's `getCenters()` directly rather than reading from the DB, since center data isn't persisted locally.
- Response `200`: `{ success: true, data: StopdeskCenter[] }`.
- Auth: none.
- Note: this route's folder used to be capitalized `[WilayaCode]`, which silently broke it (every request returned a 400 `"Invalid wilaya code"` because the handler destructured the lowercase `wilayaCode` key that never matched) — fixed by renaming the folder to lowercase, matching the sibling `communes/[wilayaCode]` route.

### Uploads

**`POST /api/upload`**
- Purpose: upload an image (product photos) to Supabase Storage.
- Body: `multipart/form-data`, field name `file`.
- Validation: MIME type allow-list (`image/jpeg`, `image/png`, `image/webp`, `image/gif`); max size 5 MB.
- Response `200`: `{ success: true, url: string }` (public Supabase Storage URL).
- Auth: admin.

### Empty/placeholder routes
`app/api/auth/` and `app/api/messages/` exist as directories but contain no `route.ts` — they are not live endpoints (likely scaffolding for future work).

---

## 9. Authentication & Authorization

**System**: a custom hybrid built on **Supabase Auth** + a bespoke `admin_users` Postgres table, implemented entirely in `src/infrastructure/auth/supabase-auth.ts`. There is exactly **one role: `admin`** — no customer accounts exist at all (checkout is anonymous by design: *"Commandez en ligne, sans compte requis"*).

**Session/token management**: standard Supabase session cookies (set via `@supabase/ssr`'s `createServerClient`, using Next's `cookies()` API to read/write). No custom JWT issuance, no `localStorage` token storage.

**Login flow** (`adminLogin(email, password)`):
1. Look up `admin_users` by email; if absent, reject.
2. `bcrypt.compare(password, admin.passwordHash)`; if it doesn't match, reject.
3. Look up this admin's `supabase_auth_secret` column. If empty (first login since the column was added, or a new admin), generate a real random secret via `crypto.randomBytes(32).toString("hex")` and save it to that column — otherwise reuse the already-stored value as-is.
4. Using the Supabase **service-role admin client**, either update an existing Supabase Auth user's password to that secret (only on the first-time/empty-column path — never overwritten again after that), or create the Supabase Auth user with it (`email_confirm: true`, `user_metadata: { role: "admin" }`) if none exists yet.
5. Sign in via the regular (cookie-writing) Supabase client with `signInWithPassword({ email, password: <secret> })` — this is what actually sets the session cookies the browser will send on subsequent requests.

**Session check** (`getAdminSession()`): reads the current Supabase session (`supabase.auth.getUser()`); if present, **re-verifies** the user's email still exists in `admin_users` before returning a session object `{ id, email, role: "admin" }`. This re-check is what prevents a stray/legacy Supabase Auth user (not in `admin_users`) from passing as an admin.

**Route protection**:
- **Frontend/pages**: `app/admin/(dashboard)/layout.tsx` (a Server Component) calls `requireAdmin()` — which re-verifies `admin_users` membership, not just "has a Supabase session" — and redirects to `/admin/login` if that fails. (Previously called `supabase.auth.getUser()` directly, which only checked for *a* valid Supabase session; fixed to match every admin API route's stricter check.) `/api-docs` (the Swagger UI console) is gated the same way via its own `app/api-docs/layout.tsx`.
- **API routes**: no shared middleware; every admin-only Route Handler calls `getAdminSession()` at the top of its own handler and returns `401` if it's `null`.
- **`requireAdmin()`** is a redirect-based helper (used by server components that need to hard-require an admin session, redirecting rather than returning `null`).
- **`isAuthenticated(request)`** exists specifically "for middleware" (reads an `sb-access-token` cookie), but as noted in [§3](#3-architecture-decisions--trade-offs)/[§20](#20-known-issues--technical-debt), there is **no active root middleware/proxy file**, so this helper is currently unused/unreachable in the request pipeline.

**Logout** (`adminLogout()`): `supabase.auth.signOut()`, then `redirect("/admin/login")`.

**OAuth providers**: none — email/password only.

**Security assumptions and known limitations** (see also [§14](#14-security--data-privacy)):
- ~~The synthetic-password scheme (`auth_${email}_fixed_password_v1`) is **not a secret**~~ — **RESOLVED.** Replaced with a random per-admin secret (`admin_users.supabase_auth_secret`, migration `0013`), generated once and reused rather than re-derived from the email. `getAdminSession()`'s independent `admin_users` re-check on every request remains in place as defense in depth regardless.
- The service-role key (`SUPABASE_SERVICE_ROLE_KEY`) — which bypasses all Row Level Security — is used at login time from server-side code only, which is correct practice, but its presence anywhere in `.env.local` is a high-value secret that must never leak client-side.
- ~~No rate limiting on `/admin/login` or on `POST /api/orders`~~ — **RESOLVED.** Both now rate-limited per-IP via `src/infrastructure/rate-limit/limiter.ts` (5 login attempts/15 min, 10 orders/10 min) — see [§14](#14-security--data-privacy) for the limiter's known cross-instance limitation.
- No CSRF token mechanism beyond what Next.js Server Actions provide natively (Server Actions have built-in origin checking); plain Route Handlers (`POST /api/orders`, etc.) have no explicit CSRF protection, relying on same-origin `fetch()` calls from the app's own frontend and the absence of cookie-based auth on the public-facing write endpoint (checkout is unauthenticated, so CSRF is less relevant there specifically — but admin mutating routes rely on the Supabase session cookie plus browser same-origin behavior, with no additional CSRF token).

---

## 10. Frontend Architecture

**Component hierarchy**: `app/layout.tsx` (Server Component: fonts, locale/messages resolution) → `app/providers.tsx`'s `<Providers>` (Client Component composition root: `NextIntlClientProvider` → Redux `<Provider>` → `<CartPersistenceProvider>` (headless, syncs Redux cart ↔ `localStorage`) → `<ClientProviders>` (conditionally renders `<Header>`/`<Footer>` based on `usePathname()` — hidden on `/admin/*` routes — and always renders `<CartDrawer>` + `<ToastContainer>`)) → `{children}` (the actual routed page). `app/template.tsx` wraps page transitions in Framer Motion animation on every navigation. Admin pages additionally nest under `app/admin/(dashboard)/layout.tsx`, which adds the Supabase auth gate and the `AdminSidebarWrapper`/`AdminTopBar` chrome.

**Routing**: Next.js App Router file-based routing (see full route table in [§5](#5-folder--file-structure)). No client-side router library beyond Next's own `next/navigation` (`useRouter`, `usePathname`, `redirect`). Locale is **not** part of the URL (no `/en/`, `/fr/` prefixes) — it's resolved from a cookie server-side, so all locales share the same route paths.

**State management** — three distinct tiers, no overlap:
- **Global (Redux Toolkit)**: cart contents (`cart` slice — items, gift note, `boxColors: BoxColor[]`, one entry per chosen box) and ephemeral UI state (`ui` slice — cart-drawer open/closed, mobile-menu open/closed, toast queue). Selectors are memoized with `createSelector` (`selectCartSummary`, `selectCartTotal`, `selectMaxBoxCount`, `selectIsBoxEligible`, etc.), delegating actual math to `src/application/services/cart.service.ts` and `src/domain/rules/cart.rules.ts` rather than computing inline in the slice.
- **Server state**: fetched per-request via Server Components/Actions (products, order lists) or via client `fetch()` in `useEffect` (admin tables, delivery lookups) — there is **no client-side server-state cache** (no SWR/React Query), so every navigation/mount re-fetches from scratch.
- **Local component state**: plain `React.useState`/`useRef` throughout — e.g. `ProductForm`'s entire form state, `Select`'s open/closed state, `LanguageSwitcher`'s dropdown state. **No custom hooks exist in the codebase** — all such logic is inlined per-component rather than extracted (a `useState`-heavy pattern repeated across `ProductForm`, `app/admin/login/page.tsx`, and others without shared abstraction).

**Data fetching strategy**: hybrid, described fully in [§4](#4-project-architecture)'s data-flow section — Server Components + cached (`React.cache()`) Server Actions for SEO-relevant reads; plain `fetch()` in `useEffect` for everything interactive/admin-facing. No request deduplication, retries, or stale-while-revalidate semantics anywhere on the client side.

**Form handling**: inconsistent across the app — **`app/cart/page.tsx`** (checkout) and **`app/contact/page.tsx`** use `react-hook-form` + `zodResolver` for typed, validated forms; **`ProductForm.tsx`** (admin product create/edit) and **`app/admin/login/page.tsx`** use plain controlled `useState` with only native HTML validation attributes. The checkout form has an added wrinkle: `WilayaCommuneSelect` is a custom (non-native `<select>`) component not directly registered with `react-hook-form`, so the checkout page calls RHF's `setValue()` imperatively from that component's `onChange` callback to keep the two in sync.

**Error handling and loading states**: `app/global-error.tsx` is a Sentry-integrated root error boundary catching unhandled render errors app-wide. Individual pages handle their own loading/error states ad hoc via local `useState` flags (`isLoading`, `error` strings) rather than a shared pattern or Next's `loading.tsx`/`error.tsx` file conventions (neither convention file was found anywhere under `app/`, despite Next.js supporting them natively) — meaning route-level Suspense/error boundaries are unused, and every page reimplements its own spinner/error-message logic.

**Key reusable components**:
- `Header` / `Footer` — global site chrome, rendered by `ClientProviders`, hidden on `/admin`.
- `CartDrawer` — slide-in cart preview, opened from the header cart icon, driven entirely by Redux `ui.cartOpen`.
- `ProductCard` (`features/`) — the product-grid tile (hover color-tint, add-to-cart, new/sold-out badges); a second, unused duplicate used to also exist as `ui/Card.tsx` but was deleted as dead code (see [§20](#20-known-issues--technical-debt)).
- `WilayaCommuneSelect` — the cascading wilaya → commune → delivery-type → stop-desk-center selector used at checkout; the most complex single form component in the app, coordinating three chained API calls (`/api/delivery/wilayas`, `/api/delivery/communes/[code]`, `/api/delivery/stopdesk-centers/[code]`). Auto-selects Stop Desk as the delivery type once it's offerable for the chosen commune, and auto-picks a default pickup center — preferring one whose own commune name matches the **wilaya's** name (its likely "main" center), falling back to the first center returned — sparing the customer clicks while still letting them override both choices manually.
- `BoxPackagingSelector` (`app/cart/page.tsx`) — the coffret picker: once the cart holds ≥4 bottles, shows one white/black color-card pair per box already chosen plus exactly one empty "next" slot; picking a color on that empty slot is what adds a box (no separate stepper), and re-picking the last box's already-selected color removes it — a deliberately one-click, progressively-revealing interaction.
- `StoryColorStrip` (`features/`) — a thin (~1rem), responsive SVG ribbon on the `/about` page winding top-to-bottom, one hard-edged color band per product in `src/domain/data/story-palette.ts` (a **static, hand-maintained** snapshot of the 14 products' real colors — not fetched at runtime, deliberately, so the page renders instantly with zero network round-trip). Animates in per-band on scroll and glows on hover via Framer Motion.
- `ProductForm` — admin product create/edit form, including image upload wiring to `/api/upload` and an auto-slugify-from-name behavior.
- `ToastContainer` — global toast/snackbar rendering off the `ui.toasts` Redux array.
- `Select`, `Button`, `Badge`, `Input`/`Textarea`, `QuantityStepper` — hand-rolled design-system primitives (see [§11](#11-ui--ux-design)).

---

## 11. UI & UX Design

**Design system**: fully custom/hand-rolled — **no shadcn/ui, no Radix primitives, no MUI/Chakra/Ant** (no `components.json`, no `@radix-ui/*` in `package.json`). Primitives live in `src/presentation/components/ui/` (`Button`, `Badge`, `Input`/`Textarea`, `Select`, `QuantityStepper`, `Logo`, `EmptyState`) built directly on Tailwind utility classes plus a large hand-authored global stylesheet.

**Color palette** (from `app/globals.css`'s `:root`):
| Token | Value | Purpose |
|---|---|---|
| `--color-bg` | `#ffffff` | Page background |
| `--color-bg-soft` | `#faf9f7` | Secondary/section background |
| `--color-text` | `#1d1d1d` | Primary text |
| `--color-text-secondary` | `#6b6b6b` | Secondary/muted text |
| `--color-border` | `#eae7e2` | Hairline borders |
| `--color-white` | `#ffffff` | Explicit white (used against colored backgrounds) |

Beyond this base palette, **the site is deliberately color-led at the product level**: each fragrance carries its own `colorHex` value (e.g. `"#D0223A"`), used to tint product cards on hover, the illustrated bottle SVG's liquid gradient (`--liquid`/`--liquid-deep` CSS custom properties), and the homepage discovery/collection sections — text color (white vs. dark) against these dynamic backgrounds is chosen at runtime via a luminance calculation (see [§20](#20-known-issues--technical-debt) for the fact that **three separate, slightly different implementations** of this luminance function exist in the codebase). The admin dashboard additionally defines its own semantic tokens (`--color-success`, `--color-error`, `--color-warning`) not used on the storefront.

**Typography**: `app/layout.tsx` loads two Google Fonts via `next/font/google` — **Comfortaa** (`--font-comfortaa`, weights 300–700, Latin subset) and **Noto Kufi Arabic** (`--font-arabic`, weights 400–700, Arabic subset, for RTL pages). However, `app/globals.css`'s `:root` defines `--font-display: var(--font-archivo-black), "Inter", sans-serif` and `--font-body: var(--font-inter), ...` — referencing font-family variables (`--font-archivo-black`, `--font-inter`) that **are not actually loaded anywhere** in `layout.tsx`. This is a leftover from an earlier font choice (Archivo Black / Inter) that was swapped for Comfortaa/Noto Kufi Arabic without updating the CSS variable references — in practice the browser falls through to the literal fallback strings (`"Inter"`, `sans-serif`) rather than the actually-loaded Comfortaa font, unless something else overrides it. Worth fixing/reconciling.

**Spacing & layout**: a small custom spacing scale in `:root` (`--space-xs: 0.5rem` through `--space-2xl: 7vw`), plus `--radius-main: 12px` / `--radius-card: 20px` for corner rounding and `--shadow-soft` / `--shadow-card` for elevation — layered on top of (not replacing) Tailwind's own utility spacing scale, which the `ui/` primitives use directly (`p-4`, `gap-2`, etc.). Layout is primarily CSS Grid/Flexbox, hand-written per section in `globals.css` (product grid, discovery grid, admin table layout) rather than a systematic Tailwind grid convention.

**Responsive design**: hand-coded `@media (max-width: ...)` breakpoints at `1024px`, `800px`, `700px`, and `420px` scattered through `globals.css` — not Tailwind's `sm:`/`md:`/`lg:` breakpoint system, so responsive behavior for the custom CSS sections and the Tailwind-based `ui/` primitives follow **two different breakpoint systems** that aren't guaranteed to align.

**Animations/transitions**: `framer-motion` throughout, with a shared variant library in `src/presentation/lib/animations.ts` (`fadeInUp`, `staggerContainer`, `scaleIn`, `slideInRight` for the cart drawer, `slideInBottom`, `fadeOverlay`, `cardHover`, `pageTransition` for route changes, `gridItem` for product-card entrance, `toastSlide`). `@media (prefers-reduced-motion: reduce)` is explicitly handled in `globals.css` (collapses all animation/transition durations to near-zero) — a genuine accessibility consideration that was deliberately implemented.

**Accessibility considerations**: a `.sr-only` utility class and a `.skip-link` ("skip to content") pattern exist in `globals.css` and are focus-visible-styled; `:focus-visible` gets an explicit outline app-wide; the custom `Select` component sets `role="listbox"`/`aria-expanded`; reduced-motion is respected (above). No systematic audit evidence found (no `axe`/Lighthouse CI config), so these should be treated as a good-faith baseline, not a certified compliance level.

**Key UI patterns**: slide-in cart drawer (Framer Motion, closes on Escape, locks body scroll while open), toast notifications (auto-dismiss after 3s, success/error/info variants), accordion (FAQ page), custom dropdown/listbox (`Select`, `LanguageSwitcher`), modal-style create/edit forms in the admin product page, sortable/filterable admin tables (orders, products), a route-group-based admin sidebar layout, and an illustrated CSS-only "bottle" component (no raster image) used as a fallback visual whenever a product has no uploaded photos.

**Main pages and layout** (see [§5](#5-folder--file-structure) for the full route table): Home (hero + ticker + collection visual + 3-product discovery grid + brand story + newsletter stub) → Shop (sortable product grid) → Product Detail (illustrated bottle or photo, notes, size, add-to-cart) → Cart/Checkout (single-page cart review + RHF+Zod checkout form + order-success state) → supporting pages (About, Contact, FAQ, Shipping/store-locator) → Admin (dashboard stats, orders table, products table), all gated behind a dark-themed sidebar shell distinct from the storefront's white/color-led aesthetic.

---

## 12. Design Patterns & Code Conventions

**Main design patterns**:
- **Repository pattern**: `src/domain/ports/repositories.ts` defines `IProductRepository`, `IOrderRepository`, `IDeliveryRepository`, `IStorageService` interfaces; `src/infrastructure/db/*.adapter.ts` provide the Drizzle-backed implementations, exported as ready-made singletons (`productRepository`, `orderRepository`, `deliveryRepository`).
- **Adapter pattern**: the same `*.adapter.ts` files, plus `SupabaseStorageService` and `TelegramNotificationService`, adapt third-party SDKs/APIs to the domain-defined port interfaces (`IStorageService`, `INotificationService`).
- **Service layer**: `src/application/services/cart.service.ts`'s `CartService` class encapsulates cart mutation/calculation logic, called by the Redux slice rather than having the slice do math directly.
- **Use-case pattern** — no longer present: `src/application/use-cases/{order,product}.use-case.ts` used to define classes like `CreateOrderUseCase`/`GetAllProductsUseCase` wrapping repository calls, but they were never called by any live API route and were deleted as dead code (see [§20](#20-known-issues--technical-debt)).
- **Singleton pattern**: repository/service/client instances are exported as module-level singletons (`export const productRepository = new ProductRepository()`, `export const yalidineClient = new YalidineClient()`) rather than dependency-injected — simple, but makes swapping implementations (e.g., for tests) require module-level mocking rather than constructor injection.
- **Compound/barrel export**: `src/presentation/components/features/index.ts` re-exports several (not all) feature components and their prop types from one module.

**Code style/formatting**: no ESLint or Prettier configuration exists — formatting is whatever each commit happened to produce; there is no automated enforcement. TypeScript is in `strict` mode (`tsconfig.json`), so type-level correctness is enforced by the compiler even without lint rules.

**Business logic vs. UI vs. data access separation**: generally well-separated for **domain-level rules** — `src/domain/rules/cart.rules.ts` (coffret eligibility, cart totals) and `src/domain/entities/delivery.ts` (`getDeliveryFee`) are pure functions with no React/DB imports, callable from both Redux selectors and API routes. Separation is **weaker at the request-handling level** — API routes (`app/api/orders/route.ts`) mix validation, business rules (e.g. the store-pickup fee override), and direct repository calls all inline in the handler function, rather than delegating to a dedicated use-case layer (there isn't one anymore — see [§20](#20-known-issues--technical-debt)).

**TypeScript organization**: domain types live in `src/domain/entities/*.ts` (hand-written interfaces: `Product`, `Order`, `DeliveryZone`, `CreateOrderPayload`, etc.); database-shape types are auto-inferred from the Drizzle schema (`typeof products.$inferSelect` etc. in `schema.ts`) — meaning there are **two parallel type systems** for the same underlying data (hand-written domain `Product` vs. Drizzle-inferred `Product` from `schema.ts`) that must be kept structurally compatible by discipline, not by a shared definition. Component prop types are typically inlined per-component (`interface ButtonProps extends ...`) rather than centralized.

**Custom hooks**: **none exist** — confirmed by an exhaustive search for `use*.ts(x)` naming; all stateful logic is inlined in components.

**Utility functions** (`src/presentation/lib/`):
- `utils.ts` — `cn()` (Tailwind class merge via `clsx`+`tailwind-merge`), `formatPrice()` (Intl `fr-DZ` currency formatting → "DA" suffix), `formatDate()`, `slugify()`, `truncate()`, `generatePlaceholder()` (base64 SVG blur placeholder), `getLuminance()`.
- `color.ts` — a second, independently-weighted `getLuminance()`.
- `animations.ts` — the Framer Motion variant library (see [§11](#11-ui--ux-design)).
- ~~`colors.ts`~~ — deleted; was orphaned (`LIQUID_COLOR`/`darkenHex`/`getLiquidStyle`, not imported anywhere) — see [§20](#20-known-issues--technical-debt).

**Constants and enums**: mostly colocated with the domain entity they describe rather than centralized — `MAX_BOX_CAPACITY`/`BOX_FEE`/`getMaxBoxCount`/`calculateCoffretFee` in `src/domain/rules/cart.rules.ts`; `STORE_PICKUP_WILAYAS`/`STORE_LOCATIONS` in `src/domain/entities/delivery.ts`; `STORY_PALETTE` (static About-page ribbon colors) in `src/domain/data/story-palette.ts`; Postgres enums (`order_status`, `product_gender`, `delivery_type`, `box_color`, `packaging_type`) defined once in `src/infrastructure/db/schema.ts` via `pgEnum` and reused as the TypeScript source of truth for those unions elsewhere; feature flags centralized in `src/domain/config/features.ts`.

---

## 13. Scalability & Maintainability

**Current load assumptions**: this is a single small-brand storefront (one product line, dozens of SKUs at most) with no evidence of load-testing, rate limiting, or horizontal-scaling configuration. Realistically designed for tens to low-hundreds of concurrent visitors and a handful of orders per day/week — consistent with a solo-developer MVP for one physical retail brand, not a multi-tenant platform.

**Bottlenecks at 10x load**:
- `GET /api/orders/stats` (non-wilaya branch) fetches **all** orders and reduces in JavaScript to compute totals — at 10x order volume this becomes a measurably slow, memory-heavy request on every admin dashboard load.
- `GET /api/orders` has no true pagination (just a `limit` cap, no cursor/offset) — the admin orders table would start truncating/missing data or need ever-larger `limit` values.
- No caching layer means every product-listing page render hits Postgres directly; 10x traffic is 10x direct DB load with no buffer.
- Yalidine's own rate limits (the client already implements retry/backoff and a self-imposed cooldown when the minute-quota drops low) would start being hit more often under higher order volume, slowing or delaying parcel creation.

**Bottlenecks at 100x load**:
- The lack of any queue/background-job system for Yalidine parcel creation becomes untenable — synchronous-ish fire-and-forget calls from the request handler would need to move to a real job queue (e.g., a Vercel Cron + a `yalidine_tracking IS NULL` retry job, or a proper queue service) to avoid request-handler latency and silent drops.
- Postgres connection handling via `postgres-js` with `prepare: false` against Supabase's pooler should hold up reasonably at 100x for a small schema, but the missing indexes on `orders.status`/`orders.wilaya_code` (see [§7](#7-database--data-layer)) would need to be added, and the in-memory stats aggregation would need to become a real SQL `COUNT`/`SUM` query (or a materialized view / scheduled rollup table).
- Supabase Storage + Next Image Optimization for product photos would need a CDN/cache-control review at that scale (currently no explicit cache headers configured beyond Next's defaults).
- Telegram notification fan-out to multiple owner chat IDs is fine at any realistic scale (Telegram's own API limits are generous relative to this use case).

**Database scaling path**: add indexes on `orders.status` and `orders.wilaya_code` (or a composite), replace the in-memory stats reducer with real SQL aggregates, add pagination (cursor-based) to `GET /api/orders`, and introduce a caching layer (even a simple `unstable_cache`/short-TTL cache on the public product-listing endpoint, since that data changes infrequently) before considering read replicas or sharding — this schema is small and simple enough that read replicas/sharding are very unlikely to ever be necessary at this business's realistic scale.

**Extensibility**: adding a new **page** means a new folder+`page.tsx` under `app/`; a new **API endpoint** means a new `route.ts` under `app/api/`; a new **DB table/field** means editing `src/infrastructure/db/schema.ts` and running `npm run db:generate && npm run db:migrate` (or `db:push` for local dev) — but a developer must remember to also check `src/infrastructure/db/migrations/` for any hand-written migrations that might conflict, since that path isn't part of the automated flow. A new **domain entity/rule** goes in `src/domain/`; a new **repository method** means updating the port interface (`src/domain/ports/repositories.ts`) and its Drizzle adapter together. A new **UI component** goes in `src/presentation/components/{features,ui}/` and should be added to the `features/index.ts` barrel (though that barrel is already inconsistently maintained — see [§20](#20-known-issues--technical-debt)).

**Multi-timezone / multi-region assumptions**: the app assumes a **single timezone, `Africa/Algiers`** (hardcoded in `i18n.config.ts`) and a **single country, Algeria** (wilaya/commune delivery model, Yalidine courier, DZD currency formatting hardcoded as `fr-DZ` in `formatPrice()`). Going global/multi-region would require: abstracting the delivery-zone model beyond wilaya/commune, supporting multiple couriers, multi-currency pricing/formatting, and timezone-aware date handling (`order_date`/`created_at` are stored as plain `timestamp` without timezone in Postgres — worth confirming this is intentional given the single-timezone assumption).

**Known technical debt** (full detail in [§20](#20-known-issues--technical-debt)): three divergent `getLuminance()` implementations; two parallel DB-migration mechanisms; no shared client/server validation schema; hardcoded synthetic-password auth scheme; TODO placeholder store addresses. (The duplicate order-creation paths, "Crumbleivable" brand-name leftovers, the unused `application/use-cases` layer, disconnected i18n middleware, orphaned `BoxBuilder`/`Card.tsx`/`colors.ts`, and the `[WilayaCode]`/`[wilayaCode]` route-param bug have all since been resolved — see [§20](#20-known-issues--technical-debt).)

**Maintenance burden**: low-to-moderate for a single developer who already holds the whole system in their head, but **high for a new developer** without this document, because: (a) the dead-vs-live code paths (use-cases, i18n middleware, `BoxBuilder`) aren't marked as such anywhere in the code itself; (b) there's no test suite to lean on to understand expected behavior or to safely refactor; (c) the two-migration-mechanism DB story requires tribal knowledge to reproduce correctly on a fresh environment. There is no on-call rotation or incident process — Sentry is the only safety net for catching production errors, and Telegram order alerts are the only "is the business working" signal.

**Handoff readiness**: with this document, a new developer could likely orient themselves and make a small, safe change (e.g., add a new product field, add a new FAQ entry, adjust a delivery fee) within a few hours. What would help most: (1) this document itself, kept up to date; (2) resolving the dead-code ambiguities flagged throughout (delete or wire up `use-cases`, `i18n` middleware, `BoxBuilder`); (3) a `.env.example`; (4) at minimum a handful of integration tests around order creation (the highest-stakes, most side-effect-heavy code path in the app).

---

## 14. Security & Data Privacy

**Data protection**: data at rest is protected only insofar as Supabase's managed Postgres/Storage provide (encryption at rest is a Supabase platform guarantee, not something this application configures itself). Data in transit uses HTTPS throughout (Supabase, Yalidine, Telegram, and the app's own Vercel deployment are all HTTPS by default) — no application-level payload encryption exists (e.g., customer phone numbers and names are stored in plain columns, not encrypted at the column level).

**Authentication/session security**: see [§9](#9-authentication--authorization) in full. The Supabase shadow password used to be a deterministic string derivable from the admin's email — **now a random per-admin secret** (`admin_users.supabase_auth_secret`), generated once and reused rather than re-derived. No password complexity requirements are enforced anywhere in code for the `admin_users.passwordHash` — whatever was hashed at account-creation time (done manually, outside the app UI) is accepted as-is.

**Authorization**: exactly two tiers — public (anonymous) and `admin`. Enforced per-request: server-layout redirect for admin pages, inline `getAdminSession()` checks for admin API routes. No row-level/field-level permission granularity exists (any admin can do anything any other admin can).

**Input validation/sanitization**:
- Client-side: `zod` schemas validate the checkout form (Algerian phone regex, name length, UUID format for delivery zone, enum for delivery type) and the contact form (email format, message length).
- Server-side: **now has a `zod` layer too** — `src/domain/validation/checkout.schema.ts` (`POST /api/orders`) and `src/domain/validation/product.schema.ts` (`POST`/`PUT /api/products`) enforce type/length/format constraints (string length caps, phone character-set check, enum values, positive numeric bounds) via `.safeParse()`, returning `400` on failure. This runs *in addition to*, not instead of, the pre-existing hand-written `if` presence checks and business-rule logic (coffret box counts, delivery-zone resolution, store-pickup fee override) — those are unchanged.
- Telegram notification text is explicitly **HTML-escaped** before being sent (`telegram-notification.service.ts`), preventing HTML-injection into the bot message (Telegram's `parse_mode: "HTML"` would otherwise render unescaped customer input as markup).
- File uploads (`POST /api/upload`) are validated by a MIME type allow-list, size cap (5 MB), **and a magic-byte sniff of the actual file bytes** (`sniffImageType()`) — the allow-list check alone only validated the browser-supplied `Content-Type` label, which a mislabeled non-image file could have satisfied; the sniffed type (not the client-reported one) is now what's actually stored.

**SQL injection**: mitigated structurally — all database access goes through Drizzle ORM's parameterized query builder; no raw string-interpolated SQL was found in application code (the hand-written `.sql` migration files are schema DDL, not runtime query paths, and are only ever run manually/offline).

**XSS**: React's default JSX escaping protects rendered user content throughout the app; no `dangerouslySetInnerHTML` usage was identified in the explored components. The Telegram-message HTML-escaping (above) is the one place raw user input is deliberately assembled into a markup-interpreting string, and it's handled correctly.

**CSRF**: Next.js Server Actions have built-in CSRF protection (origin header verification). Plain Route Handlers do not get this automatically — `POST /api/orders` is public/unauthenticated so CSRF is largely moot there (no session to hijack), but admin-mutating routes (`PUT/DELETE /api/orders/[id]`, `POST/PUT/DELETE /api/products`, `POST /api/upload`) rely solely on the Supabase session cookie + same-origin browser behavior, with no explicit anti-CSRF token — a cross-site request from a page an authenticated admin happens to have open could in theory trigger one of these if third-party cookie/SameSite defaults didn't block it (Supabase's cookies are typically `SameSite=Lax` by default, which mitigates most simple CSRF vectors for `GET`, less so guaranteed for all `POST`/`PUT`/`DELETE` patterns — not independently verified in this codebase).

**Known security assumptions/limitations** (explicit list):
1. Synthetic Supabase Auth password scheme (see above) — the single highest-priority item to fix before wider production exposure.
2. ~~No rate limiting on any endpoint~~ — **PARTIALLY RESOLVED.** `src/infrastructure/rate-limit/limiter.ts` (a simple in-memory, fixed-window, per-IP limiter — no Redis/Upstash) now gates `loginAdmin` (5 attempts/15 min) and `POST /api/orders` (10 orders/10 min). Admin product/order-mutation routes remain unlimited — lower priority given they're already admin-authenticated. The limiter's state is per server process/instance, not durable or shared across instances; acceptable at this app's current scale but worth swapping for Upstash/Vercel KV if it ever runs multi-instance.
3. `.env.local` (present locally, correctly gitignored) contains live production-looking secrets for Supabase, Sentry, Telegram, and Yalidine — standard practice, but flagged here as a reminder that these must never be committed, logged, or pasted into chat/AI tooling, and that this documentation deliberately never quotes their values.
4. No admin audit log — there's no record of which admin performed which action (status change, product edit) beyond `orders.updated_at`/`products.updated_at` timestamps, which don't identify the actor.
5. No explicit data-retention/deletion policy for customer PII (names, phone numbers) held in `orders` — orders soft-delete (`deletedAt`) but the underlying row (with customer PII) is retained indefinitely.

**GDPR/data privacy compliance**: **out of scope as implemented.** The business is Algeria-only (not EU-facing), and no GDPR-specific mechanisms exist (no consent banner, no data-export/right-to-erasure tooling, no documented retention policy). If the business ever serves EU customers, this would need dedicated work.

**Explicitly out of scope for security in this project** (and why that's currently acceptable): formal penetration testing, a WAF/DDoS layer beyond Vercel's platform defaults, and SOC2-style access controls — all reasonable to defer for a single-owner, single-admin, low-transaction-volume regional retail storefront, but should be revisited if the business scales, adds staff accounts, or starts handling online payments directly (it currently doesn't — Yalidine handles COD collection, so no card/payment data ever touches this application).

---

## 15. Third-Party Services & Integrations

| Service | Purpose | Client/SDK | Used by |
|---|---|---|---|
| **Supabase (Postgres)** | Primary relational database | `postgres` (postgres-js driver) wrapped by `drizzle-orm` | `src/infrastructure/db/client.ts` and all `*.adapter.ts` repositories |
| **Supabase Auth** | Admin session/cookie management | `@supabase/ssr` (`createServerClient`), `@supabase/supabase-js` (`createClient`, admin API) | `src/infrastructure/auth/supabase-auth.ts` |
| **Supabase Storage** | Product image hosting (bucket `"magieKlayn"`) | `@supabase/supabase-js` storage client | `src/infrastructure/storage/supabase-storage.ts`, invoked by `POST /api/upload` |
| **Yalidine** | Algerian last-mile courier — wilaya/commune reference data, delivery fees, stop-desk center lookup, parcel creation, COD collection | Custom hand-written HTTP client (`fetch`-based, no official SDK) with retry/backoff and rate-limit-aware throttling | `src/infrastructure/yalidine/client.ts`, consumed by `config.ts`, `stopdesk-resolver.ts`, `zone-sync-helpers.ts`, `scripts/create-parcel.ts`, and the public `app/api/delivery/*` routes |
| **Telegram Bot API** | Real-time new-order alerts to the store owner's phone | Raw `fetch()` against the Bot API's `sendMessage` endpoint | `src/infrastructure/telegram/telegram-notification.service.ts`, invoked by `POST /api/orders` and the `createOrder` server action |
| **Sentry** | Error monitoring (client, server, edge runtimes) + source-map upload at build time | `@sentry/nextjs`, `@sentry/react` | `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `next.config.ts` (`withSentryConfig`), `app/global-error.tsx` |
| **Vercel** | Hosting/deployment platform | N/A (platform, not an SDK) | Implicit — `automaticVercelMonitors: true` in Sentry config, default `NEXT_PUBLIC_SITE_URL` points at a `.vercel.app` domain |
| **Google Fonts** | Webfonts (Comfortaa, Noto Kufi Arabic) | `next/font/google` (self-hosted/optimized by Next at build time, not a runtime third-party call) | `app/layout.tsx` |

No payment provider integration exists (Yalidine handles cash-on-delivery collection directly with the courier, not this application). No analytics service is wired up despite a `NEXT_PUBLIC_FEATURE_ANALYTICS` flag existing in `src/domain/config/features.ts` — the flag currently gates nothing concrete that was found in the explored code. No maps/geocoding service (delivery zones are looked up by wilaya/commune name matching, not geocoordinates). No AI/LLM API integration anywhere in the app.

---

## 16. Testing

**Not applicable — no automated test suite exists.** There is no `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*`, no `__tests__` directory, and no `*.test.ts(x)`/`*.spec.ts(x)` file anywhere in the repository (confirmed by exhaustive search). No test-related packages appear in `package.json`. There is no `npm run test`/`lint` script at all.

**Suggestive evidence a test suite was planned**: many interactive elements carry `data-testid` attributes that strongly resemble E2E test selectors — e.g. `checkout-button`, `cart-button`, `cart-count`, `product-card`, `add-to-cart-button`, `checkout-form`, `place-order-button`, `order-success`, `login-form`, `login-button`, `login-error`, `product-toggle`, `save-product-button`, `product-detail`. This is either leftover from a removed test suite or preparation for one never finished.

**How to run tests locally**: not applicable — there's nothing to run yet.

**Top 5 things that should be tested first, and why**:
1. **`POST /api/orders` (checkout end-to-end)** — the single highest-stakes code path: it writes financial/order data, computes `totalAmount`, enforces the multi-box coffret rules and recomputes `coffretFee` server-side, overrides the delivery fee for `store_pickup`, and fires two best-effort side effects (Telegram, Yalidine). A regression here directly costs the business money or orders. Should cover: valid order creation, the store-pickup fee-override anti-tamper path, the coffret box-count/color validation branch (including the "boxes exceed what the cart supports" rejection), and behavior when `deliveryZoneId` doesn't resolve.
2. **`src/domain/rules/cart.rules.ts` and `src/domain/entities/delivery.ts`'s `getDeliveryFee`** — pure functions, trivially unit-testable, and they encode business rules (`getMaxBoxCount`'s exactly-4-bottles-per-box math, `calculateCoffretFee`, store-pickup-is-always-free) that are easy to silently break during refactors.
3. **`src/infrastructure/yalidine/stopdesk-resolver.ts`'s `resolveStopdeskId`** — the fuzzy commune-name matching logic is exactly the kind of "looks right, breaks on an accented character" code that benefits enormously from a table of real Algerian commune-name edge cases as test fixtures. Stop-desk delivery itself is now functional end-to-end (the checkout-time-resolved `stopdeskCenterId`/`stopdeskCommuneName` is the primary path; this resolver is only a fallback for pre-migration orders), but the fuzzy-matching fallback path remains untested.
4. **`src/infrastructure/auth/supabase-auth.ts`'s `adminLogin`/`getAdminSession`** — security-critical, and subtle to get right (the synthetic-password + `admin_users` cross-check dance is exactly the kind of logic that regresses silently).
5. **API route auth guards** (every admin-only route correctly returning `401` when unauthenticated, and correctly proceeding when authenticated) — a simple, high-value smoke test across all `app/api/**` admin routes would catch an accidentally-removed `getAdminSession()` check immediately, which is otherwise a silent, severe authorization bug.

**Mocking strategy**: not applicable (no tests exist to mock for). If a suite is introduced, the existing "mock mode" in `src/infrastructure/db/client.ts` (returns `db = null` when `DATABASE_URL` is absent/placeholder) suggests the codebase already has a seam that could be leaned on for test doubles, though it would need every repository call site to null-check rather than assuming a live `db`.

---

## 17. Performance & Optimization

**Optimizations applied**:
- `reactCompiler: true` in `next.config.ts` — automatic React memoization at build time (React 19 / Next 16 feature), reducing manual `useMemo`/`useCallback` need.
- `next/font/google` for Comfortaa and Noto Kufi Arabic — self-hosted, subset, `display: "swap"` fonts avoiding a render-blocking external font request.
- `next/image`-compatible remote pattern configured for the Supabase Storage bucket (`next.config.ts`), enabling Next's automatic image optimization for product photos (resizing/format negotiation) rather than serving raw uploaded files.
- React's `cache()` wrapper around `getAllProducts`/`getProductBySlug` in `app/actions.ts` dedupes repeated calls within a single server render pass.
- Public product listing (`GET /api/products`) is properly paginated (capped at 100/page) rather than returning the full catalogue at once.
- CSS-only illustrated "bottle" fallback (no raster image) when a product has no photos — avoids an unnecessary image request/layout-shift risk for incomplete product data.

**SEO setup**: `app/layout.tsx` defines a title template (`"%s · Magie Klayn"`), a French meta description, Open Graph metadata (`type: website`, `locale: fr_DZ`, a default `og-default.jpg` image, `metadataBase`), and Twitter card metadata (`summary_large_image`). `app/shop/[slug]/page.tsx` implements `generateMetadata()` per-product for individual product SEO. **No `sitemap.xml` or `robots.txt`** file/route was found (Next.js App Router supports both via `app/sitemap.ts`/`app/robots.ts` conventions — neither exists here), meaning search engines currently have no explicit crawl guidance beyond default behavior.

**Bundle analysis**: no bundle-analyzer tooling configured (`@next/bundle-analyzer` not in `package.json`), so bundle size is currently unmeasured/unmonitored. Given the dependency list (Framer Motion, Redux Toolkit, Sentry, Supabase JS client, Drizzle) shipped to the client where actually used (client components), a bundle audit would be a reasonable next step, especially since Sentry's own client bundle can be non-trivial.

**Rendering strategy**: `app/layout.tsx` sets `export const dynamic = "force-dynamic"` — this **opts the entire app out of static generation and ISR** at the root layout level, meaning every request is server-rendered fresh (no cached HTML). This is a deliberate trade-off (likely driven by the per-request cookie-based locale resolution) but means the app gets none of Next's static/ISR performance benefits even for genuinely static content (About, FAQ, Shipping pages) or semi-static content (product listings, which change infrequently). `app/shop/[slug]/page.tsx`'s `generateStaticParams()` returns an empty array, confirming product pages are never statically pre-rendered/pre-built — always on-demand.

**Measured performance baselines**: none found — no Lighthouse CI config, no Web Vitals reporting wired up (beyond whatever Sentry Performance monitoring may capture implicitly through its SDK, which is not further configured/customized in this codebase), no documented TTFB/load-time numbers.

---

## 18. Deployment & DevOps

**Deployment target**: **Vercel** (inferred from `next.config.ts`'s `automaticVercelMonitors: true` Sentry setting and the default site URL `https://magie-klayn.vercel.app` in `app/layout.tsx`), using Vercel's zero-config Next.js detection — no `vercel.json` exists, so build/deploy settings are whatever Vercel's dashboard defaults + auto-detection provide.

**Build commands**:
- `npm run build` → `next build` (produces the optimized production build, including React Compiler transforms and Sentry source-map upload if `SENTRY_AUTH_TOKEN`/`CI` are set appropriately).
- `npm run start` → `next start` (runs the production build; used for platforms other than Vercel's own build pipeline, or local production-mode testing).
- `npm run dev` → `next dev` (local development server).

**Environment setup per environment**: no distinct staging/production config files exist — environment differentiation is entirely via environment variables set per Vercel deployment target (Production/Preview/Development in Vercel's dashboard terms), following Next.js/Vercel's standard `.env.local` (local only, gitignored) vs. platform-configured env-var convention. No evidence of a separate staging Supabase project or staging Yalidine credentials in the codebase — this would need to be confirmed/set up by whoever manages the Vercel project settings.

**CI/CD pipeline**: **none exists.** No `.github/workflows/`, no other CI config found. Deploys presumably happen via Vercel's default Git-push-triggers-deploy behavior (connecting the GitHub repo to a Vercel project triggers a build on every push to the connected branch), but there is no automated test-gate, lint-gate, or manual-approval step configured in-repo.

**Docker/containerization**: **not used.** No `Dockerfile`, no `docker-compose.yml`. The app is deployed as a standard Next.js app on Vercel's managed infrastructure, not as a container.

**Database deployment/migration strategy in production**: **manual.** There is no migration step wired into any deploy pipeline (since there is no CI/CD pipeline at all). A developer must run `npm run db:migrate` (or `db:push`) against the production `DATABASE_URL` by hand, and separately, manually apply the two stray hand-written SQL files under `src/infrastructure/db/migrations/` if they haven't already been applied to that database. This is a real operational risk: there's no guarantee the production schema and the `drizzle/` migration history are in sync unless whoever deploys remembers this manual step every time the schema changes.

---

## 19. Learnings & What I'd Do Differently

*(Derived from what the codebase itself demonstrates about its own evolution — commit history, code comments, and structural leftovers — presented as honest engineering retrospective for future maintainers.)*

**Biggest technical learning**: integrating a real regional courier API (Yalidine) surfaced a lot of domain complexity that isn't visible from the outside — fuzzy commune-name matching (`stopdesk-resolver.ts`'s diacritic-normalization logic), rate-limit-aware retry/backoff, the non-obvious fact (called out explicitly in a code comment in `scripts/create-parcel.ts`, confirmed "via a real test parcel") that Yalidine's COD `price` field should **exclude** the delivery fee, not include it, and — most recently — a persistent platform-side ">5kg" oversize display that didn't match the documented `max(actual, L×W×H×0.0002)` billable-weight formula given the small dimensions actually sent, currently being debugged by testing whether omitting `length`/`width`/`height`/`weight` from the parcel payload entirely changes anything. This kind of "you only learn this by hitting the real API" knowledge is exactly why `stop_desk` delivery was, for a while, the least-reliable path in the app — it's since been fixed end-to-end (real center id/commune resolved and stored at checkout time, not guessed after the fact).

**Architectural decision to reconsider**: the Clean/Hexagonal layering (`domain`/`application`/`infrastructure`/`presentation`) was a reasonable instinct for keeping business rules testable and framework-independent, but it was only followed through halfway — the `application/use-cases` layer was built and then bypassed entirely by the actual API routes. Starting over, either commit fully to routing every mutation through use-cases (so the layer is real, not aspirational) or skip that layer entirely for a project this size and let API routes call repositories directly (which is what's actually happening today) — the current halfway state is worse than either extreme because it misleads a reader of the folder structure about what's actually enforced.

**Over-engineering or under-engineering**:
- *Over-engineered*: the `application/use-cases` layer, given it's unused. Also arguably the Supabase-Auth-plus-shadow-user hybrid for authentication — a single-admin system didn't need Supabase Auth's full session machinery layered on top of a custom table; a simpler signed-cookie session tied directly to `admin_users` would have been less code and fewer moving parts, with no security downside (the current approach isn't more secure for the complexity it adds — see [§14](#14-security--data-privacy)).
- *Under-engineered*: server-side request validation (hand-written `if` checks duplicating, imperfectly, the client's Zod schemas) and the complete absence of any test suite despite `data-testid` scaffolding suggesting one was intended — both are the kind of shortcut that's fine at low order volume but compounds risk as the business grows.

**Library/tool regrets**: none of the core stack choices (Next.js, Drizzle, Redux Toolkit, Tailwind, Sentry) look like they'd be swapped out on a do-over — they're each defensible for this project's size. If anything, the missing pieces (no SWR/React Query for client-side data fetching, no shared Zod-schema validation between client and server, no `.env.example` tooling) are gaps to fill in, not regretted choices to reverse.

**Process improvements**: the git history (single-author, feature-by-feature, commit messages like "fix the build issue", "check", "test") reads as fast iterative solo development with no separate planning/review checkpoints — reasonable for a solo MVP, but the project would benefit from: (1) writing the two currently-duplicated order-creation code paths (`app/actions.ts`'s `createOrder` vs. `POST /api/orders`) as a single shared function before they drift further apart; (2) a lightweight pre-deploy checklist (did the schema change? did both migration paths get applied? did `.env` vars change?) given there's no CI to catch this automatically.

**Key insight for the next project**: when a project's architecture promises more structure than the code actually delivers (unused use-case layer, disconnected middleware, orphaned components), that gap becomes a tax on every future contributor who has to rediscover it by reading code rather than being told — the fix isn't necessarily "always fully implement every layer you sketch," it's "delete or clearly mark anything you decide not to finish," so the codebase never lies about its own shape.

---

## 20. Known Issues & Technical Debt

**Bugs / functional gaps**:
1. ~~Stop-desk delivery via Yalidine is currently broken/incomplete~~ — **RESOLVED.** The customer's real, checkout-time-picked Yalidine center (`stopdeskCenterId`/`stopdeskCommuneName`, stored on the order) is now used directly for parcel creation, instead of guessing a center from the customer's commune after the fact. `resolveStopdeskId`'s fuzzy matching is kept only as a fallback for orders placed before these columns existed. `WilayaCommuneSelect` also now auto-selects Stop Desk and a default center for the customer, further reducing the chance of a bad/missing selection reaching checkout.
2. ~~Duplicate order-creation code paths~~ — **RESOLVED: deleted.** `app/actions.ts`'s `createOrder` server action had no callers anywhere in the app (the only real checkout UI, `app/cart/page.tsx`, already posted to `POST /api/orders`) and was an incomplete duplicate — it skipped validation, delivery-zone resolution, the coffret/store-pickup anti-tamper checks, and Yalidine parcel creation. It's been removed; `POST /api/orders` is now the single order-creation path.
3. ~~`src/middleware/i18n.ts` is dead code~~ — **RESOLVED: deleted.** It was set up correctly for `next-intl`, but never wired up as an actual Next.js `proxy.ts`/`middleware.ts`, given this Next.js version's `middleware.ts` → `proxy.ts` rename (per `AGENTS.md`'s own warning). Locale is handled via a manual cookie read in `app/layout.tsx` — that part is unchanged.
4. **A second, separate RTL/locale mechanism exists in `app/template.tsx`** (localStorage/custom-event based `<html dir>` management), independent of the cookie-based one in `app/layout.tsx` — these two are not obviously guaranteed to stay in sync.
5. ~~`BoxBuilder.tsx` fetches a non-existent endpoint~~ — **RESOLVED: deleted** (along with its exports from `features/index.ts`). It fetched a non-existent `/api/products/cookies` endpoint and wasn't referenced by any live page — an orphaned "cookie box" feature from what looked like an earlier product-line pivot (baked-goods → perfume). `NEXT_PUBLIC_FEATURE_CUSTOM_BUILDER` now gates nothing until a real replacement is built.
6. ~~`app/shop/layout.tsx`'s metadata copy references "American-style" baked goods~~ — **RESOLVED.** Replaced with fragrance-appropriate copy matching the actual product line.
7. ~~`app/admin/(dashboard)/layout.tsx`'s metadata description said "Crumbleivable Brum Shop"~~ — **RESOLVED.** Updated to "Admin Dashboard for Magie Klayn".
8. ~~Cart persistence used the `localStorage` key `"crumbleivable-cart"`~~ — **RESOLVED.** Renamed to `"magie-klayn-cart"` in `app/providers.tsx`, with a one-time fallback read of the old key on hydration so existing in-progress carts aren't lost.
9. ~~Store-pickup addresses are literal TODO placeholders~~ — **RESOLVED.** `STORE_PICKUP_ADDRESSES` was replaced with `STORE_LOCATIONS: Record<string, StoreLocation>` (real name, address, phone, Maps link for both the Alger and Oran stores) — a single source of truth consumed by both the checkout pickup-point note and the `/shipping` page's store cards, instead of the address/phone text being duplicated (and drifting, with placeholder phone numbers) inside `messages/*.json`.
10. **Font-variable mismatch**: `globals.css`'s `--font-display`/`--font-body` reference `--font-archivo-black`/`--font-inter`, but `app/layout.tsx` only loads Comfortaa and Noto Kufi Arabic — the referenced font variables are never defined, so text likely renders in fallback fonts rather than the intended brand typeface in CSS-driven sections.
11. **Three divergent `getLuminance()` implementations** exist (`src/presentation/lib/utils.ts`, `src/presentation/lib/color.ts`, and one inlined in `ProductCard.tsx`), using different luminance-weighting constants — could produce inconsistent white/dark-text contrast decisions depending on which one a given component happens to call.
12. ~~Duplicate `ProductCard` implementations~~ — **RESOLVED: deleted.** `ui/Card.tsx` was an orphaned near-duplicate (mislabeled as a generic `Card` primitive) of the actively-used `features/ProductCard.tsx`, which remains the only one.
13. ~~Orphaned `src/presentation/lib/colors.ts`~~ — **RESOLVED: deleted.** (`LIQUID_COLOR`/`darkenHex`/`getLiquidStyle`, not imported anywhere.)
14. **Newsletter signup on the homepage is a non-functional stub** (`handleNewsletterSubmit` just calls `preventDefault()`, with a `// TODO: wire up to your real newsletter endpoint.` comment).
15. ~~Inconsistent dynamic-route param casing~~ — **RESOLVED: this was a functional bug, not just cosmetic.** `app/api/delivery/stopdesk-centers/[WilayaCode]` (capitalized) meant the route handler's `(await params).wilayaCode` (lowercase) never matched the real params key, so the route always returned 400 `"Invalid wilaya code"` regardless of input — the stop-desk pickup-point dropdown in checkout was silently broken because of this. Fixed by renaming the folder to lowercase `[wilayaCode]`, matching `communes/[wilayaCode]`.
16. **`app/api/auth/` and `app/api/messages/` are empty placeholder directories** with no `route.ts` — dead scaffolding, not live endpoints.
17. ~~`src/application/{layout.tsx,page.tsx,favicon.ico}` are leftover `create-next-app` scaffold~~ — **RESOLVED: deleted.** They were entirely outside the live route tree (Next.js only reads `app/` at the project root).
18. ~~`src/application/use-cases/{order,product}.use-case.ts` are unused~~ — **RESOLVED: deleted** (folder removed too). No live route or server action ever called them; `cart.service.ts` remains the only file in `src/application/` and is actively used.
19b. ~~Client-trusted product price in `POST /api/orders`~~ — **RESOLVED.** `coffretFee`/`deliveryFee` were already recomputed/forced server-side, but per-item `price` was taken as-is from `item.product.price` in the request body, letting a tampered checkout payload set an arbitrary total (and COD amount). `orderRepository.create()`'s caller now re-fetches each item's price from `products` via `productRepository.getById()` before computing totals; a reference to a nonexistent/inactive/sold-out product is rejected with `400`.
19c. ~~`app/admin/(dashboard)/layout.tsx` only checked `supabase.auth.getUser()`~~ — **RESOLVED.** Every admin API route re-verifies `admin_users` membership via `getAdminSession()`, but the dashboard layout itself only checked for *a* valid Supabase session — inconsistent with that model, and exploitable if the (now also resolved, see 19e below) deterministic per-admin Supabase shadow password were ever leveraged directly against Supabase Auth. Now calls `requireAdmin()` instead, matching every API route.
19e. ~~Deterministic Supabase Auth shadow password (`getSupabaseAuthPassword()`, `auth_${email}_fixed_password_v1`)~~ — **RESOLVED.** Replaced with a random per-admin secret stored in the new `admin_users.supabase_auth_secret` column (migration `0013`), generated once via `crypto.randomBytes(32)` and reused on every subsequent login instead of being re-derived from the email or overwritten each time. See [§9](#9-authentication--authorization) for the updated login flow.
19d. ~~`GET /api/openapi` and `/api-docs` were publicly reachable, no auth~~ — **RESOLVED.** Both now require an admin session (see §8's Interactive API docs note above) — previously any visitor could browse the full internal route/schema map, and (with an ambient admin session cookie) execute real requests against admin-only routes via Swagger UI's "Try it out."
19. **IN PROGRESS — Yalidine platform always displays parcels as exceeding 5kg**, despite the app's small declared dimensions/weight not matching that per Yalidine's own documented `max(actual weight, L×W×H×0.0002)` billable-weight formula. Currently being debugged by omitting `length`/`width`/`height`/`weight` from the parcel-creation payload entirely (`scripts/create-parcel.ts`) to test whether sending them at all is the actual trigger — Yalidine's own docs list these fields as "Required" for parcel creation, so this is a live experiment, not a confirmed fix; watch `create-parcel` logs for rejected parcels, and see the inline revert note in that file (the old `DEFAULT_PARCEL_DIMENSIONS`/`calculateParcelWeight()` gradual-weight logic in `src/infrastructure/yalidine/config.ts` is kept, just unused, for a one-line rollback).

**Process/tooling gaps** (see also [§16](#16-testing), [§18](#18-deployment--devops)):
- No test suite of any kind, despite `data-testid` scaffolding suggesting one was planned.
- No ESLint/Prettier configuration.
- No CI/CD pipeline.
- No `.env.example`.
- No Docker/containerization story.
- Two parallel, not-fully-automated database migration mechanisms (Drizzle Kit `drizzle/` + hand-written SQL in `src/infrastructure/db/migrations/`).
- ~~Client-side (Zod) and server-side (manual `if`) request validation are not shared/derived from one schema, risking drift~~ — **PARTIALLY RESOLVED.** Server-side `zod` schemas now exist for `POST /api/orders` and `POST`/`PUT /api/products` (`src/domain/validation/`), independently written rather than literally shared with the client-side ones — so drift between the two schema *definitions* is still possible, but the server no longer relies on presence-only checks.

**Outdated/regret-worthy dependencies**: nothing found to be meaningfully outdated as of this writing — the stack (Next 16.3.0, React 19.2.4, Drizzle 0.45.2) is current/bleeding-edge rather than stale. The main "dependency" concern is architectural rather than version-related (see above).

**Features planned but not implemented** (inferred from feature flags and orphaned code): a working custom "box builder" product (flag `NEXT_PUBLIC_FEATURE_CUSTOM_BUILDER`, but `BoxBuilder.tsx` targets a non-existent endpoint), a "weekly drop" countdown feature (`NEXT_PUBLIC_FEATURE_WEEKLY_DROP`, no corresponding UI found in the explored pages), a community "vote" feature (`NEXT_PUBLIC_FEATURE_VOTE`, `ProductForm`'s `mode: "vote"` variant exists but no page/route consuming it was found), an admin analytics dashboard beyond the existing basic stats (`NEXT_PUBLIC_FEATURE_ANALYTICS`), and a real newsletter integration.

---

## 21. Glossary

| Term | Meaning |
|---|---|
| **Wilaya** | An Algerian province (58 total). Identified in this codebase by a 2-digit `wilayaCode` (e.g. `"16"` = Alger, `"31"` = Oran). |
| **Commune** | A municipality within a wilaya — the finer-grained unit used for delivery-fee lookup. |
| **Yalidine** | A real third-party Algerian courier/shipping API integrated into this app for delivery-zone data, fee lookup, stop-desk centers, and parcel (shipment) creation with cash-on-delivery collection. |
| **Stop-desk** | A Yalidine pickup point (French: "point relais") — a physical location where a customer collects their own parcel, as an alternative to home delivery. |
| **Store pickup** | An in-house (non-Yalidine) fulfillment option, available only in wilayas 16 (Alger) and 31 (Oran), always free. |
| **Coffret** | French for "gift box." An order-level luxury packaging upsell (not a product) — a box always holds **exactly 4 bottles**, never more or less. Once the cart has ≥4 bottles, the customer can add one or more boxes, each independently colored (`white`/`black`), at a flat 800 DA fee per box (`boxColors: BoxColor[]`, `coffretFee = 800 × boxColors.length`); any bottles beyond `boxColors.length × 4` simply ship without a box. |
| **Zone / Delivery Zone** | A `delivery_zones` table row representing one wilaya+commune pair with its stop-desk fee, home-delivery fee, and availability flags. |
| **COD** | Cash on delivery — the payment model this app assumes; Yalidine collects payment from the customer on the courier's behalf, and this application never processes payments directly. |
| **Admin** | The single user role in this app; there is no customer-account concept. |
| **DA** | Algerian Dinar — the currency `products.price`/`orders.totalAmount` are stored in (as integer smallest-unit values), formatted for display via `formatPrice()` using `Intl`'s `fr-DZ` locale. |
| **Crumbleivable** | The name of an apparent prior/sibling project this codebase was bootstrapped or adapted from; its name leaks into a `localStorage` key, a code comment, and an admin page `<title>` that were never renamed to "Magie Klayn." |
| **RTL** | Right-to-left text direction, applied to the `<html>` element when the active locale is Arabic (`ar`). |
| **Snapshot (in `order_items`)** | The practice of copying product fields (`productName`, `productSlug`, `productColorHex`, `priceSnapshot`) onto each order-item row at order time, so historical orders remain accurate even if the underlying product is later edited, deleted, or repriced. |

---

## 22. Quick Reference for AI Agents

**What this project does**: Magie Klayn is a Next.js 16 / React 19 e-commerce storefront for a luxury fragrance brand in Oran, Algeria. Customers browse perfumes, add to cart, optionally add "coffret" gift-box packaging, and check out anonymously (no account) with delivery via Yalidine (Algerian courier: home delivery, stop-desk pickup point, or free in-store pickup in Alger/Oran). An authenticated single-admin back-office at `/admin` manages products and orders. New orders trigger a Telegram alert to the store owner and (best-effort) a Yalidine parcel-creation call.

**Full tech stack**: Next.js 16.3.0 (App Router, `reactCompiler: true`) · React 19.2.4 · TypeScript `^5` (strict) · Tailwind CSS v4 (CSS-first, no config file) · Drizzle ORM 0.45.2 + `postgres`(-js) driver → Supabase Postgres · Supabase Auth (`@supabase/ssr`) + custom `admin_users` table hybrid · Supabase Storage (product images) · Redux Toolkit + `react-redux` (cart/UI global state, no Zustand/Context/Jotai) · `next-intl` (en/fr/ar, RTL) · `react-hook-form` + `zod` (checkout/contact forms only) · Framer Motion (animations) · `next-swagger-doc` + `swagger-ui-react` (interactive API docs at `/api-docs`) · `@sentry/nextjs` (client/server/edge monitoring) · `bcryptjs` (admin password hashing) · Telegram Bot API (order alerts) · Yalidine API (delivery). **No** test framework, **no** ESLint config, **no** CI/CD, **no** Docker, **no** `.env.example`.

**Main folders**:
- `app/` — Next.js App Router: every page, layout, server action file (`actions.ts`), and API route (`api/**/route.ts`). **This is where routing lives — not `src/app/`.**
- `src/domain/` — pure business types/rules (entities, ports/interfaces, `cart.rules.ts`), zero framework imports.
- `src/application/` — `cart.service.ts` only (used by the Redux cart slice); the unused `use-cases/` layer and stray `create-next-app` scaffold files that used to live here have been deleted.
- `src/infrastructure/` — concrete integrations: `db/` (Drizzle schema + repositories), `auth/supabase-auth.ts`, `storage/supabase-storage.ts`, `telegram/`, `yalidine/`.
- `src/presentation/` — all React UI: `components/{features,ui}/`, `store/` (Redux slices `cart`, `ui`), `lib/` (utils, animations, color helpers).
- `drizzle/` — generated SQL migrations (0000–0012); **also check** `src/infrastructure/db/migrations/` for two hand-written SQL files not tracked by Drizzle Kit. Neither `db:migrate` nor `db:push` reliably works against this project's Supabase database — see [§7](#7-database--data-layer)'s Migrations note for the raw-SQL-plus-manual-registration workaround actually used.
- `messages/{en,fr,ar}.json` — i18n translation catalogs.
- `scripts/` — standalone `tsx`-run maintenance scripts (Yalidine zone sync, auth repair); `scripts/create-parcel.ts` is unusually imported directly by `app/api/orders/route.ts`.

**Most important files to know**: `src/infrastructure/db/schema.ts` (DB source of truth), `app/api/orders/route.ts` (the core checkout/order-creation logic, including the delivery-fee anti-tamper guard and server-side coffret-fee recomputation), `src/infrastructure/auth/supabase-auth.ts` (the security-sensitive hybrid auth), `src/infrastructure/yalidine/{client,config,stopdesk-resolver}.ts` + `scripts/create-parcel.ts` (the courier integration — stop-desk now resolves via the checkout-time-picked center, weight/dimensions currently omitted as a live oversize-fee experiment), `src/presentation/store/cart/cart.slice.ts` (cart state, multi-box `boxColors[]`; persisted in `app/providers.tsx` under the `localStorage` key `"magie-klayn-cart"`), `src/domain/entities/delivery.ts`'s `STORE_LOCATIONS` (single source of truth for real store address/phone/maps data), `app/layout.tsx` (locale resolution + provider composition root), `i18n.config.ts` + `src/domain/config/features.ts` (config/flags).

**How to add a new feature** (rough steps):
1. New **page**: add a folder + `page.tsx` under `app/` (add `layout.tsx` too if it needs distinct metadata/chrome).
2. New **API endpoint**: add `route.ts` under `app/api/<name>/` (or `[param]/route.ts` for dynamic segments); call `getAdminSession()` inline at the top if it should be admin-only — there's no shared middleware to lean on.
3. New **DB field/table**: edit `src/infrastructure/db/schema.ts`, then `npm run db:generate && npm run db:migrate` (or `db:push` for fast local iteration); update the matching repository (`src/infrastructure/db/*.adapter.ts`) and its port interface (`src/domain/ports/repositories.ts`) together.
4. New **domain rule/entity**: add to `src/domain/entities/` or `src/domain/rules/` as a framework-free function/type.
5. New **UI component**: add to `src/presentation/components/{features,ui}/`; consider adding it to `features/index.ts`'s barrel (note: that barrel is already incomplete — some components are imported by direct path instead).
6. New **Redux state**: add a slice under `src/presentation/store/<domain>/`, register it in `src/presentation/store/index.ts`.

**How to run locally**: `npm install`, create `.env.local` with at least `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (app runs in a DB-less "mock mode" without `DATABASE_URL`, logging a warning instead of crashing), `npm run db:push` to provision the schema (then manually apply the two stray SQL files in `src/infrastructure/db/migrations/`), insert an `admin_users` row manually (bcrypt hash) since there's no signup UI, then `npm run dev`.

**Main architectural decisions & rationale** (condensed — full detail in [§3](#3-architecture-decisions--trade-offs)):
- Hexagonal layering under `src/` for testable/portable business logic — API routes call repositories directly (the `use-cases` layer that used to exist was unused dead weight and has been deleted).
- Hybrid Supabase-Auth-plus-custom-table admin auth, bridging the two with a random per-admin secret (`admin_users.supabase_auth_secret`) generated once and reused — previously a hardcoded deterministic synthetic password, since fixed (see [§9](#9-authentication--authorization)).
- `next-intl`'s middleware-based locale negotiation was never wired up in this Next.js version (which renamed `middleware.ts` → `proxy.ts`) — the dead `src/middleware/i18n.ts` that attempted it has been deleted; locale is cookie-driven instead.
- Yalidine parcel creation and Telegram notification are both deliberately **fire-and-forget/never-throw** from `POST /api/orders`, so checkout always succeeds even if either integration fails — at the cost of silent partial failures with no retry mechanism.
- No shared validation schema between client (Zod) and server (manual `if` checks) — a deliberate speed-over-rigor trade-off, not an oversight, but a real drift risk.

**Gotchas / non-obvious things to know**:
- `tsconfig.json`'s `"@/*"` path alias maps to `./src/*` only — it does **not** cover `app/`, which uses relative imports.
- This Next.js version (16.3.0) has real breaking changes vs. typical training-data knowledge — consult `node_modules/next/dist/docs/` before assuming standard Next.js conventions apply, per this repo's own `AGENTS.md`.
- `BoxBuilder.tsx`, `ui/Card.tsx`, `src/presentation/lib/colors.ts`, `src/middleware/i18n.ts`, `src/application/use-cases/`, and `src/application/{layout,page}.tsx` were all confirmed orphaned/dead and have been **deleted** — if you see references to them elsewhere (older commits, cached docs), they no longer exist in the repo.
- Never read or echo the contents of `.env.local`/`.env.sentry-build-plugin` into chat, logs, or generated files — they hold live production credentials.
- Two duplicate order-creation code paths exist (`app/actions.ts`'s `createOrder` vs. `app/api/orders/route.ts`'s `POST`) with **different side effects** — prefer/extend the API route, since only it creates Yalidine parcels and applies the store-pickup anti-tamper fee override.
