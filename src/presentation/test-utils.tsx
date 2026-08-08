/**
 * Shared render helper for component tests
 * @module presentation/test-utils
 *
 * Wraps RTL's render() with the two providers almost every component
 * needs: a real (but test-configurable) Redux store, and next-intl fed
 * the real en.json catalog (avoids missing-key noise vs. a stub).
 */
import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { NextIntlClientProvider } from "next-intl";
import cartReducer from "./store/cart/cart.slice";
import uiReducer from "./store/ui/ui.slice";
import messages from "../../messages/en.json";

// combineReducers (rather than handing the reducer map straight to
// configureStore) gives Redux's own PreloadedState<S> inference a
// concrete State type to work from, so a caller can preload just the
// slice(s) it cares about — the pattern RTK's own testing docs use.
const rootReducer = combineReducers({ cart: cartReducer, ui: uiReducer });
export type TestPreloadedState = Partial<ReturnType<typeof rootReducer>>;

export function createTestStore(preloadedState?: TestPreloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ["cart"],
          ignoredActions: ["cart/hydrateCart", "cart/addItem"],
        },
      }),
  });
}

export type TestStore = ReturnType<typeof createTestStore>;

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: TestPreloadedState;
  store?: TestStore;
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, store = createTestStore(preloadedState), ...renderOptions }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <NextIntlClientProvider locale="en" messages={messages}>
          {children}
        </NextIntlClientProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from "@testing-library/react";
