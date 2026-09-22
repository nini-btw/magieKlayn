# Small-Store Production-Readiness Requirements

A stack-agnostic checklist for taking a small online storefront (roughly under 20 products,
usually a single owner/small team) from "it works on my machine" to production-ready.

This document is intentionally **technology-neutral** — it doesn't assume any particular
framework, database, payment provider, or delivery carrier. It describes *what* must be true,
not *how* to build it, so it can be dropped into any storefront repo and used as-is.

## How to use this doc

1. Hand this whole file to whoever (or whichever AI assistant) is auditing or building the
   store.
2. Go section by section. For each bullet, mark it **Done / Partial / Missing / N/A**.
3. Prioritize fixes in this order: **Security & money-handling first**, then **checkout
   reliability**, then everything else. A store that loses money silently or leaks secrets is
   not production-ready no matter how polished the UI is.
4. Re-run the checklist before every major change to checkout, payments, or auth — those are
   the areas most likely to silently regress.

See the [appendix](#appendix-prompts-to-hand-an-ai-assistant) for ready-to-paste prompts.

## Scope assumptions

- Small catalog (roughly <20 SKUs) — inventory and catalog tooling can stay simple; it does not
  need to be built for thousands of products.
- Single storefront, most likely single region/currency, but confirm this explicitly — it
  changes the tax, currency, and delivery requirements below.
- Small team, often a solo non-technical owner — the admin/ops tooling requirement matters more
  here than it would for a team with engineers on call.
- Physical goods with delivery are assumed for the "Delivery & fulfillment" section; skip it
  (mark N/A) for digital-only products.

---

## 1. Catalog & data integrity

*Why it matters: wrong prices, broken images, or stale stock directly cost money or trust.*

- [ ] Product data (name, price, description, images, variants) lives in one authoritative
      place — never hardcoded in multiple pages that can drift out of sync.
- [ ] Prices are stored as exact values (integer minor units or a decimal type), never as
      floating-point numbers that can introduce rounding errors.
- [ ] Every product image has a defined fallback behavior if missing (placeholder, not a broken
      image icon or a fabricated stock photo).
- [ ] If stock/inventory is tracked, it can't go negative, and out-of-stock items are clearly
      marked or hidden from checkout.
- [ ] There is a way to update product data without a code deploy (admin UI, CMS, or at minimum
      a documented direct-DB/API workflow).

## 2. Checkout & order flow

*Why it matters: this is where money and trust are won or lost — bugs here are the most
expensive kind.*

- [ ] Price and any fees (delivery, tax, discounts) are **recomputed server-side** at order
      creation time — the client-submitted price is never trusted as-is. This closes the most
      common "edit the request in devtools" tampering vector.
- [ ] Orders have an explicit status model (e.g. pending → confirmed → fulfilled/cancelled) and
      every transition is auditable (who/what changed it, when).
- [ ] Duplicate submissions (double-click, network retry) don't create duplicate orders —
      some form of idempotency on order creation.
- [ ] Promo codes / discounts, if present, are validated server-side (expiry, usage limits,
      applicability) — not just hidden in the UI.
- [ ] Failed payment or delivery-dispatch attempts don't silently lose the order — there's a
      retry path or at least a visible failed state an admin can see and act on.

## 3. Delivery & fulfillment (skip if digital-only)

*Why it matters: wrong delivery fees or lost tracking create refund requests and support load.*

- [ ] Delivery fee/zone logic is deterministic, tested, and not editable by the customer's
      request payload.
- [ ] If integrating a third-party delivery/carrier API, failures in that integration degrade
      gracefully (order still gets created; dispatch can be retried) rather than blocking
      checkout entirely.
- [ ] There's a way to look up an order's delivery/tracking status without leaving the admin
      tool.
- [ ] Any "free" or "in-store pickup" delivery option is server-validated against the actual
      allowed set of options, not just trusted from the client.

## 4. Auth & authorization

*Why it matters: an unguarded admin endpoint is a full store compromise, not a minor bug.*

- [ ] Admin/management routes require authentication, and the authorization check happens on
      the server for every request — never inferred from something only checked in the UI.
- [ ] Auth guards are added to a route in the **same change** that creates the route — never
      shipped "temporarily" unguarded.
- [ ] Role/permission checks (e.g. admin vs. customer) are enforced server-side, keyed off a
      trusted source (session/token), not a client-supplied flag.
- [ ] Session/token handling follows the auth provider's documented security guidance (secure
      cookies, expiry, refresh) rather than a hand-rolled scheme.
- [ ] There's a way to promote/demote admin users that doesn't require direct database access
      as the only option in the long run (a documented interim script is acceptable early on).

## 5. Admin/ops tooling

*Why it matters: if the owner can't run the store without a developer, it isn't production-ready
for them.*

- [ ] The non-technical owner can, without touching code: add/edit/remove products, view and
      manage orders, and update key site content (banners, images, contact info).
- [ ] Every admin-facing destructive action (delete product, cancel order) has a confirmation
      step.
- [ ] There's at least a minimal view of "orders needing attention" (e.g. missing
      tracking/failed dispatch) so problems don't require querying the database to notice.

## 6. Notifications

*Why it matters: a new order that nobody notices isn't fulfilled.*

- [ ] The owner/staff gets notified (email, SMS, chat bot, or push) when a new order comes in,
      through a channel they actually check.
- [ ] Notification failures (e.g. the notification service is down) don't block or fail the
      underlying order — notification is best-effort, not on the critical path.
- [ ] There's a way to turn notifications on/off per environment (so testing/staging doesn't
      spam real channels).

## 7. Internationalization & localization (optional — only if the market needs it)

*Why it matters: half-translated UI looks unfinished and erodes trust; over-investing here when
the market is single-language wastes effort better spent elsewhere.*

- [ ] If multiple languages are needed, routing/URLs reflect the locale and there's one real
      routing solution — not a decorative language switcher that doesn't change content.
- [ ] There's a clear line between UI chrome (safe to machine-translate) and real business
      content — product names/descriptions are not silently auto-translated without the
      business's sign-off.
- [ ] If right-to-left languages are supported, layout mirroring is verified on real pages, not
      just assumed from framework defaults.

## 8. SEO & discoverability (skip if the store is purely social/ad-traffic driven)

- [ ] Each product/category page has real, distinct metadata (title, description).
- [ ] A sitemap exists and is submitted to search engines.
- [ ] Structured data (e.g. product/offer schema) is present where it drives rich results.

## 9. Testing

*Why it matters: untested money-math is the single most common source of production incidents in
small stores.*

- [ ] Price, fee, and discount calculation logic has automated tests covering normal and edge
      cases (zero, boundary, invalid input).
- [ ] The order-creation path has at least one end-to-end or integration test, not just unit
      tests on isolated functions.
- [ ] Tests run automatically before merge/deploy (CI), not only manually and inconsistently.
- [ ] New functionality ships with its first test alongside it, not "added later."

## 10. Security

- [ ] No secrets (API keys, DB credentials, service-role keys) are committed to source control
      or exposed to the client (e.g. no server-only secret accidentally marked as a public/
      browser-exposed env var).
- [ ] All user-supplied input is validated/sanitized server-side (SQL/NoSQL injection, XSS,
      command injection) — the framework's built-in protections aren't assumed to cover
      hand-rolled queries or raw HTML rendering.
- [ ] Dependencies are kept reasonably current and checked for known vulnerabilities.
- [ ] Rate limiting or basic abuse protection exists on public write endpoints (order creation,
      login, promo code redemption) to prevent trivial scripted abuse.
- [ ] HTTPS is enforced everywhere; no mixed content.

## 11. Performance

- [ ] Images are served in an optimized format/size (not full-resolution originals on every
      page).
- [ ] Core pages (home, product, checkout) load acceptably on a throttled mobile connection —
      verified with a real tool (e.g. PageSpeed Insights), not assumed.
- [ ] Build output doesn't ship obviously unnecessary polyfills/bundles for the target browser
      support matrix.

## 12. Deployment & environments

- [ ] Development, staging (if used), and production use separate configuration/credentials —
      a bug in dev can't touch production data.
- [ ] Environment variables/secrets are managed through the hosting platform's mechanism, not
      hardcoded or passed ad hoc.
- [ ] There's a documented (or scripted) way to roll back a bad deploy.
- [ ] Database migrations are applied through a repeatable, versioned process — not manual ad
      hoc schema edits against production.

## 13. Monitoring & error visibility

- [ ] Server errors are logged somewhere the owner/developer can actually see them after the
      fact, not only in an ephemeral local terminal.
- [ ] There's a way to know the site is down (uptime check/alert) without a customer having to
      report it first.
- [ ] Failed background/async work (e.g. a notification or dispatch call that failed) leaves a
      visible trace rather than failing silently.

---

## Definition of "production-ready" — go/no-go summary

Treat the store as **not yet production-ready** if any of the following are true, regardless of
how complete everything else is:

- Prices/fees are trusted from the client instead of recomputed server-side.
- Any admin/management route is reachable without authentication.
- Secrets are exposed to the browser or committed to source control.
- New orders can be silently lost (no notification, no visible "needs attention" state, no
  server-side error logging).
- There is no automated test covering the price/fee calculation logic.
- The owner cannot manage products/orders without a developer.

Everything else in this checklist is about polish and risk-reduction on top of that baseline —
prioritize accordingly.

---

## Appendix: prompts to hand an AI assistant

Paste these into a fresh Claude Code (or similar) session inside the target store's repo, after
placing this file at `docs/STORE_PRODUCTION_READINESS_REQUIREMENTS.md` (or any path) in that
repo:

**1. Audit:**
> Read `docs/STORE_PRODUCTION_READINESS_REQUIREMENTS.md` and audit this codebase against every
> checklist item. For each item, report Done / Partial / Missing / N/A with a one-line reason
> and file reference. Do not fix anything yet — just report.

**2. Plan:**
> Based on the audit, propose a phased plan to close the Missing/Partial gaps, ordered by the
> priority rule in the "Definition of production-ready" section (security and money-handling
> first). Group into phases I can review one at a time.

**3. Execute one phase:**
> Implement phase 1 of the plan. Add tests alongside any new logic. Stop and summarize before
> moving to the next phase.
