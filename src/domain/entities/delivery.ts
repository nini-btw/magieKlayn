/**
 * Delivery zone entity definitions
 * @module domain/entities/delivery
 */

/**
 * Delivery type - stop desk (point relais), home delivery, or in-store pickup
 */
export type DeliveryType = "stop_desk" | "home" | "store_pickup";

/**
 * Wilaya codes where in-store pickup is offered as a fulfillment option.
 * Store pickup bypasses Yalidine entirely — it's a manual, local fulfillment
 * path, available for every commune within these wilayas.
 */
export const STORE_PICKUP_WILAYAS = ["16", "31"] as const;

/**
 * Hardcoded store addresses, one per wilaya that offers pickup.
 * Not DB-driven — update here if a store moves or a new one opens.
 */
export const STORE_PICKUP_ADDRESSES: Record<string, string> = {
  "16": "TODO: Alger store address",
  "31": "TODO: Oran store address",
};

export function isStorePickupAvailable(wilayaCode: string): boolean {
  return (STORE_PICKUP_WILAYAS as readonly string[]).includes(wilayaCode);
}

/**
 * Delivery zone entity representing a wilaya/commune
 */
export interface DeliveryZone {
  id: string;
  wilayaCode: string;
  wilayaNameAscii: string;
  wilayaName: string;
  communeNameAscii: string;
  communeName: string;
  stopDeskFee: number;
  homeFee: number;
  hasStopDesk: boolean;
  hasHomeDelivery: boolean;
}

/**
 * Delivery selection made by customer during checkout
 */
export interface DeliverySelection {
  zoneId: string;
  type: DeliveryType;
  fee: number;
  wilayaCode: string;
  wilayaName: string;
  communeName: string;
}

/**
 * Get delivery fee for a zone based on delivery type.
 * Store pickup is always free.
 */
export function getDeliveryFee(zone: DeliveryZone, type: DeliveryType): number {
  if (type === "store_pickup") return 0;
  return type === "stop_desk" ? zone.stopDeskFee : zone.homeFee;
}
