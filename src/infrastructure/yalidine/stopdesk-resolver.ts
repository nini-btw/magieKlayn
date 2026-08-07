/**
 * Resolves a default stopdesk_id for a commune, server-side — the
 * customer never picks one (see integration state doc v5 §2.1).
 *
 * CAVEAT: delivery_zones has no Yalidine commune_id column, only names,
 * so matching is by commune_name string equality. Names are normalized
 * (diacritics stripped, whitespace/case collapsed) before comparing,
 * since Yalidine's own commune_name spellings (e.g. "Aïn El Turck") can
 * diverge from ours (e.g. "Ain El Turk").
 *
 * If no match is found even after normalization, this returns null
 * rather than guessing — a wrong center produces a hard Yalidine
 * rejection ("stopdesk_id does not belong to to_commune_name"), which
 * is worse than skipping parcel creation and flagging it for manual
 * follow-up.
 */
import { yalidineClient } from "./client";

function normalizeCommuneName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (é→e, ï→i, etc.)
    .replace(/[\s-]+/g, " "); // collapse whitespace/hyphens
}

export async function resolveStopdeskId(
  wilayaId: number,
  communeName: string,
): Promise<number | null> {
  const res = await yalidineClient.getCenters(wilayaId);
  if (res.data.length === 0) return null;

  const target = normalizeCommuneName(communeName);

  const exactMatch = res.data.find(
    (c) => normalizeCommuneName(c.commune_name) === target,
  );
  if (exactMatch) return exactMatch.center_id;

  console.warn(
    `[stopdesk-resolver] No commune match for "${communeName}" (normalized: "${target}") in wilaya ${wilayaId}. ` +
      `Available centers: ${res.data.map((c) => `"${c.commune_name}"`).join(", ")}. ` +
      `Skipping parcel creation — needs manual review.`,
  );
  return null;
}
