"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { XIcon, UploadIcon } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";

export type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  price: number;
  /** Fragrance notes, e.g. ["Vanille", "Musc blanc", "Fleur d'oranger"] */
  notes: string[];
  /** Signature liquid color for the `.bottle` illustration, e.g. "#D0223A" */
  colorHex: string;
  sizeMl: number;
  isActive: boolean;
  images: string[];
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
};

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
  t,
}: ProductFormProps) {
  const isVoteMode = mode === "vote";

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    price: 1500,
    notes: [],
    colorHex: "#D0223A",
    sizeMl: 50,
    isActive: isVoteMode ? false : true,
    images: [],
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
        <label className="mb-2 block text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">
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
            <div className="group relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--color-text)]">
              <img
                src={formData.images[0]}
                alt="Preview"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/0 transition-colors duration-200 group-hover:bg-black/25" />
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[var(--color-text)] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
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
            className="flex h-32 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-border)] transition-colors hover:border-[var(--color-text)] hover:bg-[var(--color-bg-soft)] disabled:opacity-50"
          >
            {isUploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-text)] border-t-transparent" />
            ) : (
              <>
                <UploadIcon className="h-8 w-8 text-[var(--color-text-secondary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {formData.images[0]
                    ? "Replace image"
                    : t("admin.products.form.uploadImage")}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-2 block text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">
          {t("admin.products.form.nameLabel")} *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-2xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-text)]/10 focus:outline-none"
        />
      </div>

      {/* Price & Size */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">
            {t("admin.products.form.priceLabel")} *
          </label>
          <input
            type="number"
            required
            min={0}
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: Number(e.target.value) })
            }
            onWheel={(e) => e.currentTarget.blur()}
            className="w-full rounded-2xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-text)]/10 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">
            {t("admin.products.form.sizeLabel")} *
          </label>
          <input
            type="number"
            required
            min={0}
            value={formData.sizeMl}
            onChange={(e) =>
              setFormData({ ...formData, sizeMl: Number(e.target.value) })
            }
            onWheel={(e) => e.currentTarget.blur()}
            className="w-full rounded-2xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-text)]/10 focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">
          {t("admin.products.form.description")} *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full resize-none rounded-2xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-text)]/10 focus:outline-none"
        />
      </div>

      {/* Signature color & Notes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">
            {t("admin.products.form.colorLabel")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={formData.colorHex}
              onChange={(e) =>
                setFormData({ ...formData, colorHex: e.target.value })
              }
              className="h-11 w-11 cursor-pointer rounded-xl border-2 border-[var(--color-border)] bg-white p-1"
            />
            <input
              type="text"
              value={formData.colorHex}
              onChange={(e) =>
                setFormData({ ...formData, colorHex: e.target.value })
              }
              className="w-full rounded-2xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] uppercase focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-text)]/10 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase">
            {t("admin.products.form.notesLabel")}
          </label>
          <input
            type="text"
            defaultValue={formData.notes?.join(", ") || ""}
            onBlur={(e) =>
              setFormData({
                ...formData,
                notes: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder={t("admin.products.form.notesPlaceholder")}
            className="w-full rounded-2xl border-2 border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-text)]/10 focus:outline-none"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--color-border)] p-3 transition-colors hover:border-[var(--color-text)]/50">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="h-4 w-4 rounded border-2 border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-text)]"
            data-testid="product-toggle"
          />
          <span className="text-sm text-[var(--color-text)]">
            {t("admin.products.form.activeLabel")}
          </span>
        </label>

        {!isVoteMode && (
          <>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--color-border)] p-3 transition-colors hover:border-[var(--color-text)]/50">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) =>
                  setFormData({ ...formData, isNew: e.target.checked })
                }
                className="h-4 w-4 rounded border-2 border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-text)]"
              />
              <span className="text-sm text-[var(--color-text)]">
                {t("admin.products.form.markAsNew")}
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[var(--color-border)] p-3 transition-colors hover:border-[var(--color-text)]/50">
              <input
                type="checkbox"
                checked={formData.isSoldOut}
                onChange={(e) =>
                  setFormData({ ...formData, isSoldOut: e.target.checked })
                }
                className="h-4 w-4 rounded border-2 border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-text)]"
              />
              <span className="text-sm text-[var(--color-text)]">
                {t("admin.products.form.markAsSoldOut")}
              </span>
            </label>
          </>
        )}
      </div>

      {/* Vote mode info box */}
      {isVoteMode && (
        <div className="rounded-xl bg-[var(--color-bg-soft)] p-3 text-sm text-[var(--color-text)]">
          <p className="mb-1 font-medium">
            {t("admin.votes.quickAdd.whatHappens")}
          </p>
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
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting || isUploading}
          className="flex-1"
          data-testid="save-product-button"
        >
          {initialData?.name
            ? t("admin.products.form.save")
            : t("admin.products.form.create")}
        </Button>
      </div>
    </form>
  );
}
