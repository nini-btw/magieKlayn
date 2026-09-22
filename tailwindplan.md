# Tailwind Migration Plan — `app/globals.css` → Utility Classes

## Context

The user wants to eliminate (or drastically shrink) the project's hand-written global CSS in favor of Tailwind utility classes. This is **not a greenfield Tailwind install** — Tailwind v4 is already wired in (`@import "tailwindcss"` in `app/globals.css`, `@tailwindcss/postcss` in `postcss.config.mjs`), and newer components (`Button.tsx`, `Select.tsx`, `CartDrawer.tsx`, admin pages, etc.) already lean on Tailwind utilities, including CSS-variable arbitrary values like `border-(--color-border)`. The problem is that `app/globals.css` itself has grown into a 4,388-line, 679-rule legacy stylesheet of hand-written classes (`.hero-full`, `.admin-panel`, `.faq-item`, etc.) that page-level files (`app/**/page.tsx`) still depend on heavily. The plan below inventories that file, separates what's safe to convert into utilities vs. what needs to stay as CSS, and sequences the migration to de-risk it — starting with a branch and with **no code changes** until this is approved.

This is a research/planning deliverable, not implementation — nothing below has been executed yet.

---

## 0. First step: branch

Create a new branch off `main` before any migration work starts, e.g. `git checkout -b tailwind-migration`. (Not yet done — will happen on approval.)

---

## 1. CSS file inventory

| File | Lines | Rule blocks (`{`) |
|---|---|---|
| `app/globals.css` | 4,388 | 679 |

This is the **only** CSS file in the repo (no `*.module.css` anywhere; `.next/**/*.css` is just compiled output — ignore). 356 unique class selectors are defined in it, spanning: base/reset, buttons, header/nav, hero variants, a repeated "bottle" product-visual pattern, collection/product grid, coffret, story/about, newsletter, footer, contact form, FAQ, 404, shipping/store, product detail, discovery section, and a very large `admin-*` namespace (~150 classes, the single biggest chunk of the file).

**Notable finding**: lines 2843–3517 and 3518–4213 are near-duplicate copies of ~150 admin selectors (diverging by only 3 rules + one `z-index`). This ~675-line duplicate block (~15% of the file) should be reconciled/deleted as a cleanup step *before* migrating the admin classes — otherwise the migration will double the work.

---

## 2. Reuse vs. one-off

**289 of 356 classes are actually referenced** somewhere in `app/**`/`src/presentation/**`; **~72 appear dead** (superseded markup, no longer referenced) — flagged in §7, should be deleted rather than migrated (after a quick `git log -p` sanity check).

**Genuinely shared across multiple components** (good Tailwind-utility or shared-component candidates):
- `eyebrow`, `section-title`, `section-description` — used in 9 different page files. Pure typography → straightforward utility classes, or a tiny shared `<SectionHeading>` component.
- `btn` / `btn-primary` / `btn-secondary` — used in 7–8 files. Candidate for a shared `Button`-style utility class or reuse of the existing `ui/Button.tsx` component instead of ad-hoc classes.
- `page-hero`, `page-cta` — 4–5 files each, page-shell layout patterns.
- `bottle-cap`, `bottle-label`, `bottle-label-brand/name`, `bottle-shoulder` — the "bottle" visual markup is **duplicated across 3 components** (`ProductDetail.tsx`, `DiscoverySection.tsx`, `ProductCard.tsx`) rather than being one shared component. Worth extracting into a single `<BottleVisual>` component *during* the migration, not just converting the classes in place 3×.
- `icon-circle`, `wordmark` — `Header.tsx`/`Footer.tsx`.
- Admin: `admin-page-title/subtitle`, `admin-panel*`, `admin-stat-grid/card*`, `admin-table`, `state-message` — reused across 3–4 admin dashboard pages.

**One-offs** (majority of the 289): all `discovery-*`, `faq-*`, `notfound-*`, `newsletter-*`, `footer-*`, `store-*`, `shipping-method-*`, most `admin-drawer/modal/login/sidebar/search/product-*`. These are used in exactly one file — safest, lowest-risk migration targets since there's no cross-component coupling to preserve.

---

## 3. Styles that don't map cleanly to Tailwind utilities

| Feature | Where | Handling |
|---|---|---|
| `@keyframes` (6: `scroll-wheel`*, `ticker-scroll`, `glow-pulse`, `heroCtaFloat`, `heroCtaGlow`, `spin`*) | scattered, `*` = likely dead | Tailwind v4 supports custom keyframes via `@theme` (`--animate-*` tokens) — move live ones (`ticker-scroll`, `glow-pulse`, `heroCtaFloat`, `heroCtaGlow`) into `@theme` and reference as `animate-*` utilities. Confirm the two `*` ones are dead before dropping. |
| 34 `@media` queries (mostly `max-width` breakpoints: 800/640/700/1024/420px) | throughout | Tailwind's default breakpoints are `min-width`-based (`sm/md/lg/xl`), the opposite direction from this file's `max-width` mobile-first-descending style. Each converted rule needs re-thinking as `max-*:` variants or restructured as base-mobile + `sm:`/`lg:` overrides — **not** a 1:1 mechanical swap; budget real time per component here. The 8 admin `min-width` breakpoints (640/1024px) already look Tailwind-shaped and should map cleanly. |
| 2 `prefers-reduced-motion` blocks | L110, 2070/2229 | Use Tailwind's `motion-reduce:` variant. |
| Pseudo-elements (`::before`/`::after`, 7 total) | reset, `.newsletter-input::placeholder`, `.nav-link::after`, `.bottle::after`, `.mini-bottle::before` | Tailwind supports `before:`/`after:`/`placeholder:` variants for simple cases; `.bottle::after` (glass sheen gradient overlay) is complex enough it may be better left as scoped CSS or an inline `<div>` overlay rather than forced into utilities. `.nav-link::after` and `.mini-bottle::before` are in the dead-code list — drop, don't migrate. |
| CSS custom properties / design tokens | two `:root` blocks (L21-45 core tokens, L2303-2307 admin-only) | These should become Tailwind v4 `@theme` tokens (`--color-*`, `--radius-*`, `--ease-luxury`, `--duration-base`, `--shadow-*`), **not** be deleted — see §6. |
| Dynamic per-instance CSS vars set from React (`--liquid`/`--liquid-deep` in `DiscoverySection.tsx`/`ProductCard.tsx`, `--wedge-glow` in `CollectionVisual.tsx`, `--glow-color` in `StoryGlowField.tsx`) | inline `style={{ '--x': ... }}` | These are legitimately per-product dynamic values (color hex codes) — **cannot** become static Tailwind classes. They must stay as inline custom-property assignments even post-migration; only the *consuming* rule (e.g. `background: var(--liquid)`) migrates to an arbitrary-value utility like `bg-(--liquid)`. |
| Nested/compound selectors (`.page-hero .section-description`, `.discovery-card:hover .discovery-visual`, `:nth-child(even)`, `:last-child`, `[aria-invalid="true"]`, `[aria-expanded="true"] .faq-icon`, etc.) | throughout | No 1:1 utility equivalent for descendant-combinator or sibling-state styling. Options per case: (a) Tailwind's `group`/`group-hover:` + `peer`/`peer-*` patterns for hover/state cascades, (b) `[&>.foo]:` arbitrary-variant syntax for one-off descendant rules, (c) restructure the component so the "descendant" is styled directly via a prop/conditional class instead of relying on CSS cascade. Flag each during per-component migration rather than solving generically. |
| Font-variable mismatch bug | L29-30: `--font-display`/`--font-body` reference `--font-archivo-black`/`--font-inter`, which are **never set anywhere** (`layout.tsx` only loads Comfortaa + Noto Kufi Arabic via `next/font`) | Pre-existing bug, unrelated to Tailwind but will surface when tokens move into `@theme` — decide with the user/design owner whether headings should actually be Archivo Black (needs `next/font` addition) or the fallback ("Inter"/system) is intentional, **before** baking the "wrong" font into the new token names. |

---

## 4. Tailwind setup status

**Already fully installed and configured** — no setup steps needed:
- `tailwindcss@^4`, `@tailwindcss/postcss@^4` in `package.json` devDependencies.
- `postcss.config.mjs` wires `@tailwindcss/postcss`.
- `app/globals.css` line 1: `@import "tailwindcss";`, followed by a `@theme inline { ... }` block already bridging some tokens (`--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`) to the site's custom properties.
- No `tailwind.config.*` file — correct for v4's CSS-first config model, don't add one.
- Next 16.3.0 / React 19.2.4 have no version conflict with Tailwind v4.

The actual work is **not** "install Tailwind," it's "port ~600 legacy rules into the `@theme` + utility-class system that's already running alongside them."

---

## 5. Proposed migration order (simplest → most complex)

Two parallel tracks, since the legacy CSS weight sits mostly in `app/**/page.tsx`, not `src/presentation/components/`:

**Track A — `src/presentation/components/` (already mostly Tailwind-native, low risk):**
1. `ui/EmptyState.tsx` (23 lines), `ui/Badge.tsx` (45)
2. `features/StepIndicator.tsx` (63), `features/ToastContainer.tsx` (67), `features/Header.tsx` (71)
3. `ui/Input.tsx` (88), `features/Footer.tsx` (97), `ui/Button.tsx` (98), `ui/QuantityStepper.tsx` (100)
4. `features/StoryColorStrip.tsx` (117), `ui/Select.tsx` (145), `features/LanguageSwitcher.tsx` (155)
5. `features/DiscoverySection.tsx` (161), `features/CartDrawer.tsx` (176), `features/ProductCard.tsx` (182), `ui/Logo.tsx` (192)
6. `features/ProductForm.tsx` (430), `features/WilayaCommuneSelect.tsx` (592)

**Track B — `app/**` pages (carries the legacy custom-class weight):**
1. Trivial shells: `shop/layout.tsx`, `api-docs/*`, `admin/(dashboard)/AdminSidebarWrapper.tsx`, `global-error.tsx`, `admin/(dashboard)/layout.tsx`
2. Small standalone pages: `not-found.tsx`, `HeroSection.tsx`, `AdminTopBar.tsx`, `template.tsx`, `StoryGlowField.tsx`
3. Mid pages with one-off classes only: `shop/[slug]/page.tsx`, `layout.tsx`, `faq/page.tsx`, `shop/page.tsx`, `CollectionVisual.tsx`
4. Pages reusing shared classes (do these together, since the shared class — e.g. `eyebrow`/`section-title`/`btn`/`page-hero` — needs one consistent replacement applied across all of them in the same pass): `about/page.tsx`, `contact/page.tsx`, `shipping/page.tsx`, `shop/[slug]/ProductDetail.tsx`
5. Admin dashboard family (do together — they share the 150-class `admin-*` namespace and the duplicate-block cleanup from §1 should happen right before this batch): `admin/login/page.tsx`, `admin/(dashboard)/AdminSidebar.tsx`, `admin/(dashboard)/page.tsx`
6. Largest/highest-risk last: `cart/page.tsx` (629 lines), `admin/(dashboard)/products/page.tsx` (709), `admin/(dashboard)/orders/page.tsx` (1,063)

Within Track B, tackle the **bottle-visual triplication** (`ProductDetail.tsx`/`DiscoverySection.tsx`/`ProductCard.tsx`) as one combined step — extract a shared `<BottleVisual>` component while converting those classes, rather than converting the same markup 3× independently.

Recommended overall sequence: Track A fully (low risk, validates the workflow/conventions) → delete confirmed-dead CSS (§2) and reconcile the admin duplicate block (§1) → Track B in the order above.

---

## 6. What stays in global CSS vs. moves to Tailwind `@theme`

**Move into `@theme` (Tailwind config, CSS-first in v4):**
- Color tokens: `--color-text`, `--color-text-secondary`, `--color-border`, `--color-white`, `--color-bg`, `--color-bg-soft`, etc. (already partially bridged via the existing `@theme inline` block — extend it rather than replacing it).
- Spacing scale: `--space-sm/md/...` if they follow a consistent scale Tailwind's spacing utilities can absorb (check whether they already align with Tailwind's default scale or need custom `--spacing-*` tokens).
- `--radius-*`, `--shadow-*`, `--ease-luxury`, `--duration-base` → Tailwind's `--radius-*`/`--shadow-*`/`--ease-*`/`--animate-duration-*` theme namespaces.
- The live `@keyframes` (`ticker-scroll`, `glow-pulse`, `heroCtaFloat`, `heroCtaGlow`) → `--animate-*` theme tokens.
- Admin-only status colors (`--color-success`, `--color-error`, `--color-warning`, currently a second `:root` block at L2303) → fold into the same `@theme`, no reason to keep them separate.

**Stays as minimal hand-written CSS (not realistically expressible as utilities):**
- The base reset (if any beyond what Tailwind's preflight already provides — confirm no conflicting resets).
- `.bottle::after` glass-sheen pseudo-element gradient (complex enough to leave as scoped CSS, or convert to an actual overlay `<div>` in the new `<BottleVisual>` component instead of CSS).
- Truly one-off complex nested/state selectors where a Tailwind arbitrary-variant would be less readable than 3 lines of scoped CSS (judgment call per-component, expect a handful to remain).
- Any print-only or extremely rare edge-case rule not worth the utility-class churn.

Target end-state: `globals.css` shrinks from 4,388 lines to roughly a `@theme` token block + `@import "tailwindcss"` + a small residual set of rules for the handful of non-utility-mappable cases above — not necessarily zero, but a small fraction of current size.

---

## 7. Risk warnings

- **Font-variable bug (§3)**: `--font-display`/`--font-body` point to CSS variables that are never actually set, so headings/body text are silently rendering in fallback fonts today. Migrating the token *as-is* into `@theme` would bake in the (possibly wrong) current visual behavior. Confirm the intended fonts before converting — this is a decision for the user/design owner, not something to silently "fix" or silently preserve.
- **Admin duplicate CSS block (§1)**: ~675 duplicated lines (2843–4213) differ by only 3 rules. Migrating both copies independently would double effort and risk inconsistency — reconcile/delete the duplicate *before* starting the admin migration batch.
- **Dead CSS (~72 classes, §2)**: confirmed unreferenced by grep, but verify via `git log -p`/visual QA before deleting — some may be intentionally-unused future/toggleable states (e.g. mobile nav overlay classes) rather than truly dead, especially around `mobile-nav-*`, `hero-*`, `coffret-*` which read like features that may have been intentionally disabled rather than abandoned.
- **`max-width`-based media queries (34 total)**: converting these to Tailwind's `min-width`-based breakpoint system is a *logical inversion*, not a mechanical find-replace. Doing this carelessly is the single most likely source of responsive-layout regressions in this migration — needs visual QA (multiple viewport widths) per converted component, not just a diff review.
- **Bottle-visual triplication**: if the 3 copies have drifted even slightly (different padding/sizing per context), naively unifying them into one shared component could visibly change one or more of the 3 usages. Diff the 3 current renderings carefully before consolidating.
- **Dynamic inline CSS vars** (`--liquid`, `--wedge-glow`, `--glow-color`): must remain inline `style` props — attempting to "fully Tailwind-ify" these by hard-coding utility classes would break per-product color theming. Explicitly exclude these from the "convert to static utility" effort.
- **No visual regression tooling in this repo** (no Percy/Chromatic/Playwright screenshot tests found in prior exploration) — recommend manual visual QA (dev server + browser) after each Track A/B batch above, especially for the `max-width`→`min-width` breakpoint conversions and the admin dashboard batch, since nothing will automatically catch a broken layout.

---

## Next steps (pending your approval)

1. Confirm the font-variable question (§3/§7) with whoever owns design — affects what gets baked into `@theme`.
2. Confirm the ~72 "dead" classes are safe to drop, or flag any that are intentionally dormant.
3. Approve the branch name and migration order above (or adjust).
4. On approval, create the branch and begin Track A (simplest components) as the first actual commit.
