/**
 * Delivery zone entity definitions
 * @module domain/entities/delivery
 */

/**
 * Delivery type - either stop desk (point relais) or home delivery
 */
export type DeliveryType = "stop_desk" | "home";

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
 * Get delivery fee for a zone based on delivery type
 * @param zone - The delivery zone
 * @param type - The delivery type
 * @returns The fee in DA (Algerian Dinar)
 */
export function getDeliveryFee(zone: DeliveryZone, type: DeliveryType): number {
  return type === "stop_desk" ? zone.stopDeskFee : zone.homeFee;
}
