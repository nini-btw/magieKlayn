"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { PlusIcon } from "lucide-react";
import type { Product } from "@/domain/entities/product";
import { addItem } from "@/presentation/store/cart/cart.slice";
import { addToast } from "@/presentation/store/ui/ui.slice";
import { formatPrice } from "@/presentation/lib/utils";
import { gridItem } from "@/presentation/lib/animations";
import { useTranslations } from "next-intl";

export interface ProductCardProps {
  product: Product;
  index?: number;
}

// Fallback liquid gradient for products that haven't been assigned their own
// bottle color yet, so the illustration never renders unfilled.
const DEFAULT_LIQUID = "#e2264a";
const DEFAULT_LIQUID_DEEP = "#a3172c";

/**
 * Darkens a hex color by a given amount (0–1). Used to derive a "deep"
 * shade for the bottle-liquid gradient from a single stored colorHex,
 * since Product only stores one signature color per fragrance.
 */
function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const darken = (channel: number) =>
    Math.max(0, Math.round(channel * (1 - amount)));

  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

  return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index = 0,
}) => {
  const dispatch = useDispatch();
  const t = useTranslations();

  const isSoldOut = Boolean(product.isSoldOut);
  const isNew = Boolean(product.isNew) && !isSoldOut;

  // Signature color used for the hover wash — falls back safely if a
  // product hasn't been assigned one yet.
  const accentColor = product.colorHex || DEFAULT_LIQUID;

  // Bottle-liquid gradient derived from the single stored colorHex, since
  // Product doesn't carry separate liquidColor/liquidColorDeep fields.
  const liquidColor = product.colorHex || DEFAULT_LIQUID;
  const liquidColorDeep = product.colorHex
    ? darkenHex(product.colorHex, 0.25)
    : DEFAULT_LIQUID_DEEP;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSoldOut) return;

    const serializedProduct = {
      ...product,
      createdAt: product.createdAt
        ? new Date(product.createdAt).toISOString()
        : null,
      updatedAt: product.updatedAt
        ? new Date(product.updatedAt).toISOString()
        : null,
    };

    dispatch(addItem({ product: serializedProduct, quantity: 1 }));
    dispatch(
      addToast({
        message: `${product.name} ${t("product.added")}`,
        type: "success",
      }),
    );
  };

  const hasPhoto = Boolean(product.images && product.images.length > 0);

  return (
    <motion.article
      variants={gridItem}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.05 }}
      data-testid="product-card"
    >
      <Link
        href={`/shop/${product.slug}`}
        className="product-card group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white transition-shadow duration-[var(--duration-base)] ease-[var(--ease-luxury)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
        style={{ "--product-color": accentColor } as React.CSSProperties}
      >
        {(isNew || isSoldOut) && (
          <div className="absolute top-3 left-3 z-20">
            {isSoldOut ? (
              <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] backdrop-blur-sm">
                {t("shop.soldOut")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text)] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("shop.new")}
              </span>
            )}
          </div>
        )}

        {hasPhoto ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--color-bg-soft)]">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className={`object-cover ${isSoldOut ? "opacity-50 grayscale" : ""}`}
              sizes="(max-width: 700px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading={index < 4 ? "eager" : "lazy"}
            />
            {/* Color-wash overlay: fades in on hover, tinted with the
                product's own signature color instead of scaling the image. */}
            {!isSoldOut && (
              <div
                className="pointer-events-none absolute inset-0 bg-[var(--product-color)] opacity-0 mix-blend-multiply transition-opacity duration-[var(--duration-base)] ease-[var(--ease-luxury)] group-hover:opacity-25"
                aria-hidden="true"
              />
            )}
          </div>
        ) : (
          <div
            className={`bottle relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden transition-colors duration-[var(--duration-base)] ease-[var(--ease-luxury)] ${
              isSoldOut
                ? "opacity-50 grayscale"
                : "group-hover:bg-[var(--product-color)]/10"
            }`}
            style={
              {
                "--liquid": liquidColor,
                "--liquid-deep": liquidColorDeep,
              } as React.CSSProperties
            }
          >
            <span className="bottle-cap" />
            <span className="bottle-shoulder" />
            <div className="bottle-label">
              <span className="bottle-label-brand">Magie Klayn</span>
              <span className="bottle-label-name">{product.name}</span>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 p-4">
          <div className="min-w-0">
            <p className="product-name truncate">{product.name}</p>
            <p className="product-meta">{formatPrice(product.price)}</p>
          </div>

          {!isSoldOut && (
            <button
              type="button"
              className="icon-circle shrink-0 transition-transform duration-150 ease-out hover:scale-110 active:scale-95"
              onClick={handleAddToCart}
              aria-label={t("product.addToCart")}
              data-testid="add-to-cart-button"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </Link>
    </motion.article>
  );
};
