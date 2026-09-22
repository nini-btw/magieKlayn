# Yalidine Integration Guide (Portable Reference)

> **Purpose of this document**: a standalone, project-agnostic guide to integrating the Yalidine delivery
> API into *any* web project — regardless of database, framework, or language — written by extracting the
> patterns, endpoints, and hard-won lessons discovered while building this integration into Magie Klayn
> (Next.js / Drizzle / Postgres). Nothing here depends on that stack; where this repo's actual code is a
> useful worked example, it's cited by path in [§15](#15-reference-implementation-map) rather than pasted
> verbatim. Read this once, and you shouldn't have to re-discover any of it on the next project.

## Table of contents

1. [What is Yalidine](#1-what-is-yalidine)
2. [Prerequisites / account setup](#2-prerequisites--account-setup)
3. [Environment variables](#3-environment-variables)
4. [HTTP client design](#4-http-client-design-portable-framework-free)
5. [API endpoint reference](#5-api-endpoint-reference)
6. [Data model / caching pattern](#6-data-model--caching-pattern)
7. [Zone sync scripts](#7-zone-sync-scripts)
8. [Checkout integration flow](#8-checkout-integration-flow)
9. [Stop-desk resolution strategies](#9-stop-desk-resolution-strategies)
10. [Parcel creation](#10-parcel-creation)
11. [Known gotchas / hard-won lessons](#11-known-gotchas--hard-won-lessons)
12. [Fee calculation flow](#12-fee-calculation-flow)
13. [Testing / smoke-test scripts](#13-testing--smoke-test-scripts)
14. [Porting checklist](#14-porting-checklist)
15. [Reference implementation map](#15-reference-implementation-map)

---

## 1. What is Yalidine

[Yalidine](https://yalidine.com) is Algeria's dominant last-mile courier and the de-facto standard for
e-commerce delivery there. There is **no official SDK** — every integration is a hand-rolled HTTP client
against their REST API. Key domain concepts:

- **Wilaya** — one of Algeria's 58 provinces (numbered 1–58).
- **Commune** — a municipality within a wilaya. Yalidine's fee/deliverability data is granular to the
  commune level, not just the wilaya.
- **Stop-desk delivery** — the customer picks up their parcel at a physical Yalidine center. Cheaper than
  home delivery, but only available in communes that actually host a center.
- **Home delivery** — door-to-door, priced per commune, generally more expensive than stop-desk.
- **COD (cash on delivery)** — Yalidine collects payment from the customer on the courier's behalf and
  remits it to you; there is no separate payment gateway integration needed for COD-only storefronts.
- Fees and deliverability are asymmetric by **origin** wilaya — the price and even whether a route is
  deliverable at all depends on where you're shipping *from*, not just to.

## 2. Prerequisites / account setup

1. Register a Yalidine merchant account and obtain an **API ID** and **API token** from their dashboard.
2. Note your API **base URL** (Yalidine's production API root, e.g. `https://api.yalidine.app/v1`).
3. Understand their **rate limits** up front — every response carries quota headers:
   - `second-quota-left`, `minute-quota-left`, `hour-quota-left`, `day-quota-left`
   - Practical limits observed: roughly 4–5 requests/second is safe; bursts risk a `429`.
4. Understand `is_deliverable` — both wilayas and communes carry a `0`/`1` deliverability flag. Filter on
   this before showing a destination as selectable; a "valid-looking" wilaya/commune can still be
   non-deliverable.
5. Understand that **stop-desk centers are a separate resource from communes** — a commune having
   `has_stop_desk: 1` in the commune list does not by itself give you a center ID; you still need to call
   the centers endpoint to get actual, bookable `center_id`s.

## 3. Environment variables

| Variable | Purpose | Default | Required |
|---|---|---|---|
| `YALIDINE_API_BASE_URL` | Root URL for all API calls | — | Yes |
| `YALIDINE_API_ID` | Sent as the `X-API-ID` header | — | Yes |
| `YALIDINE_API_TOKEN` | Sent as the `X-API-TOKEN` header | — | Yes |
| `YALIDINE_ENABLED` | Master feature gate for **parcel creation only** (recommended pattern below) | unset (disabled) | No |
| `YALIDINE_DEFAULT_ORIGIN_WILAYA_ID` | Default ship-from wilaya, for multi-warehouse setups | your main warehouse | No |
| `YALIDINE_OVERRIDE_ORIGIN_WILAYA_ID` | Alternate ship-from wilaya | your secondary warehouse | No |
| `YALIDINE_OVERRIDE_DESTINATION_IDS` | Comma-separated destination wilaya IDs that should ship from the override origin instead of the default | empty (inert) | No |

**Recommended gating pattern**: gate *parcel creation* (the mutating, revenue-affecting call) behind a
boolean flag like `YALIDINE_ENABLED`, but let read-only lookups (wilayas, communes, fees, centers) run
unconditionally wherever they're needed for checkout UI. That way you can build and test the entire
checkout experience — including live stop-desk center selection — before you're ready to actually create
real parcels in production. Don't make the read-only routes depend on the same flag as parcel creation;
they serve different purposes and disabling one shouldn't silently break the other.

**Multi-warehouse routing** (origin override vars): if you ship from more than one location, you can encode
a simple rule — "ship to these specific destination wilayas from warehouse B, everything else from
warehouse A" — via an env-configured set of destination IDs, rather than hardcoding routing logic. Keep
this simple (a flat allow-list) unless you have a genuine need for per-commune routing; a full routing
table is usually not worth the complexity for two warehouses.

## 4. HTTP client design (portable, framework-free)

Build a single, dependency-free client class wrapping `fetch`. Nothing below needs a framework — put it in
its own module with zero framework imports so it's trivially portable.

**Auth headers**, on every request:

```
X-API-ID: <your API ID>
X-API-TOKEN: <your API token>
Content-Type: application/json   (only when sending a body)
```

**Design requirements**:

- **Preemptive rate-limit throttling.** Don't wait for a `429` to slow down — read the
  `minute-quota-left` header from each response, and if it drops to a small threshold (e.g. ≤5), sleep
  proactively (e.g. 60s) before firing the next request. Reactive-only 429 handling still works but wastes
  requests and adds latency spikes; preemptive throttling is smoother in bulk operations like a zone sync
  that fires 58 sequential requests.
- **Reactive 429 handling** as a backstop: read the `Retry-After` header (default to a couple of seconds if
  absent), sleep, retry, up to a capped number of attempts (e.g. 3), then give up with a clear error.
- **Timeouts.** Use `AbortController` to cap each individual request (e.g. 8s) — a hung Yalidine call
  should never hang your checkout request indefinitely.
- **Timeout retries** with linear or exponential backoff (e.g. `1000ms * attemptNumber`), separate from the
  429 retry path.
- **Non-OK, non-429 responses** should throw immediately with the status code and response body included in
  the error message — don't swallow the response text, you'll want it for debugging bad payloads.

```typescript
// yalidine-client.ts — framework-free, portable

const BASE_URL = process.env.YALIDINE_API_BASE_URL!;
const API_ID = process.env.YALIDINE_API_ID!;
const API_TOKEN = process.env.YALIDINE_API_TOKEN!;

const TIMEOUT_MS = 8000;
const MAX_RETRIES = 3;

class YalidineClient {
  private lastMinuteQuota: number | null = null;

  private async request<T>(path: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<T> {
    // Preemptive throttle: if we're nearly out of per-minute quota, wait it out up front.
    if (this.lastMinuteQuota !== null && this.lastMinuteQuota <= 5) {
      await sleep(60_000);
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch(`${BASE_URL}${path}`, {
          method,
          signal: controller.signal,
          headers: {
            "X-API-ID": API_ID,
            "X-API-TOKEN": API_TOKEN,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        clearTimeout(timer);

        this.logQuota(res.headers);

        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
          await sleep(retryAfter * 1000);
          continue; // retry
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Yalidine API error ${res.status}: ${text}`);
        }

        return (await res.json()) as T;
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === "AbortError" && attempt < MAX_RETRIES) {
          await sleep(1000 * attempt);
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Yalidine rate-limited after ${MAX_RETRIES} retries`);
  }

  private logQuota(headers: Headers) {
    const minute = headers.get("minute-quota-left");
    if (minute !== null) this.lastMinuteQuota = Number(minute);
    // Optionally log second/hour/day quota too for visibility during bulk operations.
  }

  getWilayas() {
    return this.request<YalidineListResponse<YalidineWilaya>>("/wilayas/");
  }

  getCommunesByWilaya(wilayaId: number) {
    return this.request<YalidineListResponse<YalidineCommune>>(`/communes/?wilaya_id=${wilayaId}`);
  }

  getFees(fromWilayaId: number, toWilayaId: number) {
    return this.request<YalidineFeeResponse>(`/fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`);
  }

  getCenters(wilayaId: number) {
    return this.request<YalidineListResponse<YalidineCenter>>(`/centers/?wilaya_id=${wilayaId}`);
  }

  createParcels(parcels: YalidineCreateParcelPayload[]) {
    return this.request<YalidineCreateParcelResponse>("/parcels/", "POST", parcels);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const yalidineClient = new YalidineClient();
```

Export a single module-level singleton (`yalidineClient`) rather than instantiating the class per-call —
this keeps the quota-tracking state (`lastMinuteQuota`) meaningful across requests within one process.

## 5. API endpoint reference

| Endpoint | Method | Query / body | Returns |
|---|---|---|---|
| `/wilayas/` | GET | — | List of wilayas |
| `/communes/` | GET | `?wilaya_id=<id>` | List of communes in that wilaya |
| `/fees/` | GET | `?from_wilaya_id=<id>&to_wilaya_id=<id>` | Fee breakdown per commune for that origin→destination pair |
| `/centers/` | GET | `?wilaya_id=<id>` | List of stop-desk centers in that wilaya |
| `/parcels/` | POST | array of parcel objects | Map of results keyed by the `order_id` you supplied |

### Response shapes

List endpoints (`/wilayas/`, `/communes/`, `/centers/`) share an envelope:

```typescript
interface YalidineListResponse<T> {
  has_more: boolean;
  total_data: number;
  data: T[];
  links: { self: string };
}

interface YalidineWilaya {
  id: number;
  name: string;
  zone: number;
  is_deliverable: 0 | 1;
}

interface YalidineCommune {
  id: number;
  name: string;
  wilaya_id: number;
  wilaya_name: string;
  has_stop_desk: 0 | 1;
  is_deliverable: 0 | 1;
  delivery_time_parcel: number;
  delivery_time_payment: number;
}

interface YalidineCenter {
  center_id: number;
  name: string;
  address: string;
  gps: string;
  commune_id: number;
  commune_name: string;
  wilaya_id: number;
  wilaya_name: string;
}
```

`/fees/` has its own shape — note fees are broken down **per commune**, keyed by commune ID as an object,
not an array:

```typescript
interface YalidineCommuneFee {
  commune_id: number;
  commune_name: string;
  express_home: number | null;   // null = home delivery not offered to this commune
  express_desk: number | null;   // null = no stop-desk fee tier (see gotcha below)
  economic_home: number | null;  // observed to always be null in practice
  economic_desk: number | null;
}

interface YalidineFeeResponse {
  from_wilaya_name: string;
  to_wilaya_name: string;
  zone: number;
  retour_fee: number;
  cod_percentage: number;
  insurance_percentage: number;
  oversize_fee: number;
  per_commune: Record<string, YalidineCommuneFee>; // keyed by commune_id as a string
}
```

### `POST /parcels/` payload

Sent as an **array** — you can batch multiple parcels in one call:

```typescript
interface YalidineCreateParcelPayload {
  order_id: string;          // YOUR order id — becomes the key in the response
  from_wilaya_name: string;
  firstname: string;
  familyname: string;
  contact_phone: string;
  address: string;
  to_commune_name: string;   // see gotcha: must match the STOP-DESK CENTER's commune, not the customer's
  to_wilaya_name: string;
  product_list: string;      // free-text description, e.g. "Product A x2, Product B x1"
  price: number;              // COD amount — see gotcha: excludes delivery fee
  do_insurance: boolean;
  declared_value: number;
  length?: number;            // cm — documented as "Required" by Yalidine; see oversize gotcha
  width?: number;
  height?: number;
  weight?: number;            // kg
  freeshipping: boolean;
  is_stopdesk: boolean;
  stopdesk_id?: number;       // required when is_stopdesk is true
  has_exchange: boolean;
  product_to_collect?: string | null;
}
```

### `POST /parcels/` response

```typescript
interface YalidineCreateParcelResult {
  success: boolean;
  order_id: string;
  tracking: string;
  import_id: number;
  label: string;
  labels: string[];
  message: string;
}

// KEYED BY order_id, NOT an array — index it as response[myOrderId], not response[0].
type YalidineCreateParcelResponse = Record<string, YalidineCreateParcelResult>;
```

## 6. Data model / caching pattern

**Don't call Yalidine live for every checkout pageview.** Fee and deliverability data changes rarely
(weeks/months), while checkout gets hit constantly — calling `/fees/` per pageview is both slow (network
round trip to a third party) and wasteful of your rate-limit quota. Instead:

- **Cache wilayas/communes/fees** into your own table, refreshed periodically by an offline sync script
  (§7). Read from this table on every checkout page load — it's just a local DB read, no latency or quota
  concerns.
- **Fetch stop-desk centers live**, uncached. Centers open/close more unpredictably than fee tiers, there
  are far fewer of them per wilaya (a live call is cheap), and serving a stale/closed center to a customer
  is a much worse failure mode than serving a slightly stale fee.

### Suggested cache table schema (generalize to your own DB/ORM)

```sql
CREATE TABLE delivery_zones (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya_code          VARCHAR(2)   NOT NULL,
  wilaya_name_ascii     VARCHAR(255) NOT NULL,  -- diacritic-stripped, for matching
  wilaya_name           VARCHAR(255) NOT NULL,  -- original spelling, for display
  commune_name_ascii    VARCHAR(255) NOT NULL,
  commune_name          VARCHAR(255) NOT NULL,
  stop_desk_fee         INTEGER      NOT NULL,
  home_fee              INTEGER      NOT NULL,
  has_stop_desk         BOOLEAN      NOT NULL DEFAULT true,
  has_home_delivery     BOOLEAN      NOT NULL DEFAULT true,

  UNIQUE (wilaya_code, commune_name_ascii)
);
CREATE INDEX idx_delivery_zones_wilaya_code ON delivery_zones (wilaya_code);
```

Notes:

- **No Yalidine `commune_id` column.** Yalidine's commune IDs aren't stable identifiers you should build
  foreign keys against across syncs in practice — name-based matching (ASCII-normalized) turned out to be
  the practical approach, since the fee endpoint and the centers endpoint don't share a clean joinable key
  and commune IDs have been observed to be inconsistent between endpoints/over time. If you find Yalidine's
  IDs reliable for your use case, prefer them — but budget for a name-matching fallback regardless, because
  you'll need it for the stop-desk resolution case in §9.
- **ASCII normalization convention**: strip diacritics for matching, keep the original for display.
  ```typescript
  function toAscii(input: string): string {
    return input
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();
  }
  ```
  This turns `"Béjaïa"` into `"Bejaia"` so that lookups are insensitive to accent variations that creep in
  from different data entry points.
- **Unique key**: `(wilaya_code, commune_name_ascii)` — this is your upsert conflict target when syncing.
- **Fee fields**: map Yalidine's `express_desk` → `stop_desk_fee`, `express_home` → `home_fee`. Derive
  `has_stop_desk`/`has_home_delivery` from whether those fields are non-null, not from a separate flag.
  Watch for `economic_home`/`economic_desk` ever being non-null — see [§11](#11-known-gotchas--hard-won-lessons).

## 7. Zone sync scripts

Structure your sync tooling as **three separate scripts** sharing one fetch/shape function, so dry-run and
write-mode are guaranteed to see identical input data (a shared helper prevents "the dry run showed X but
the write did Y" bugs from drifting):

### Shared fetch logic

```typescript
const THROTTLE_MS = 300; // stay comfortably under quota when hitting 58 wilayas sequentially

async function fetchCandidateRows(wilayaFilter?: number[]) {
  const candidateRows = [];
  const errors = [];
  const skippedWilayas = [];

  const { data: wilayas } = await yalidineClient.getWilayas();
  const deliverable = wilayas.filter(
    (w) => w.is_deliverable === 1 && (!wilayaFilter || wilayaFilter.includes(w.id))
  );

  for (const wilaya of deliverable) {
    try {
      const originId = getOriginWilayaId(wilaya.id); // your multi-warehouse routing, if any
      const feeRes = await yalidineClient.getFees(originId, wilaya.id);

      for (const fee of Object.values(feeRes.per_commune)) {
        candidateRows.push({
          wilayaCode: String(wilaya.id).padStart(2, "0"),
          wilayaNameAscii: toAscii(wilaya.name),
          wilayaName: wilaya.name,
          communeNameAscii: toAscii(fee.commune_name),
          communeName: fee.commune_name,
          stopDeskFee: fee.express_desk,
          homeFee: fee.express_home,
          hasStopDesk: fee.express_desk !== null,
          hasHomeDelivery: fee.express_home !== null,
        });

        if (fee.economic_home !== null || fee.economic_desk !== null) {
          console.warn(`Unexpected economic-tier fee for commune ${fee.commune_name} — schema assumes express-only`);
        }
      }
    } catch (err) {
      errors.push({ wilaya, error: err });
    }

    await sleep(THROTTLE_MS);
  }

  return { candidateRows, errors, skippedWilayas };
}
```

### Script 1 — dry run (no writes, ever)

- Usage: `sync-zones --wilayas=16,31` (optional scope filter, else all wilayas).
- Calls `fetchCandidateRows`, loads existing cache rows for the touched wilayas, and diffs by the
  `(wilayaCode, communeNameAscii)` key into **NEW** / **CHANGED** (any fee or flag differs) / **UNCHANGED**.
- For a full (unfiltered) run, also detect cache rows **not** returned by Yalidine this time — write them
  to an `orphan-communes.json` report for manual review. **Never auto-delete** — a transient API hiccup or
  a genuinely temporary deliverability gap shouldn't silently erase pricing data your checkout depends on.
- Prints a summary; touches nothing in the database.

### Script 2 — write mode

- Usage: `sync-zones-write --wilayas=16 --write --yes` (`--write` actually persists; without it, behaves
  like the dry run. `--yes` skips an interactive typed confirmation — needed for CI/non-interactive runs).
- Wrap the whole batch in a **single transaction** — full rollback on any failure, no partial writes
  left half-applied.
- Chunk large batches (e.g. 200 rows per insert) to avoid oversized single statements.
- **Upsert**, don't insert-or-fail:
  ```sql
  INSERT INTO delivery_zones (wilaya_code, wilaya_name_ascii, wilaya_name, commune_name_ascii, commune_name, stop_desk_fee, home_fee, has_stop_desk, has_home_delivery)
  VALUES (...)
  ON CONFLICT (wilaya_code, commune_name_ascii)
  DO UPDATE SET
    wilaya_name_ascii = EXCLUDED.wilaya_name_ascii,
    wilaya_name = EXCLUDED.wilaya_name,
    commune_name = EXCLUDED.commune_name,
    stop_desk_fee = EXCLUDED.stop_desk_fee,
    home_fee = EXCLUDED.home_fee,
    has_stop_desk = EXCLUDED.has_stop_desk,
    has_home_delivery = EXCLUDED.has_home_delivery;
  ```
- Never truncates the table; rows absent from this run's Yalidine response are left untouched (paired with
  script 1's orphan report for a human to act on).
- Recommend a full backup of the cache table before the very first real run against production data.

### Script 3 — canonical duplicate resolution (occasional maintenance, not routine sync)

Because commune names and matching are string-based, duplicates can accumulate over time (spelling
variants entering the cache from different sync runs, manual edits, etc.). A separate maintenance script:

1. Fetches Yalidine's full canonical commune list directly (paginated, same auth headers).
2. Sanity-checks the fetch returned a plausible total count before touching anything (guards against a
   partial/broken response being treated as authoritative).
3. Groups your cached rows by `(wilaya, aggressively-normalized commune name)` — strip accents, case,
   whitespace, hyphens, apostrophes — to surface likely duplicates.
4. Picks the row whose spelling matches Yalidine's canonical name as the "winner" (try a few match
   strictness levels, strictest first) and flags the rest for deletion.
5. Dry-run by default; require an explicit flag (e.g. `--delete`) to actually remove rows.

Run this occasionally as a hygiene pass, not as part of the regular sync cadence.

## 8. Checkout integration flow

Cascading selection, each level backed by a different data source:

```
1. Wilaya dropdown         ← your cached delivery_zones table (deduped by wilaya)
2. Commune dropdown        ← your cached delivery_zones table, filtered by chosen wilaya
3. Stop-desk centers list  ← LIVE call to Yalidine getCenters(wilayaId), independent of commune choice
4. Delivery type selection ← Stop Desk / Home / Store Pickup, shown conditionally
5. Fee display             ← from the cached zone row, per delivery type
```

Conditional visibility rules:

- **Stop Desk** — show only if the *live* centers call returned at least one center for this wilaya. Don't
  gate this on a cached `has_stop_desk` flag alone; that flag reflects fee-zone coverage, not whether an
  actual bookable center currently exists there.
- **Home** — show if the cached zone's `has_home_delivery` is true.
- **Store Pickup** (if you offer it) — a delivery type that bypasses Yalidine entirely; always free; only
  offer it for the specific origin locations you actually have physical pickup at.

**The critical trap**: once the customer picks a specific stop-desk center, capture and store **both** the
center's numeric ID *and its own commune name** — not the customer's delivery-address commune. These are
frequently different values (a center in commune A can be the nearest stop-desk for a customer who lives in
commune B), and Yalidine's parcel-creation API validates `to_commune_name` against the **center's**
commune, not the customer's address. Sending the customer's commune here produces a hard rejection at
parcel-creation time (`"stopdesk_id does not belong to to_commune_name"`), often long after checkout
already succeeded, since parcel creation happens server-side afterward. Store the pair explicitly at
selection time so you never have to reconstruct it later:

```typescript
interface DeliverySelection {
  zoneId: string;
  type: "stop_desk" | "home" | "store_pickup";
  fee: number;
  wilayaCode: string;
  wilayaName: string;
  communeName: string;            // customer's own commune
  stopdeskCenterId?: number;      // set only when type === "stop_desk"
  stopdeskCommuneName?: string;   // the CENTER's commune — required, not the customer's
}
```

A reasonable auto-selection UX (optional, but nice to have): once centers load for a chosen wilaya, default
to stop-desk if no type is picked yet, and default-select the center whose commune matches the wilaya's own
name (usually the "main" center) — customers can always override both.

## 9. Stop-desk resolution strategies

Two approaches, ranked by preference:

### (a) Preferred — capture the real center at checkout time

As described above: when the customer picks a center from the live `getCenters()` list, store its exact
`center_id` and `commune_name` on the order. At parcel-creation time, use these values directly — no
matching, no ambiguity, no failure mode beyond "the value we already validated at checkout." This should be
your only path for any new integration; only fall back to (b) for orders that predate this capture (e.g.
legacy data, or a first shipped version that only stored a commune name).

### (b) Fallback — fuzzy match by commune name

For records that only have a commune name (no captured center ID), resolve at parcel-creation time by
fetching centers for the wilaya and matching normalized commune names:

```typescript
function normalizeCommuneName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]+/g, " ");
}

async function resolveStopdeskId(wilayaId: number, communeName: string): Promise<number | null> {
  const { data: centers } = await yalidineClient.getCenters(wilayaId);
  const target = normalizeCommuneName(communeName);

  const match = centers.find((c) => normalizeCommuneName(c.commune_name) === target);
  if (!match) {
    console.warn(
      `No stop-desk center match for "${communeName}" in wilaya ${wilayaId}. Available: ${centers
        .map((c) => c.commune_name)
        .join(", ")}`
    );
    return null;
  }
  return match.center_id;
}
```

**Fail closed, not open**: if no confident match is found, return `null` and skip parcel creation for that
order rather than guessing — sending the wrong `stopdesk_id` produces a hard Yalidine rejection, and a
skipped parcel (visible in logs, fixable by hand) is a far better failure mode than a customer's parcel
routed to the wrong physical location.

## 10. Parcel creation

**Fire-and-forget, always.** Never let checkout success depend on Yalidine's availability. Create the order
in your own database first (that's the transaction that matters to the customer), then attempt Yalidine
parcel creation as a best-effort side effect that can fail silently (logged, not thrown) without affecting
the checkout response.

```typescript
async function createParcelForOrder(order: Order): Promise<void> {
  try {
    if (process.env.YALIDINE_ENABLED !== "true") return;
    if (order.deliveryType === "store_pickup") return;
    if (order.yalidineTracking) return; // idempotency — don't double-create

    if (!order.wilayaCode || !order.wilayaName || !order.communeName) {
      console.error(`Order ${order.id} missing delivery location fields — skipping parcel creation`);
      return;
    }

    const destWilayaId = Number(order.wilayaCode);
    const originWilayaId = getOriginWilayaId(destWilayaId);
    const originWilayaName = ORIGIN_WILAYA_NAMES[originWilayaId]; // your hardcoded {id: name} map

    const isStopdesk = order.deliveryType === "stop_desk";
    let stopdeskId: number | undefined;
    let toCommuneName = order.communeName;

    if (isStopdesk) {
      if (order.stopdeskCenterId && order.stopdeskCommuneName) {
        // preferred path — see §9(a)
        stopdeskId = order.stopdeskCenterId;
        toCommuneName = order.stopdeskCommuneName;
      } else {
        // fallback path — see §9(b)
        const resolved = await resolveStopdeskId(destWilayaId, order.communeName);
        if (resolved === null) {
          console.error(`Could not resolve stop-desk center for order ${order.id} — skipping`);
          return;
        }
        stopdeskId = resolved;
      }
    }

    // COD price EXCLUDES delivery fee — see gotcha in §11.
    const codPrice = order.totalAmount - (order.deliveryFee ?? 0);

    const payload: YalidineCreateParcelPayload = {
      order_id: order.id,
      from_wilaya_name: originWilayaName,
      firstname: order.firstName,
      familyname: order.lastName || "-",
      contact_phone: order.phone,
      address: toCommuneName,
      to_commune_name: toCommuneName,
      to_wilaya_name: order.wilayaName,
      product_list: order.items.map((i) => `${i.productName} x${i.quantity}`).join(", "),
      price: codPrice,
      do_insurance: false,
      declared_value: codPrice,
      freeshipping: false,
      is_stopdesk: isStopdesk,
      ...(stopdeskId ? { stopdesk_id: stopdeskId } : {}),
      has_exchange: false,
    };

    const result = await yalidineClient.createParcels([payload]);
    const entry = result[order.id]; // keyed by order_id — see §5

    if (!entry?.success || !entry.tracking) {
      console.error(`Yalidine parcel creation failed for order ${order.id}: ${entry?.message}`);
      return;
    }

    await saveTrackingNumber(order.id, entry.tracking);
    console.log(`Order ${order.id} → Yalidine tracking ${entry.tracking}`);
  } catch (err) {
    // Never throw — this must not break order creation.
    console.error(`Unexpected error creating Yalidine parcel for order ${order.id}:`, err);
  }
}
```

Call this **after** your own order-creation transaction commits, and `await` it if you want the log line
to land before the request returns — but never let its outcome affect the HTTP response you send the
customer.

**Limitation to plan around**: without a retry queue, a Yalidine outage at checkout time results in an
order with no tracking number and no automatic retry — someone has to notice (missing tracking numbers) and
create the parcel manually. If your order volume is high enough that this matters, add a background retry
job or an admin-visible "shipping pending" status rather than relying on manual log inspection.

## 11. Known gotchas / hard-won lessons

### COD `price` excludes the delivery fee

Yalidine's `price` field on parcel creation is the amount **collected from the customer on delivery** — and
it does **not** get delivery fee added on top by Yalidine. If your order total already includes the
delivery fee (as most checkout totals do), you must subtract it back out before sending:

```typescript
const codPrice = order.totalAmount - (order.deliveryFee ?? 0);
```

Sending the full total (including delivery fee) as `price` will double-charge the customer on delivery.
Confirm this against your own account with a real test parcel before trusting it blindly — behavior here
is not obviously documented and was only confirmed empirically.

### Parcel-creation response is a map, not an array

`POST /parcels/` accepts an **array** of parcels but returns a `Record<order_id, result>` — a common
mistake is to index the response positionally (`response[0]`) instead of by the `order_id` you supplied
(`response[myOrderId]`). Always index by key.

### Dynamic route folder casing must exactly match the destructured param

If you're building the delivery lookup routes in a file-based router (Next.js, etc.), the dynamic segment
folder name must match the parameter name you destructure in the handler, **case-sensitively**. A folder
named `[WilayaCode]` next to a handler destructuring `{ wilayaCode }` will silently produce a `400` for
every single request with no obvious error pointing at the mismatch — it just looks like "the code is
wrong" or "the param is always undefined." This is easy to introduce by copy-pasting a route folder and
renaming it inconsistently, and easy to miss because nothing throws — it just always fails validation.
Double check folder-name-vs-param-name casing is identical across every dynamic delivery route you add.

### Prefer preemptive throttling over reactive-only rate-limit handling

Waiting for `429`s before backing off works, but produces choppier bulk operations (a zone sync hitting all
58 wilayas sequentially will trip the limit repeatedly without preemptive throttling). Track the
`minute-quota-left` response header and throttle proactively before you run out — see §4.

### Unresolved: "parcel always shown as exceeding 5kg" oversize display

One integration hit a persistent issue where Yalidine's platform displayed every created parcel as
exceeding 5kg regardless of the declared `length`/`width`/`height`/`weight` values sent — inconsistent with
Yalidine's own documented billable-weight formula, `max(actual_weight, length × width × height × 0.0002)`.
The values sent were well under any threshold by that formula, yet the platform still flagged them as
oversize. As an unconfirmed workaround, omitting the `length`/`width`/`height`/`weight` fields from the
payload entirely was tried (despite Yalidine's docs listing them as "Required") — **this is a live
experiment, not a verified fix.** If you hit the same symptom, test both with and against your own account
before committing to either approach, and don't treat omission as a settled best practice from this
document alone.

### Server-side anti-tamper: recompute the delivery fee, don't trust the client's

A checkout request typically arrives with a client-computed `deliveryFee` value (matching what the UI
displayed). It's tempting to validate only its *shape* (a non-negative number) and store it as-is. Do more
than that: **recompute the fee server-side from your cached zone record** (`fee = zone.stopDeskFee` /
`zone.homeFee` / `0` depending on delivery type) and use that computed value, ignoring whatever the client
submitted. Otherwise a tampered request can submit an arbitrary fee for `home`/`stop_desk` orders, which
then flows into your order total and — if you compute the Yalidine COD price as `total - deliveryFee` (see
above) — into the actual amount collected on delivery. This is the same anti-tamper discipline you should
already be applying to line-item prices (re-fetch from your product catalog, never trust the client's
submitted price) and any order-level fee upsells — apply it here too, and don't special-case only the
"free" delivery type (e.g. store pickup) while leaving paid types unchecked.

### Economic-tier fees are effectively unused

`economic_home`/`economic_desk` exist in the fee response schema but have been observed to always be
`null` in practice — build your caching/display logic assuming express-tier only, and log a warning (don't
silently ignore) if you ever see a non-null value, since it would mean your assumption has changed.

## 12. Fee calculation flow

Four distinct places fees exist in the system — keep straight which one is authoritative for what:

```
Yalidine /fees/ (source of truth, changes rarely)
        │  synced periodically by offline script
        ▼
Cached delivery_zones table (your DB — what checkout actually reads)
        │  read at checkout, displayed to customer
        ▼
Client-side display (UI shows the fee, customer sees it before confirming)
        │  submitted back to server as part of the order payload
        ▼
Server-side enforcement (MUST recompute from cached zone — see gotcha above,
        do not trust the submitted value for paid delivery types)
        │  becomes order.deliveryFee, subtracted out of order.totalAmount
        ▼
Yalidine parcel `price` field = totalAmount - deliveryFee (COD amount actually collected)
```

The weak link, if you don't apply the anti-tamper fix in §11, is the jump from "client-side display" to
"server-side enforcement" — that's the one hop where a value should be recomputed rather than passed
through.

## 13. Testing / smoke-test scripts

Before wiring Yalidine into a live checkout flow, validate against your real account with small, disposable
scripts:

- **Connectivity check**: call `getWilayas()`, log the first few results. Confirms your credentials and
  base URL are correct before you build anything else on top.
- **Test parcel creation**: create exactly one real parcel with hardcoded, obviously-test data (a known
  wilaya/commune, a placeholder name/phone), and inspect the actual response — this is how you'll confirm
  things like the COD `price` behavior in §11 rather than trusting documentation alone. **Delete the test
  parcel afterward** via the parcel-deletion endpoint while it's still in a pre-shipped state — don't leave
  test data cluttering your live Yalidine dashboard.
- Run these as one-off scripts outside your main app (a `scripts/` directory, run manually), not as part of
  your test suite — they hit a real third-party account and cost real API quota/create real records.

## 14. Porting checklist

A condensed step-by-step for wiring Yalidine into a new project:

1. Get API ID/token/base URL from Yalidine; store as env vars (§3).
2. Build the framework-free HTTP client with preemptive throttling, retry/backoff, and timeouts (§4).
3. Define the wire-format types for wilayas, communes, fees, centers, and parcel create/response (§5).
4. Create your cache table (`delivery_zones` or equivalent) with the ASCII-normalized name columns and a
   `(wilaya_code, commune_name_ascii)` unique key (§6).
5. Write the three sync scripts: dry-run, write-mode (transactional, upsert, never-truncate), and an
   occasional duplicate-resolution maintenance script (§7).
6. Run the connectivity smoke test (§13) before building UI on top.
7. Build the cascading checkout UI: wilaya → commune (cached) → stop-desk centers (live) → delivery type →
   fee display (§8). Capture the exact center ID + its own commune name when stop-desk is chosen, not just
   the customer's commune.
8. Implement fire-and-forget parcel creation, called after your own order transaction commits, with
   idempotency (skip if a tracking number already exists) and a master `YALIDINE_ENABLED` gate around only
   the mutating call (§10).
9. Apply the server-side fee anti-tamper fix: recompute `deliveryFee` from the cached zone rather than
   trusting the client submission (§11).
10. Run one real test parcel creation, delete it afterward, confirm the COD `price` behavior matches your
    assumption (§11, §13).
11. Decide, deliberately, what your failure-visibility story is for silently-failed parcels (missing
    tracking numbers) — at minimum, a periodic query for orders with `deliveryType != store_pickup AND
    yalidineTracking IS NULL` past some age threshold; ideally a retry job or admin alert.

## 15. Reference implementation map

A working example of every pattern above exists in this repository (Magie Klayn). Framework/DB specifics
(Next.js route handlers, Drizzle ORM) are project-specific — treat these as one worked example, not the
only correct shape.

| Concept | File in this repo |
|---|---|
| HTTP client | `src/infrastructure/yalidine/client.ts` |
| Origin-wilaya routing / weight helpers | `src/infrastructure/yalidine/config.ts` |
| Wire-format types | `src/infrastructure/yalidine/types.ts` |
| Fuzzy stop-desk fallback resolver | `src/infrastructure/yalidine/stopdesk-resolver.ts` |
| Shared zone-sync fetch logic | `src/infrastructure/yalidine/zone-sync-helpers.ts` |
| Fire-and-forget parcel creation | `scripts/create-parcel.ts` |
| Zone sync — dry run | `scripts/sync-zones.ts` |
| Zone sync — write mode | `scripts/sync-zones-write.ts` |
| Duplicate commune cleanup | `scripts/resolve-duplicate-communes.ts` |
| Connectivity smoke test | `scripts/test-yalidine.ts` |
| Test parcel creation | `scripts/test-create-parcel.ts` |
| Cache table + order columns | `src/infrastructure/db/schema.ts` (`deliveryZones`, `orders`) |
| DB read repository | `src/infrastructure/db/delivery.adapter.ts` |
| Public delivery lookup API routes | `app/api/delivery/wilayas/route.ts`, `app/api/delivery/communes/[wilayaCode]/route.ts`, `app/api/delivery/stopdesk-centers/[wilayaCode]/route.ts` |
| Order-creation route (fee anti-tamper) | `app/api/orders/route.ts` |
| Domain types + fee helper | `src/domain/entities/delivery.ts` |
| Checkout cascading UI | `src/presentation/components/features/WilayaCommuneSelect.tsx` |

This project's own `PROJECT_DOCUMENTATION.md` (§1, §3, §6, §7, §8, §15, §19, §20) also documents this
integration from the "current state of this specific app" angle, if you want the narrower, project-bound
version alongside this portable one.
