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

/**
 * Relative luminance (WCAG-ish, simplified sRGB version).
 * Used to decide whether hover text should switch to white
 * or stay at its default color, based on how dark/light the
 * product's accent color is.
 */
function getLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index = 0,
}) => {
  const dispatch = useDispatch();
  const t = useTranslations();
  const [isHovered, setIsHovered] = React.useState(false);

  const isSoldOut = Boolean(product.isSoldOut);
  const isNew = Boolean(product.isNew) && !isSoldOut;
  const accentColor = product.colorHex;

  // Light accents (e.g. #F7F1E7) keep default text color on hover;
  // only dark/saturated accents switch text to white for contrast.
  const needsWhiteText = React.useMemo(
    () => getLuminance(accentColor) < 0.6,
    [accentColor],
  );

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
      className="h-full"
    >
      <Link
        href={`/shop/${product.slug}`}
        className="product-card group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] transition-colors duration-700 ease-[var(--ease-luxury)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
        style={{ backgroundColor: isHovered ? accentColor : "#ffffff" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {(isNew || isSoldOut) && (
          <div className="absolute top-3 left-3 z-10">
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
          <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[var(--color-bg-soft)]">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className={`object-cover transition-opacity duration-700 ease-[var(--ease-luxury)] ${
                isSoldOut ? "opacity-50 grayscale" : ""
              }`}
              sizes="(max-width: 700px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading={index < 4 ? "eager" : "lazy"}
            />
          </div>
        ) : (
          <div
            className={`bottle relative flex aspect-[4/5] w-full shrink-0 items-center justify-center transition-opacity duration-700 ease-[var(--ease-luxury)] ${
              isSoldOut ? "opacity-50 grayscale" : ""
            }`}
            style={
              {
                "--liquid": accentColor,
                "--liquid-deep": accentColor,
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

        <div className="relative z-[2] flex min-h-[76px] items-start justify-between gap-2 p-4">
          <div className="min-w-0">
            <p
              className="product-name truncate transition-colors duration-700 ease-[var(--ease-luxury)]"
              style={{
                color: isHovered && needsWhiteText ? "#ffffff" : undefined,
              }}
            >
              {product.name}
            </p>
            <p
              className="product-meta transition-colors duration-700 ease-[var(--ease-luxury)]"
              style={{
                color: isHovered && needsWhiteText ? "#ffffff" : undefined,
              }}
            >
              {formatPrice(product.price)}
            </p>
          </div>

          {!isSoldOut && (
            <button
              type="button"
              className="icon-circle shrink-0 transition-transform duration-150 ease-out hover:scale-110 active:scale-95"
              style={{ backgroundColor: "#ffffff" }}
              onClick={handleAddToCart}
              aria-label={t("product.addToCart")}
              data-testid="add-to-cart-button"
            >
              <PlusIcon className="h-4 w-4" style={{ color: "#000000" }} />
            </button>
          )}
        </div>
      </Link>
    </motion.article>
  );
};
