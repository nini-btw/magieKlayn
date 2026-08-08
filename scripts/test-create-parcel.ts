// scripts/test-create-parcel.ts
// Throwaway script — creates ONE real test parcel to observe what
// Yalidine actually returns for delivery_fee, so we can confirm whether
// `price` should be goods-only or the full order total.
// DELETE the resulting parcel afterward (status will be "en préparation",
// so it's deletable) — see DELETE /v1/parcels/:tracking in the docs.

import { yalidineClient } from "../src/infrastructure/yalidine/client";
import { getOriginWilayaId } from "../src/infrastructure/yalidine/config";
import type { YalidineCreateParcelPayload } from "../src/infrastructure/yalidine/types";

async function main() {
  const testWilayaId = 16; // Alger — pick a wilaya you know is deliverable
  const testCommuneName = "Bab El Oued"; // must match Yalidine's exact commune name

  const originWilayaId = getOriginWilayaId(testWilayaId);
  const originWilayaName =
    originWilayaId === 16 ? "Alger" : originWilayaId === 31 ? "Oran" : "Batna"; // adjust to your real origin name

  const testPayload: YalidineCreateParcelPayload = {
    order_id: `TEST-${Date.now()}`, // unique, throwaway
    from_wilaya_name: originWilayaName,
    firstname: "Test",
    familyname: "Order",
    contact_phone: "0555000000",
    address: testCommuneName, // per decision: address = commune name
    to_commune_name: testCommuneName,
    to_wilaya_name: "Alger",
    product_list: "Test parcel — price verification",
    price: 1100, // <-- goods-only guess (subtotal, no delivery). Swap to full total on a second run if needed.
    do_insurance: false,
    declared_value: 1100,
    // length/width/height/weight deliberately omitted — see the same note
    // in scripts/create-parcel.ts.
    freeshipping: false,
    is_stopdesk: false, // home delivery — simplest first test
    has_exchange: false,
  };

  console.log("[test] Sending payload:", testPayload);

  const result = await yalidineClient.createParcels([testPayload]);

  console.log("[test] Raw response:", JSON.stringify(result, null, 2));

  const entry = result[testPayload.order_id];

  if (entry?.success) {
    console.log(`[test] Created tracking: ${entry.tracking}`);
    console.log(
      `[test] Fetch this tracking via GET /v1/parcels/${entry.tracking} to see the delivery_fee Yalidine calculated.`,
    );
    console.log(
      `[test] Remember to DELETE this test parcel afterward: DELETE /v1/parcels/${entry.tracking}`,
    );
  } else {
    console.error("[test] Failed:", entry?.message);
  }
}

main().catch(console.error);
