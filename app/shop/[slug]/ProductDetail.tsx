"use client";

import * as React from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import type { Product, CookiePiece, CookieBox } from "@/domain/entities/product";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { QuantityStepper } from "@/presentation/components/ui/QuantityStepper";
import { addItem } from "@/presentation/store/cart/cart.slice";
import { addToast } from "@/presentation/store/ui/ui.slice";
import { formatPrice } from "@/presentation/lib/utils";
import { fadeInUp } from "@/presentation/lib/animations";
import { useTranslations } from 'next-intl';

// Map product slugs to image filenames (same as ProductCard)
const getProductImage = (slug: string): string => {
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

/**
 * Product detail component (client-side interactivity)
 */
export const ProductDetail: React.FC<{ product: Product }> = ({ product }) => {
  const dispatch = useDispatch();
  const t = useTranslations();
  const [quantity, setQuantity] = React.useState(1);
  const isCookie = product.type === "cookie";
  const cookie = isCookie ? (product as CookiePiece) : null;
  const box = !isCookie ? (product as CookieBox) : null;

  // Get the main image for this product
  const mainImage = product.images?.[0] || getProductImage(product.slug);

  const handleAddToCart = () => {
    if (isCookie && cookie?.isSoldOut) {
      dispatch(
        addToast({
          message: t("shop.soldOut"),
          type: "error",
        })
      );
      return;
    }

    // Serialize product to avoid Redux non-serializable value errors
    // Convert Date objects to ISO strings
    const serializedProduct = {
      ...product,
      createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : null,
      updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : null,
    };

    // Cast to unknown first to bypass type checking, then to Product
    dispatch(addItem({ product: serializedProduct as unknown as Product, quantity }));
    dispatch(
      addToast({
        message: `${quantity}x ${product.name} ${t("product.added")}`,
        type: "success",
      })
    );
    setQuantity(1);
  };

  return (
    <div data-testid="product-detail" className="my-4 grid gap-12 lg:grid-cols-2">
      {/* Images */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        {/* Main Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-pink-50">
          <Image src={mainImage} alt={product.name} fill className="object-cover" priority />
          {isCookie && cookie?.isNew && (
            <div className="absolute top-4 left-4">
              <Badge variant="new">{t("shop.new")}</Badge>
            </div>
          )}
          {isCookie && cookie?.isSoldOut && (
            <div className="absolute top-4 left-4">
              <Badge variant="soldOut">{t("shop.soldOut")}</Badge>
            </div>
          )}
        </div>
      </motion.div>

      {/* Details */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="space-y-6">
        {/* Type badge */}
        <div>
          <Badge variant="outline" className="mb-4">
            {isCookie ? t("shop.filters.cookies") : t("shop.filters.boxes")}
          </Badge>
          <h1 className="font-display text-brown-900 text-4xl sm:text-5xl">{product.name}</h1>
        </div>

        {/* Price */}
        <p className="text-brown-900 text-3xl font-extrabold tabular-nums">
          {formatPrice(product.price)}
        </p>

        {/* Description */}
        <p className="text-brown-700 text-lg leading-relaxed">{product.description}</p>

        {/* Cookie-specific info */}
        {isCookie && cookie && (
          <>
            {/* Flavour */}
            {cookie.flavour && (
              <div>
                <h3 className="text-brown-400 mb-2 text-xs font-bold tracking-widest uppercase">
                  {t("product.flavour")}
                </h3>
                <p className="text-brown-700 text-lg font-medium">{cookie.flavour}</p>
              </div>
            )}
            
            {/* Allergens */}
            {cookie.allergens.length > 0 && (
              <div>
                <h3 className="text-brown-400 mb-3 text-xs font-bold tracking-widest uppercase">
                  {t("product.allergens")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cookie.allergens.map((allergen) => (
                    <span
                      key={allergen}
                      className="bg-sand text-brown-700 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Box-specific info */}
        {!isCookie && box && box.includedCookies?.length > 0 && (
          <div className="bg-pink-50/50 rounded-2xl p-5">
            <h3 className="text-brown-400 mb-4 text-xs font-bold tracking-widest uppercase">
              {t("product.boxContents")}
            </h3>
            <ul className="space-y-3">
              {box.includedCookies.map((item, index) => (
                <li key={index} className="text-brown-700 flex items-center gap-3">
                  <div className="bg-pink-100 rounded-full p-1">
                    <CheckIcon className="h-4 w-4 text-pink-500" />
                  </div>
                  <span className="font-medium">{item.quantity}x</span>
                  <span className="text-brown-800">{item.productName || "Cookie"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quantity & Add to Cart */}
        <div className="border-brown-100 space-y-4 border-t pt-6">
          <div className="flex items-center gap-4">
            <span className="text-brown-700 text-sm font-semibold">{t("product.quantity")}:</span>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              disabled={isCookie && cookie?.isSoldOut}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAddToCart}
            disabled={isCookie && cookie?.isSoldOut}
          >
            {isCookie && cookie?.isSoldOut ? t("shop.soldOut") : t("shop.addToCart")}
          </Button>
        </div>

        {/* Note */}
        <p className="text-brown-400 text-sm">
          {t("build.completeSelection")}. {t("common.free")} {t("common.delivery")}.
        </p>
      </motion.div>
    </div>
  );
};
