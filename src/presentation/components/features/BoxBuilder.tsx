"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckIcon, XIcon } from "lucide-react";
import { QuantityStepper } from "@/presentation/components/ui/QuantityStepper";
import type { Product } from "@/domain/entities/product";

export type BoxItem = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
};

type BoxBuilderProps = {
  selectedItems: BoxItem[];
  onItemsChange: (items: BoxItem[], products?: Product[]) => void;
  t: (key: string) => string;
  mode: "admin" | "customer";
};

const MIN_COOKIES = 3;

export function BoxBuilder({ selectedItems, onItemsChange, t, mode }: BoxBuilderProps) {
  const [cookies, setCookies] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const isCustomerMode = mode === "customer";

  useEffect(() => {
    async function fetchCookies() {
      try {
        const url = isCustomerMode
          ? "/api/products/cookies"
          : "/api/products/cookies?includeInactive=true";
        const response = await fetch(url);
        const result = await response.json();
        if (result.success) {
          setCookies(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch cookies:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCookies();
  }, [isCustomerMode]);

  const toggleCookie = (cookie: Product) => {
    const existing = selectedItems.find((item) => item.productId === cookie.id);
    let newItems: BoxItem[];
    if (existing) {
      newItems = selectedItems.filter((item) => item.productId !== cookie.id);
    } else {
      newItems = [
        ...selectedItems,
        {
          productId: cookie.id,
          productName: cookie.name,
          productImage: cookie.images?.[0],
          quantity: 1,
        },
      ];
    }
    onItemsChange(newItems, cookies);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    let newItems: BoxItem[];
    if (quantity <= 0) {
      newItems = selectedItems.filter((item) => item.productId !== productId);
    } else {
      newItems = selectedItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    }
    onItemsChange(newItems, cookies);
  };

  const removeItem = (productId: string) => {
    const newItems = selectedItems.filter((item) => item.productId !== productId);
    onItemsChange(newItems, cookies);
  };

  const totalCookies = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const isValid = totalCookies >= MIN_COOKIES;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-[#A07850]">{t("common.loading")}</div>
      </div>
    );
  }

  // Customer mode: full layout with step indicator style
  if (isCustomerMode) {
    return (
      <div className="space-y-6">
        {/* Progress bar */}
        <div className="mb-8 rounded-2xl border border-[#F4538A]/20 bg-[#FFF0F5] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-[#5C3D2E]">
              {totalCookies} / {MIN_COOKIES} {t("common.quantity").toLowerCase()}
            </span>
            <span className="font-bold text-[#F4538A]">
              {isValid
                ? "✓ " + t("checkout.success")
                : `${MIN_COOKIES - totalCookies} ${t("build.pieces")}`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F4538A]/10">
            <div
              className="h-full rounded-full bg-[#F4538A] transition-all duration-300"
              style={{ width: `${Math.min((totalCookies / MIN_COOKIES) * 100, 100)}%` }}
            />
          </div>
          {!isValid && (
            <p className="mt-2 text-sm text-red-500">
              {t("build.completeSelection")}: {MIN_COOKIES - totalCookies} 🍪
            </p>
          )}
        </div>

        {/* Cookie Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cookies.map((cookie) => {
            const selected = selectedItems.some((item) => item.productId === cookie.id);
            return (
              <button
                key={cookie.id}
                onClick={() => toggleCookie(cookie)}
                className={`group relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-200 ${
                  selected
                    ? "border-[#F4538A] bg-[#FFF0F5] shadow-[0_0_0_3px_rgba(244,83,138,0.15)]"
                    : "border-[#E8D5C0] bg-white hover:border-[#F4538A]/30"
                }`}
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#FFF0F5] sm:h-24 sm:w-24">
                  <Image
                    src={cookie.images[0] || "/images/box1.png"}
                    alt={cookie.name}
                    fill
                    className="object-cover"
                  />
                  {selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#F4538A]/40">
                      <CheckIcon className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <span className="line-clamp-2 text-center text-xs font-bold leading-tight text-[#2C1810] sm:text-sm">
                  {cookie.name}
                </span>
                <span className="text-xs tabular-nums text-[#A07850]">
                  {cookie.price} {t("common.currency")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected items list */}
        {selectedItems.length > 0 && (
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(44,24,16,0.08)]">
            <h3 className="font-display text-lg text-[#2C1810]">{t("build.yourBox")}</h3>
            {selectedItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-xl bg-[#F0E6D6]/30 p-3"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#FFF0F5]">
                  <Image
                    src={item.productImage || "/images/box1.png"}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-[#2C1810]">
                    {item.productName}
                  </h4>
                </div>
                <QuantityStepper
                  value={item.quantity}
                  onChange={(q) => updateQuantity(item.productId, q)}
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Admin mode: compact layout for modal
  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="flex items-center justify-between rounded-xl bg-[#F0E6D6]/30 p-3">
        <span className="text-sm text-[#5C3D2E]">
          {totalCookies} / {MIN_COOKIES} {t("common.quantity").toLowerCase()}
        </span>
        {!isValid && (
          <span className="text-sm text-red-500">
            {t("build.completeSelection")}: {MIN_COOKIES - totalCookies}
          </span>
        )}
        {isValid && <span className="text-sm text-green-600">✓ {t("checkout.success")}</span>}
      </div>

      {/* Cookie Grid - compact */}
      <div className="grid grid-cols-4 gap-2">
        {cookies.map((cookie) => {
          const selected = selectedItems.some((item) => item.productId === cookie.id);
          const item = selectedItems.find((i) => i.productId === cookie.id);
          return (
            <div
              key={cookie.id}
              className={`group relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all duration-200 ${
                selected
                  ? "border-[#F4538A] bg-[#FFF0F5]"
                  : "border-[#E8D5C0] bg-white hover:border-[#F4538A]/30"
              }`}
            >
              {/* Clickable area for toggle */}
              <button
                type="button"
                onClick={() => toggleCookie(cookie)}
                className="flex flex-col items-center gap-1 w-full"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[#FFF0F5]">
                  <Image
                    src={cookie.images[0] || "/images/box1.png"}
                    alt={cookie.name}
                    fill
                    className="object-cover"
                  />
                  {selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#F4538A]/40">
                      <CheckIcon className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <span className="line-clamp-1 text-center text-[10px] text-[#2C1810]">
                  {cookie.name}
                </span>
              </button>
              {/* QuantityStepper outside of button */}
              {selected && item && (
                <div onClick={(e) => e.stopPropagation()}>
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(q) => updateQuantity(item.productId, q)}
                    size="sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected items summary */}
      {selectedItems.length > 0 && (
        <div className="rounded-xl border border-[#E8D5C0] bg-white p-3">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#A07850]">
            {t("build.yourBox")}
          </h4>
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <span className="text-[#2C1810]">{item.productName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#A07850]">x{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
