---
# Magie Klayn — Portfolio Entry

## Card Preview
**Short Description:** Trilingual fragrance storefront with automatic Algeria courier delivery pricing and instant owner order alerts.

## Project Story

### The Problem
A small perfume boutique owner running her brand out of Oran and Algiers was taking every order manually through Instagram comments and WhatsApp messages, then separately calling a courier to arrange cash-on-delivery shipping across Algeria's 58 provinces. Every order meant cross-referencing delivery fees by hand, re-typing customer details into the courier's own system, and hoping nothing got lost across four different tools — with no single record of what was ordered, by whom, or where it stood.

### The Outcome
The storefront now handles browsing, account-free checkout, wilaya/commune-aware delivery pricing, and automatic courier parcel creation in one flow — reducing what was a multi-tool, multi-step manual process per order down to a single customer-facing form, with the store owner alerted on Telegram the instant an order lands instead of having to watch an inbox.

### Key Achievement
Server-side order creation independently recomputes delivery fees and gift-packaging charges rather than trusting client input, while courier-shipment creation and owner notifications run fire-and-forget so a slow or failing third-party API can never block a customer's checkout.

### Why Not Something Else?
Mainstream platforms like Shopify handle storefront and admin well but have no native fit for Algeria-specific courier logistics (wilaya/commune fee lookups, stop-desk pickup points, COD parcel creation) without custom app development on top of a recurring subscription. A manual Google Sheets + Instagram DM workflow costs nothing but has no automatic pricing and real per-order error risk once volume grows past a handful a week. This project sits deliberately in between: purpose-built for one brand's exact delivery landscape, without the overhead of a general-purpose platform it doesn't need.

## Project Details
| Field        | Value                          |
|--------------|--------------------------------|
| Category     | full-stack |
| My Role      | Solo Developer — Full-Stack    |
| Duration     | ~5 weeks                    |
| Featured     | Yes                     |

## Tech Stack
Next.js, React, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Supabase (Auth, Storage), Redux Toolkit, next-intl, React Hook Form, Zod, Framer Motion, Sentry, bcryptjs, next-swagger-doc, swagger-ui-react, Yalidine courier API (custom client), Telegram Bot API

## Links
- Live: https://magie-klayn.vercel.app
- GitHub: https://github.com/nini-btw/magieKlayn
---

## Sanity JSON
```json
{
  "title": "Magie Klayn",
  "slug": { "current": "magie-klayn" },
  "featured": true,
  "category": "full-stack",
  "shortDescription": "Trilingual fragrance storefront with automatic Algeria courier delivery pricing and instant owner order alerts.",
  "problem": "A small perfume boutique owner running her brand out of Oran and Algiers was taking every order manually through Instagram comments and WhatsApp messages, then separately calling a courier to arrange cash-on-delivery shipping across Algeria's 58 provinces. Every order meant cross-referencing delivery fees by hand, re-typing customer details into the courier's own system, and hoping nothing got lost across four different tools — with no single record of what was ordered, by whom, or where it stood.",
  "myRole": "Solo Developer — Full-Stack",
  "duration": "~5 weeks",
  "outcome": "The storefront now handles browsing, account-free checkout, wilaya/commune-aware delivery pricing, and automatic courier parcel creation in one flow — reducing what was a multi-tool, multi-step manual process per order down to a single customer-facing form, with the store owner alerted on Telegram the instant an order lands instead of having to watch an inbox.",
  "keyAchievement": "Server-side order creation independently recomputes delivery fees and gift-packaging charges rather than trusting client input, while courier-shipment creation and owner notifications run fire-and-forget so a slow or failing third-party API can never block a customer's checkout.",
  "techStack": [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "Drizzle ORM",
    "PostgreSQL",
    "Supabase Auth",
    "Supabase Storage",
    "Redux Toolkit",
    "next-intl",
    "React Hook Form",
    "Zod",
    "Framer Motion",
    "Sentry",
    "bcryptjs",
    "next-swagger-doc",
    "swagger-ui-react",
    "Yalidine API",
    "Telegram Bot API"
  ],
  "liveUrl": "https://magie-klayn.vercel.app",
  "githubUrl": "https://github.com/nini-btw/magieKlayn"
}
```
