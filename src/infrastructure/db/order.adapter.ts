/**
 * Order repository adapter
 * @module infrastructure/db/order-adapter
 */

import { eq, desc, isNull, and, gte, lte, sql } from "drizzle-orm";
import type { Order, CreateOrderPayload, OrderFilters, WilayaOrderStats } from "@/domain/entities/order";
import type { IOrderRepository } from "@/domain/ports/repositories";
import { calculateCartTotal } from "@/domain/rules/cart.rules";
import { db, mockOrders } from "./client";
import { orders, orderItems } from "./schema";

// Check if we're in mock mode
const isMockMode = !db;

/**
 * Order repository implementation using Drizzle ORM
 */
export class OrderRepository implements IOrderRepository {
  async create(payload: CreateOrderPayload): Promise<Order> {
    if (!payload.wilayaCode || !payload.wilayaName || !payload.communeName) {
      throw new Error(
        "wilaya fields must be resolved server-side before calling orderRepository.create()"
      );
    }
    const totalAmount = calculateCartTotal(payload.items);

    if (isMockMode) {
      const order: Order = {
        id: `order-${Date.now()}`,
        fullName: payload.customer.fullName,
        phone: payload.customer.phone,
        address: payload.customer.address,
        cookingNote: payload.notes.cookingNote,
        giftNote: payload.notes.giftNote,
        items: payload.items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          orderId: `order-${Date.now()}`,
          productId: item.product.id,
          productType: item.product.type,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImage: item.product.images?.[0],
          quantity: item.quantity,
          priceSnapshot: item.product.price,
        })),
        status: "pending",
        totalAmount: totalAmount + payload.deliveryFee,
        deliveryZoneId: payload.deliveryZoneId,
        deliveryType: payload.deliveryType,
        deliveryFee: payload.deliveryFee,
        wilayaCode: payload.wilayaCode,
        wilayaName: payload.wilayaName,
        communeName: payload.communeName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return order;
    }

    // Create order with delivery info
    const [orderResult] = await db
      .insert(orders)
      .values({
        fullName: payload.customer.fullName,
        phone: payload.customer.phone,
        address: payload.customer.address,
        cookingNote: payload.notes.cookingNote,
        giftNote: payload.notes.giftNote,
        status: "pending",
        totalAmount: totalAmount + payload.deliveryFee,
        deliveryZoneId: payload.deliveryZoneId,
        deliveryType: payload.deliveryType,
        deliveryFee: payload.deliveryFee,
        wilayaCode: payload.wilayaCode,
        wilayaName: payload.wilayaName,
        communeName: payload.communeName,
        orderDate: new Date(),
      })
      .returning();

    // Create order items
    const itemsToInsert = payload.items.map((item) => ({
      orderId: orderResult.id,
      productId: item.product.id,
      productType: item.product.type,
      productName: item.product.name,
      productSlug: item.product.slug,
      productImage: item.product.images?.[0],
      quantity: item.quantity,
      priceSnapshot: item.product.price,
    }));

    const itemResults = await db
      .insert(orderItems)
      .values(itemsToInsert)
      .returning();

    return this.mapToEntity(orderResult, itemResults);
  }

  async getById(id: string): Promise<Order | null> {
    if (isMockMode) {
      return mockOrders.find((o) => o.id === id) || null;
    }

    const [orderResult] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!orderResult) return null;

    const itemsResult = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    // Log warning if items array is empty for a completed order
    if (itemsResult.length === 0) {
      console.warn(`[OrderAdapter] Order ${id} has no items`);
    }

    return this.mapToEntity(orderResult, itemsResult);
  }

  async getAll(limit?: number): Promise<Order[]> {
    if (isMockMode) {
      return mockOrders.slice(0, limit);
    }

    // Exclude soft-deleted orders
    const ordersResult = await db
      .select()
      .from(orders)
      .where(isNull(orders.deletedAt))
      .orderBy(desc(orders.createdAt))
      .limit(limit || 1000);

    const result: Order[] = [];
    for (const order of ordersResult) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      result.push(this.mapToEntity(order, items));
    }
    return result;
  }

  async getAllWithFilters(filters?: OrderFilters, limit?: number): Promise<Order[]> {
    if (isMockMode) {
      return mockOrders.slice(0, limit);
    }

    // Build where conditions
    const conditions = [isNull(orders.deletedAt)];
    
    if (filters?.wilayaCode) {
      conditions.push(eq(orders.wilayaCode, filters.wilayaCode));
    }
    
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(orders.orderDate, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(orders.orderDate, filters.endDate));
    }

    const ordersResult = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit || 1000);

    const result: Order[] = [];
    for (const order of ordersResult) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      result.push(this.mapToEntity(order, items));
    }
    return result;
  }

  async getTopWilayas(limit: number = 5): Promise<WilayaOrderStats[]> {
    if (isMockMode) {
      return [];
    }

    const result = await db
      .select({
        wilayaCode: orders.wilayaCode,
        wilayaName: orders.wilayaName,
        orderCount: sql<number>`COUNT(*)::int`,
        totalRevenue: sql<number>`SUM(${orders.totalAmount})::int`,
      })
      .from(orders)
      .where(and(
        isNull(orders.deletedAt),
        sql`${orders.wilayaCode} IS NOT NULL`
      ))
      .groupBy(orders.wilayaCode, orders.wilayaName)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit);

    return result.map((row: { wilayaCode: string | null; wilayaName: string | null; orderCount: number; totalRevenue: number }) => ({
      wilayaCode: row.wilayaCode || '',
      wilayaName: row.wilayaName || '',
      orderCount: row.orderCount,
      totalRevenue: row.totalRevenue,
    }));
  }

  async updateStatus(id: string, status: Order["status"]): Promise<void> {
    if (isMockMode) return;

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  async getRecent(count: number): Promise<Order[]> {
    return this.getAll(count);
  }

  async delete(id: string): Promise<void> {
    if (isMockMode) return;

    // Get order to check status
    const order = await this.getById(id);
    if (!order) throw new Error("Order not found");

    // Only allow deletion of cancelled orders (Option B)
    if (order.status !== "cancelled") {
      throw new Error("Only cancelled orders can be deleted");
    }

    // Soft delete - set deletedAt timestamp
    await db
      .update(orders)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  /**
   * Map database records to domain entity
   */
  private mapToEntity(
    order: typeof orders.$inferSelect,
    items: (typeof orderItems.$inferSelect)[]
  ): Order {
    return {
      id: order.id,
      fullName: order.fullName,
      phone: order.phone,
      address: order.address,
      cookingNote: order.cookingNote || undefined,
      giftNote: order.giftNote || undefined,
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryZoneId: order.deliveryZoneId,
      deliveryType: order.deliveryType || undefined,
      deliveryFee: order.deliveryFee || undefined,
      wilayaCode: order.wilayaCode || undefined,
      wilayaName: order.wilayaName || undefined,
      communeName: order.communeName || undefined,
      orderDate: order.orderDate ? new Date(order.orderDate) : undefined,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      items: items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productType: item.productType,
        productName: item.productName,
        productSlug: item.productSlug,
        productImage: item.productImage || undefined,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
      })),
    };
  }
}

/**
 * Singleton instance
 */
export const orderRepository = new OrderRepository();
