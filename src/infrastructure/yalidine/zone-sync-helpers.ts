/**
 * Shared fetch logic for Yalidine zone/fee sync.
 * @module infrastructure/yalidine/zone-sync-helpers
 *
 * Used by BOTH scripts/sync-zones.ts (dry-run diff) and
 * scripts/sync-zones-write.ts (real upsert) so the data going into the
 * diff you review is guaranteed identical to the data that gets written —
 * no risk of the two scripts silently drifting apart over time.
 */

import type { YalidineCommuneFee } from "./types";
import { yalidineClient } from "./client";
import { getOriginWilayaId } from "./config";

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
export function toAscii(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "'"); // keep apostrophes as-is
}

export interface CandidateRow {
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

export interface FetchError {
  wilayaId: number;
  wilayaName: string;
  error: string;
}

export interface FetchResult {
  candidateRows: CandidateRow[];
  errors: FetchError[];
  skippedWilayas: { id: number; name: string }[];
}

/**
 * Fetches wilayas + per-commune fees from Yalidine, throttled to respect
 * the rate limit, and shapes them into rows matching the `delivery_zones`
 * table. Does NOT touch the database — pure fetch + shape.
 *
 * @param wilayaFilter optional list of wilaya IDs to limit the run to
 */
export async function fetchCandidateRows(
  wilayaFilter: number[] | null = null,
): Promise<FetchResult> {
  const wilayasRes = await yalidineClient.getWilayas();
  let wilayas = wilayasRes.data.filter((w) => w.is_deliverable === 1);

  if (wilayaFilter) {
    wilayas = wilayas.filter((w) => wilayaFilter.includes(w.id));
  }

  const skippedWilayas = wilayasRes.data
    .filter((w) => w.is_deliverable === 0)
    .map((w) => ({ id: w.id, name: w.name }));

  const candidateRows: CandidateRow[] = [];
  const errors: FetchError[] = [];

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

  return { candidateRows, errors, skippedWilayas };
}
