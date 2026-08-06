/**
 * Creates a real Yalidine parcel for a given order, fire-and-forget,
 * called right after order creation in /api/orders (route.ts).
 * Skips entirely for store_pickup orders. Never throws to its caller —
 * catches everything internally and logs, same discipline as
 * telegramNotificationService.notifyNewOrder.
 */
import { yalidineClient } from "../src/infrastructure/yalidine/client";
import { getOriginWilayaId } from "../src/infrastructure/yalidine/config";
import { DEFAULT_PARCEL_DIMENSIONS } from "../src/infrastructure/yalidine/config";
import { resolveStopdeskId } from "../src/infrastructure/yalidine/stopdesk-resolver";
import { orderRepository } from "../src/infrastructure/db/order.adapter";
import type { YalidineCreateParcelPayload } from "../src/infrastructure/yalidine/types";
import type { Order } from "@/domain/entities/order";

// Only 2 origins exist today (config.ts defaults). If a third origin
// is ever added via YALIDINE_OVERRIDE_ORIGIN_WILAYA_ID, update this too.
const ORIGIN_WILAYA_NAMES: Record<number, string> = {
  16: "Alger",
  31: "Oran",
};

export async function createParcelForOrder(order: Order): Promise<void> {
  try {
    if (process.env.YALIDINE_ENABLED !== "true") return;
    if (order.deliveryType === "store_pickup") return;
    if (order.yalidineTracking) return; // idempotency

    if (!order.wilayaCode || !order.wilayaName || !order.communeName) {
      console.error(
        `[create-parcel] Order ${order.id} missing wilaya/commune — skipping.`,
      );
      return;
    }

    const destWilayaId = Number(order.wilayaCode);
    const originWilayaId = getOriginWilayaId(destWilayaId);
    const originWilayaName = ORIGIN_WILAYA_NAMES[originWilayaId];
    if (!originWilayaName) {
      console.error(
        `[create-parcel] No origin name mapped for id ${originWilayaId} — skipping order ${order.id}.`,
      );
      return;
    }

    const isStopdesk = order.deliveryType === "stop_desk";
    let stopdeskId: number | undefined;
    if (isStopdesk) {
      const resolved = await resolveStopdeskId(destWilayaId, order.communeName);
      if (!resolved) {
        console.error(
          `[create-parcel] No stop-desk centers for wilaya ${destWilayaId} — skipping order ${order.id}.`,
        );
        return;
      }
      stopdeskId = resolved;
    }

    // price = COD amount collected from customer. Confirmed via test
    // parcel: delivery_fee is NOT added on top — Yalidine collects
    // `price` only. See integration state doc, has_recouvrement finding.
    const codPrice = order.totalAmount - (order.deliveryFee ?? 0);

    const payload: YalidineCreateParcelPayload = {
      order_id: order.id,
      from_wilaya_name: originWilayaName,
      firstname: order.firstName || order.fullName.split(" ")[0],
      familyname:
        order.lastName || order.fullName.split(" ").slice(1).join(" ") || "-",
      contact_phone: order.phone,
      address: order.communeName,
      to_commune_name: order.communeName,
      to_wilaya_name: order.wilayaName,
      product_list: order.items
        .map((i) => `${i.productName} x${i.quantity}`)
        .join(", "),
      price: codPrice,
      do_insurance: false,
      declared_value: codPrice,
      length: DEFAULT_PARCEL_DIMENSIONS.length,
      width: DEFAULT_PARCEL_DIMENSIONS.width,
      height: DEFAULT_PARCEL_DIMENSIONS.height,
      weight: DEFAULT_PARCEL_DIMENSIONS.weight,
      freeshipping: false,
      is_stopdesk: isStopdesk,
      ...(stopdeskId ? { stopdesk_id: stopdeskId } : {}),
      has_exchange: false,
    };

    const result = await yalidineClient.createParcels([payload]);
    const entry = result[order.id];

    if (!entry?.success || !entry.tracking) {
      console.error(
        `[create-parcel] Failed for order ${order.id}:`,
        entry?.message,
      );
      return;
    }

    await orderRepository.setYalidineTracking(order.id, entry.tracking);
    console.log(
      `[create-parcel] Order ${order.id} → Yalidine tracking ${entry.tracking}`,
    );
  } catch (err) {
    // Never throw — this must not break order creation.
    console.error(
      `[create-parcel] Unexpected error for order ${order.id}:`,
      err,
    );
  }
}
