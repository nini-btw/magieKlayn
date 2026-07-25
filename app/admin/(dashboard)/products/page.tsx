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
  CookieIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import type { Product } from "@/domain/entities/product";
import { isCookiePiece } from "@/domain/entities/product";
import { ProductForm, type ProductFormData } from "@/presentation/components/features/ProductForm";
import { BoxBuilder, type BoxItem } from "@/presentation/components/features/BoxBuilder";
import { useTranslations, useLocale } from 'next-intl';

type SortField = "name" | "price" | "type" | "status";
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
  onSave: (formData: ProductFormData & { includedCookies?: BoxItem[] }) => void;
  isSubmitting: boolean;
}) {
  const t = useTranslations();
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [productType, setProductType] = useState<"cookie" | "box">("cookie");

  // Reset state when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Edit mode: set type from product and load existing cookies if it's a box
        setProductType(product.type);
        if (product.type === "box") {
          const boxProduct = product as import("@/domain/entities/product").CookieBox;
          setBoxItems(boxProduct.includedCookies || []);
        } else {
          setBoxItems([]);
        }
      } else {
        // Add mode: reset to defaults (empty box, no default cookies)
        setProductType("cookie");
        setBoxItems([]);
      }
    }
  }, [isOpen, product]);

  // Convert product to initial form data
  const getInitialData = (): Partial<ProductFormData> | undefined => {
    if (!product) return undefined;
    
    const cookieData = isCookiePiece(product)
      ? {
          flavour: product.flavour || "",
          allergens: product.allergens || [],
          isNew: product.isNew ?? true,
          isSoldOut: product.isSoldOut ?? false,
        }
      : {
          flavour: "",
          allergens: [],
          isNew: true,
          isSoldOut: false,
        };

    return {
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      type: product.type,
      isActive: product.isActive,
      images: product.images,
      ...cookieData,
    };
  };

  const handleSubmit = async (formData: ProductFormData) => {
    const dataToSave = {
      ...formData,
      ...(formData.type === "box" ? { includedCookies: boxItems } : {}),
    };
    onSave(dataToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8D5C0] p-4 sm:p-6">
          <h2 className="text-lg font-bold text-[#2C1810]">
            {product ? t("admin.products.form.editTitle") : t("admin.products.form.addTitle")}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-[#F0E6D6]">
            <XIcon className="h-5 w-5 text-[#A07850]" />
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
            onTypeChange={(type) => {
              setProductType(type);
              // Clear box items when switching to cookie type
              if (type === "cookie") {
                setBoxItems([]);
              }
            }}
          />

          {/* Box Builder for box type */}
          {productType === "box" && (
            <div className="mt-6 border-t border-[#E8D5C0] pt-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#A07850]">
                {t("admin.products.form.boxContents")}
              </h3>
              <BoxBuilder
                selectedItems={boxItems}
                onItemsChange={setBoxItems}
                t={t}
                mode="admin"
              />
            </div>
          )}
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
    <div className="space-y-3 rounded-2xl border border-[#E8D5C0] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#F0E6D6]">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PackageIcon className="h-6 w-6 text-[#A07850]" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[#2C1810]">{product.name}</h3>
          <p className="text-lg font-bold text-[#F4538A]">
            {product.price} {t("common.currency")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#F0E6D6] px-2 py-0.5 text-xs font-medium text-[#5C3D2E]">
              {product.type}
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

      <p className="line-clamp-2 text-sm text-[#A07850]">{product.description}</p>

      <div className="flex items-center justify-end gap-2 border-t border-[#F0E6D6] pt-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg bg-[#F0E6D6] px-3 py-2 text-sm transition-colors hover:bg-[#E8D5C0]"
        >
          <PencilIcon className="h-4 w-4 text-[#5C3D2E]" />
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
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | null>(null);
  const [typeFilter, setTypeFilter] = useState<"cookies" | "boxes" | null>(null);
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'ar';

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

  const toggleTypeFilter = (type: "cookies" | "boxes") => {
    setTypeFilter((prev) => (prev === type ? null : type));
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setTypeFilter(null);
  };

  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products;

    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.isActive);
    }

    if (typeFilter === "cookies") {
      filtered = filtered.filter((p) => p.type === "cookie");
    } else if (typeFilter === "boxes") {
      filtered = filtered.filter((p) => p.type === "box");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (isCookiePiece(p) && p.flavour?.toLowerCase().includes(query))
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
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "status":
          const statusA = a.isActive ? 1 : 0;
          const statusB = b.isActive ? 1 : 0;
          comparison = statusA - statusB;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [products, sortField, sortDirection, searchQuery, statusFilter, typeFilter]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: ProductFormData & { includedCookies?: BoxItem[] }) => {
    setIsSubmitting(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const dataToSend = {
        ...formData,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      if (result.success) {
        if (editingProduct) {
          setProducts(products.map((p) => (p.id === editingProduct.id ? result.data : p)));
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

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="cursor-pointer px-3 py-3 text-left text-xs font-bold tracking-widest text-[#A07850] uppercase transition-colors hover:text-[#5C3D2E] sm:px-6"
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
    const cookies = products.filter((p) => p.type === "cookie").length;
    const boxes = products.filter((p) => p.type === "box").length;
    const newProducts = products.filter((p) => isCookiePiece(p) && p.isNew).length;

    return { total, active, inactive, cookies, boxes, newProducts };
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
      className={`w-full rounded-2xl border p-4 text-left transition-all sm:p-5 cursor-pointer ${
        isActive
          ? "border-[#F4538A] bg-[#FFF0F5] ring-2 ring-[#F4538A]/20"
          : "border-[#E8D5C0] bg-white hover:border-[#F4538A]/50 hover:bg-[#FFF0F5]/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#A07850]">{title}</p>
          <p className="text-2xl font-bold text-[#2C1810]">{value}</p>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-[#2C1810]">{t("admin.products.title")}</h1>
          <p className="mt-1 text-[#A07850]">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="products-page" className="space-y-6 sm:space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl text-[#2C1810] sm:text-3xl">
            {t("admin.products.title")}
          </h1>
          <p className="mt-1 text-[#A07850]">{t("admin.products.subtitle")}</p>
        </div>
        <Button onClick={handleCreate} className="cursor-pointer bg-[#F4538A] hover:bg-[#D63A72]" data-testid="add-product-button">
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("admin.products.addProduct")}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        <StatCard
          title={t("admin.products.stats.total")}
          value={stats.total}
          icon={LayersIcon}
          color="bg-[#F4538A]"
          isActive={statusFilter === null && typeFilter === null}
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
          title={t("admin.products.stats.cookies")}
          value={stats.cookies}
          icon={CookieIcon}
          color="bg-amber-500"
          isActive={typeFilter === "cookies"}
          onClick={() => toggleTypeFilter("cookies")}
        />
        <StatCard
          title={t("admin.products.stats.boxes")}
          value={stats.boxes}
          icon={PackageIcon}
          color="bg-blue-500"
          isActive={typeFilter === "boxes"}
          onClick={() => toggleTypeFilter("boxes")}
        />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[#A07850]" />
        <input
          type="text"
          placeholder={t("admin.products.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border-2 border-[#E8D5C0] bg-white py-3 pr-4 pl-12 text-[#2C1810] focus:border-[#F4538A] focus:ring-2 focus:ring-[#F4538A]/20 focus:outline-none"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-3xl border border-[#E8D5C0] bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F0E6D6]/50">
              <tr>
                <SortHeader field="name">{t("admin.products.name")}</SortHeader>
                <SortHeader field="price">{t("admin.products.price")}</SortHeader>
                <SortHeader field="type">{t("admin.products.type")}</SortHeader>
                <SortHeader field="status">{t("admin.products.status")}</SortHeader>
                <th className="px-3 py-3 text-right text-xs font-bold tracking-widest text-[#A07850] uppercase sm:px-6">
                  {t("admin.products.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8D5C0]">
              {filteredAndSortedProducts.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-[#FFF0F5]/50">
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-[#F0E6D6] sm:h-14 sm:w-14">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-[#A07850] sm:h-6 sm:w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p data-testid="product-name" className="truncate text-sm font-medium text-[#2C1810] sm:text-base">
                          {product.name}
                        </p>
                        <p className="max-w-[150px] truncate text-xs text-[#A07850] sm:max-w-[200px]">
                          {product.description.slice(0, 40)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-[#2C1810] tabular-nums sm:px-6 sm:py-4 sm:text-base">
                    {product.price} {t("common.currency")}
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <span className="inline-flex items-center rounded-full bg-[#F0E6D6] px-2 py-0.5 text-xs font-medium text-[#5C3D2E] sm:px-2.5 sm:py-1">
                      {product.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <button
                      onClick={() => handleEdit({ ...product, isActive: !product.isActive })}
                      className="cursor-pointer"
                      data-testid="product-toggle"
                      title={product.isActive ? t("admin.products.active") : t("admin.products.inactive")}
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
                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#F0E6D6]"
                        title={t("common.edit")}
                      >
                        <PencilIcon className="h-4 w-4 text-[#A07850]" />
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
          <div className="p-8 text-center text-[#A07850]">
            {searchQuery ? t("shop.noProducts") : t("admin.products.noProducts")}
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
          <div className="rounded-3xl border border-[#E8D5C0] bg-white p-8 text-center text-[#A07850]">
            {searchQuery ? t("shop.noProducts") : t("admin.products.noProducts")}
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
