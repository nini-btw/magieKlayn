"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Trash2Icon,
  XIcon,
  PackageIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  TrendingUpIcon,
  DollarSignIcon,
  ShoppingBagIcon,
  BarChart3Icon,
  FilterIcon,
  MapIcon,
  BuildingIcon,
  GiftIcon,
} from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { Select } from "@/presentation/components/ui/Select";
import type {
  Order,
  WilayaOrderStats,
  BoxColor,
} from "@/domain/entities/order";
import type { DeliveryZone } from "@/domain/entities/delivery";
import { useTranslations, useLocale } from "next-intl";
import { formatPrice } from "@/presentation/lib/utils";
import { EmptyState } from "@/presentation/components/ui/EmptyState";

type SortField = "id" | "customer" | "total" | "status" | "date";
type SortDirection = "asc" | "desc";

// Same badge convention as the dashboard — keep this mapping in one
// place if it ever moves to a shared module.

const statusOptionsList = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#b8860b",
  confirmed: "#3b6fa0",
  preparing: "#8a63d2",
  ready: "#c2761f",
  delivered: "#2f9488",
  cancelled: "#c0392b",
};

const STATUS_DOT: Record<string, string> = {
  pending: "🟡",
  confirmed: "🔵",
  preparing: "🟣",
  ready: "🟠",
  delivered: "🟢",
  cancelled: "🔴",
};

const statusBadgeClass: Record<string, string> = {
  pending: "admin-badge admin-badge-warning",
  confirmed: "admin-badge admin-badge-confirmed",
  preparing: "admin-badge admin-badge-preparing",
  ready: "admin-badge admin-badge-ready",
  delivered: "admin-badge admin-badge-success",
  cancelled: "admin-badge admin-badge-error",
};

// Swatch color shown next to the box color name — actual brand hex,
// not pure #fff/#000, so the white swatch stays visible on a white card.
const BOX_COLOR_SWATCH: Record<BoxColor, string> = {
  white: "#f2ede3",
  black: "#1a1a1a",
};

// Product swatch — mirrors the "colorHex" rule from the design system:
// no photo yet → solid signature color behind a bottle glyph;
// real photo → soft tint frame so the accent never fights the shot.
function ProductSwatch({
  image,
  colorHex,
  size = 44,
}: {
  image?: string;
  colorHex?: string;
  size?: number;
}) {
  const tint = colorHex
    ? `color-mix(in srgb, ${colorHex} 14%, white)`
    : "var(--color-bg-soft)";

  return (
    <div
      className="admin-item-swatch"
      style={{
        width: size,
        height: size,
        backgroundColor: image ? tint : colorHex || "var(--color-bg-soft)",
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="admin-item-swatch-img" />
      ) : (
        <PackageIcon
          className="w-4 h-4"
          style={{ color: "var(--color-white)" }}
        />
      )}
    </div>
  );
}

// Stat card — reused pattern from the dashboard (icon chip, label,
// value, small description), just with an optional trend line.
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">
        <Icon className="w-5 h-5" />
      </div>
      <p className="admin-stat-label">{title}</p>
      <p className="admin-stat-value">{value}</p>
      {trend && <p className="admin-stat-desc">{trend}</p>}
    </div>
  );
}

// Top Wilayas Chart
function TopWilayasChart({
  stats,
  t,
}: {
  stats: WilayaOrderStats[];
  t: (key: string) => string;
}) {
  const maxOrders = Math.max(...stats.map((s) => s.orderCount), 1);

  return (
    <div className="admin-chart-panel">
      <h3 className="admin-chart-title">
        <MapIcon className="w-4 h-4" />
        {t("admin.orders.topWilayas")}
      </h3>
      {stats.length === 0 ? (
        <p className="admin-empty">{t("admin.orders.noData")}</p>
      ) : (
        <div className="admin-bar-list">
          {stats.map((stat, index) => {
            const barWidth = (stat.orderCount / maxOrders) * 100;
            return (
              <div className="admin-bar-row" key={stat.wilayaCode}>
                <div className="admin-bar-label">
                  <span className="admin-bar-rank">{index + 1}</span>
                  <span>{stat.wilayaName}</span>
                </div>
                <div className="admin-bar-track">
                  <div
                    className="admin-bar-fill"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="admin-bar-meta">
                  <span>
                    {stat.orderCount} {t("admin.orders.orders")}
                  </span>
                  <span className="admin-bar-meta-strong">
                    {formatPrice(stat.totalRevenue)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Status Distribution Chart
function StatusChart({
  orders,
  t,
}: {
  orders: Order[];
  t: (key: string) => string;
}) {
  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = orders.length;
  const maxCount = Math.max(...Object.values(statusCounts), 1);

  return (
    <div className="admin-chart-panel">
      <h3 className="admin-chart-title">
        <BarChart3Icon className="w-4 h-4" />
        {t("admin.orders.status")}
      </h3>
      <div className="admin-bar-list">
        {statusOptionsList.map((status) => {
          const count = statusCounts[status] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const color = STATUS_COLORS[status];

          return (
            <div className="admin-bar-row" key={status}>
              <div className="admin-bar-label">
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: color,
                    marginInlineEnd: 6,
                  }}
                />
                <span>{t(`admin.orders.statusLabels.${status}`)}</span>
              </div>
              <div className="admin-bar-track">
                <div
                  className="admin-bar-fill"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="admin-bar-meta">
                <span>
                  {count} ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Order Detail Sidebar
function OrderDetailSidebar({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
  t,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: Order["status"]) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus: Order["status"]) => {
    setIsUpdating(true);
    await onStatusChange(order.id, newStatus);
    setIsUpdating(false);
  };

  const hasPackagingNote =
    order.packagingType === "luxury_coffret" || Boolean(order.giftNote);

  return (
    <>
      <div className="admin-drawer-overlay" onClick={onClose} />
      <div className="admin-drawer">
        <div className="admin-drawer-head">
          <div>
            <h2 className="admin-panel-title">
              {t("admin.orders.orderDetails.title")}
            </h2>
            <p className="admin-order-id">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="admin-drawer-close"
            aria-label={t("common.close") || "Close"}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="admin-drawer-body">
          {/* Status */}
          <div className="admin-drawer-section">
            <h3 className="admin-drawer-section-title">
              <ClockIcon className="w-4 h-4" />
              {t("admin.orders.orderDetails.status")}
            </h3>
            <div className="admin-status-pills">
              {statusOptionsList.map((status) => {
                const isActive = order.status === status;
                const color = STATUS_COLORS[status];
                return (
                  <button
                    key={status}
                    onClick={() =>
                      handleStatusChange(status as Order["status"])
                    }
                    disabled={isUpdating || isActive}
                    className="admin-status-pill"
                    style={
                      isActive
                        ? {
                            backgroundColor: color,
                            borderColor: color,
                            color: "#fff",
                          }
                        : undefined
                    }
                  >
                    {t(`admin.orders.statusLabels.${status}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Info */}
          {(order.wilayaName || order.communeName) && (
            <div className="admin-drawer-section">
              <h3 className="admin-drawer-section-title">
                <MapIcon className="w-4 h-4" />
                {t("admin.orders.orderDetails.deliveryInfo")}
              </h3>
              <div className="admin-info-card">
                {order.wilayaName && (
                  <div className="admin-info-row">
                    <BuildingIcon className="admin-info-icon w-4 h-4" />
                    <div>
                      <p className="admin-info-label">
                        {t("admin.orders.wilaya")}
                      </p>
                      <p className="admin-info-value">
                        {order.wilayaName} ({order.wilayaCode})
                      </p>
                    </div>
                  </div>
                )}
                {order.communeName && (
                  <div className="admin-info-row">
                    <MapPinIcon className="admin-info-icon w-4 h-4" />
                    <div>
                      <p className="admin-info-label">
                        {t("admin.orders.commune")}
                      </p>
                      <p className="admin-info-value">{order.communeName}</p>
                    </div>
                  </div>
                )}
                {order.deliveryType && (
                  <div className="admin-info-row">
                    <PackageIcon className="admin-info-icon w-4 h-4" />
                    <div>
                      <p className="admin-info-label">
                        {t("admin.orders.deliveryType")}
                      </p>
                      <p className="admin-info-value">
                        {t(`admin.orders.deliveryTypes.${order.deliveryType}`)}
                        {order.deliveryFee !== undefined && (
                          <span className="admin-info-value-accent">
                            {" "}
                            ({formatPrice(order.deliveryFee)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="admin-drawer-section">
            <h3 className="admin-drawer-section-title">
              <UserIcon className="w-4 h-4" />
              {t("admin.orders.orderDetails.customerInfo")}
            </h3>
            <div className="admin-info-card">
              <div className="admin-info-row">
                <UserIcon className="admin-info-icon w-4 h-4" />
                <p className="admin-info-value">{order.fullName}</p>
              </div>
              <div className="admin-info-row">
                <PhoneIcon className="admin-info-icon w-4 h-4" />
                <p className="admin-info-value">{order.phone}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="admin-drawer-section">
            <h3 className="admin-drawer-section-title">
              <PackageIcon className="w-4 h-4" />
              {t("admin.orders.orderDetails.items")} ({order.items.length})
            </h3>
            <div className="admin-item-list">
              {order.items.map((item, index) => (
                <div key={index} className="admin-item-row">
                  <div className="admin-item-row-left">
                    <ProductSwatch
                      image={item.productImage}
                      colorHex={item.productColorHex}
                    />
                    <p className="admin-item-name">{item.productName}</p>
                  </div>
                  <div className="admin-item-row-right">
                    <p className="admin-item-qty">x{item.quantity}</p>
                    <p className="admin-item-price">
                      {formatPrice(item.priceSnapshot)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Packaging + Notes */}
          {hasPackagingNote && (
            <div className="admin-drawer-section">
              <h3 className="admin-drawer-section-title">
                {t("admin.orders.orderDetails.notes")}
              </h3>
              <div className="admin-item-list">
                {order.packagingType === "luxury_coffret" && (
                  <div className="admin-note-card">
                    <p className="admin-note-label">
                      <GiftIcon className="w-3.5 h-3.5" />
                      {t("admin.orders.orderDetails.luxuryCoffret")}
                    </p>
                    <div className="admin-note-body-row">
                      {order.boxColor && (
                        <span className="admin-box-color-chip">
                          <span
                            className="admin-box-color-dot"
                            style={{
                              backgroundColor: BOX_COLOR_SWATCH[order.boxColor],
                            }}
                          />
                          {t(`cart.packaging.${order.boxColor}`)}
                        </span>
                      )}
                      {order.coffretFee !== undefined && (
                        <p className="admin-note-body">
                          {formatPrice(order.coffretFee)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {order.giftNote && (
                  <div className="admin-note-card">
                    <p className="admin-note-label">
                      {t("admin.orders.orderDetails.giftNote")}
                    </p>
                    <p className="admin-note-body">{order.giftNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="admin-summary-card">
            <div className="admin-summary-row">
              <span>{t("admin.orders.orderDetails.subtotal")}</span>
              <span>
                {formatPrice(
                  order.totalAmount -
                    (order.deliveryFee || 0) -
                    (order.coffretFee || 0),
                )}
              </span>
            </div>
            {order.coffretFee !== undefined && (
              <div className="admin-summary-row">
                <span>{t("admin.orders.orderDetails.luxuryCoffret")}</span>
                <span>{formatPrice(order.coffretFee)}</span>
              </div>
            )}
            {order.deliveryFee !== undefined && (
              <div className="admin-summary-row">
                <span>{t("common.delivery")}</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="admin-summary-total">
              <span>{t("admin.orders.orderDetails.total")}</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Order Date */}
          <div className="admin-order-date-row">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {t("admin.orders.orderDetails.orderedOn")}{" "}
              {new Date(order.createdAt).toLocaleDateString()}{" "}
              {new Date(order.createdAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Delete */}
          <div className="admin-drawer-footer">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                if (confirm(t("admin.common.confirm"))) {
                  onDelete(order.id);
                  onClose();
                }
              }}
              className="admin-danger-button"
            >
              <Trash2Icon className="w-4 h-4 mr-2" />
              {t("admin.orders.orderDetails.deleteOrder")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Order Card — mobile
function OrderCard({
  order,
  onView,
  onDelete,
  t,
}: {
  order: Order;
  onView: () => void;
  onDelete: () => void;
  t: (key: string) => string;
}) {
  const badgeClass = statusBadgeClass[order.status] || "admin-badge";

  return (
    <div className="admin-order-card">
      <div className="admin-order-card-top">
        <div>
          <p className="admin-order-id">#{order.id.slice(-6).toUpperCase()}</p>
          <p className="admin-order-date">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={badgeClass}>
          {t(`admin.orders.statusLabels.${order.status}`)}
        </span>
      </div>

      <div className="admin-order-customer-row">
        <div className="admin-order-avatar">
          <UserIcon className="w-5 h-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="admin-order-name">{order.fullName}</p>
          <p className="admin-order-items">{order.phone}</p>
          {order.wilayaName && (
            <p className="admin-order-items admin-order-items-accent">
              {order.wilayaName}
            </p>
          )}
        </div>
      </div>

      <div className="admin-order-bottom">
        <p className="admin-order-total">{formatPrice(order.totalAmount)}</p>
        <div className="admin-order-card-actions">
          <button onClick={onView} className="admin-icon-button">
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="admin-icon-button admin-icon-button-danger"
          >
            <Trash2Icon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [wilayas, setWilayas] = useState<DeliveryZone[]>([]);
  const [topWilayas, setTopWilayas] = useState<WilayaOrderStats[]>([]);

  // Filters
  const [filterWilaya, setFilterWilaya] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    async function fetchData() {
      try {
        const ordersRes = await fetch("/api/orders");
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.data);
          setFilteredOrders(ordersData.data);
        }

        const wilayasRes = await fetch("/api/delivery/wilayas");
        const wilayasData = await wilayasRes.json();
        if (wilayasData.success) setWilayas(wilayasData.data);

        const statsRes = await fetch("/api/orders/stats?type=wilayas&limit=5");
        const statsData = await statsRes.json();
        if (statsData.success) setTopWilayas(statsData.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...orders];
    if (filterWilaya)
      filtered = filtered.filter((o) => o.wilayaCode === filterWilaya);
    if (filterStatus)
      filtered = filtered.filter((o) => o.status === filterStatus);
    setFilteredOrders(filtered);
  }, [orders, filterWilaya, filterStatus]);

  const clearFilters = () => {
    setFilterWilaya("");
    setFilterStatus("");
  };

  const stats = React.useMemo(() => {
    const total = filteredOrders.length;
    const totalRevenue = filteredOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const pending = filteredOrders.filter((o) => o.status === "pending").length;
    const delivered = filteredOrders.filter(
      (o) => o.status === "delivered",
    ).length;
    const today = new Date().toISOString().split("T")[0];
    const todayOrders = filteredOrders.filter((o) =>
      o.createdAt.toString().includes(today),
    ).length;
    return { total, totalRevenue, pending, delivered, todayOrders };
  }, [filteredOrders]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedOrders = React.useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "id":
          comparison = a.id.localeCompare(b.id);
          break;
        case "customer":
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case "total":
          comparison = a.totalAmount - b.totalAmount;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "date":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredOrders, sortField, sortDirection]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsSidebarOpen(true);
  };

  const handleStatusChange = async (id: string, status: Order["status"]) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (result.success) {
        setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
        if (selectedOrder?.id === id)
          setSelectedOrder({ ...selectedOrder, status });
      } else {
        alert(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(t("common.error"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        setOrders(orders.filter((o) => o.id !== id));
        setIsSidebarOpen(false);
      } else {
        alert(result.error || t("common.error"));
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
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
            <ChevronUpIcon className="w-3.5 h-3.5" />
          ) : (
            <ChevronDownIcon className="w-3.5 h-3.5" />
          ))}
      </div>
    </th>
  );

  const wilayaOptions = [
    { value: "", label: t("admin.orders.allWilayas") },
    ...wilayas.map((w) => ({
      value: w.wilayaCode,
      label: `${w.wilayaCode} - ${w.wilayaNameAscii}`,
    })),
  ];

  const statusOptions = [
    { value: "", label: t("admin.orders.allStatuses") },
    ...statusOptionsList.map((s) => ({
      value: s,
      label: `${STATUS_DOT[s]} ${t(`admin.orders.statusLabels.${s}`)}`,
    })),
  ];

  if (loading) {
    return (
      <div>
        <h1 className="admin-page-title">{t("admin.orders.title")}</h1>
        <p className="state-message">{t("common.loading")}</p>
      </div>
    );
  }

  const hasActiveFilters = Boolean(filterWilaya || filterStatus);

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="admin-toolbar">
        <div>
          <h1 className="admin-page-title">{t("admin.orders.title")}</h1>
          <p className="admin-page-subtitle">{t("admin.orders.subtitle")}</p>
        </div>
        <button
          className={`admin-filter-toggle ${hasActiveFilters ? "admin-filter-toggle-active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon className="w-4 h-4" />
          {t("admin.orders.filters")}
          {hasActiveFilters && <span className="admin-filter-dot" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="admin-filter-panel">
          <div className="admin-filter-grid">
            <Select
              value={filterWilaya}
              onChange={setFilterWilaya}
              options={wilayaOptions}
              label={t("admin.orders.wilaya")}
              placeholder={t("admin.orders.selectWilaya")}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusOptions}
              label={t("admin.orders.status")}
              placeholder={t("admin.orders.selectStatus")}
            />
          </div>
          {hasActiveFilters && (
            <div className="admin-filter-clear-row">
              <button className="admin-filter-clear" onClick={clearFilters}>
                {t("admin.orders.clearFilters")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="admin-stat-grid">
        <StatCard
          title={t("admin.orders.stats.total")}
          value={stats.total}
          icon={ShoppingBagIcon}
          trend={`${stats.todayOrders} today`}
        />
        <StatCard
          title={t("admin.orders.stats.revenue")}
          value={formatPrice(stats.totalRevenue)}
          icon={DollarSignIcon}
        />
        <StatCard
          title={t("admin.orders.stats.pending")}
          value={stats.pending}
          icon={ClockIcon}
        />
        <StatCard
          title={t("admin.orders.stats.delivered")}
          value={stats.delivered}
          icon={TrendingUpIcon}
        />
      </div>

      {/* Charts */}
      <div className="admin-chart-row">
        <TopWilayasChart stats={topWilayas} t={t} />
        <StatusChart orders={filteredOrders} t={t} />
      </div>

      {/* Orders */}
      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-title">
            {t("admin.dashboard.recentOrders")}
          </h2>
          {hasActiveFilters && (
            <span className="admin-panel-meta">
              {filteredOrders.length} {t("admin.orders.results")}
            </span>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block" style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <SortHeader field="id">{t("admin.orders.orderId")}</SortHeader>
                <SortHeader field="customer">
                  {t("admin.orders.customer")}
                </SortHeader>
                <th>{t("admin.orders.wilaya")}</th>
                <SortHeader field="total">{t("admin.orders.total")}</SortHeader>
                <SortHeader field="status">
                  {t("admin.orders.status")}
                </SortHeader>
                <SortHeader field="date">{t("admin.orders.date")}</SortHeader>
                <th style={{ textAlign: "right" }}>
                  {t("admin.orders.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td>
                    <p style={{ fontWeight: 500 }}>{order.fullName}</p>
                    <p className="admin-cell-subtext">{order.phone}</p>
                  </td>
                  <td>
                    {order.wilayaName ? (
                      <>
                        <p>{order.wilayaName}</p>
                        {order.communeName && (
                          <p className="admin-cell-subtext">
                            {order.communeName}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="admin-cell-subtext">—</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td>
                    <span
                      className={
                        statusBadgeClass[order.status] || "admin-badge"
                      }
                    >
                      {t(`admin.orders.statusLabels.${order.status}`)}
                    </span>
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="admin-icon-button"
                        title={t("admin.orders.view")}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="admin-icon-button admin-icon-button-danger"
                        title={t("admin.orders.delete")}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedOrders.length === 0 && (
            <EmptyState
              icon={hasActiveFilters ? FilterIcon : PackageIcon}
              title={t("admin.orders.noOrders")}
              description={
                hasActiveFilters
                  ? t("admin.orders.noOrdersFilteredDesc") ||
                    "Try adjusting or clearing your filters."
                  : t("admin.orders.noOrdersDesc") ||
                    "Orders placed by customers will show up here."
              }
            />
          )}
        </div>

        {/* Mobile Cards */}
        <div
          className="sm:hidden"
          style={{
            padding: "var(--space-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          {sortedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => handleViewOrder(order)}
              onDelete={() => {
                if (confirm(t("admin.common.confirm"))) handleDelete(order.id);
              }}
              t={t}
            />
          ))}
          {sortedOrders.length === 0 && (
            <EmptyState
              icon={hasActiveFilters ? FilterIcon : PackageIcon}
              title={t("admin.orders.noOrders")}
              description={
                hasActiveFilters
                  ? t("admin.orders.noOrdersFilteredDesc") ||
                    "Try adjusting or clearing your filters."
                  : t("admin.orders.noOrdersDesc") ||
                    "Orders placed by customers will show up here."
              }
            />
          )}
        </div>
      </div>

      <OrderDetailSidebar
        order={selectedOrder}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        t={t}
      />
    </div>
  );
}
