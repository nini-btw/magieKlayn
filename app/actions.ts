"use server";

import { cache } from "react";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { orderRepository } from "@/infrastructure/db/order.adapter";

import { telegramService } from "@/infrastructure/telegram/service";
import type { CreateOrderPayload } from "@/domain/entities/order";
import type { Product } from "@/domain/entities/product";
import { canCheckout } from "@/domain/rules/cart.rules";
import { getTimeRemaining } from "@/domain/entities/drop";

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
 * Get all cookie pieces (for box builder)
 */
export const getAllCookies = cache(async () => {
  return productRepository.getAllCookies();
});

/**
 * Get all boxes
 */
export const getAllBoxes = cache(async () => {
  return productRepository.getAllBoxes();
});

/** */
/**
 * Create order action
 */
export async function createOrder(payload: CreateOrderPayload) {
  try {
    // Validate cart minimum
    if (!canCheckout(payload.items)) {
      return {
        success: false,
        error: "Minimum 3 cookies required for checkout",
      };
    }

    // Create order
    const order = await orderRepository.create(payload);

    // Send Telegram notification
    try {
      await telegramService.sendOrderNotification(order);
    } catch (notifyError) {
      console.error("Notification failed:", notifyError);
    }

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
