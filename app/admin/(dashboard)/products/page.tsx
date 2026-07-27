"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  ImageIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XIcon,
  SearchIcon,
  PackageIcon,
  LayersIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  BanIcon,
} from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import type { Product } from "@/domain/entities/product";
import {
  ProductForm,
  type ProductFormData,
} from "@/presentation/components/features/ProductForm";
import { useTranslations, useLocale } from "next-intl";

type SortField = "name" | "price" | "status";
type SortDirection = "asc" | "desc";

// Product Modal Component
function ProductModal({
  isOpen,
  onClose,
  product,
  onSave,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (formData: ProductFormData) => void;
  isSubmitting: boolean;
}) {
  const t = useTranslations();

  // Convert product to initial form data
  const getInitialData = (): Partial<ProductFormData> | undefined => {
    if (!product) return undefined;

    return {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      notes: product.notes,
      colorHex: product.colorHex,
      sizeMl: product.sizeMl,
      isActive: product.isActive,
      images: product.images,
      isNew: product.isNew,
      isSoldOut: product.isSoldOut,
    };
  };

  const handleSubmit = async (formData: ProductFormData) => {
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4 sm:p-6">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {product
              ? t("admin.products.form.editTitle")
              : t("admin.products.form.addTitle")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-soft)]"
          >
            <XIcon className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <ProductForm
            initialData={getInitialData()}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            mode="product"
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

// Product Card Component for Mobile
function ProductCard({
  product,
  onEdit,
  onDelete,
  t,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <div className="flex items-start gap-3">
        <div
          className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--color-bg-soft)]"
          style={
            !product.images?.[0]
              ? { backgroundColor: product.colorHex }
              : undefined
          }
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PackageIcon className="h-6 w-6 text-white/80" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--color-text)]">
            {product.name}
          </h3>
          <p className="text-lg font-bold text-[var(--color-text)]">
            {product.price} {t("common.currency")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--color-bg-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-text)]">
              {product.sizeMl}ml
            </span>
            {product.isActive ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                {t("admin.products.active")}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {t("admin.products.inactive")}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-[var(--color-text-secondary)]">
        {product.description}
      </p>

      <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-bg-soft)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-border)]"
        >
          <PencilIcon className="h-4 w-4 text-[var(--color-text)]" />
          {t("common.edit")}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-100"
        >
          <Trash2Icon className="h-4 w-4" />
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "active" | "inactive" | null
  >(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "new" | "soldOut" | null
  >(null);
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/admin/products");
        const result = await response.json();
        if (result.success) {
          setProducts(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleStatusFilter = (status: "active" | "inactive") => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const toggleAvailabilityFilter = (availability: "new" | "soldOut") => {
    setAvailabilityFilter((prev) =>
      prev === availability ? null : availability,
    );
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setAvailabilityFilter(null);
  };

  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products;

    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.isActive);
    }

    if (availabilityFilter === "new") {
      filtered = filtered.filter((p) => p.isNew);
    } else if (availabilityFilter === "soldOut") {
      filtered = filtered.filter((p) => p.isSoldOut);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.notes.some((note) => note.toLowerCase().includes(query)),
      );
    }
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "status":
          const statusA = a.isActive ? 1 : 0;
          const statusB = b.isActive ? 1 : 0;
          comparison = statusA - statusB;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    products,
    sortField,
    sortDirection,
    searchQuery,
    statusFilter,
    availabilityFilter,
  ]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const dataToSend = {
        ...formData,
        slug:
          formData.slug ||
          formData.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      if (result.success) {
        if (editingProduct) {
          setProducts(
            products.map((p) => (p.id === editingProduct.id ? result.data : p)),
          );
        } else {
          setProducts([...products, result.data]);
        }
        setIsModalOpen(false);
        setEditingProduct(null);
      } else {
        alert(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Failed to save product:", error);
      alert(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("common.confirm"))) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert(t("common.error"));
    }
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <th
      className="cursor-pointer px-3 py-3 text-left text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase transition-colors hover:text-[var(--color-text)] sm:px-6"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          ))}
      </div>
    </th>
  );

  // Calculate stats
  const stats = React.useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const inactive = total - active;
    const newProducts = products.filter((p) => p.isNew).length;
    const soldOut = products.filter((p) => p.isSoldOut).length;

    return { total, active, inactive, newProducts, soldOut };
  }, [products]);

  // Stats Card Component
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    isActive,
    onClick,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    isActive?: boolean;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all sm:p-5 ${
        isActive
          ? "border-[var(--color-text)] bg-[var(--color-bg-soft)] ring-2 ring-[var(--color-text)]/10"
          : "border-[var(--color-border)] bg-white hover:border-[var(--color-text)]/40 hover:bg-[var(--color-bg-soft)]/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-[var(--color-text)]">
            {t("admin.products.title")}
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="products-page"
      className="space-y-6 sm:space-y-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-text)] sm:text-3xl">
            {t("admin.products.title")}
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {t("admin.products.subtitle")}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreate}
          data-testid="add-product-button"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("admin.products.addProduct")}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          title={t("admin.products.stats.total")}
          value={stats.total}
          icon={LayersIcon}
          color="bg-[var(--color-text)]"
          isActive={statusFilter === null && availabilityFilter === null}
          onClick={clearFilters}
        />
        <StatCard
          title={t("admin.products.stats.active")}
          value={stats.active}
          icon={CheckCircleIcon}
          color="bg-green-500"
          isActive={statusFilter === "active"}
          onClick={() => toggleStatusFilter("active")}
        />
        <StatCard
          title={t("admin.products.stats.inactive")}
          value={stats.inactive}
          icon={XCircleIcon}
          color="bg-gray-400"
          isActive={statusFilter === "inactive"}
          onClick={() => toggleStatusFilter("inactive")}
        />
        <StatCard
          title={t("admin.products.stats.new")}
          value={stats.newProducts}
          icon={SparklesIcon}
          color="bg-[var(--color-text)]"
          isActive={availabilityFilter === "new"}
          onClick={() => toggleAvailabilityFilter("new")}
        />
        <StatCard
          title={t("admin.products.stats.soldOut")}
          value={stats.soldOut}
          icon={BanIcon}
          color="bg-gray-400"
          isActive={availabilityFilter === "soldOut"}
          onClick={() => toggleAvailabilityFilter("soldOut")}
        />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input
          type="text"
          placeholder={t("admin.products.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border-2 border-[var(--color-border)] bg-white py-3 pr-4 pl-12 text-[var(--color-text)] focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-text)]/10 focus:outline-none"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-soft)]">
              <tr>
                <SortHeader field="name">{t("admin.products.name")}</SortHeader>
                <SortHeader field="price">
                  {t("admin.products.price")}
                </SortHeader>
                <SortHeader field="status">
                  {t("admin.products.status")}
                </SortHeader>
                <th className="px-3 py-3 text-right text-xs font-bold tracking-widest text-[var(--color-text-secondary)] uppercase sm:px-6">
                  {t("admin.products.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredAndSortedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-[var(--color-bg-soft)]/60"
                >
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--color-bg-soft)] sm:h-14 sm:w-14"
                        style={
                          !product.images?.[0]
                            ? { backgroundColor: product.colorHex }
                            : undefined
                        }
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-white/80 sm:h-6 sm:w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          data-testid="product-name"
                          className="truncate text-sm font-medium text-[var(--color-text)] sm:text-base"
                        >
                          {product.name}
                        </p>
                        <p className="max-w-[150px] truncate text-xs text-[var(--color-text-secondary)] sm:max-w-[200px]">
                          {product.description.slice(0, 40)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-[var(--color-text)] tabular-nums sm:px-6 sm:py-4 sm:text-base">
                    {product.price} {t("common.currency")}
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <button
                      onClick={() =>
                        handleEdit({ ...product, isActive: !product.isActive })
                      }
                      className="cursor-pointer"
                      data-testid="product-toggle"
                      title={
                        product.isActive
                          ? t("admin.products.active")
                          : t("admin.products.inactive")
                      }
                    >
                      {product.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 sm:px-2.5 sm:py-1">
                          {t("admin.products.active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 sm:px-2.5 sm:py-1">
                          {t("admin.products.inactive")}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-soft)]"
                        title={t("common.edit")}
                      >
                        <PencilIcon className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-red-50"
                        title={t("common.delete")}
                      >
                        <Trash2Icon className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedProducts.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">
            {searchQuery
              ? t("shop.noProducts")
              : t("admin.products.noProducts")}
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 sm:hidden">
        {filteredAndSortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={() => handleEdit(product)}
            onDelete={() => handleDelete(product.id)}
            t={t}
          />
        ))}
        {filteredAndSortedProducts.length === 0 && (
          <div className="rounded-3xl border border-[var(--color-border)] bg-white p-8 text-center text-[var(--color-text-secondary)]">
            {searchQuery
              ? t("shop.noProducts")
              : t("admin.products.noProducts")}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
