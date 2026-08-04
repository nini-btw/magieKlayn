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
import { inArray } from "drizzle-orm";
// NOTE: db/schema imports are deferred inside main(), after loadEnv() runs.
// A static top-of-file import is hoisted by JS regardless of position, so
// if db/client.ts reads process.env.* at module-load time, importing it
// here would run BEFORE .env.local loads, silently breaking the client.

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
  const { fetchCandidateRows } =
    await import("../src/infrastructure/yalidine/zone-sync-helpers");

  console.log("=== Yalidine Zone Sync — DRY RUN (no writes) ===\n");

  const wilayaFilter = parseWilayaFilter();
  if (wilayaFilter) {
    console.log(`Limiting run to wilayas: ${wilayaFilter.join(", ")}\n`);
  }

  console.log("Fetching live data from Yalidine (throttled)...\n");
  const { candidateRows, errors, skippedWilayas } =
    await fetchCandidateRows(wilayaFilter);

  if (skippedWilayas.length > 0) {
    console.log(
      `Skipped ${skippedWilayas.length} non-deliverable wilaya(s): ` +
        skippedWilayas.map((w) => `${w.id} (${w.name})`).join(", ") +
        "\n",
    );
  }

  console.log(
    `Fetched ${candidateRows.length} commune fee rows from Yalidine.`,
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
