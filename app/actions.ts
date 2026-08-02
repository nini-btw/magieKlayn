"use server";

import { cache } from "react";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { orderRepository } from "@/infrastructure/db/order.adapter";

import type { CreateOrderPayload } from "@/domain/entities/order";
import type { Product } from "@/domain/entities/product";
import { telegramNotificationService } from "@/infrastructure/telegram/telegram-notification.service";

/**
 * Get all active products
 */
export const getAllProducts = cache(async (): Promise<Product[]> => {
  return productRepository.getAllActive();
});

/**
 * Get product by slug
 */
export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => {
    return productRepository.getBySlug(slug);
  },
);

/**
 * Create order action
 */
export async function createOrder(payload: CreateOrderPayload) {
  try {
    // Create order
    const order = await orderRepository.create(payload);
    await telegramNotificationService.notifyNewOrder(order);

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Order creation failed:", error);
    return {
      success: false,
      error: "Failed to create order. Please try again.",
    };
  }
}

/**
 * Get recent orders for admin
 */
export async function getRecentOrders(count: number = 10) {
  return orderRepository.getRecent(count);
}
