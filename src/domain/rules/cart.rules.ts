/**
 * Cart business rules
 * @module domain/rules/cart
 */

import type { CartItem } from "../entities/order";
import type { Product } from "../entities/product";

/**
 * Minimum cookies required for checkout
 */
export const MIN_COOKIES = 3;

/**
 * Cookie equivalent for a pre-made box
 */
export const BOX_COOKIE_EQUIVALENT = 3;

/**
 * Calculate total cookie count for cart validation.
 * CookieBox counts as 3 regardless of quantity.
 *
 * @param items - Current cart items
 * @returns Total cookie-equivalent count
 * @example
 * totalCookieCount([{ product: box, quantity: 1 }]) // => 3
 */
export function totalCookieCount(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    // Boxes count as BOX_COOKIE_EQUIVALENT (3) cookies each
    // Individual cookies count as 1 each
    const value =
      item.product.type === "box" ? BOX_COOKIE_EQUIVALENT : 1;
    return sum + value * item.quantity;
  }, 0);
}

/**
 * Check if checkout is allowed (minimum 3 cookies)
 *
 * @param items - Current cart items
 * @returns True if cart meets minimum requirement
 */
export function canCheckout(items: CartItem[]): boolean {
  return totalCookieCount(items) >= MIN_COOKIES;
}

/**
 * Get how many more cookies needed to reach minimum
 *
 * @param items - Current cart items
 * @returns Number of cookies needed (0 if minimum met)
 */
export function cookiesNeeded(items: CartItem[]): number {
  const current = totalCookieCount(items);
  return Math.max(0, MIN_COOKIES - current);
}

/**
 * Calculate cart total amount
 *
 * @param items - Cart items
 * @returns Total price in cents (or currency unit)
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);
}

/**
 * Calculate progress percentage toward minimum
 *
 * @param items - Current cart items
 * @returns Percentage (0-100)
 */
export function getCartProgress(items: CartItem[]): number {
  const count = totalCookieCount(items);
  return Math.min(100, (count / MIN_COOKIES) * 100);
}

/**
 * Group cart items by product type
 */
export function groupCartItems(items: CartItem[]): {
  cookies: CartItem[];
  boxes: CartItem[];
} {
  return {
    cookies: items.filter((item) => item.product.type === "cookie"),
    boxes: items.filter((item) => item.product.type === "box"),
  };
}

/**
 * Find item in cart by product ID
 */
export function findCartItem(
  items: CartItem[],
  productId: string
): CartItem | undefined {
  return items.find((item) => item.product.id === productId);
}

/**
 * Check if product is already in cart
 */
export function hasProductInCart(items: CartItem[], productId: string): boolean {
  return items.some((item) => item.product.id === productId);
}

/**
 * Get total item count (sum of quantities)
 */
export function getTotalItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
