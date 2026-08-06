/**
 * Order entity definitions
 * @module domain/entities/order
 */

import type { SerializedProduct } from "./product";
export type BoxColor = "white" | "black";

/**
 * Order status enum
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

/**
 * Packaging type — coffret decision made at checkout, order-level
 */
export type PackagingType = "standard" | "luxury_coffret";

/**
 * Order entity
 */
export interface Order {
  id: string;
  fullName: string;
  firstName?: string; // undefined on pre-migration orders
  lastName?: string;
  phone: string;
  giftNote?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  packagingType: PackagingType;
  coffretFee?: number;
  boxColor?: BoxColor; // <-- new

  // Delivery details
  deliveryZoneId: string;
  deliveryType?: "stop_desk" | "home" | "store_pickup";
  deliveryFee?: number;
  wilayaCode?: string;
  wilayaName?: string;
  communeName?: string;
  yalidineTracking?: string;
  orderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual item within an order
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  productColorHex?: string;
  quantity: number;
  priceSnapshot: number;
}

/**
 * Cart item used during shopping.
 *
 * Uses `SerializedProduct` (not `Product`) because CartItem lives in
 * Redux state, which must be JSON-serializable — a real `Date` object
 * on `product.createdAt`/`updatedAt` would break serialization.
 */
export interface CartItem {
  product: SerializedProduct;
  quantity: number;
}

/**
 * Customer information for checkout
 */
export interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
}

/**
 * Optional notes for the order
 */
export interface OrderNotes {
  giftNote?: string;
}

/**
 * Create order payload from cart
 */
export interface CreateOrderPayload {
  customer: CustomerInfo;
  notes: OrderNotes;
  items: CartItem[];
  packagingType?: PackagingType;
  coffretFee?: number;
  boxColor?: BoxColor; // <-- new

  deliveryZoneId: string;
  deliveryType: "stop_desk" | "home" | "store_pickup";
  deliveryFee: number;
  wilayaCode?: string;
  wilayaName?: string;
  communeName?: string;
}

/**
 * Order filters for admin
 */
export interface OrderFilters {
  wilayaCode?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

/**
 * Wilaya order statistics
 */
export interface WilayaOrderStats {
  wilayaCode: string;
  wilayaName: string;
  orderCount: number;
  totalRevenue: number;
}

// domain/entities/order.ts (or a shared lib file)
export function splitOrGetFullName(
  order: Pick<Order, "fullName" | "firstName" | "lastName">,
) {
  return {
    firstName: order.firstName ?? null, // null = old order, no structured name
    lastName: order.lastName ?? null,
    display: order.fullName, // always safe to render
  };
}
