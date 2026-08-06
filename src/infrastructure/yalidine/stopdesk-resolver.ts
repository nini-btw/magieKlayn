/**
 * Resolves a default stopdesk_id for a commune, server-side — the
 * customer never picks one (see integration state doc v5 §2.1).
 *
 * CAVEAT: delivery_zones has no Yalidine commune_id column, only names,
 * so matching is by commune_name string equality. If no exact match is
 * found, falls back to the first center in the wilaya and logs a warning
 * rather than blocking parcel creation.
 */
import { yalidineClient } from "./client";

export async function resolveStopdeskId(
  wilayaId: number,
  communeName: string,
): Promise<number | null> {
  const res = await yalidineClient.getCenters(wilayaId);
  if (res.data.length === 0) return null;

  const exactMatch = res.data.find(
    (c) =>
      c.commune_name.trim().toLowerCase() === communeName.trim().toLowerCase(),
  );
  if (exactMatch) return exactMatch.center_id;

  console.warn(
    `[stopdesk-resolver] No exact commune match for "${communeName}" in wilaya ${wilayaId} — falling back to first center (${res.data[0].name}).`,
  );
  return res.data[0].center_id;
}
