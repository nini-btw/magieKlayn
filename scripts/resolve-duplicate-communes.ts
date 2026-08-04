// scripts/resolve-duplicate-communes.ts
import { deliveryZones } from "../src/infrastructure/db/schema"; // adjust to your schema import
import { eq } from "drizzle-orm";

const API_ID = process.env.YALIDINE_API_ID!;
const API_TOKEN = process.env.YALIDINE_API_TOKEN!;

// Aggressive normalize — used ONLY for grouping duplicates together.
// Collapses accents/case/spaces/hyphens/apostrophes so that "Hammam-Righa"
// and "Hammam Righa" are recognized as the same commune.
function normalize(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z]/g, "") // strip spaces, apostrophes, hyphens
    .toLowerCase();
}

// Strict normalize — accent-strip + trim only, preserves internal
// whitespace exactly. Used as the FIRST comparison pass so that a stray
// double-space typo (e.g. "Oued  Djer" vs "Oued Djer") is distinguishable
// instead of both collapsing to the same string.
function strictNormalize(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Light normalize — accent-strip + collapse internal whitespace + trim.
// Used only as a FALLBACK if the strict comparison above didn't produce
// a unique winner.
function lightNormalize(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\s+/g, " ")
    .trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fetch one page, with explicit handling for non-OK responses and 429s
// instead of assuming res.json().data always exists. Retries a 429 up to
// 3 times using the Retry-After header (falls back to 2s if absent).
async function fetchPage(page: number, attempt = 1): Promise<any> {
  const res = await fetch(
    `https://api.yalidine.app/v1/communes/?fields=name,wilaya_id&page=${page}&page_size=100`,
    { headers: { "X-API-ID": API_ID, "X-API-TOKEN": API_TOKEN } },
  );

  if (res.status === 429) {
    if (attempt > 3) {
      throw new Error(
        `Rate-limited (429) fetching page ${page} after 3 retries. Stop and check quota headers / wait before re-running.`,
      );
    }
    const retryAfter = Number(res.headers.get("Retry-After")) || 2;
    console.log(
      `⏳ 429 rate-limited on page ${page}, waiting ${retryAfter}s (attempt ${attempt}/3)...`,
    );
    await sleep(retryAfter * 1000);
    return fetchPage(page, attempt + 1);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Yalidine API error ${res.status} on page ${page}: ${body.slice(0, 500)}`,
    );
  }

  const json = await res.json();

  if (!Array.isArray(json?.data)) {
    throw new Error(
      `Unexpected response shape on page ${page} (status ${res.status}): ${JSON.stringify(json).slice(0, 500)}`,
    );
  }

  return json;
}

async function fetchAllCommunes() {
  let page = 1;
  const all: { name: string; wilaya_id: number }[] = [];
  while (true) {
    const json = await fetchPage(page);
    all.push(...json.data);
    console.log(
      `  fetched page ${page} (${json.data.length} communes, running total ${all.length})`,
    );
    if (!json.has_more) break;
    page++;
    // Small delay between pages so a 16-page loop can't burst past the
    // ~4-5 req/sec quota on its own, independent of anything else you've
    // run today.
    await sleep(300);
  }
  return all;
}

async function main() {
  // Import the db client here (inside the async function) instead of at
  // module top-level, so no top-level `await` is needed anywhere in the
  // file. This is what was tripping up esbuild/tsx under CJS output.
  const { db } = await import("../src/infrastructure/db/client");

  console.log("Fetching canonical commune list from Yalidine...");
  const canonical = await fetchAllCommunes();
  console.log(`Fetched ${canonical.length} canonical communes (expect ~1541).`);

  if (canonical.length < 1400) {
    throw new Error(
      `Canonical fetch looks incomplete (${canonical.length} communes, expected ~1541). ` +
        `Stopping before touching the DB — re-run once this looks right.`,
    );
  }

  // Map keyed by wilaya + aggressively-normalized name -> Yalidine's exact
  // spelling (accent-stripped, trimmed, internal whitespace untouched).
  // Scoped per-wilaya since commune names aren't globally unique.
  const canonicalByKey = new Map<string, string>();
  for (const c of canonical) {
    const key = `${c.wilaya_id}::${normalize(c.name)}`;
    canonicalByKey.set(key, strictNormalize(c.name));
  }

  const rows = await db.select().from(deliveryZones);

  // group by wilaya + normalized name (aggressive normalize, for grouping only)
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${Number(row.wilayaCode)}::${normalize(row.communeNameAscii)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const toDelete: typeof rows = [];
  for (const [key, group] of groups) {
    if (group.length < 2) continue;

    const canonicalStrict = canonicalByKey.get(key);
    if (!canonicalStrict) {
      console.log(
        `⚠ UNRESOLVED group (no canonical match found at all): ${key}`,
        group.map((r: { communeNameAscii: any }) => r.communeNameAscii),
      );
      continue;
    }

    // Pass 1: strict comparison (whitespace-preserving) — catches things
    // like double-space typos that a whitespace-collapsing compare would
    // hide.
    let winners = group.filter(
      (r: { communeNameAscii: string }) =>
        strictNormalize(r.communeNameAscii) === canonicalStrict,
    );

    // Pass 2: same, case-insensitive.
    if (winners.length !== 1) {
      winners = group.filter(
        (r: { communeNameAscii: string }) =>
          strictNormalize(r.communeNameAscii).toLowerCase() ===
          canonicalStrict.toLowerCase(),
      );
    }

    // Pass 3: fall back to whitespace-collapsed comparison.
    if (winners.length !== 1) {
      const canonicalLight = lightNormalize(canonicalStrict);
      winners = group.filter(
        (r: { communeNameAscii: string }) =>
          lightNormalize(r.communeNameAscii) === canonicalLight,
      );
    }

    // Pass 4: whitespace-collapsed, case-insensitive.
    if (winners.length !== 1) {
      const canonicalLight = lightNormalize(canonicalStrict).toLowerCase();
      winners = group.filter(
        (r: { communeNameAscii: string }) =>
          lightNormalize(r.communeNameAscii).toLowerCase() === canonicalLight,
      );
    }

    if (winners.length === 1) {
      const winnerId = winners[0].id;
      const losers = group.filter((r: { id: any }) => r.id !== winnerId);
      toDelete.push(...losers);
    } else {
      console.log(
        `⚠ UNRESOLVED group (needs manual review): ${key} | canonical: "${canonicalStrict}"`,
        group.map((r: { communeNameAscii: any }) => r.communeNameAscii),
      );
    }
  }

  console.log(`\nFound ${toDelete.length} stale row(s) to delete:`);
  toDelete.forEach(
    (r: {
      wilayaCode: any;
      communeNameAscii: any;
      stopDeskFee: any;
      homeFee: any;
    }) =>
      console.log(
        `  ${r.wilayaCode} | ${r.communeNameAscii} (${r.stopDeskFee}/${r.homeFee})`,
      ),
  );

  if (!process.argv.includes("--delete")) {
    console.log(
      "\nDry run only — no deletes performed. Re-run with --delete to actually remove these rows.",
    );
    return;
  }

  console.log(`\nDeleting ${toDelete.length} row(s)...`);
  for (const row of toDelete) {
    await db.delete(deliveryZones).where(eq(deliveryZones.id, row.id));
  }
  console.log(`✓ Deleted ${toDelete.length} row(s).`);
}

main().catch((err) => {
  console.error("\n✗ Script aborted:", err.message ?? err);
  console.error("No further rows were touched beyond what was logged above.");
  process.exit(1);
});
