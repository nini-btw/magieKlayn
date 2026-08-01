/**
 * Cart service for managing shopping cart operations
 * @module application/services/cart
 */

import type { SerializedProduct } from "@/domain/entities/product";
import type { CartItem } from "@/domain/entities/order";
import {
  calculateCartTotal,
  findCartItem,
  getTotalItemCount,
} from "@/domain/rules/cart.rules";

/**
 * Cart operations result
 */
export interface CartOperationResult {
  success: boolean;
  items: CartItem[];
  message?: string;
}

/**
 * Cart service class
 */
export class CartService {
  /**
   * Add product to cart
   */
  addItem(
    currentItems: CartItem[],
    product: SerializedProduct,
    quantity: number = 1,
  ): CartOperationResult {
    const existingItem = findCartItem(currentItems, product.id);

    let newItems: CartItem[];
    if (existingItem) {
      newItems = currentItems.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    } else {
      newItems = [...currentItems, { product, quantity }];
    }

    return {
      success: true,
      items: newItems,
      message: `${product.name} added to cart`,
    };
  }

  /**
   * Remove product from cart
   */
  removeItem(currentItems: CartItem[], productId: string): CartOperationResult {
    const item = findCartItem(currentItems, productId);
    if (!item) {
      return {
        success: false,
        items: currentItems,
        message: "Item not found in cart",
      };
    }

    const newItems = currentItems.filter(
      (item) => item.product.id !== productId,
    );
    return {
      success: true,
      items: newItems,
      message: `${item.product.name} removed from cart`,
    };
  }

  /**
   * Update item quantity
   */
  updateQuantity(
    currentItems: CartItem[],
    productId: string,
    quantity: number,
  ): CartOperationResult {
    if (quantity < 1) {
      return this.removeItem(currentItems, productId);
    }

    const item = findCartItem(currentItems, productId);
    if (!item) {
      return {
        success: false,
        items: currentItems,
        message: "Item not found in cart",
      };
    }

    const newItems = currentItems.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item,
    );

    return {
      success: true,
      items: newItems,
    };
  }

  /**
   * Clear entire cart
   */
  clearCart(): CartOperationResult {
    return {
      success: true,
      items: [],
      message: "Cart cleared",
    };
  }

  /**
   * Get cart summary
   */
  getCartSummary(items: CartItem[]) {
    return {
      itemCount: getTotalItemCount(items),
      totalAmount: calculateCartTotal(items),
    };
  }
}

/**
 * Singleton instance
 */
export const cartService = new CartService();
