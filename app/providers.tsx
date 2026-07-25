"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Provider as ReduxProvider, useDispatch } from "react-redux";
import { NextIntlClientProvider } from 'next-intl';
import { store, type RootState } from "@/presentation/store";
import { hydrateCart } from "@/presentation/store/cart/cart.slice";
import { Header } from "@/presentation/components/features/Header";
import { Footer } from "@/presentation/components/features/Footer";
import { CartDrawer } from "@/presentation/components/features/CartDrawer";
import { ToastContainer } from "@/presentation/components/features/ToastContainer";

const CART_STORAGE_KEY = "crumbleivable-cart";

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

/**
 * App providers wrapper
 * Provides Redux store and common UI components
 * Excludes Header/Footer for admin routes
 */
export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ReduxProvider store={store}>
        <CartPersistenceProvider />
        <ClientProviders>{children}</ClientProviders>
      </ReduxProvider>
    </NextIntlClientProvider>
  );
}

/**
 * Cart persistence layer
 * - Hydrates cart from localStorage on mount
 * - Saves cart to localStorage on every change
 */
function CartPersistenceProvider() {
  const dispatch = useDispatch();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Restore Date objects for product timestamps
        const safeDate = (value: unknown) => {
          if (typeof value === "string") {
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d;
          }
          return new Date();
        };
        const items = (parsed.items || []).map((item: any) => ({
          ...item,
          product: {
            ...item.product,
            createdAt: safeDate(item.product?.createdAt),
            updatedAt: safeDate(item.product?.updatedAt),
          },
        }));
        dispatch(hydrateCart({
          items,
          cookingNote: parsed.cookingNote || null,
          giftNote: parsed.giftNote || null,
        }));
      }
    } catch {
      // ignore corrupted storage
    }

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const cartState = state.cart;
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
      } catch {
        // ignore storage errors
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}

// Client-only wrapper for components that need usePathname
function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header />}
      <main>{children}</main>
      {!isAdminRoute && <Footer />}
      <CartDrawer />
      <ToastContainer />
    </>
  );
}
