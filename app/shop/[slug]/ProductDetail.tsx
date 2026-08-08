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
import { fadeInUp } from "@/presentation/lib/animations";
import { useTranslations } from "next-intl";

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

    dispatch(addItem({ product: serializedProduct, quantity }));
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
      className="mx-auto my-4 grid max-w-[1440px] gap-12 px-[var(--space-md)] py-[var(--space-lg)] sm:px-[var(--space-lg)] lg:grid-cols-2 lg:px-[var(--space-2xl)]"
    >
      {/* Visual */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/*
          Photos already have their own white product-shot background, so a
          solid full-strength colorHex behind them (e.g. pure black) reads as
          a broken frame. Real photos get a soft tint instead; the fallback
          illustration — designed to sit directly on the color — keeps the
          full colorHex.
        */}
        <div
          className="product-detail-visual"
          style={{
            backgroundColor: hasPhoto
              ? `color-mix(in srgb, ${product.colorHex} 14%, white)`
              : product.colorHex,
          }}
        >
          {hasPhoto ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
            />
          ) : (
            <div className="bottle bottle-lg">
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
        {product.gender && (
          <Badge variant={product.gender === "unisex" ? "unisex" : "gender"}>
            {t(`product.gender.${product.gender}`)}
          </Badge>
        )}

        {/* Price */}
        <p className="text-[var(--color-text)] text-3xl font-extrabold tabular-nums">
          {formatPrice(product.price)}
        </p>

        {/* Description — "inspired by X" is folded into the same paragraph,
            colored with the product's own signature color so it reads as a
            highlighted detail rather than a separate spec/callout. */}
        <p className="section-description max-w-none text-lg">
          {product.description}
          {product.inspiredBy && (
            <>
              {" "}
              <span
                className="product-detail-inspired-inline"
                style={{ color: product.colorHex }}
              >
                {t("about.inspiredByPrefix")} {product.inspiredBy}
              </span>
            </>
          )}
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
            size="lg"
            fullWidth
            onClick={handleAddToCart}
            disabled={product.isSoldOut}
            className={`!border-2 ${
              product.isSoldOut
                ? "!border-[var(--color-border)] !bg-[var(--color-bg-soft)] !text-[var(--color-text-secondary)]"
                : "!border-[var(--color-text)] !bg-[var(--color-text)] !text-[var(--color-white)] hover:!bg-transparent hover:!text-[var(--color-text)]"
            }`}
          >
            {product.isSoldOut ? t("shop.soldOut") : t("shop.addToCart")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
