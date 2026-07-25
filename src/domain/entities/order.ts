/**
 * Order entity definitions
 * @module domain/entities/order
 */

import type { Product } from "./product";

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
 * Order entity
 */
export interface Order {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  cookingNote?: string;
  giftNote?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  // Delivery details
  deliveryZoneId: string;
  deliveryType?: "stop_desk" | "home";
  deliveryFee?: number;
  wilayaCode?: string;
  wilayaName?: string;
  communeName?: string;
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
  productType: "cookie" | "box";
  productName: string;
  productSlug: string;
  productImage?: string;
  quantity: number;
  priceSnapshot: number;
}

/**
 * Cart item used during shopping
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Customer information for checkout
 */
export interface CustomerInfo {
  fullName: string;
  phone: string;
  address: string;
}

/**
 * Optional notes for the order
 */
export interface OrderNotes {
  cookingNote?: string;
  giftNote?: string;
}

/**
 * Create order payload from cart
 */
export interface CreateOrderPayload {
  customer: CustomerInfo;
  notes: OrderNotes;
  items: CartItem[];
  deliveryZoneId: string;
  deliveryType: "stop_desk" | "home";
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
