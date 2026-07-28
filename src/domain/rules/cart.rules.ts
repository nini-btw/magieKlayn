/**
 * Cart business rules
 * @module domain/rules/cart
 */

import type { CartItem } from "../entities/order";
import type { Product } from "../entities/product";

/**
 * Calculate cart total amount
 *
 * @param items - Cart items
 * @returns Total price in the smallest currency unit (DA)
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);
}

/**
 * Find item in cart by product ID
 */
export function findCartItem(
  items: CartItem[],
  productId: string,
): CartItem | undefined {
  return items.find((item) => item.product.id === productId);
}

/**
 * Check if product is already in cart
 */
export function hasProductInCart(
  items: CartItem[],
  productId: string,
): boolean {
  return items.some((item) => item.product.id === productId);
}

/**
 * Get total item count (sum of quantities)
 */
export function getTotalItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
