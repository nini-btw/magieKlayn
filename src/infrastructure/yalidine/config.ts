const DEFAULT_ORIGIN_WILAYA_ID = Number(
  process.env.YALIDINE_DEFAULT_ORIGIN_WILAYA_ID ?? 16,
);

const OVERRIDE_ORIGIN_WILAYA_ID = Number(
  process.env.YALIDINE_OVERRIDE_ORIGIN_WILAYA_ID ?? 31,
);

const OVERRIDE_DESTINATION_IDS = new Set(
  (process.env.YALIDINE_OVERRIDE_DESTINATION_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number),
);

/**
 * Resolves which wilaya a parcel should ship FROM, based on where
 * it's going. Defaults to YALIDINE_DEFAULT_ORIGIN_WILAYA_ID unless the
 * destination wilaya is explicitly listed in
 * YALIDINE_OVERRIDE_DESTINATION_IDS, in which case it ships from
 * YALIDINE_OVERRIDE_ORIGIN_WILAYA_ID instead.
 *
 * Inert by default — YALIDINE_OVERRIDE_DESTINATION_IDS starts empty,
 * so every destination resolves to the default origin until specific
 * wilaya IDs are added to that env var.
/**
 * Resolves which wilaya a parcel should ship FROM, based on where
 * it's going. Defaults to YALIDINE_DEFAULT_ORIGIN_WILAYA_ID unless the
 * destination wilaya is explicitly listed in
 * YALIDINE_OVERRIDE_DESTINATION_IDS, in which case it ships from
 * YALIDINE_OVERRIDE_ORIGIN_WILAYA_ID instead.
 *
 * Accepts the destination wilaya id as string or number since orders.wilayaCode
 * is stored as a varchar — parses and validates here so callers never need to
 * remember to convert, and a bad/missing value fails loudly instead of
 * silently resolving to NaN.
 */
export function getOriginWilayaId(
  destinationWilayaId: string | number,
): number {
  const destId = Number(destinationWilayaId);

  if (!Number.isInteger(destId) || destId < 1 || destId > 58) {
    throw new Error(
      `Invalid destination wilaya id: "${destinationWilayaId}". Expected an integer 1–58.`,
    );
  }

  if (OVERRIDE_DESTINATION_IDS.has(destId)) {
    return OVERRIDE_ORIGIN_WILAYA_ID;
  }
  return DEFAULT_ORIGIN_WILAYA_ID;
}

// NOTE: currently UNUSED by scripts/create-parcel.ts — dimensions/weight
// are being omitted from the Yalidine payload entirely, to test whether
// sending them at all is what makes the platform always display parcels
// as exceeding 5kg. Kept here, ready to wire back in (see the revert note
// in create-parcel.ts) if that turns out not to be the cause.
export const DEFAULT_PARCEL_DIMENSIONS = {
  length: 20, // cm
  width: 15,
  height: 15,
  weight: 2, // kg
};

// Estimates, not measured values — adjust here if the real average
// mist-bottle weight (incl. packaging share) turns out to differ.
const BASE_PARCEL_WEIGHT_KG = 0.6; // packaging/box baseline
const PER_BOTTLE_WEIGHT_KG = 0.25; // per bottle in the order

// A coffret box always holds exactly 4 bottles (see cart.rules.ts).
const HEAVY_ORDER_BOX_THRESHOLD = 4;

// Above this, weight is left uncapped — the parcel is genuinely large by
// then (16+ bottles across 4+ boxes) and should bill accordingly.
const CAPPED_WEIGHT_LIMIT_KG = 4.5;

/**
 * Computes the declared parcel weight for a Yalidine shipment, gradually
 * from how many bottles are actually in the order rather than a flat
 * guess. Stays safely under the 5kg tier unless the order has 4 or more
 * boxes (a genuinely bigger parcel), in which case it's allowed to scale
 * past 5kg. Dimensions stay fixed/small regardless — only weight varies,
 * see DEFAULT_PARCEL_DIMENSIONS.length/width/height above.
 *
 * Currently unused (see NOTE above) — kept for a quick revert.
 */
export function calculateParcelWeight(
  itemCount: number,
  boxCount: number,
): number {
  const raw = BASE_PARCEL_WEIGHT_KG + itemCount * PER_BOTTLE_WEIGHT_KG;
  if (boxCount >= HEAVY_ORDER_BOX_THRESHOLD) return raw;
  return Math.min(raw, CAPPED_WEIGHT_LIMIT_KG);
}
