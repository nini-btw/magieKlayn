"use client";

import { useState, useMemo, use, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/presentation/components/features/ProductCard";
import { useTranslations } from "next-intl";
import type { Product } from "@/domain/entities/product";

type SortValue = "name-asc" | "name-desc";

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsData = use(searchParams);
  const initialSort: SortValue =
    searchParamsData.sort === "name-desc" ? "name-desc" : "name-asc";

  const [sort, setSort] = useState<SortValue>(initialSort);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch products");
        }

        setProducts(result.data);

        // Debug: check that every product has a colorHex
        console.log("Products loaded:", result.data);
        console.table(
          result.data.map((p: Product) => ({
            name: p.name,
            colorHex: p.colorHex,
            hasColor: Boolean(p.colorHex),
          })),
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const sortedProducts = useMemo(() => {
    const result = [...products];
    result.sort((a, b) =>
      sort === "name-desc"
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name),
    );
    return result;
  }, [products, sort]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort as SortValue);
    const url = new URL(window.location.href);
    url.searchParams.set("sort", newSort);
    window.history.pushState({}, "", url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="section-description mx-auto">{t("common.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="text-[#c0392b]">
          {t("common.error")}: {error}
        </div>
      </div>
    );
  }

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
