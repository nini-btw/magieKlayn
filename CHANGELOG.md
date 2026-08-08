# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
