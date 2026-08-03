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
