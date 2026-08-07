/**
 * Cart Redux slice
 * @module presentation/store/cart
 */

import { createSlice, createSelector, PayloadAction } from "@reduxjs/toolkit";
import type { SerializedProduct } from "@/domain/entities/product";
import type { CartItem } from "@/domain/entities/order";
import { cartService } from "@/application/services/cart.service";
import { getMaxBoxCount } from "@/domain/rules/cart.rules";

/**
 * Box color choice for a single box
 */
export type BoxColor = "white" | "black";

/**
 * Cart state interface.
 *
 * `boxColors` is one entry per box the customer has chosen to add — its
 * length is the box count (0 = no coffret packaging). Each box always
 * holds exactly MAX_BOX_CAPACITY bottles; any cart quantity beyond
 * `boxColors.length * MAX_BOX_CAPACITY` ships without a box.
 */
export interface CartState {
  items: CartItem[];
  giftNote: string | null;
  boxColors: BoxColor[];
}

const initialState: CartState = {
  items: [],
  giftNote: null,
  boxColors: [],
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

      // Trim any boxes that are no longer fillable rather than wiping the
      // whole selection — shouldn't normally shrink on addItem, but keeps
      // the invariant honest if this ever runs after a quantity decrease.
      const maxBoxes = getMaxBoxCount(result.items);
      if (state.boxColors.length > maxBoxes) {
        state.boxColors = state.boxColors.slice(0, maxBoxes);
      }
    },

    removeItem: (state, action: PayloadAction<string>) => {
      const result = cartService.removeItem(state.items, action.payload);
      state.items = result.items;

      const maxBoxes = getMaxBoxCount(result.items);
      if (state.boxColors.length > maxBoxes) {
        state.boxColors = state.boxColors.slice(0, maxBoxes);
      }
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

      // If the cart no longer supports as many boxes as chosen, trim the
      // selection down to what still fits instead of wiping it entirely.
      const maxBoxes = getMaxBoxCount(result.items);
      if (state.boxColors.length > maxBoxes) {
        state.boxColors = state.boxColors.slice(0, maxBoxes);
      }
    },

    clearCart: (state) => {
      const result = cartService.clearCart();
      state.items = result.items;
      state.giftNote = null;
      state.boxColors = [];
    },

    setGiftNote: (state, action: PayloadAction<string | null>) => {
      state.giftNote = action.payload;
    },

    /** Full replace — the cart page manages box count + per-box color
     * together and dispatches the whole array at once. */
    setBoxColors: (state, action: PayloadAction<BoxColor[]>) => {
      state.boxColors = action.payload;
    },

    hydrateCart: (state, action: PayloadAction<CartState>) => {
      state.items = action.payload.items;
      state.giftNote = action.payload.giftNote;
      state.boxColors = action.payload.boxColors ?? [];
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setGiftNote,
  setBoxColors,
  hydrateCart,
} = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectGiftNote = (state: { cart: CartState }) =>
  state.cart.giftNote;
export const selectBoxColors = (state: { cart: CartState }) =>
  state.cart.boxColors;

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
 * How many full boxes (each exactly MAX_BOX_CAPACITY bottles) the current
 * cart can support.
 */
export const selectMaxBoxCount = createSelector([selectCartItems], (items) =>
  getMaxBoxCount(items),
);

/**
 * Whether coffret packaging is offerable at all (needs >=1 full box worth
 * of bottles in the cart).
 */
export const selectIsBoxEligible = createSelector(
  [selectMaxBoxCount],
  (maxBoxes) => maxBoxes >= 1,
);

export default cartSlice.reducer;
