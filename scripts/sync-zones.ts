/**
 * Phase 2 — Yalidine zone sync (DRY RUN ONLY)
 * @module scripts/sync-zones
 *
 * Fetches live wilaya + fee data from Yalidine and prints a diff against
 * the current `delivery_zones` table. Writes NOTHING to the database.
 *
 * Per the integration plan's non-negotiable rule: this script must be run
 * and its output manually reviewed before any write-mode version is built.
 *
 * Usage:
 *   npx tsx scripts/sync-zones.ts
 *
 * Optional: limit to specific wilaya IDs for a faster/smaller test run:
 *   npx tsx scripts/sync-zones.ts --wilayas=16,31
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
// NOTE: `db`, `deliveryZones`, `yalidineClient`, `getOriginWilayaId` are
// imported dynamically INSIDE main(), after loadEnv() runs. A normal
// top-of-file `import` statement is hoisted by JS regardless of where it's
// written in the file, so if db/client.ts or yalidine/client.ts read
// process.env.* at module-load time, a static import here would run
// BEFORE .env.local is loaded, silently producing an unconfigured client.
// This was almost certainly the actual cause of the earlier "no output"
// run — the script likely crashed (or the DB client hung on an undefined
// connection string) before reaching the first console.log.
import { inArray } from "drizzle-orm";
import type { YalidineCommuneFee } from "../src/infrastructure/yalidine/types";

// Quota is ~4-5 req/sec — stay safely under that between calls.
const THROTTLE_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strips diacritics for the *Ascii columns, e.g. "Béjaïa" -> "Bejaia".
 * Review output against existing seeded data — automated deaccenting can
 * occasionally diverge from how names were originally entered.
 */
function toAscii(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "'"); // keep apostrophes as-is
}

interface CandidateRow {
  wilayaCode: string;
  wilayaNameAscii: string;
  wilayaName: string;
  communeNameAscii: string;
  communeName: string;
  stopDeskFee: number | null;
  homeFee: number | null;
  hasStopDesk: boolean;
  hasHomeDelivery: boolean;
}

function parseWilayaFilter(): number[] | null {
  const arg = process.argv.find((a) => a.startsWith("--wilayas="));
  if (!arg) return null;
  return arg
    .replace("--wilayas=", "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n));
}

async function main() {
  // Load .env.local FIRST, before anything else touches process.env.
  loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

  console.log("[sync-zones] booting...");
  console.log(
    `[sync-zones] env check — YALIDINE_API_ID present: ${Boolean(process.env.YALIDINE_API_ID)}`,
  );
  console.log(
    `[sync-zones] env check — DATABASE_URL present: ${Boolean(
      process.env.DATABASE_URL || process.env.POSTGRES_URL,
    )}`,
  );

  if (!process.env.YALIDINE_API_ID || !process.env.YALIDINE_API_TOKEN) {
    console.error(
      "\n✗ Missing YALIDINE_API_ID / YALIDINE_API_TOKEN after loading .env.local.\n" +
        "  Check that .env.local exists in the project root and contains these keys.",
    );
    process.exit(1);
  }

  // Dynamic imports — deferred until AFTER env vars are loaded above.
  const { db } = await import("../src/infrastructure/db/client");
  const { deliveryZones } = await import("../src/infrastructure/db/schema");
  const { yalidineClient } =
    await import("../src/infrastructure/yalidine/client");
  const { getOriginWilayaId } =
    await import("../src/infrastructure/yalidine/config");

  console.log("=== Yalidine Zone Sync — DRY RUN (no writes) ===\n");

  const wilayaFilter = parseWilayaFilter();
  if (wilayaFilter) {
    console.log(`Limiting run to wilayas: ${wilayaFilter.join(", ")}\n`);
  }

  // 1. Fetch all wilayas, filter to deliverable ones only
  const wilayasRes = await yalidineClient.getWilayas();
  let wilayas = wilayasRes.data.filter((w) => w.is_deliverable === 1);

  if (wilayaFilter) {
    wilayas = wilayas.filter((w) => wilayaFilter.includes(w.id));
  }

  const skipped = wilayasRes.data.filter((w) => w.is_deliverable === 0);
  if (skipped.length > 0) {
    console.log(
      `Skipping ${skipped.length} non-deliverable wilaya(s): ${skipped
        .map((w) => `${w.id} (${w.name})`)
        .join(", ")}\n`,
    );
  }

  console.log(`Fetching fees for ${wilayas.length} wilaya(s)...\n`);

  const candidateRows: CandidateRow[] = [];
  const errors: { wilayaId: number; wilayaName: string; error: string }[] = [];

  // 2. Fetch fees per wilaya, throttled
  for (const wilaya of wilayas) {
    const originId = getOriginWilayaId(wilaya.id);

    try {
      const feeRes = await yalidineClient.getFees(originId, wilaya.id);

      const communeFees = Object.values(
        feeRes.per_commune,
      ) as YalidineCommuneFee[];

      for (const fee of communeFees) {
        candidateRows.push({
          wilayaCode: String(wilaya.id).padStart(2, "0"),
          wilayaNameAscii: toAscii(feeRes.to_wilaya_name),
          wilayaName: feeRes.to_wilaya_name,
          communeNameAscii: toAscii(fee.commune_name),
          communeName: fee.commune_name,
          stopDeskFee: fee.express_desk,
          homeFee: fee.express_home,
          hasStopDesk: fee.express_desk !== null,
          hasHomeDelivery: fee.express_home !== null,
        });

        // Flag if economic tier ever shows up — plan currently assumes express-only
        if (fee.economic_home !== null || fee.economic_desk !== null) {
          console.warn(
            `⚠ Economic tier detected for ${fee.commune_name} (wilaya ${wilaya.id}) — ` +
              `plan currently assumes express-only. Re-evaluate schema decision.`,
          );
        }
      }
    } catch (err) {
      errors.push({
        wilayaId: wilaya.id,
        wilayaName: wilaya.name,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(
        `✗ Failed to fetch fees for wilaya ${wilaya.id} (${wilaya.name}):`,
        err,
      );
    }

    await sleep(THROTTLE_MS);
  }

  console.log(
    `\nFetched ${candidateRows.length} commune fee rows from Yalidine.`,
  );
  if (errors.length > 0) {
    console.log(
      `${errors.length} wilaya(s) failed — see above. Re-run to retry those.`,
    );
  }

  // 3. Load current delivery_zones rows for comparison (only for wilayas touched)
  const touchedWilayaCodes = [
    ...new Set(candidateRows.map((r) => r.wilayaCode)),
  ];

  type DeliveryZoneRow = typeof deliveryZones.$inferSelect;

  const existingRows: DeliveryZoneRow[] =
    touchedWilayaCodes.length > 0
      ? await db
          .select()
          .from(deliveryZones)
          .where(inArray(deliveryZones.wilayaCode, touchedWilayaCodes))
      : [];

  const existingByKey = new Map<string, DeliveryZoneRow>(
    existingRows.map((row) => [
      `${row.wilayaCode}|${row.communeNameAscii}`,
      row,
    ]),
  );

  // 4. Diff
  let newCount = 0;
  let changedCount = 0;
  let unchangedCount = 0;

  console.log("\n=== DIFF ===\n");

  for (const candidate of candidateRows) {
    const key = `${candidate.wilayaCode}|${candidate.communeNameAscii}`;
    const existing = existingByKey.get(key);

    if (!existing) {
      newCount++;
      console.log(
        `[NEW]     ${candidate.wilayaName} / ${candidate.communeName} — ` +
          `stopDesk=${candidate.stopDeskFee} home=${candidate.homeFee}`,
      );
      continue;
    }

    const feeChanged =
      existing.stopDeskFee !== candidate.stopDeskFee ||
      existing.homeFee !== candidate.homeFee ||
      existing.hasStopDesk !== candidate.hasStopDesk ||
      existing.hasHomeDelivery !== candidate.hasHomeDelivery;

    if (feeChanged) {
      changedCount++;
      console.log(
        `[CHANGED] ${candidate.wilayaName} / ${candidate.communeName} — ` +
          `stopDesk ${existing.stopDeskFee}→${candidate.stopDeskFee}, ` +
          `home ${existing.homeFee}→${candidate.homeFee}`,
      );
    } else {
      unchangedCount++;
    }
  }

  // 5. Communes that exist in DB but were NOT returned by Yalidine for this run
  // (only meaningful for a full, unfiltered run — flagged for awareness, not action)
  if (!wilayaFilter) {
    const candidateKeys = new Set(
      candidateRows.map((r) => `${r.wilayaCode}|${r.communeNameAscii}`),
    );
    const staleRows = [...existingByKey.entries()].filter(
      ([key]) => !candidateKeys.has(key),
    );
    if (staleRows.length > 0) {
      console.log(
        `\n[IN DB, NOT IN YALIDINE RESPONSE] ${staleRows.length} row(s) — ` +
          `review manually, do NOT auto-delete:`,
      );
      for (const [, row] of staleRows.slice(0, 20)) {
        console.log(`  - ${row.wilayaName} / ${row.communeName}`);
      }
      if (staleRows.length > 20) {
        console.log(`  ...and ${staleRows.length - 20} more`);
      }
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`New:       ${newCount}`);
  console.log(`Changed:   ${changedCount}`);
  console.log(`Unchanged: ${unchangedCount}`);
  console.log(`Errors:    ${errors.length} wilaya(s)`);
  console.log("\nNo writes performed — this was a dry run.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sync script failed:", err);
    process.exit(1);
  });
