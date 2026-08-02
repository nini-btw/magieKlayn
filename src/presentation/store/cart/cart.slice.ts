/**
 * Cart Redux slice
 * @module presentation/store/cart
 */

import { createSlice, createSelector, PayloadAction } from "@reduxjs/toolkit";
import type { SerializedProduct } from "@/domain/entities/product";
import type { CartItem } from "@/domain/entities/order";
import { cartService } from "@/application/services/cart.service";
import { MAX_BOX_CAPACITY } from "@/domain/rules/cart.rules";

/**
 * Box color choice — null means no box selected (default)
 */
export type BoxColor = "white" | "black";

/**
 * Cart state interface
 */
export interface CartState {
  items: CartItem[];
  giftNote: string | null;
  boxColor: BoxColor | null;
}

const initialState: CartState = {
  items: [],
  giftNote: null,
  boxColor: null,
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

      // If the cart now exceeds box capacity, drop any box selection
      const totalQty = result.items.reduce((s, i) => s + i.quantity, 0);
      if (totalQty > MAX_BOX_CAPACITY) {
        state.boxColor = null;
      }
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

      // If the cart now exceeds box capacity, drop any box selection
      const totalQty = result.items.reduce((s, i) => s + i.quantity, 0);
      if (totalQty > MAX_BOX_CAPACITY) {
        state.boxColor = null;
      }
    },

    clearCart: (state) => {
      const result = cartService.clearCart();
      state.items = result.items;
      state.giftNote = null;
      state.boxColor = null;
    },

    setGiftNote: (state, action: PayloadAction<string | null>) => {
      state.giftNote = action.payload;
    },

    setBoxColor: (state, action: PayloadAction<BoxColor | null>) => {
      state.boxColor = action.payload;
    },

    hydrateCart: (state, action: PayloadAction<CartState>) => {
      state.items = action.payload.items;
      state.giftNote = action.payload.giftNote;
      state.boxColor = action.payload.boxColor ?? null;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setGiftNote,
  setBoxColor,
  hydrateCart,
} = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectGiftNote = (state: { cart: CartState }) =>
  state.cart.giftNote;
export const selectBoxColor = (state: { cart: CartState }) =>
  state.cart.boxColor;

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

/**
 * Whether the cart currently qualifies for box packaging (max 4 bottles)
 */
export const selectIsBoxEligible = createSelector(
  [selectTotalItemCount],
  (itemCount) => itemCount > 0 && itemCount <= MAX_BOX_CAPACITY,
);

export default cartSlice.reducer;
