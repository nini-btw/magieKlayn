/**
 * Redux store configuration
 * @module presentation/store
 */

import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cart/cart.slice";
import uiReducer from "./ui/ui.slice";

/**
 * Redux store
 */
export const store = configureStore({
  reducer: {
    cart: cartReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Cart stores full Product entities with Date fields; ignore the whole slice
        ignoredPaths: ["cart"],
        ignoredActions: ["cart/hydrateCart", "cart/addItem"],
      },
    }),
  devTools: {
    serialize: {
      options: {
        date: true,
      },
    },
  },
});

/**
 * Store type exports
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
