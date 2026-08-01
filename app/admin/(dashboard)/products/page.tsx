"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
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

// The five stat cards now drive ONE mutually-exclusive filter instead of
// two independent ones — picking "New" clears "Active"/"Inactive"/"Sold
// out" and vice versa, same as a normal single-select filter bar.
type ProductFilter = "active" | "inactive" | "new" | "soldOut" | null;

// Product visual — follows the brand's colorHex rule: a real photo gets a
// soft tint frame, an illustrated placeholder sits on the full-strength
// signature color.
function ProductVisual({ product }: { product: Product }) {
  const hasImage = Boolean(product.images?.[0]);
  const tint = `color-mix(in srgb, ${product.colorHex} 14%, white)`;

  return (
    <div
      className="admin-product-thumb"
      style={{ backgroundColor: hasImage ? tint : product.colorHex }}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.images[0]}
          alt={product.name}
          className="admin-product-thumb-img"
        />
      ) : (
        <PackageIcon
          className="w-5 h-5"
          style={{ color: "var(--color-white)" }}
        />
      )}
    </div>
  );
}

// Availability chips — "New" / "Sold out", shared by the table's Tags
// column and the mobile card. Neutral/monochrome to match the rest of
// the admin surface; only the badge components carry semantic color.
function ProductTags({ product }: { product: Product }) {
  if (!product.isNew && !product.isSoldOut) {
    return <span className="admin-cell-subtext">—</span>;
  }
  return (
    <div className="admin-product-tags">
      {product.isNew && (
        <span className="admin-tag" style={{ color: "#2f9488" }}>
          <SparklesIcon className="h-3 w-3" style={{ marginInlineEnd: 4 }} />
          New
        </span>
      )}
      {product.isSoldOut && (
        <span className="admin-tag" style={{ color: "#c0392b" }}>
          <BanIcon className="h-3 w-3" style={{ marginInlineEnd: 4 }} />
          Sold out
        </span>
      )}
    </div>
  );
}

// Empty state — replaces the bare "no products" line with something that
// actually invites the next action instead of dead-ending the page.
function EmptyProductsState({
  isFiltered,
  onAddProduct,
  t,
}: {
  isFiltered: boolean;
  onAddProduct: () => void;
  t: (key: string) => string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "var(--space-xl) var(--space-md)",
        gap: "var(--space-sm)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--color-bg-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
        }}
      >
        <PackageIcon className="h-6 w-6" />
      </div>
      <p style={{ fontWeight: 600, color: "var(--color-text)" }}>
        {isFiltered
          ? t("admin.products.noProducts")
          : t("admin.products.emptyTitle") || "No products yet"}
      </p>
      <p className="admin-cell-subtext" style={{ maxWidth: 320 }}>
        {isFiltered
          ? t("admin.products.emptyFilteredDesc") ||
            "Nothing matches this filter. Try a different one."
          : t("admin.products.emptyDesc") ||
            "Add some! Your first fragrance is one click away."}
      </p>
      {!isFiltered && (
        <Button
          variant="primary"
          onClick={onAddProduct}
          className="!bg-[var(--color-text)] !text-[var(--color-white)] hover:!opacity-90 mt-2"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("admin.products.addProduct")}
        </Button>
      )}
    </div>
  );
}

// Product Modal
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
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-head">
          <h2 className="admin-panel-title">
            {product
              ? t("admin.products.form.editTitle")
              : t("admin.products.form.addTitle")}
          </h2>
          <button onClick={onClose} className="admin-modal-close">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="admin-modal-body">
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

// Product Card — mobile
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
    <div className="admin-product-card">
      <div className="admin-product-card-top">
        <ProductVisual product={product} />
        <div className="admin-product-info">
          <h3 className="admin-product-name">{product.name}</h3>
          <p className="admin-product-price">
            {product.price} {t("common.currency")}
          </p>
          <div className="admin-product-tags">
            <span className="admin-tag">{product.sizeMl}ml</span>
            <span
              className={
                product.isActive
                  ? "admin-badge admin-badge-success"
                  : "admin-badge"
              }
            >
              {product.isActive
                ? t("admin.products.active")
                : t("admin.products.inactive")}
            </span>
            {product.isNew && (
              <span className="admin-tag" style={{ color: "#2f9488" }}>
                New
              </span>
            )}
            {product.isSoldOut && (
              <span className="admin-tag" style={{ color: "#c0392b" }}>
                Sold out
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="admin-product-desc">{product.description}</p>

      <div className="admin-product-actions">
        <button onClick={onEdit} className="admin-action-button">
          <PencilIcon className="h-4 w-4" />
          {t("common.edit")}
        </button>
        <button
          onClick={onDelete}
          className="admin-action-button admin-action-button-danger"
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
  const [activeFilter, setActiveFilter] = useState<ProductFilter>(null);
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/admin/products");
        const result = await response.json();
        if (result.success) setProducts(result.data);
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

  // Single toggle for all five stat cards: clicking the currently-active
  // one clears the filter, clicking any other one replaces it outright —
  // so only one filter can ever be "on" at a time.
  const toggleFilter = (filter: Exclude<ProductFilter, null>) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  };

  const clearFilters = () => {
    setActiveFilter(null);
  };

  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products;

    switch (activeFilter) {
      case "active":
        filtered = filtered.filter((p) => p.isActive);
        break;
      case "inactive":
        filtered = filtered.filter((p) => !p.isActive);
        break;
      case "new":
        filtered = filtered.filter((p) => p.isNew);
        break;
      case "soldOut":
        filtered = filtered.filter((p) => p.isSoldOut);
        break;
      default:
        break;
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
          comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [products, sortField, sortDirection, searchQuery, activeFilter]);

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
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
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
    <th className="admin-th-sortable" onClick={() => handleSort(field)}>
      <div className="admin-th-inner">
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUpIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronDownIcon className="h-3.5 w-3.5" />
          ))}
      </div>
    </th>
  );

  const stats = React.useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const inactive = total - active;
    const newProducts = products.filter((p) => p.isNew).length;
    const soldOut = products.filter((p) => p.isSoldOut).length;
    return { total, active, inactive, newProducts, soldOut };
  }, [products]);

  const FilterStatCard = ({
    title,
    value,
    icon: Icon,
    isActive,
    onClick,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    isActive?: boolean;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`admin-stat-card admin-stat-card-button ${isActive ? "admin-stat-card-active" : ""}`}
    >
      <div className="admin-stat-icon">
        <Icon className="h-5 w-5" />
      </div>
      <p className="admin-stat-label">{title}</p>
      <p className="admin-stat-value">{value}</p>
    </button>
  );

  if (loading) {
    return (
      <div>
        <h1 className="admin-page-title">{t("admin.products.title")}</h1>
        <p className="state-message">{t("common.loading")}</p>
      </div>
    );
  }

  const isFilteredEmpty =
    filteredAndSortedProducts.length === 0 &&
    (Boolean(activeFilter) || Boolean(searchQuery.trim()));

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-page-title">{t("admin.products.title")}</h1>
          <p className="admin-page-subtitle">{t("admin.products.subtitle")}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreate}
          className="!bg-[var(--color-text)] !text-[var(--color-white)] hover:!opacity-90"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("admin.products.addProduct")}
        </Button>
      </div>

      {/* Stats — now a single-select filter bar */}
      <div className="admin-stat-grid admin-stat-grid-5">
        <FilterStatCard
          title={t("admin.products.stats.total")}
          value={stats.total}
          icon={LayersIcon}
          isActive={activeFilter === null}
          onClick={clearFilters}
        />
        <FilterStatCard
          title={t("admin.products.stats.active")}
          value={stats.active}
          icon={CheckCircleIcon}
          isActive={activeFilter === "active"}
          onClick={() => toggleFilter("active")}
        />
        <FilterStatCard
          title={t("admin.products.stats.inactive")}
          value={stats.inactive}
          icon={XCircleIcon}
          isActive={activeFilter === "inactive"}
          onClick={() => toggleFilter("inactive")}
        />
        <FilterStatCard
          title={t("admin.products.stats.new")}
          value={stats.newProducts}
          icon={SparklesIcon}
          isActive={activeFilter === "new"}
          onClick={() => toggleFilter("new")}
        />
        <FilterStatCard
          title={t("admin.products.stats.soldOut")}
          value={stats.soldOut}
          icon={BanIcon}
          isActive={activeFilter === "soldOut"}
          onClick={() => toggleFilter("soldOut")}
        />
      </div>

      {/* Search */}
      <div className="admin-search">
        <SearchIcon className="admin-search-icon h-4 w-4" />
        <input
          type="text"
          placeholder={t("admin.products.search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-search-input"
        />
      </div>

      {/* Desktop Table */}
      <div className="admin-panel hidden sm:block">
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <SortHeader field="name">{t("admin.products.name")}</SortHeader>
                <SortHeader field="price">
                  {t("admin.products.price")}
                </SortHeader>
                <th>{t("admin.products.tags") || "Tags"}</th>
                <SortHeader field="status">
                  {t("admin.products.status")}
                </SortHeader>
                <th style={{ textAlign: "right" }}>
                  {t("admin.products.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-row">
                      <ProductVisual product={product} />
                      <div className="min-w-0">
                        <p className="admin-product-row-name">{product.name}</p>
                        <p className="admin-cell-subtext">
                          {product.description.slice(0, 40)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {product.price} {t("common.currency")}
                  </td>
                  <td>
                    <ProductTags product={product} />
                  </td>
                  <td>
                    <span
                      className={
                        product.isActive
                          ? "admin-badge admin-badge-success"
                          : "admin-badge"
                      }
                    >
                      {product.isActive
                        ? t("admin.products.active")
                        : t("admin.products.inactive")}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        onClick={() => handleEdit(product)}
                        className="admin-icon-button"
                        title={t("common.edit")}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="admin-icon-button admin-icon-button-danger"
                        title={t("common.delete")}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedProducts.length === 0 && (
          <EmptyProductsState
            isFiltered={isFilteredEmpty}
            onAddProduct={handleCreate}
            t={t}
          />
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
          <EmptyProductsState
            isFiltered={isFilteredEmpty}
            onAddProduct={handleCreate}
            t={t}
          />
        )}
      </div>

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
