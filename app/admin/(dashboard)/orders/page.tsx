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
} from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { Select } from "@/presentation/components/ui/Select";
import type { Order, WilayaOrderStats } from "@/domain/entities/order";
import type { DeliveryZone } from "@/domain/entities/delivery";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { formatPrice } from "@/presentation/lib/utils";

// Product image mapping
const getProductImage = (slug: string, image?: string): string => {
  if (image) return image;
  const imageMap: Record<string, string> = {
    chocoShips: "/images/chocoShips.png",
    mm: "/images/mm.png",
    pistash: "/images/pistash.png",
    viola: "/images/viola.png",
    peanut: "/images/peanut.png",
    ben10: "/images/ben10.png",
    lotus: "/images/lotus.png",
    strawbery: "/images/strawbery.png",
    bueno: "/images/bueno.png",
    kinder: "/images/kinder.png",
    tiramisu: "/images/tiramisu.png",
  };
  return imageMap[slug] || "/images/bueno.png";
};

type SortField = "id" | "customer" | "total" | "status" | "date";
type SortDirection = "asc" | "desc";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-purple-100 text-purple-800 border-purple-200",
  ready: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

// Stats Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8D5C0] p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#A07850] mb-1">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-[#2C1810]">
            {value}
          </p>
          {trend && <p className="text-xs text-[#A07850] mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
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
  if (stats.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E8D5C0] p-4 sm:p-6">
        <h3 className="font-bold text-[#2C1810] text-lg mb-4 flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-[#F4538A]" />
          {t("admin.orders.topWilayas")}
        </h3>
        <p className="text-[#A07850] text-center py-8">
          {t("admin.orders.noData")}
        </p>
      </div>
    );
  }

  const maxOrders = Math.max(...stats.map((s) => s.orderCount), 1);

  return (
    <div className="bg-white rounded-3xl border border-[#E8D5C0] p-4 sm:p-6">
      <h3 className="font-bold text-[#2C1810] text-lg mb-4 flex items-center gap-2">
        <MapIcon className="w-5 h-5 text-[#F4538A]" />
        {t("admin.orders.topWilayas")}
      </h3>
      <div className="space-y-3">
        {stats.map((stat, index) => {
          const barWidth = (stat.orderCount / maxOrders) * 100;
          return (
            <div key={stat.wilayaCode}>
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#F4538A]/10 text-[#F4538A] text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium text-[#2C1810]">
                    {stat.wilayaName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#A07850] text-xs block">
                    {stat.orderCount} {t("admin.orders.orders")}
                  </span>
                  <span className="text-[#F4538A] text-xs font-medium">
                    {formatPrice(stat.totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-[#F0E6D6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F4538A] rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
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
  const statusOptions = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ];
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
    <div className="bg-white rounded-3xl border border-[#E8D5C0] p-4 sm:p-6">
      <h3 className="font-bold text-[#2C1810] text-lg mb-4 flex items-center gap-2">
        <BarChart3Icon className="w-5 h-5 text-[#F4538A]" />
        {t("admin.orders.status")}
      </h3>
      <div className="space-y-3">
        {statusOptions.map((status) => {
          const count = statusCounts[status] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={status}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-[#2C1810]">
                  {t(`admin.orders.statusLabels.${status}`)}
                </span>
                <span className="text-[#A07850]">
                  {count} ({percentage}%)
                </span>
              </div>
              <div className="h-2.5 bg-[#F0E6D6] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status === "delivered"
                      ? "bg-green-500"
                      : status === "cancelled"
                        ? "bg-red-400"
                        : status === "pending"
                          ? "bg-yellow-400"
                          : status === "confirmed"
                            ? "bg-blue-400"
                            : status === "preparing"
                              ? "bg-purple-400"
                              : "bg-indigo-400"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Order Detail Sidebar Component
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
  const statusOptions = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ];

  if (!isOpen || !order) return null;

  const handleStatusChange = async (newStatus: Order["status"]) => {
    setIsUpdating(true);
    await onStatusChange(order.id, newStatus);
    setIsUpdating(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E8D5C0] p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#2C1810]">
              {t("admin.orders.orderDetails.title")}
            </h2>
            <p className="text-sm text-[#A07850]">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F0E6D6] rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-[#A07850]" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Status Section */}
          <div className="bg-[#F0E6D6]/30 rounded-2xl p-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#A07850] mb-3 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              {t("admin.orders.orderDetails.status")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status as Order["status"])}
                  disabled={isUpdating || order.status === status}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    order.status === status
                      ? statusColors[status]
                      : "bg-white border-[#E8D5C0] text-[#5C3D2E] hover:border-[#F4538A]"
                  } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {t(`admin.orders.statusLabels.${status}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          {(order.wilayaName || order.communeName) && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#A07850] mb-3 flex items-center gap-2">
                <MapIcon className="w-4 h-4" />
                {t("admin.orders.orderDetails.deliveryInfo")}
              </h3>
              <div className="bg-white border border-[#E8D5C0] rounded-2xl p-4 space-y-3">
                {order.wilayaName && (
                  <div className="flex items-start gap-3">
                    <BuildingIcon className="w-5 h-5 text-[#F4538A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#A07850]">
                        {t("admin.orders.wilaya")}
                      </p>
                      <p className="font-medium text-[#2C1810]">
                        {order.wilayaName} ({order.wilayaCode})
                      </p>
                    </div>
                  </div>
                )}
                {order.communeName && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-[#F4538A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#A07850]">
                        {t("admin.orders.commune")}
                      </p>
                      <p className="font-medium text-[#2C1810]">
                        {order.communeName}
                      </p>
                    </div>
                  </div>
                )}
                {order.deliveryType && (
                  <div className="flex items-start gap-3">
                    <PackageIcon className="w-5 h-5 text-[#F4538A] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#A07850]">
                        {t("admin.orders.deliveryType")}
                      </p>
                      <p className="font-medium text-[#2C1810]">
                        {t(`admin.orders.deliveryTypes.${order.deliveryType}`)}
                        {order.deliveryFee !== undefined && (
                          <span className="text-[#F4538A] ml-2">
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
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#A07850] mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              {t("admin.orders.orderDetails.customerInfo")}
            </h3>
            <div className="bg-white border border-[#E8D5C0] rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <PackageIcon className="w-5 h-5 text-[#F4538A] mt-0.5" />
                <div>
                  <p className="font-medium text-[#2C1810]">{order.fullName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-[#F4538A] mt-0.5" />
                <p className="text-[#5C3D2E]">{order.phone}</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-[#F4538A] mt-0.5" />
                <p className="text-[#5C3D2E]">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#A07850] mb-3 flex items-center gap-2">
              <PackageIcon className="w-4 h-4" />
              {t("admin.orders.orderDetails.items")} ({order.items.length})
            </h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white border border-[#E8D5C0] rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-[#FFF0F5] rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={getProductImage(
                          item.productSlug,
                          item.productImage,
                        )}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-[#2C1810] text-sm">
                        {item.productName}
                      </p>
                      <p className="text-xs text-[#A07850]">
                        {item.productType === "box" ? "Box" : "Cookie"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#2C1810]">
                      x{item.quantity}
                    </p>
                    <p className="text-xs text-[#A07850]">
                      {item.priceSnapshot} {t("common.currency")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {(order.cookingNote || order.giftNote) && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#A07850] mb-3">
                {t("admin.orders.orderDetails.notes")}
              </h3>
              <div className="space-y-2">
                {order.cookingNote && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                    <p className="text-xs font-medium text-yellow-700 mb-1">
                      {t("admin.orders.orderDetails.cookingNote")}:
                    </p>
                    <p className="text-sm text-yellow-800">
                      {order.cookingNote}
                    </p>
                  </div>
                )}
                {order.giftNote && (
                  <div className="bg-pink-50 border border-pink-100 rounded-xl p-3">
                    <p className="text-xs font-medium text-pink-700 mb-1">
                      {t("admin.orders.orderDetails.giftNote")}:
                    </p>
                    <p className="text-sm text-pink-800">{order.giftNote}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-[#2C1810] rounded-2xl p-4 text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70">
                {t("admin.orders.orderDetails.subtotal")}
              </span>
              <span>
                {formatPrice(order.totalAmount - (order.deliveryFee || 0))}
              </span>
            </div>
            {order.deliveryFee !== undefined && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70">{t("common.delivery")}</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="border-t border-white/20 pt-3 flex justify-between items-center">
              <span className="font-bold">
                {t("admin.orders.orderDetails.total")}
              </span>
              <span className="text-2xl font-bold">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Order Date */}
          <div className="flex items-center gap-2 text-sm text-[#A07850]">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {t("admin.orders.orderDetails.orderedOn")}{" "}
              {new Date(order.createdAt).toLocaleDateString()}{" "}
              {new Date(order.createdAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Delete Button */}
          <div className="pt-4 border-t border-[#E8D5C0]">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                if (confirm(t("admin.common.confirm"))) {
                  onDelete(order.id);
                  onClose();
                }
              }}
              className="text-red-500 hover:bg-red-50"
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

// Order Card Component for Mobile
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
  return (
    <div className="bg-white border border-[#E8D5C0] rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-[#2C1810]">
            #{order.id.slice(-6).toUpperCase()}
          </p>
          <p className="text-sm text-[#A07850]">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
            statusColors[order.status] ||
            "bg-gray-100 text-gray-800 border-gray-200"
          }`}
        >
          {t(`admin.orders.statusLabels.${order.status}`)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#F0E6D6] rounded-full flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-[#A07850]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#2C1810] truncate">
            {order.fullName}
          </p>
          <p className="text-sm text-[#A07850]">{order.phone}</p>
          {order.wilayaName && (
            <p className="text-xs text-[#F4538A]">{order.wilayaName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#F0E6D6]">
        <p className="font-bold text-[#2C1810]">
          {formatPrice(order.totalAmount)}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="p-2 bg-[#F0E6D6] hover:bg-[#E8D5C0] rounded-lg transition-colors"
          >
            <EyeIcon className="w-4 h-4 text-[#5C3D2E]" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2Icon className="w-4 h-4 text-red-400" />
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
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Fetch orders and wilayas
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch orders
        const ordersRes = await fetch("/api/orders");
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.data);
          setFilteredOrders(ordersData.data);
        }

        // Fetch wilayas for filter
        const wilayasRes = await fetch("/api/delivery/wilayas");
        const wilayasData = await wilayasRes.json();
        if (wilayasData.success) {
          setWilayas(wilayasData.data);
        }

        // Fetch top wilayas stats
        const statsRes = await fetch("/api/orders/stats?type=wilayas&limit=5");
        const statsData = await statsRes.json();
        if (statsData.success) {
          setTopWilayas(statsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...orders];

    if (filterWilaya) {
      filtered = filtered.filter((o) => o.wilayaCode === filterWilaya);
    }

    if (filterStatus) {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    if (filterStartDate) {
      const start = new Date(filterStartDate);
      filtered = filtered.filter((o) => new Date(o.createdAt) >= start);
    }

    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter((o) => new Date(o.createdAt) <= end);
    }

    setFilteredOrders(filtered);
  }, [orders, filterWilaya, filterStatus, filterStartDate, filterEndDate]);

  // Clear filters
  const clearFilters = () => {
    setFilterWilaya("");
    setFilterStatus("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // Calculate stats
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
        if (selectedOrder?.id === id) {
          setSelectedOrder({ ...selectedOrder, status });
        }
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
      const response = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
      });

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
    <th
      className="px-3 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#A07850] cursor-pointer hover:text-[#5C3D2E] transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          ))}
      </div>
    </th>
  );

  // Filter options
  const wilayaOptions = [
    { value: "", label: t("admin.orders.allWilayas") },
    ...wilayas.map((w) => ({
      value: w.wilayaCode,
      label: `${w.wilayaCode} - ${w.wilayaNameAscii}`,
    })),
  ];

  const statusOptions = [
    { value: "", label: t("admin.orders.allStatuses") },
    { value: "pending", label: t("admin.orders.statusLabels.pending") },
    { value: "confirmed", label: t("admin.orders.statusLabels.confirmed") },
    { value: "preparing", label: t("admin.orders.statusLabels.preparing") },
    { value: "ready", label: t("admin.orders.statusLabels.ready") },
    { value: "delivered", label: t("admin.orders.statusLabels.delivered") },
    { value: "cancelled", label: t("admin.orders.statusLabels.cancelled") },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-[#2C1810]">
            {t("admin.orders.title")}
          </h1>
          <p className="text-[#A07850] mt-1">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    filterWilaya || filterStatus || filterStartDate || filterEndDate;

  return (
    <div className="space-y-6 sm:space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#2C1810]">
            {t("admin.orders.title")}
          </h1>
          <p className="text-[#A07850] mt-1">{t("admin.orders.subtitle")}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`self-start ${hasActiveFilters ? "border-[#F4538A] text-[#F4538A]" : ""}`}
        >
          <FilterIcon className="w-4 h-4 mr-2" />
          {t("admin.orders.filters")}
          {hasActiveFilters && (
            <span className="ml-2 w-2 h-2 bg-[#F4538A] rounded-full" />
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-[#E8D5C0] p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-[#A07850]"
              >
                {t("admin.orders.clearFilters")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title={t("admin.orders.stats.total")}
          value={stats.total}
          icon={ShoppingBagIcon}
          color="bg-[#F4538A]"
          trend={`${stats.todayOrders} today`}
        />
        <StatCard
          title={t("admin.orders.stats.revenue")}
          value={formatPrice(stats.totalRevenue)}
          icon={DollarSignIcon}
          color="bg-green-500"
        />
        <StatCard
          title={t("admin.orders.stats.pending")}
          value={stats.pending}
          icon={ClockIcon}
          color="bg-yellow-500"
        />
        <StatCard
          title={t("admin.orders.stats.delivered")}
          value={stats.delivered}
          icon={TrendingUpIcon}
          color="bg-blue-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <TopWilayasChart stats={topWilayas} t={t} />
        <StatusChart orders={filteredOrders} t={t} />
      </div>

      {/* Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#2C1810] text-lg">
            {t("admin.dashboard.recentOrders")}
          </h2>
          {hasActiveFilters && (
            <span className="text-sm text-[#A07850]">
              {filteredOrders.length} {t("admin.orders.results")}
            </span>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block bg-white rounded-3xl border border-[#E8D5C0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0E6D6]/50">
                <tr>
                  <SortHeader field="id">
                    {t("admin.orders.orderId")}
                  </SortHeader>
                  <SortHeader field="customer">
                    {t("admin.orders.customer")}
                  </SortHeader>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#A07850]">
                    {t("admin.orders.wilaya")}
                  </th>
                  <SortHeader field="total">
                    {t("admin.orders.total")}
                  </SortHeader>
                  <SortHeader field="status">
                    {t("admin.orders.status")}
                  </SortHeader>
                  <SortHeader field="date">{t("admin.orders.date")}</SortHeader>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-[#A07850]">
                    {t("admin.orders.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D5C0]">
                {sortedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#FFF0F5]/50 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className="font-medium text-[#2C1810]">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <p className="font-medium text-[#2C1810] text-sm sm:text-base">
                          {order.fullName}
                        </p>
                        <p className="text-xs text-[#A07850]">{order.phone}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {order.wilayaName ? (
                        <div>
                          <p className="text-sm text-[#2C1810]">
                            {order.wilayaName}
                          </p>
                          {order.communeName && (
                            <p className="text-xs text-[#A07850]">
                              {order.communeName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#A07850]">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-[#2C1810] tabular-nums">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium border ${
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        {t(`admin.orders.statusLabels.${order.status}`)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-[#A07850] text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 hover:bg-[#F0E6D6] rounded-lg transition-colors cursor-pointer"
                          title={t("admin.orders.view")}
                        >
                          <EyeIcon className="w-4 h-4 text-[#A07850]" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title={t("admin.orders.delete")}
                        >
                          <Trash2Icon className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedOrders.length === 0 && (
            <div className="p-8 text-center text-[#A07850]">
              {t("admin.orders.noOrders")}
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {sortedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => handleViewOrder(order)}
              onDelete={() => {
                if (confirm(t("admin.common.confirm"))) {
                  handleDelete(order.id);
                }
              }}
              t={t}
            />
          ))}
          {sortedOrders.length === 0 && (
            <div className="p-8 text-center text-[#A07850] bg-white rounded-3xl border border-[#E8D5C0]">
              {t("admin.orders.noOrders")}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Sidebar */}
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
