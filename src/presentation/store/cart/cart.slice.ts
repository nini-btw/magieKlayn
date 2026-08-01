/**
 * Cart Redux slice
 * @module presentation/store/cart
 */

import { createSlice, createSelector, PayloadAction } from "@reduxjs/toolkit";
import type { SerializedProduct } from "@/domain/entities/product";
import type { CartItem } from "@/domain/entities/order";
import { cartService } from "@/application/services/cart.service";

/**
 * Cart state interface
 */
export interface CartState {
  items: CartItem[];
  giftNote: string | null;
}

const initialState: CartState = {
  items: [],
  giftNote: null,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<{ product: SerializedProduct; quantity?: number }>,
    ) => {
      const { product, quantity = 1 } = action.payload;
      const result = cartService.addItem(state.items, product, quantity);
      state.items = result.items;
    },

    removeItem: (state, action: PayloadAction<string>) => {
      const result = cartService.removeItem(state.items, action.payload);
      state.items = result.items;
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) => {
      const { productId, quantity } = action.payload;
      const result = cartService.updateQuantity(
        state.items,
        productId,
        quantity,
      );
      state.items = result.items;
    },

    clearCart: (state) => {
      const result = cartService.clearCart();
      state.items = result.items;
      state.giftNote = null;
    },

    setGiftNote: (state, action: PayloadAction<string | null>) => {
      state.giftNote = action.payload;
    },

    hydrateCart: (state, action: PayloadAction<CartState>) => {
      state.items = action.payload.items;
      state.giftNote = action.payload.giftNote;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setGiftNote,
  hydrateCart,
} = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectGiftNote = (state: { cart: CartState }) =>
  state.cart.giftNote;

export const selectCartSummary = createSelector([selectCartItems], (items) =>
  cartService.getCartSummary(items),
);

export const selectTotalItemCount = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items).itemCount,
);

export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => cartService.getCartSummary(items).totalAmount,
);

export default cartSlice.reducer;
