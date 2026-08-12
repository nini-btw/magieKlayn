"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductCard } from "@/presentation/components/features/ProductCard";
import { useTranslations } from "next-intl";
import type { Product } from "@/domain/entities/product";

type SortValue = "name-asc" | "name-desc";

export function ShopPageClient({
  initialProducts,
  initialSort,
}: {
  initialProducts: Product[];
  initialSort: SortValue;
}) {
  const [sort, setSort] = useState<SortValue>(initialSort);
  const t = useTranslations();

  const sortedProducts = useMemo(() => {
    const result = [...initialProducts];
    result.sort((a, b) =>
      sort === "name-desc"
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name),
    );
    return result;
  }, [initialProducts, sort]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort as SortValue);
    const url = new URL(window.location.href);
    url.searchParams.set("sort", newSort);
    window.history.pushState({}, "", url);
  };

  return (
    <div className="min-h-screen overflow-x">
      <div className="page-hero">
        <p className="eyebrow">{t("shop.eyebrow")}</p>
        <h1 className="section-title mb-4">{t("shop.title")}</h1>
        <p className="section-description">{t("shop.subtitle")}</p>
      </div>

      <section className="collection">
        {sortedProducts.length > 0 ? (
          <div className="product-grid ">
            {sortedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center sm:py-20">
            <p className="section-description mx-auto">
              {t("shop.noProducts")}
            </p>
            <Link href="/shop" className="text-link">
              {t("common.viewAll")}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
