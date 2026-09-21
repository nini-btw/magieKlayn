# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Collapsible desktop admin sidebar.** A new burger toggle in the sidebar header (`AdminSidebar.tsx`) shrinks it to an icons-only rail (`width: 80px`, `.admin-sidebar.is-collapsed`) on desktop (`lg`+) — nav links, "View site", the admin email, and sign-out all keep their icons and lose their text labels (wrapped in a shared `.admin-collapsible-label` span); `LanguageSwitcher` is hidden outright when collapsed since it needs more than icon width. `AdminSidebarWrapper.tsx` now also owns `<main>` (moved out of `layout.tsx`, a server component with no channel to this client-only state) so its left margin (`lg:ml-64`/`lg:ml-20`) tracks the collapse state. Persisted via `localStorage` (`magieklayn-admin-sidebar-collapsed`) — the mobile off-canvas overlay is unaffected, this is a desktop-only preference.

- **Brand-name misspelling coverage for search.** Added `app/layout.tsx`'s `BRAND_NAME_VARIANTS` — ~20 phonetic/spelling variants customers actually search with (e.g. "Magic Klein", "Maji Klayn", "Magiclaine", "Magic Line", plus a couple of Arabic-transliteration variants), feeding both the `keywords` meta tag and, more effectively, the Organization JSON-LD's `alternateName` field — the mechanism Google's entity resolution uses to match a typo'd query to the right brand.
- **Facebook link.** Added the brand's Facebook page to the footer's social icons (`Footer.tsx`, alongside Instagram/TikTok) and to the Organization JSON-LD's `sameAs` array (`app/layout.tsx`).
- **Clickable order status pill in the admin orders table.** New `OrderStatusPill` (`app/admin/(dashboard)/orders/page.tsx`) lets an admin change an order's status directly from its colored badge — in both the desktop table row and the mobile card — without opening the detail drawer. Backed by the existing `PUT /api/orders/[id]` status update.
- **"Net Revenue" stat.** The orders page's revenue stat card now sums only `delivered` orders and subtracts each order's `deliveryFee` before summing, since the delivery fee is passed through to the courier and was never real revenue for the store. Relabeled "Net Revenue" with a short explanatory note, translated in `en`/`fr`/`ar` (`admin.orders.stats.revenue`/`revenueNote`).
- **Per-order bottle count, total bottles sold, and a per-fragrance sales chart.** The admin orders table/mobile card now shows each order's bottle count (`order.items` quantities summed client-side — no new fetch needed). A new "Total Bottles Sold" stat card sums bottles from `delivered` orders (same "actually sold" rule as Net Revenue). A new `TopProductsChart` (`app/admin/(dashboard)/orders/TopProductsChart.tsx`) shows units sold per fragrance as a bar list, mirroring the existing `TopWilayasChart` pattern (no charting library in this codebase) — rendered on both the orders page and the dashboard overview. Backed by a new `IOrderRepository.getTopProducts()` (`src/infrastructure/db/order.adapter.ts`), a `groupBy`/`SUM` aggregate over `order_items` joined to `orders`, filtered to `delivered` and non-deleted, exposed via `GET /api/orders/stats?type=products` (with its own route test, `app/api/orders/stats/route.test.ts`). The dashboard's old "Most Ordered" stat — previously computed in-memory from a client fetch capped at the server's default 100-order limit — now reads from this same accurate, all-time aggregate instead.

### Fixed
- **A stray mobile order card rendered below the desktop orders table on wide screens.** The mobile-cards wrapper in `app/admin/(dashboard)/orders/page.tsx` had both a `sm:hidden` Tailwind class and an inline `style={{ display: "flex" }}` — the inline style always wins over a CSS class, so it silently canceled `sm:hidden` and the mobile card list rendered at every screen width, appearing stacked right after the desktop table on desktop. Moved `display`/`flex-direction` into Tailwind classes (`flex flex-col`) so the responsive table/card switch actually works.
- **Admin sidebar could show a stray page scrollbar on short viewports.** `.admin-nav` (`app/globals.css`) is a `flex: 1; overflow-y: auto` child inside the fixed, `height: 100vh` `.admin-sidebar` — without `min-height: 0`, a flex item can't shrink below its content's natural height, so on short screens the nav's full content height pushed the whole sidebar taller than the viewport instead of scrolling internally. Added `min-height: 0`.
- **The same stray-mobile-card bug also existed on the dashboard overview page.** `app/admin/(dashboard)/page.tsx`'s recent-orders mobile card list had the identical `sm:hidden` class + inline `style={{ display: "flex" }}` conflict as the orders page (see above) — fixed the same way.
- **Orders table showed a horizontal scrollbar at tablet/narrow-desktop widths.** The table grew to 8 columns (Order ID, Customer, Wilaya, Bottles, Total, Status, Date, Actions) but only switched to mobile cards below the `sm` (640px) breakpoint, so it had to horizontally scroll between ~640–1024px. Raised the table/card breakpoint to `lg` (1024px, the breakpoint this codebase already treats as its real desktop threshold — e.g. the sidebar's own off-canvas rule) in `app/admin/(dashboard)/orders/page.tsx`, and added a `.admin-cell-truncate` class (`app/globals.css`) to the Customer/Wilaya cells so one unusually long name/commune can't reintroduce it even at `lg`+.

### Changed
- **Order status set replaced `preparing`/`ready` with `returned`.** The app's order statuses are now `pending | confirmed | delivered | cancelled | returned` (previously included `preparing`/`ready`, which had no real workflow behind them). Updated everywhere the set was hardcoded: `src/domain/entities/order.ts`'s `OrderStatus` type, `src/infrastructure/db/schema.ts`'s `order_status` Postgres enum, the `PUT /api/orders/[id]` status allowlist, Swagger docs (`app/api/orders/route.ts`, `app/api/orders/[id]/route.ts`, `src/infrastructure/swagger/config.ts`), the admin orders/dashboard pages' status lists/colors/badges, and `statusLabels` in all three locale files. Live database migrated via `scripts/migrate-order-status-returned.ts` — added `'returned'` to the `order_status` enum (Postgres can't drop enum values, so the retired `preparing`/`ready` labels remain defined on the type but are no longer used by the app) and checked for any existing orders still in those statuses (none found; the two in use were `delivered`/`cancelled`).

## [0.2.9] - 2026-08-13

### Changed
- **Default UI locale switched from English to French.** Any visitor with no `NEXT_LOCALE` cookie (e.g. first-time arrivals from search) previously saw the English UI; since the target market is Algeria, where French dominates, the default is now French. Changed `i18n.config.ts`'s `defaultLocale` (the value `app/layout.tsx`'s cookie-fallback logic reads), `app/template.tsx`'s independent `localStorage`-based `<html dir>`/`lang` fallback, `<LanguageSwitcher>`'s language list order (French now leads, so its "no match" fallback also degrades to French), and `app/global-error.tsx`'s hardcoded `<html lang>` on the top-level error boundary. SEO `<head>` metadata was already pinned to French independently of this (see 0.2.8 below) and is unaffected.

### Fixed
- **Mobile product-card layout crowded the name against the add-to-cart button.** On `/shop` at small screen widths, the product name/price column and the circular add-to-cart button shared one horizontal row, crowding/truncating longer product names. `ProductCard.tsx`'s footer row now switches to a stacked column (name, then price, then button, each on its own line) under the existing `max-width: 700px` mobile breakpoint in `app/globals.css`, with the button centered under the price.
- **Product cards in the same grid row had inconsistent heights.** `.product-name` (`app/globals.css`) previously had no line-clamp or reserved height, so a card with a short name sat noticeably shorter than one with a long (now-wrapping, not truncated) name, breaking row alignment. It's now clamped to a maximum of 2 lines (`-webkit-line-clamp: 2` plus the standard `line-clamp: 2`) with a `min-height` reserving space for exactly 2 lines, so every card in a row renders at the same height regardless of name length. `ProductCard.tsx`'s footer no longer sets its own bottom padding — bottom spacing is governed entirely by `.product-card`'s own `padding-bottom`, which is forced to `1rem` under the `max-width: 700px` mobile breakpoint (`app/globals.css`) instead of the desktop default (`--space-md`, 1.75rem).

## [0.2.8] - 2026-08-12

### Added
- **SEO foundation for `www.magieklayn.com`** — the domain had no crawl/index infrastructure at all until now:
  - `app/robots.ts` (allows all, disallows `/admin`, `/api`, `/cart`, `/checkout`, `/api-docs`, points at the sitemap) and `app/sitemap.ts` (static routes + every active product's `/shop/[slug]`, pulled live via `getAllProducts()`).
  - Root `<head>` metadata (`app/layout.tsx`) and the shop listing's (`app/shop/layout.tsx`): title/description/keywords/OG/Twitter now pinned to **French** regardless of the visitor's UI locale (see "Changed" below) — added `keywords`, self-referencing `alternates.canonical`, explicit `robots: { index: true, follow: true }`, and a `manifest` link. `<html lang>`/the actual UI is unaffected and still switches en/fr/ar per visitor as before.
  - `app/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx` — code-generated (`next/og` `ImageResponse`) brand-gradient images, replacing a previously-referenced-but-missing `/og-default.jpg`. `app/manifest.ts` adds a PWA manifest.
  - `Organization` JSON-LD in the root layout (name, url, logo, `sameAs` → Instagram/TikTok); `Product`/`Offer` JSON-LD on `app/shop/[slug]/page.tsx` (price in DZD, availability); `ItemList` JSON-LD server-rendered in `app/shop/layout.tsx`.
  - `app/shop/[slug]/page.tsx`'s `generateMetadata` now sets `alternates.canonical` and a full `openGraph`/`twitter` block (previously only title/description/one image).
  - `app/admin/(dashboard)/layout.tsx` and a new `app/admin/login/layout.tsx` set `robots: { index: false, follow: false }` so admin routes are never indexed.
  - `NEXT_PUBLIC_SITE_URL` corrected from the stale `magie-klayn.vercel.app` fallback to `https://www.magieklayn.com` in `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/shop/[slug]/page.tsx`, and `.env.local` (the Vercel Production/Preview env var itself also had to be fixed separately — it had literal quote characters baked into its value, which broke `metadataBase`/sitemap URL generation until caught post-deploy).
  - Known gap, deliberately not addressed here: locale is cookie-based with no URL prefix, so true per-locale `hreflang` alternates aren't possible without a larger locale-routing refactor — flagged as a future follow-up, not bundled into this change.

### Changed
- **SEO metadata (title/description/OG/Twitter) is now pinned to French**, independent of the visitor's cookie-selected UI locale. It previously followed `messages[locale].metadata`, which meant anyone without a saved language preference — including Google's crawler, which never sends the `NEXT_LOCALE` cookie — saw the English default. Since the target market is Algeria, where French dominates search behavior, `app/layout.tsx` and `app/shop/layout.tsx` now always read `messages/fr.json` for `<head>` metadata specifically, while `<html lang>` and the rest of the UI are untouched and still resolve per-visitor as before.

### Fixed
- **`/shop` was flagged by Google Search Console as a soft 404.** `app/shop/page.tsx` was a `"use client"` page that fetched products via `useEffect` against `/api/products`, so its server-rendered HTML was an empty Suspense shell with no product content — thin enough for Google to treat it as an error page despite the `200` status. It's now an async Server Component that fetches products via the existing `getAllProducts()` server action and passes them to a new `app/shop/ShopPageClient.tsx`, which keeps the prior sort/rendering behavior but works off pre-fetched data instead of its own fetch/loading/error state.

## [0.2.7] - 2026-08-08

Everything below was committed as `44526f9`/`380db2d`, merged into `main` on the `db-keep-alive-cron` branch.

### Added
- **DB keep-alive cron** — `app/api/cron/keep-db-active/route.ts` (`GET`, `CRON_SECRET`-gated via a Bearer-token check against `Authorization`; requires the secret to actually be set, so a missing `CRON_SECRET` env var fails closed rather than accepting an unauthenticated `Bearer undefined` request — caught during manual testing before commit) pings the `products` table so Supabase's free tier doesn't auto-pause the project after 7 days of inactivity. Scheduled weekly (Sundays at midnight UTC) via new `vercel.json` `crons` config. No-ops safely (200, not 500) when `db` is in mock mode. `CRON_SECRET` is set in Vercel's Production + Preview env vars.

### Fixed
- **Missing `cronSecret` OpenAPI security scheme.** The cron route's `@swagger` block declared `security: [{ cronSecret: [] }]`, but `components.securitySchemes` in `src/infrastructure/swagger/config.ts` only defined `adminSession` — so `/api-docs` rendered the route with no way to attach the Bearer token via "Try it out". Found while verifying the cron route through the Swagger UI on a preview deployment.

## [0.2.6] - 2026-08-08

Everything below was committed as `c2e402c` (merge of `add-test-suite`) on `main`.

### Added
- **Jest test suite** — the project's first automated tests. `jest.config.ts` (via `next/jest`, split into `node` and `jsdom` projects) and `jest.setup.ts`; new `npm run test`/`test:watch`/`test:coverage` scripts. 214 tests across 25 suites: pure business logic in depth (`cart.rules.ts`, delivery/order entity helpers, both zod validation schemas, `cart.service.ts`, the rate limiter, Yalidine config), Redux slices (`cart.slice.ts`, `ui.slice.ts`), API-route integration tests with adapters mocked at the module boundary (`POST /api/orders` — including a dedicated test proving the security audit's price-tamper fix holds, rate-limit exhaustion, coffret/zod/store-pickup edge cases — plus `products`, `products/[id]`, and `upload`, the latter gaining an exported `sniffImageType()` specifically to unit-test each magic-byte signature), and React Testing Library component tests (all `ui/` primitives plus `ProductCard`/`CartDrawer`/`Header`, via a new shared `src/presentation/test-utils.tsx` render helper). See `PROJECT_DOCUMENTATION.md` §16 for exactly what's covered vs. explicitly out of scope (Server Components, Server Actions, E2E).

### Fixed
- **Partial product updates silently reset other fields to their defaults.** Found while writing the test suite above (`app/api/products/[id]/route.test.ts`): `updateProductSchema` was built as `createProductSchema.partial()`, and zod's `.partial()` only makes a field optional to *provide* — fields with `.default(...)` (`gender`/`isActive`/`isNew`/`isSoldOut`/`inspiredBy`/`notes`) still applied that default when a `PUT` caller omitted them, so a genuinely partial update (e.g. `{ isSoldOut: true }`) silently reset every other defaulted field instead of leaving it untouched. No live caller triggered this (`ProductForm`'s `handleSave` always submits the full form state), but it directly contradicted `/api-docs`'s own "Partial Product fields to update" documentation for this route. `src/domain/validation/product.schema.ts` now builds `updateProductSchema` from the same field validators *without* their defaults, rather than deriving it from the defaulted create schema.
- `scripts/fix-auth.ts`'s TypeScript build error (`admins.find((a) => ...)` implicit-any) — surfaced by `npm run build`'s type-check while adding the test suite.

## [0.2.5] - 2026-08-08

Everything below was committed as `00ec0b2` on `main`.

### Changed
- `scripts/fix-auth.ts` rewritten to work correctly with the new per-admin shadow-secret auth model (see `0.2.4` below): it no longer computes and pushes its own password formula directly onto the Supabase Auth user (a formula that already didn't match `adminLogin()`'s, and which would now permanently desync login since the password is no longer overwritten every login). It now just clears the target admin's `admin_users.supabase_auth_secret`, letting the real `adminLogin()` flow regenerate and re-sync it on next login. No-arg invocation lists known admin emails instead of defaulting to a hardcoded (and, as discovered, already-wrong) email.

## [0.2.4] - 2026-08-08

Everything below was committed as `3ac928a`, merged into `main` at `ab4caa3`.

### Security
- **Deterministic Supabase Auth shadow password replaced with a random per-admin secret.** `admin_users` gains a nullable `supabase_auth_secret` column (migration `0013_polite_punisher`); `adminLogin()` now generates a `crypto.randomBytes(32)` secret once per admin (on first login after the column exists) and reuses it on every subsequent login, instead of deriving a password from the formula `` `auth_${email}_fixed_password_v1` `` and overwriting the Supabase Auth user's password to that value on *every* login. The old scheme was fully computable from an admin's email plus the (readable) source code, and its every-login overwrite meant any manual workaround on the Supabase side got silently reverted. `getSupabaseAuthPassword()` has been removed entirely. See `AUTH_DOCUMENTATION.md` §4 for full before/after detail.

## [0.2.3] - 2026-08-08

Everything below was committed as `ba85799` and pushed to `origin/security-audit`.

### Added
- Basic in-memory rate limiting (`src/infrastructure/rate-limit/limiter.ts`, fixed-window per-IP) on `loginAdmin` (5 attempts/15min — the bcrypt comparison had no other brute-force protection) and `POST /api/orders` (10 orders/10min — checkout had no abuse protection against spam that could flood the Telegram alert channel or create bogus Yalidine parcels). Deliberately simple (no Redis/Upstash) given this app's actual scale; state is per-process, not durable/cross-instance — documented as a known limitation in the module itself.
- Baseline security headers via `next.config.ts`'s `headers()` (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and a `Content-Security-Policy` scoped to Supabase/Sentry origins) — previously there were none, and no `proxy.ts`/middleware exists in this app to have set them elsewhere.
- Zod request-body validation for `POST /api/orders` (`src/domain/validation/checkout.schema.ts`) and `POST`/`PUT /api/products` (`src/domain/validation/product.schema.ts`) — `zod` was already a dependency (used client-side only) but server routes previously did presence-only `if (!body.field)` checks with no type/length/format constraints. Existing business-rule checks (coffret box counts, delivery-zone resolution, etc.) are unchanged and still run after schema validation.
- Magic-byte sniffing on `POST /api/upload` (`sniffImageType()` in `app/api/upload/route.ts`) — the allowed-MIME-type check previously trusted the browser-supplied `file.type` label; uploads are now also verified against the actual file bytes for JPEG/PNG/GIF/WebP before being accepted.

## [0.2.2] - 2026-08-08

Everything below was committed as `3859670` and pushed to `origin/security-audit`.

### Fixed
- **Client-trusted product price in checkout** (security): `POST /api/orders` now re-fetches each item's price from the `products` table server-side (`productRepository.getById`) instead of trusting `item.product.price` from the request body — closes a gap where the coffret/delivery-fee anti-tamper checks existed but per-item price didn't, allowing a crafted checkout payload to set an arbitrary total (and, for COD orders, an arbitrary amount collected on delivery). Also now rejects orders referencing an inactive/sold-out/nonexistent product with a 400 instead of silently accepting them.
- **Admin dashboard layout auth gap** (security): `app/admin/(dashboard)/layout.tsx` gated access on `supabase.auth.getUser()` alone (any valid Supabase session), not `admin_users` membership like every API route already enforces via `getAdminSession()`. Now calls `requireAdmin()` instead, matching the rest of the app's auth model.
- **Public, unauthenticated API docs** (security): `/api/openapi` and `/api-docs` (a live Swagger UI console capable of executing real requests against admin-only routes using an ambient session cookie) had no auth check, exposing the full internal route/schema map to any visitor. Both now require `getAdminSession()`/`requireAdmin()`.

### Security
- Dependency vulnerabilities patched via `next` 16.2.11 → 16.3.0 (pulls in fixed `postcss` and `sharp`, resolving GHSA-r28c-9q8g-f849, GHSA-qx2v-qp2m-jg93, GHSA-f88m-g3jw-g9cj) and a transitive `nanoid` bump (GHSA-2v37-7h3g-55p8). Remaining `npm audit` findings (`swagger-ui-react`'s vendored `js-yaml`, dev-only `drizzle-kit`/`esbuild`) require semver-major downgrades and were left as-is — the `swagger-ui-react` exposure is mitigated by the `/api-docs` auth gate above instead.

## [0.2.1] - 2026-08-08

### Changed
- Repo-wide Tailwind v4 class-syntax cleanup (no visual/behavioral change): arbitrary CSS-variable values written as `text-[var(--foo)]` converted to the shorter `text-(--foo)` syntax across 10 files (`ProductForm.tsx`, `WilayaCommuneSelect.tsx`, `ProductDetail.tsx`, admin `products/page.tsx`, `CartDrawer.tsx`, `LanguageSwitcher.tsx`, `ProductCard.tsx`, `ToastContainer.tsx`, `Select.tsx`, `app/cart/page.tsx`); `--color-text`/`--color-bg` (which have a real mapping to Tailwind's `foreground`/`background` theme tokens via `app/globals.css`'s `@theme inline` bridge) converted to those semantic utility names instead. `flex-shrink-0` renamed to its v4 alias `shrink-0` in the 3 files that used it.
- `CLAUDE.md`'s Documentation Sync Policy sharpened to explicitly cover the *after*-commit side: `CHANGELOG.md`'s `[Unreleased]` section should be converted into a real dated version entry once its contents are actually committed/pushed, not left open-ended indefinitely.

## [0.2.0] - 2026-08-08

Everything below was committed as `3ed4350` and pushed to `origin/yalidine`.

### Added
- Optional `inspiredBy` fragrance-icon field on products (e.g. `"Dior Lucky"`) — new `products.inspired_by` column (migration `0012_chemical_maginty`), threaded through the domain entity, repository, `POST`/`PUT /api/products`, and the admin product form. On the product detail page (`app/shop/[slug]/ProductDetail.tsx`), it's folded inline into the end of the description paragraph — colored with the product's own signature `colorHex` — rather than shown as a separate block.
- `AUTH_DOCUMENTATION.md` — full audit of the admin authentication system (login flow, the synthetic-Supabase-password bridge, session verification, route protection, and a ranked list of known security gaps with recommendations).
- `gender` selector in the admin product form (`ProductForm.tsx`) — the field existed on the `Product` entity/schema already but had no way to be set from the admin UI until now.
- `scripts/seed-inspired-by.ts` — one-time, dry-run-by-default backfill script that populates `products.inspired_by` for the 14 launch mists from their original mist→inspiration pairing.
- Real Instagram (`@magie.klayn.algerie`) and TikTok (`@magieklaynalgerie`) links on the footer's social icons (previously `href="#"` placeholders).
- Store hours now shown in the checkout store-pickup note (`WilayaCommuneSelect.tsx`) — previously only address and phone were shown.
- Contact page now shows both boutiques' hours separately (`contact.hoursAlgiersLabel`/`contact.hoursOranLabel`), instead of one generic, store-agnostic hours line.
- New translation keys across `messages/{en,fr,ar}.json`: `product.inspiredBy`, `admin.products.form.{genderLabel,genderUnset,inspiredByLabel,inspiredByPlaceholder}`, `contact.{hoursAlgiersLabel,hoursOranLabel}`, `about.inspiredByPrefix`.
- `MagieKlayn-MARKETING.md`, `portfolio_description.md` — new business-facing project documents.
- "Documentation Sync Policy" and "Translation Parity" sections in `CLAUDE.md`.

### Changed
- About page's "Inspired By" section rebuilt from a static two-column card grid (reading a hardcoded `INSPIRED_BY` array) into a staggered, alternating vertical list that fetches live product data client-side and shows each product's real signature color as a swatch — so it now reflects whatever's actually curated in the admin instead of a separate static file.
- About page's story section rebuilt from a single static two-column layout (fixed color strip beside one large text block) into four alternating zigzag rows, each pairing a bold single-direction color-ribbon bow with its own text block (headline / description / tagline pull-quote / stats), replacing the previous subtle continuous S-curve ribbon.
- `StoryColorStrip` component's path geometry changed from a per-band alternating wiggle to a single sine-based bow per instance, driven by a new `bend: "left" | "right"` prop.
- Corrected both boutiques' opening hours (`shipping.storeAlgiers.hours` / `shipping.storeOran.hours` in all three locales) — both previously showed the identical, incorrect `"Mon–Sat, 10:00 – 19:00"`. Alger is now Saturday–Thursday 9:00 AM–8:00 PM, closed Fridays; Oran is now Saturday–Thursday 11:30 AM–12:00 AM, Friday 5:00 PM–12:00 AM.
- `app/about/page.tsx`'s "Values" section removed entirely (unused `messages/*.json` keys and `.value-grid`/`.value-card*` CSS left in place, not deleted).
- Single order-creation path consolidated: `app/actions.ts`'s unused `createOrder` server-action duplicate (no validation, no Yalidine parcel creation, no anti-tamper fee checks, and zero callers anywhere in the app) removed — `POST /api/orders` is now the sole order-creation path.
- `app/api/orders/route.ts`'s Yalidine `create-parcel` import normalized from an `@/../scripts/create-parcel` alias hack to a plain relative import.
- Cart `localStorage` persistence key renamed from `"crumbleivable-cart"` (leftover branding from a prior project this codebase was adapted from) to `"magie-klayn-cart"`, with a one-time migration read of the old key so no in-progress cart is lost.
- Admin dashboard metadata description, shop page metadata description, and a couple of code comments in `src/infrastructure/db/schema.ts` — cleaned of the same "Crumbleivable" prior-project branding leftover.
- `scripts/fix-auth.ts`'s hardcoded admin email updated from a leftover `admin@crumbleivable.com` to `admin@magieklayn.com`.
- `PROJECT_DOCUMENTATION.md` updated in place (not rewritten) for the schema/API/folder-structure/migration-tooling changes above.

### Removed
- Dead duplicate `createOrder` server action in `app/actions.ts` (see Changed).
- `INSPIRED_BY`/`InspiredByEntry` static array from `src/domain/data/story-palette.ts` — the data now lives on `products.inspired_by`; the array's original 14 entries were moved into `scripts/seed-inspired-by.ts` as the one-time backfill source before being deleted from the domain layer.
- Stray empty `true,` file at the repo root (accidental artifact, unreferenced).
- `bash.exe.stackdump` (stray crash artifact, unreferenced).

### Fixed
- Both boutiques displaying identical, incorrect opening hours (see Changed) — customers could previously be told the wrong hours for either location.
- Checkout store-pickup note giving a customer an address with no indication of when the store is actually open.

### Security
- No security-relevant changes in this batch.

---

## [0.1.0] - 2026-08-08

First tracked baseline, covering the full feature set built up over the project's initial 34-commit history (2026-07-24 → 2026-08-08), before the `[Unreleased]` changes above.

### Added
- Public storefront: home, shop grid, product detail, cart, checkout, about, contact, FAQ, and shipping pages, in French/English/Arabic with full right-to-left support for Arabic.
- Account-free checkout with delivery via Yalidine (Algeria's dominant courier): home delivery, stop-desk pickup point, or free in-store pickup in Algiers and Oran — wilaya/commune-aware delivery-fee calculation.
- "Coffret" gift-box packaging as an order-level upsell (not a separate product), holding exactly 4 bottles per box, with server-recomputed pricing.
- Automatic Yalidine courier parcel creation on order placement, and an admin-owner Telegram alert on every new order — both fire-and-forget so a slow/failing integration never blocks checkout.
- Single-admin back-office at `/admin`: product CRUD (with image upload to Supabase Storage), order management with status tracking (`pending → confirmed → preparing → ready → delivered`/`cancelled`), and dashboard stats.
- Hybrid authentication: `admin_users` table (bcrypt) as the source of truth, shadowed by a Supabase Auth session for cookie-based session handling.
- Interactive API documentation at `/api-docs`, generated from `@swagger` JSDoc comments across all route handlers.
- Sentry error monitoring across client, server, and edge runtimes.
- Standalone maintenance scripts for Yalidine delivery-zone syncing, admin auth repair, and one-off DB migrations.

### Changed
- N/A (baseline release).

### Fixed
- Various early-stage fixes folded into this baseline (home/shop page responsiveness, product page data issues, build/deploy metadata) — see git history prior to this file's creation for individual commits.

### Security
- N/A (baseline release; see `PROJECT_DOCUMENTATION.md` §14 for known, already-documented security trade-offs such as the synthetic-password Supabase Auth bridge).
