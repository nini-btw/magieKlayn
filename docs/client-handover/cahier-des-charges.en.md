# Project Specifications — Magie Klayn E-commerce Platform

**Cahier des charges — project handover document**
English version — 1.0

---

## Contents

1. [Purpose of this document](#1-purpose-of-this-document)
2. [Project context](#2-project-context)
3. [Delivered functional scope](#3-delivered-functional-scope)
4. [Technical architecture](#4-technical-architecture)
5. [Development cost estimate](#5-development-cost-estimate-dzd)
6. [Estimated monthly running costs](#6-estimated-monthly-running-costs-dzd)
7. [Deliverables](#7-deliverables)
8. [Sign-off](#8-sign-off)

---

## 1. Purpose of this document

This document — a *cahier des charges* in the sense used in French-speaking business
practice — presents, for the client's reference, the full scope of the **Magie Klayn**
project as designed, built, and delivered: the business context, the delivered
features, the technical architecture used, an approximate development cost estimate
in Algerian Dinars (DZD), and the ongoing monthly running costs to expect once the
platform is live.

It serves as a shared reference between the developer and the client for validating
the delivered work and for scoping any future evolution of the project.

---

## 2. Project context

**Before the project**, the brand — a luxury fragrance boutique based in Oran —
took every order manually through Instagram comments and WhatsApp messages, then
separately called a courier to arrange cash-on-delivery shipping across Algeria's
58 provinces. Every order meant cross-referencing delivery fees by hand, re-typing
customer details into the courier's own system, and hoping nothing got lost across
several disconnected tools — with no single record of what was ordered, by whom,
or where it stood.

**After the project**, customers browse a real online storefront in French, Arabic,
and English, check out with no account required, and get exact wilaya/commune-aware
delivery pricing automatically — choosing home delivery, a Yalidine stop-desk pickup
point, or free in-store pickup in Algiers or Oran. A luxury gift-box ("coffret")
packaging upsell is calculated automatically based on cart contents. The moment an
order is placed, a courier parcel is created and the owner is alerted on Telegram —
turning what used to be a multi-tool manual relay into a single customer-facing
checkout flow.

---

## 3. Delivered functional scope

### 3.1 Online storefront (public site)

- Home page (hero, collection showcase, product discovery grid, brand story, color
  strip), a sortable shop/catalog page, and detailed product pages — each with an
  illustrated fallback visual for products without uploaded photos.
- A real fragrance catalog, priced in DZD, with per-product color/scent identity
  reflected throughout the site's visual design (hover tints, dynamic backgrounds).
- Cart with a **luxury gift-box ("coffret") packaging system**: once the cart holds
  4 or more bottles, the customer can pack them into one or more gift boxes
  (white/black), with the packaging fee calculated automatically.
- The entire site is available in **French, Arabic, and English**, including proper
  right-to-left (RTL) layout for Arabic.
- About, Contact, FAQ, and Shipping/store-locator pages with the brand's real
  information.
- SEO foundation: `robots.txt` and `sitemap.xml`, structured data (Organization,
  Product, and catalog JSON-LD), auto-generated social preview images, and search
  coverage for common misspellings of the brand name.
- Interactive, access-controlled API documentation (Swagger UI) for future
  maintenance and integration work.

### 3.2 Payment and delivery

- **Cash-on-delivery (COD)** checkout, with no customer account required, offering
  home delivery, Yalidine stop-desk pickup, and free in-store pickup (Algiers and
  Oran).
- A real integration with the **Yalidine** courier: wilaya/commune delivery-fee
  lookup and live stop-desk pickup-point selection, with the customer's chosen
  point stored on the order for accurate parcel routing.
- **Server-side anti-fraud protection**: on every order, each item's price, the
  gift-box packaging fee, and the delivery fee are all independently recomputed by
  the server from trusted catalog/zone data — none of them can be tampered with
  from the customer's browser.
- Automatic **Yalidine parcel creation** and a **Telegram** alert to the owner the
  moment an order is placed — both fire-and-forget, so a slow or failing
  third-party API can never block a customer's checkout.
- Rate limiting on the checkout endpoint to guard against abuse.

### 3.3 Admin dashboard

Accessible only to the store owner (protected by authentication), it allows
managing:
- **Products** — creation, editing, deletion, and image upload.
- **Orders** — filtering by wilaya, status, and date range; inline status updates;
  controlled deletion (cancelled orders only).
- **Dashboard statistics** — total orders, total revenue, pending orders, and
  top-performing wilayas.

### 3.4 Authentication

- A single-admin authentication system combining Supabase Auth with a dedicated
  credentials table, so only the store owner's account can reach the admin area.

### 3.5 Reliability and quality assurance

- **Automated error monitoring** (Sentry) across client, server, and edge runtime,
  catching and reporting unhandled errors in production.
- **An automated test suite** (214 tests across 25 suites) covering business-critical
  logic in depth: the gift-box packaging rules, delivery/order domain logic, and —
  most importantly — the checkout endpoint's price-tampering defenses (the same
  server-side recompute described in §3.2, verified by an automated test rather
  than by inspection alone).
- A scheduled weekly job that keeps the database active, avoiding an unnecessary
  cold-start delay on the platform's free-tier database plan.

---

## 4. Technical architecture

| Area | Technical choice |
|---|---|
| Application | Next.js 16 (React 19, TypeScript), Tailwind CSS |
| Internationalization | next-intl — FR/AR/EN, RTL handling for Arabic |
| State management | Redux Toolkit (cart, UI state) |
| Forms & validation | React Hook Form + Zod |
| Database | PostgreSQL, managed via Supabase, Drizzle ORM |
| Authentication | Supabase Auth (hybrid, single-admin) |
| Image storage | Supabase Storage |
| Delivery | Yalidine API (58 wilayas) |
| Notifications | Telegram Bot API |
| Error monitoring | Sentry (client/server/edge) |
| API documentation | Swagger (next-swagger-doc + swagger-ui-react), admin-gated |
| Automated testing | Jest (Node + jsdom projects), 214 tests / 25 suites |
| Deployment | Vercel |

---

## 5. Development cost estimate (DZD)

> ⚠️ **Disclaimer:** this estimate is provided for reference only, to document the
> value of the delivered work. It is not an invoice or a contractual commitment;
> actual terms remain whatever was agreed between the developer and the client.

Estimated **per delivered feature**, not by duration or day-rate — each line
corresponds to a concrete item from the scope described in Section 3. Amounts aim
for the lowest reasonable rate for this kind of work on the Algerian freelance
market, given the real complexity of each item (real third-party integrations,
security, and three languages).

### 5.1 Storefront (public site)

| Feature | Price (DZD) |
|---|---|
| Homepage (hero, discovery grid, brand story, color strip) | 2,500 |
| Shop page (sortable product grid) | 2,000 |
| Product detail page (photos + illustrated fallback) | 2,500 |
| Cart + luxury gift-box ("coffret") packaging system | 4,500 |
| Trilingual UI — French / Arabic / English | 7,500 |
| Arabic right-to-left (RTL) layout support | 4,000 |
| About / Contact / FAQ / Shipping pages | 2,000 |
| SEO (sitemap, robots.txt, structured data, social images) | 3,500 |
| Responsive design (mobile / tablet / desktop) | 2,500 |
| Catalog data entry | 1,000 |
| **Subtotal** | **32,000** |

### 5.2 Payment and delivery

| Feature | Price (DZD) |
|---|---|
| Cash-on-delivery checkout flow (no account required) | 4,500 |
| Home delivery option | 1,500 |
| Stop-desk pickup (live Yalidine center selection) | 2,500 |
| In-store pickup option | 1,500 |
| Wilaya/commune delivery-fee lookup (Yalidine integration) | 13,500 |
| Server-side anti-fraud recompute (price / coffret fee / delivery fee) | 5,500 |
| Automatic Yalidine parcel creation | 4,500 |
| Telegram order alert | 2,500 |
| Checkout rate limiting | 1,500 |
| **Subtotal** | **37,500** |

### 5.3 Admin dashboard

| Feature | Price (DZD) |
|---|---|
| Product management (create / edit / delete / image upload) | 7,000 |
| Orders list (filter by wilaya / status / date range) | 3,500 |
| Order status update and controlled deletion | 2,000 |
| Dashboard statistics (revenue, orders, top wilayas) | 3,500 |
| Single-admin authentication | 4,500 |
| Interactive API documentation (Swagger, admin-gated) | 2,000 |
| **Subtotal** | **22,500** |

### 5.4 Reliability and quality assurance

| Feature | Price (DZD) |
|---|---|
| Automated error monitoring (Sentry, client/server/edge) | 2,500 |
| Automated test suite (214 tests, checkout security coverage) | 4,500 |
| Scheduled database keep-alive job | 1,000 |
| **Subtotal** | **8,000** |

### Grand total

| Section | Amount (DZD) |
|---|---|
| Storefront | 32,000 |
| Payment and delivery | 37,500 |
| Admin dashboard | 22,500 |
| Reliability and quality assurance | 8,000 |
| **Total** | **100,000** |

**Total amount: 100,000 DZD** for the full delivered scope described in Section 3.

---

## 6. Estimated monthly running costs (DZD)

> ⚠️ These figures depend on the DZD/USD exchange rate, which varies by market
> (official vs. parallel rate) — adjust them at the time of actual production
> launch. The services listed below all offer free tiers that are more than
> sufficient to start.

| Item | Estimate |
|---|---|
| Domain name (magieklayn.com) | ~2,000–5,000 DZD/year |
| Site hosting (Vercel) | 0 DZD to start (free tier); ~2,700 DZD/month if a paid tier becomes necessary |
| Database and authentication (Supabase) | 0 DZD to start; ~3,400 DZD/month at the paid tier |
| Image storage (Supabase Storage) | Negligible at this scale (a few hundred DZD/month) |
| Error monitoring (Sentry) | 0 DZD to start (free tier); paid tier only needed at high error volume |
| Yalidine courier, Telegram | No additional technical cost |

**Overall estimate: from 0 DZD/month at launch up to approximately 6,000–12,000
DZD/month** once paid tiers become necessary at greater scale.

---

## 7. Deliverables

- Access to the complete source code repository.
- The deployed platform: public storefront and admin dashboard.
- This document.

---

## 8. Sign-off

| | Developer | Client |
|---|---|---|
| Name | | |
| Date | | |
| Signature | | |
