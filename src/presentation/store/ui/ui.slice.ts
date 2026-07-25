/**
 * UI Redux slice
 * @module presentation/store/ui
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * Toast notification interface
 */
export interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
}

/**
 * UI state interface
 */
export interface UIState {
  cartOpen: boolean;
  mobileMenuOpen: boolean;
  toasts: Toast[];
}

/**
 * Initial UI state
 */
const initialState: UIState = {
  cartOpen: false,
  mobileMenuOpen: false,
  toasts: [],
};

/**
 * UI slice with reducers
 */
export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /**
     * Open cart drawer
     */
    openCart: (state) => {
      state.cartOpen = true;
    },

    /**
     * Close cart drawer
     */
    closeCart: (state) => {
      state.cartOpen = false;
    },

    /**
     * Toggle cart drawer
     */
    toggleCart: (state) => {
      state.cartOpen = !state.cartOpen;
    },

    /**
     * Open mobile menu
     */
    openMobileMenu: (state) => {
      state.mobileMenuOpen = true;
    },

    /**
     * Close mobile menu
     */
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },

    /**
     * Add toast notification
     */
    addToast: (state, action: PayloadAction<Omit<Toast, "id">>) => {
      const id = Math.random().toString(36).substring(7);
      state.toasts.push({ ...action.payload, id });
    },

    /**
     * Remove toast by ID
     */
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    /**
     * Clear all toasts
     */
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

/**
 * Export actions
 */
export const {
  openCart,
  closeCart,
  toggleCart,
  openMobileMenu,
  closeMobileMenu,
  toggleMobileMenu,
  addToast,
  removeToast,
  clearToasts,
} = uiSlice.actions;

/**
 * Selectors
 */
export const selectCartOpen = (state: { ui: UIState }) => state.ui.cartOpen;
export const selectMobileMenuOpen = (state: { ui: UIState }) =>
  state.ui.mobileMenuOpen;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;

export default uiSlice.reducer;
