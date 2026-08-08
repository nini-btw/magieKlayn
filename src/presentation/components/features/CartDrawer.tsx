"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, Trash2Icon, ShoppingBagIcon } from "lucide-react";
import { closeCart, selectCartOpen } from "@/presentation/store/ui/ui.slice";
import {
  selectCartItems,
  selectCartTotal,
  removeItem,
  updateQuantity,
} from "@/presentation/store/cart/cart.slice";
import { QuantityStepper } from "@/presentation/components/ui/QuantityStepper";
import { Button } from "@/presentation/components/ui/Button";
import { formatPrice } from "@/presentation/lib/utils";
import { slideInRight, fadeOverlay } from "@/presentation/lib/animations";
import { useTranslations } from "next-intl";

/**
 * Product visual: real photo on a soft tint of its signature color.
 * Falls back to a solid-color placeholder swatch if no photo exists yet.
 */
const ProductThumb: React.FC<{
  image?: string;
  colorHex: string;
  name: string;
}> = ({ image, colorHex, name }) => (
  <div
    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-(--radius-main)"
    style={{
      background: image
        ? `color-mix(in srgb, ${colorHex} 14%, white)`
        : colorHex,
    }}
  >
    {image && (
      <Image src={image} alt={name} fill className="object-contain p-2" />
    )}
  </div>
);

export const CartDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const t = useTranslations();
  const isOpen = useSelector(selectCartOpen);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(closeCart());
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            variants={fadeOverlay}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => dispatch(closeCart())}
          />

          <motion.aside
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-0 right-0 bottom-0 flex w-full max-w-md flex-col bg-(--color-white) shadow-(--shadow-soft)"
          >
            <div className="flex items-center justify-between border-b border-(--color-border) p-5">
              <h2 className="font-display text-2xl text-foreground">
                {t("cart.title")}
              </h2>
              <button
                onClick={() => dispatch(closeCart())}
                className="cursor-pointer rounded-full p-2 transition-colors duration-(--duration-base) ease-(--ease-luxury) hover:bg-(--color-bg-soft)"
                aria-label="Close cart"
              >
                <XIcon className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBagIcon className="mb-4 h-16 w-16 text-(--color-border)" />
                  <p className="text-(--color-text-secondary)">
                    {t("cart.empty")}
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 rounded-(--radius-card) border border-(--color-border) bg-(--color-white) p-3"
                  >
                    <ProductThumb
                      image={item.product.images?.[0]}
                      colorHex={item.product.colorHex}
                      name={item.product.name}
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-foreground">
                        {item.product.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-(--color-text-secondary)">
                        {formatPrice(item.product.price)}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(qty) =>
                            dispatch(
                              updateQuantity({
                                productId: item.product.id,
                                quantity: qty,
                              }),
                            )
                          }
                        />
                        <button
                          onClick={() => dispatch(removeItem(item.product.id))}
                          className="cursor-pointer p-2 text-(--color-text-secondary) transition-colors duration-(--duration-base) ease-(--ease-luxury) hover:text-red-500"
                          aria-label="Remove item"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-(--color-border) p-5">
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>{t("common.total")}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link href="/cart" onClick={() => dispatch(closeCart())}>
                <Button
                  fullWidth
                  disabled={items.length === 0}
                  className="!border-2 !border-foreground !bg-foreground !text-(--color-white) hover:!bg-transparent hover:!text-foreground disabled:!bg-(--color-bg-soft) disabled:!border-(--color-border) disabled:!text-(--color-text-secondary) cursor-pointer transition-colors duration-(--duration-base) ease-(--ease-luxury)"
                  data-testid="checkout-button"
                >
                  {t("cart.checkout")}
                </Button>
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
