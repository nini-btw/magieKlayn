"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { XIcon, UploadIcon } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { Select } from "@/presentation/components/ui/Select";
import type { Product } from "@/domain/entities/product";
import { isCookiePiece } from "@/domain/entities/product";

export type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  price: number;
  type: "cookie" | "box";
  isActive: boolean;
  images: string[];
  flavour?: string;
  allergens?: string[];
  isNew?: boolean;
  isSoldOut?: boolean;
};

type ProductFormProps = {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: "product" | "vote";
  t: (key: string) => string;
  onTypeChange?: (type: "cookie" | "box") => void;
};

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
  t,
  onTypeChange,
}: ProductFormProps) {
  const isVoteMode = mode === "vote";

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    price: 150,
    type: "cookie",
    isActive: isVoteMode ? false : true,
    images: [],
    flavour: "",
    allergens: [],
    isNew: true,
    isSoldOut: false,
    ...initialData,
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !isVoteMode) {
      const slug = formData.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, isVoteMode]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        setFormData((prev) => ({ ...prev, images: [result.url] }));
      } else {
        alert(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div>
        <label className="mb-2 block text-xs font-bold tracking-widest text-[#A07850] uppercase">
          {t("admin.products.form.productImage")}
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        <div className="flex gap-3">
          {formData.images[0] && (
            <div className="group relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-[#F4538A]">
              <img
                src={formData.images[0]}
                alt="Preview"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/0 transition-colors duration-200 group-hover:bg-black/25" />
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#F4538A] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                Main
              </span>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, images: [] }))}
                className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1 text-red-500 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-32 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E8D5C0] transition-colors hover:border-[#F4538A] hover:bg-[#FFF0F5] disabled:opacity-50"
          >
            {isUploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F4538A] border-t-transparent" />
            ) : (
              <>
                <UploadIcon className="h-8 w-8 text-[#A07850]" />
                <span className="text-sm text-[#A07850]">
                  {formData.images[0] ? "Replace image" : t("admin.products.form.uploadImage")}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-2 block text-xs font-bold tracking-widest text-[#A07850] uppercase">
          {t("admin.products.form.nameLabel")} *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-2xl border-2 border-[#E8D5C0] bg-white px-4 py-3 text-[#2C1810] focus:border-[#F4538A] focus:ring-2 focus:ring-[#F4538A]/20 focus:outline-none"
        />
      </div>

      {/* Price */}
      <div>
        <label className="mb-2 block text-xs font-bold tracking-widest text-[#A07850] uppercase">
          {t("admin.products.form.priceLabel")} *
        </label>
        <input
          type="number"
          required
          min={0}
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          onWheel={(e) => e.currentTarget.blur()}
          className="w-full rounded-2xl border-2 border-[#E8D5C0] bg-white px-4 py-3 text-[#2C1810] focus:border-[#F4538A] focus:ring-2 focus:ring-[#F4538A]/20 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-xs font-bold tracking-widest text-[#A07850] uppercase">
          {t("admin.products.form.description")} *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-2xl border-2 border-[#E8D5C0] bg-white px-4 py-3 text-[#2C1810] focus:border-[#F4538A] focus:ring-2 focus:ring-[#F4538A]/20 focus:outline-none"
        />
      </div>

      {/* Flavour & Allergens (only for cookies) */}
      {formData.type === "cookie" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-[#A07850] uppercase">
              {t("admin.products.form.flavour")}
            </label>
            <input
              type="text"
              value={formData.flavour}
              onChange={(e) => setFormData({ ...formData, flavour: e.target.value })}
              className="w-full rounded-2xl border-2 border-[#E8D5C0] bg-white px-4 py-3 text-[#2C1810] focus:border-[#F4538A] focus:ring-2 focus:ring-[#F4538A]/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-[#A07850] uppercase">
              {t("admin.products.form.allergens")}
            </label>
            <input
              type="text"
              defaultValue={formData.allergens?.join(", ") || ""}
              onBlur={(e) =>
                setFormData({
                  ...formData,
                  allergens: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder={t("admin.products.form.allergensPlaceholder")}
              className="w-full rounded-2xl border-2 border-[#E8D5C0] bg-white px-4 py-3 text-[#2C1810] focus:border-[#F4538A] focus:ring-2 focus:ring-[#F4538A]/20 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Type */}
      <div>
        <label className="mb-2 block text-xs font-bold tracking-widest text-[#A07850] uppercase">
          {t("admin.products.form.typeLabel")} *
        </label>
        <Select
          value={formData.type}
          onChange={(value) => setFormData({ ...formData, type: value as "cookie" | "box" })}
          options={[
            { value: "cookie", label: t("admin.products.form.cookie") },
            { value: "box", label: t("admin.products.form.box") },
          ]}
          placeholder={t("admin.products.form.typeLabel")}
          size="md"
          variant="default"
          className="w-full"
        />
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#E8D5C0] p-3 transition-colors hover:border-[#F4538A]/50">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-2 border-[#E8D5C0] text-[#F4538A] focus:ring-[#F4538A]"
            data-testid="product-toggle"
          />
          <span className="text-sm text-[#2C1810]">{t("admin.products.form.activeLabel")}</span>
        </label>

        {!isVoteMode && (
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#E8D5C0] p-3 transition-colors hover:border-[#F4538A]/50">
            <input
              type="checkbox"
              checked={formData.isNew}
              onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
              className="h-4 w-4 rounded border-2 border-[#E8D5C0] text-[#F4538A] focus:ring-[#F4538A]"
            />
            <span className="text-sm text-[#2C1810]">{t("admin.products.form.markAsNew")}</span>
          </label>
        )}
      </div>

      {/* Vote mode info box */}
      {isVoteMode && (
        <div className="rounded-xl bg-[#FFF0F5] p-3 text-sm text-[#5C3D2E]">
          <p className="mb-1 font-medium">{t("admin.votes.quickAdd.whatHappens")}</p>
          <ul className="list-inside list-disc space-y-1">
            <li>{t("admin.votes.quickAdd.step1")}</li>
            <li>{t("admin.votes.quickAdd.step2")}</li>
            <li>
              {formData.isActive
                ? t("admin.votes.quickAdd.step3Active")
                : t("admin.votes.quickAdd.step3Inactive")}
            </li>
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting || isUploading}
          className="flex-1 bg-[#F4538A] hover:bg-[#D63A72]"
          data-testid="save-product-button"
        >
          {initialData?.name ? t("admin.products.form.save") : t("admin.products.form.create")}
        </Button>
      </div>
    </form>
  );
}
