"use client";

import { useState, useMemo, use, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/presentation/components/features/ProductCard";
import { Button } from "@/presentation/components/ui/Button";
import { Select } from "@/presentation/components/ui/Select";
import { useTranslations } from 'next-intl';
import type { Product } from "@/domain/entities/product";

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsData = use(searchParams);
  const filter = typeof searchParamsData.filter === "string" ? searchParamsData.filter : "all";
  const initialSort = typeof searchParamsData.sort === "string" ? searchParamsData.sort : "popular";
  
  const [sort, setSort] = useState(initialSort);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();

  // Sort options
  const sortOptions = [
    { value: "popular", label: t("shop.sort.name") },
    { value: "newest", label: t("shop.sort.newest") },
    { value: "price-asc", label: t("shop.sort.priceLow") },
    { value: "price-desc", label: t("shop.sort.priceHigh") },
  ];

  // Fetch products from API
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    if (filter === "cookies") {
      result = result.filter((p) => p.type === "cookie");
    } else if (filter === "boxes") {
      result = result.filter((p) => p.type === "box");
    }
    
    if (sort === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return result;
  }, [products, filter, sort]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    const url = new URL(window.location.href);
    url.searchParams.set("sort", newSort);
    window.history.pushState({}, "", url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#A07850]">{t("common.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{t("common.error")}: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="bg-[#F0E6D6]/30 py-16">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 max-w-[1400px]">
          <h1 className="font-display text-4xl sm:text-5xl text-[#2C1810] mb-4">
            {t("shop.title")}
          </h1>
          <p className="text-[#A07850] max-w-xl">
            {t("shop.subtitle")}
          </p>
        </div>
      </section>

      <div className="sticky top-16 z-30 bg-[#FDF6EE]/95 backdrop-blur-md border-b border-[#E8D5C0]">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 max-w-[1400px] py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              {[
                { value: "all", label: t("shop.filters.all") },
                { value: "cookies", label: t("shop.filters.cookies") },
                { value: "boxes", label: t("shop.filters.boxes") },
              ].map((tab) => (
                <Link
                  key={tab.value}
                  href={`/shop?filter=${tab.value}&sort=${sort}`}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                    filter === tab.value
                      ? "bg-[#F4538A] text-white"
                      : "bg-[#F0E6D6] text-[#5C3D2E] hover:bg-[#FFF0F5]"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            <div className="ml-auto">
              <Select
                value={sort}
                onChange={handleSortChange}
                options={sortOptions}
                placeholder={t("common.sortBy")}
                size="md"
                variant="filled"
                className="w-44"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 lg:py-24">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 max-w-[1400px]">
          {filteredProducts.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#A07850] text-lg">
                {t("shop.noProducts")}
              </p>
              <Link href="/shop" className="mt-4 inline-block">
                <Button variant="ghost">{t("common.viewAll")}</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
