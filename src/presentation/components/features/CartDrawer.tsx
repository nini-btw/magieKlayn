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
  selectCanCheckout,
  selectCookiesNeeded,
  selectCartProgress,
  removeItem,
  updateQuantity,
} from "@/presentation/store/cart/cart.slice";
import { QuantityStepper } from "@/presentation/components/ui/QuantityStepper";
import { Button } from "@/presentation/components/ui/Button";
import { formatPrice } from "@/presentation/lib/utils";
import { slideInRight, fadeOverlay } from "@/presentation/lib/animations";
import { useTranslations } from 'next-intl';

export const CartDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const t = useTranslations();
  const isOpen = useSelector(selectCartOpen);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const canCheckout = useSelector(selectCanCheckout);
  const cookiesNeeded = useSelector(selectCookiesNeeded);
  const progress = useSelector(selectCartProgress);

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

  const getProductImage = (slug: string) => {
    const imageMap: Record<string, string> = {
      chocoShips: "/images/chocoShips.png",
      mm: "/images/mm.png",
      pistash: "/images/pistash.png",
      viola: "/images/viola.png",
      peanut: "/images/peanut.png",
      ben10: "/images/ben10.png",
      lotus: "/images/lotus.png",
      strawbery: "/images/strawbery.png",

      // boxes
      bueno: "/images/bueno.png",
      kinder: "/images/kinder.png",
      tiramisu: "/images/tiramisu.png",
    };
    return imageMap[slug] || "/images/bueno.png";
  };

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
            className="absolute inset-0 bg-[#2C1810]/40 backdrop-blur-sm"
            onClick={() => dispatch(closeCart())}
          />

          <motion.aside
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-0 right-0 bottom-0 flex w-full max-w-md flex-col bg-[#FDF6EE] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E8D5C0] p-5">
              <h2 className="font-display text-2xl text-[#2C1810]">{t("cart.title")}</h2>
              <button
                onClick={() => dispatch(closeCart())}
                className="cursor-pointer rounded-full p-2 transition-colors hover:bg-[#FFF0F5]"
                aria-label="Close cart"
              >
                <XIcon className="h-5 w-5 text-[#5C3D2E]" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBagIcon className="mb-4 h-16 w-16 text-[#E8D5C0]" />
                  <p className="text-[#A07850]">{t("cart.empty")}</p>
                  <p className="mt-1 text-sm text-[#A07850]">{t("home.features.fresh.desc")}</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 rounded-2xl border border-[#E8D5C0] bg-white p-3"
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-[#FFF0F5]">
                      <Image
                        src={getProductImage(item.product.slug)}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-[#2C1810]">
                        {item.product.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-[#A07850]">
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
                              })
                            )
                          }
                        />
                        <button
                          onClick={() => dispatch(removeItem(item.product.id))}
                          className="cursor-pointer p-2 text-[#A07850] transition-colors hover:text-red-500"
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

            {!canCheckout && items.length > 0 && (
              <div className="mx-5 mb-3 rounded-2xl border border-[#FFD6E7] bg-[#FFF0F5] p-4">
                <p data-testid="cookies-needed" className="text-center text-sm font-medium text-[#5C3D2E]">
                  {t("build.completeSelection")}: {cookiesNeeded} 🍪
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#FFD6E7]">
                  <motion.div
                    className="h-full rounded-full bg-[#F4538A]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 border-t border-[#E8D5C0] p-5">
              <div className="flex justify-between text-lg font-bold text-[#2C1810]">
                <span>{t("common.total")}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link href="/cart" onClick={() => dispatch(closeCart())}>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={!canCheckout && items.length > 0}
                  className="cursor-pointer"
                  data-testid="checkout-button"
                >
                  {canCheckout ? t("cart.checkout") : `${t("build.completeSelection")} (${cookiesNeeded})`}
                </Button>
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
