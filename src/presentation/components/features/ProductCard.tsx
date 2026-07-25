"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { PlusIcon } from "lucide-react";
import type { Product } from "@/domain/entities/product";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/Card";
import { Badge } from "@/presentation/components/ui/Badge";
import { Button } from "@/presentation/components/ui/Button";
import { addItem } from "@/presentation/store/cart/cart.slice";
import { addToast } from "@/presentation/store/ui/ui.slice";
import { formatPrice } from "@/presentation/lib/utils";
import { gridItem } from "@/presentation/lib/animations";
import { useTranslations } from "next-intl";

export interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index = 0,
}) => {
  const dispatch = useDispatch();
  const t = useTranslations();
  const isBox = product.type === "box";

  let badge: string | null = null;
  let badgeVariant: "new" | "soldOut" | "pink" = "new";
  if (!isBox) {
    const cookie = product as { isNew?: boolean; isSoldOut?: boolean };
    if (cookie.isSoldOut) {
      badge = t("shop.soldOut");
      badgeVariant = "soldOut";
    } else if (cookie.isNew) {
      badge = t("shop.new");
      badgeVariant = "new";
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.type === "cookie") {
      const cookie = product as { isSoldOut?: boolean };
      if (cookie.isSoldOut) return;
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

    // Cast to unknown first to bypass type checking, then to Product
    dispatch(
      addItem({
        product: serializedProduct as unknown as Product,
        quantity: 1,
      }),
    );
    dispatch(
      addToast({
        message: `${product.name} ${t("product.added")}`,
        type: "success",
      }),
    );
  };

  // Get product image - use product.images if available, otherwise fall back to mapping
  const getProductImage = (product: Product) => {
    // First priority: use the uploaded product image
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }

    // Fallback: map product slugs to default images
    const imageMap: Record<string, string> = {
      // cookies
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
    return imageMap[product.slug] || "/images/bueno.png";
  };

  return (
    <motion.article
      variants={gridItem}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.05 }}
      data-testid="product-card"
      data-product-type={product.type}
    >
      <Link href={`/shop/${product.slug}`} className="cursor-pointer">
        <Card className="group flex h-full cursor-pointer flex-col">
          <div className="relative aspect-square overflow-hidden bg-[#FFF0F5]">
            <Image
              src={getProductImage(product)}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading={index < 4 ? "eager" : "lazy"}
            />
            {badge && (
              <div className="absolute top-3 left-3">
                <Badge variant={badgeVariant}>{badge}</Badge>
              </div>
            )}
            {isBox && (
              <div className="absolute top-3 left-3">
                <Badge variant="pink">{t("shop.filters.boxes")}</Badge>
              </div>
            )}
          </div>

          <CardHeader className="flex-1">
            <h3 className="mb-1 line-clamp-1 text-base leading-snug font-bold text-[#2C1810]">
              {product.name}
            </h3>
            <p className="line-clamp-2 text-sm text-[#A07850]">
              {product.description}
            </p>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#2C1810]">
                {formatPrice(product.price)}
              </span>
              <Button
                variant="primary"
                size="sm"
                className="cursor-pointer !rounded-full !p-2.5"
                onClick={handleAddToCart}
                disabled={badge === t("shop.soldOut")}
                data-testid="add-to-cart-button"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.article>
  );
};
