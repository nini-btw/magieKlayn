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

/**
 * A coffret (gift box) always holds exactly this many bottles — not more,
 * not less. A cart with more than this many bottles can still box some of
 * them (see getMaxBoxCount); the remainder always ships without a box.
 */
export const MAX_BOX_CAPACITY = 4;

/**
 * How many full boxes of MAX_BOX_CAPACITY the current cart can fill.
 * E.g. 7 bottles -> 1 (4 boxed, 3 ship normally); 8 bottles -> 2 (both
 * boxable, or the customer can choose fewer and ship the rest normally).
 */
export function getMaxBoxCount(items: CartItem[]): number {
  return Math.floor(getTotalItemCount(items) / MAX_BOX_CAPACITY);
}

/** Whether coffret packaging is offerable at all (needs >=1 full box) */
export function isBoxPackagingEligible(items: CartItem[]): boolean {
  return getMaxBoxCount(items) >= 1;
}

/** Flat fee per box (not per bottle) — shared by client cart UI and the
 * orders API's server-side fee recomputation, so they can never drift. */
export const BOX_FEE = 800;

/** Total coffret fee for a given number of chosen boxes. */
export function calculateCoffretFee(boxCount: number): number {
  return BOX_FEE * boxCount;
}
