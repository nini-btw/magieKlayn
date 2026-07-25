/**
 * Cart Redux slice
 * @module presentation/store/cart
 */

import { createSlice, createSelector, PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "@/domain/entities/product";
import type { CartItem } from "@/domain/entities/order";
import { cartService } from "@/application/services/cart.service";

/**
 * Cart state interface
 */
export interface CartState {
  items: CartItem[];
  cookingNote: string | null;
  giftNote: string | null;
}

/**
 * Initial cart state
 */
const initialState: CartState = {
  items: [],
  cookingNote: null,
  giftNote: null,
};

/**
 * Cart slice with reducers
 */
export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /**
     * Add item to cart
     */
    addItem: (
      state,
      action: PayloadAction<{ product: Product; quantity?: number }>
    ) => {
      const { product, quantity = 1 } = action.payload;
      const result = cartService.addItem(state.items, product, quantity);
      state.items = result.items;
    },

    /**
     * Remove item from cart
     */
    removeItem: (state, action: PayloadAction<string>) => {
      const result = cartService.removeItem(state.items, action.payload);
      state.items = result.items;
    },

    /**
     * Update item quantity
     */
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;
      const result = cartService.updateQuantity(
        state.items,
        productId,
        quantity
      );
      state.items = result.items;
    },

    /**
     * Clear entire cart
     */
    clearCart: (state) => {
      const result = cartService.clearCart();
      state.items = result.items;
      state.cookingNote = null;
      state.giftNote = null;
    },

    /**
     * Set cooking note
     */
    setCookingNote: (state, action: PayloadAction<string | null>) => {
      state.cookingNote = action.payload;
    },

    /**
     * Set gift note
     */
    setGiftNote: (state, action: PayloadAction<string | null>) => {
      state.giftNote = action.payload;
    },

    /**
     * Load cart from storage (for hydration)
     */
    hydrateCart: (state, action: PayloadAction<CartState>) => {
      state.items = action.payload.items;
      state.cookingNote = action.payload.cookingNote;
      state.giftNote = action.payload.giftNote;
    },
  },
});

/**
 * Export actions
 */
export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setCookingNote,
  setGiftNote,
  hydrateCart,
} = cartSlice.actions;

/**
 * Selectors
 */
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCookingNote = (state: { cart: CartState }) =>
  state.cart.cookingNote;
export const selectGiftNote = (state: { cart: CartState }) =>
  state.cart.giftNote;

/**
 * Memoized cart summary selector
 */
export const selectCartSummary = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items)
);

/**
 * Select total item count
 */
export const selectTotalItemCount = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items).itemCount
);

/**
 * Select total cookie count (for minimum validation)
 */
export const selectTotalCookieCount = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items).cookieCount
);

/**
 * Select if checkout is allowed
 */
export const selectCanCheckout = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items).canCheckout
);

/**
 * Select cart total amount
 */
export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items).totalAmount
);

/**
 * Select cookies needed for minimum
 */
export const selectCookiesNeeded = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items).cookiesNeeded
);

/**
 * Select cart progress percentage
 */
export const selectCartProgress = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items).progress
);

export default cartSlice.reducer;
