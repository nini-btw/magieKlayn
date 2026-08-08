"use server";

import { cache } from "react";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { orderRepository } from "@/infrastructure/db/order.adapter";

import type { Product } from "@/domain/entities/product";

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
 * Get recent orders for admin
 */
export async function getRecentOrders(count: number = 10) {
  return orderRepository.getRecent(count);
}
