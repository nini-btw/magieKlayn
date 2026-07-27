"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import type { Product } from "@/domain/entities/product";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { QuantityStepper } from "@/presentation/components/ui/QuantityStepper";
import { addItem } from "@/presentation/store/cart/cart.slice";
import { addToast } from "@/presentation/store/ui/ui.slice";
import { formatPrice } from "@/presentation/lib/utils";
import { getLiquidStyle } from "@/presentation/lib/colors";
import { fadeInUp } from "@/presentation/lib/animations";
import { useTranslations } from "next-intl";

/**
 * Product detail component (client-side interactivity)
 *
 * Single product type in this brand (fragrance) — no cookie/box branching.
 * Visual defaults to the on-brand `.bottle` illustration, colored from
 * `product.colorHex`, per DESIGN-SYSTEM.md: "color comes from the product
 * itself." Falls back to a real photo only if `product.images` has one.
 */
export const ProductDetail: React.FC<{ product: Product }> = ({ product }) => {
  const dispatch = useDispatch();
  const t = useTranslations();
  const [quantity, setQuantity] = React.useState(1);

  const hasPhoto = product.images.length > 0;

  const handleAddToCart = () => {
    if (product.isSoldOut) {
      dispatch(addToast({ message: t("shop.soldOut"), type: "error" }));
      return;
    }

    // Serialize product to avoid Redux non-serializable value errors
    const serializedProduct = {
      ...product,
      createdAt: product.createdAt
        ? new Date(product.createdAt).toISOString()
        : null,
      updatedAt: product.updatedAt
        ? new Date(product.updatedAt).toISOString()
        : null,
    };

    dispatch(
      addItem({ product: serializedProduct as unknown as Product, quantity }),
    );
    dispatch(
      addToast({
        message: `${quantity}x ${product.name} ${t("product.added")}`,
        type: "success",
      }),
    );
    setQuantity(1);
  };

  return (
    <div
      data-testid="product-detail"
      className="my-4 grid gap-12 lg:grid-cols-2"
    >
      {/* Visual */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="product-detail-visual">
          {hasPhoto ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="bottle bottle-lg"
              style={getLiquidStyle(product.colorHex)}
            >
              <div className="bottle-cap" />
              <div className="bottle-shoulder" />
              <div className="bottle-label">
                <span className="bottle-label-brand">Magie Klayn</span>
                <span className="bottle-label-name">{product.name}</span>
                <span className="bottle-label-sub">{product.sizeMl}ml</span>
              </div>
            </div>
          )}

          {product.isNew && (
            <div className="product-detail-badge">
              <Badge variant="new">{t("shop.new")}</Badge>
            </div>
          )}
          {product.isSoldOut && (
            <div className="product-detail-badge">
              <Badge variant="soldOut">{t("shop.soldOut")}</Badge>
            </div>
          )}
        </div>
      </motion.div>

      {/* Details */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Breadcrumb — sits above the name, as requested */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/shop">{t("shop.title")}</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        <h1 className="section-title">{product.name}</h1>

        {/* Price */}
        <p className="text-[var(--color-text)] text-3xl font-extrabold tabular-nums">
          {formatPrice(product.price)}
        </p>

        {/* Description */}
        <p className="section-description max-w-none text-lg">
          {product.description}
        </p>

        {/* Fragrance notes */}
        {product.notes.length > 0 && (
          <div>
            <h3 className="eyebrow">{t("product.notes")}</h3>
            <div className="note-chip-list">
              {product.notes.map((note) => (
                <span key={note} className="note-chip">
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Specs */}
        <div className="product-detail-specs">
          <div>
            <div className="product-detail-spec-label">{t("product.size")}</div>
            <div className="product-detail-spec-value">{product.sizeMl}ml</div>
          </div>
        </div>

        {/* Quantity & Add to Cart */}
        <div className="border-[var(--color-border)] space-y-4 border-t pt-6">
          <div className="flex items-center gap-4">
            <span className="text-[var(--color-text)] text-sm font-semibold">
              {t("product.quantity")}:
            </span>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              disabled={product.isSoldOut}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAddToCart}
            disabled={product.isSoldOut}
          >
            {product.isSoldOut ? t("shop.soldOut") : t("shop.addToCart")}
          </Button>
        </div>

        {/* Note */}
        <p className="text-[var(--color-text-secondary)] text-sm">
          {t("common.free")} {t("common.delivery")}.
        </p>
      </motion.div>
    </div>
  );
};
