"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBagIcon,
  TrendingUpIcon,
  PackageIcon,
  StarIcon,
  ArrowRightIcon,
  UserIcon,
} from "lucide-react";
import type { Order } from "@/domain/entities/order";
import type { Product } from "@/domain/entities/product";
import { useTranslations, useLocale } from "next-intl";
import { EmptyState } from "@/presentation/components/ui/EmptyState";

const statusBadgeClass: Record<string, string> = {
  pending: "admin-badge admin-badge-warning",
  confirmed: "admin-badge",
  preparing: "admin-badge",
  ready: "admin-badge",
  delivered: "admin-badge admin-badge-success",
  cancelled: "admin-badge admin-badge-error",
};

// Recent order card — mobile
function RecentOrderCard({
  order,
  t,
}: {
  order: Order;
  t: (key: string) => string;
}) {
  const statusLabel = t(`admin.orders.statusLabels.${order.status}`);
  const badgeClass = statusBadgeClass[order.status] || "admin-badge";

  return (
    <div className="admin-order-card">
      <div className="admin-order-card-top">
        <div>
          <p className="admin-order-id">#{order.id.slice(0, 8)}</p>
          <p className="admin-order-date">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={badgeClass}>{statusLabel}</span>
      </div>

      <div className="admin-order-customer-row">
        <div className="admin-order-avatar">
          <UserIcon className="w-5 h-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="admin-order-name">{order.fullName}</p>
          <p className="admin-order-items">
            {order.items.length} {t("admin.products.form.items") || "items"}
          </p>
        </div>
      </div>

      <div className="admin-order-bottom">
        <p className="admin-order-total">
          {order.totalAmount} {t("common.currency")}
        </p>
        <Link href="/admin/orders" className="admin-panel-link">
          {t("admin.orders.view")} →
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/products"),
        ]);

        const ordersData = await ordersRes.json();
        const productsData = await productsRes.json();

        if (ordersData.success) setOrders(ordersData.data);
        if (productsData.success) setProducts(productsData.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;

  const productCounts = new Map<string, number>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const count = productCounts.get(item.productName) || 0;
      productCounts.set(item.productName, count + item.quantity);
    });
  });
  const mostOrdered = [...productCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];

  const activeProducts = products.filter((p) => p.isActive).length;

  if (loading) {
    return (
      <div>
        <h1 className="admin-page-title">{t("admin.dashboard.title")}</h1>
        <p className="state-message">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="admin-page-title">{t("admin.dashboard.title")}</h1>
        <p className="admin-page-subtitle">{t("admin.dashboard.subtitle")}</p>
      </div>

      <div className="admin-stat-grid">
        <StatCard
          icon={ShoppingBagIcon}
          label={t("admin.dashboard.totalOrders")}
          value={totalOrders.toString()}
          description={t("admin.dashboard.viewAll")}
        />
        <StatCard
          icon={TrendingUpIcon}
          label={t("admin.dashboard.revenue")}
          value={`${totalRevenue} ${t("common.currency")}`}
          description={t("admin.dashboard.subtitle")}
        />
        <StatCard
          icon={PackageIcon}
          label={t("admin.dashboard.mostOrdered")}
          value={mostOrdered?.[0] || "N/A"}
          description={
            mostOrdered
              ? `${mostOrdered[1]} ${t("admin.products.form.sold")}`
              : t("admin.dashboard.noOrders")
          }
        />
        <StatCard
          icon={StarIcon}
          label="Active fragrances"
          value={activeProducts.toString()}
          description={`${products.length} total`}
        />
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-title">
            {t("admin.dashboard.recentOrders")}
          </h2>
          <Link href="/admin/orders" className="admin-panel-link">
            {t("admin.dashboard.viewAll")}
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {orders.length > 0 ? (
          <>
            <div className="hidden sm:block" style={{ overflowX: "auto" }}>
              <table className="admin-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>{t("admin.orders.orderId")}</th>
                    <th>{t("admin.orders.customer")}</th>
                    <th>{t("admin.orders.total")}</th>
                    <th>{t("admin.orders.status")}</th>
                    <th>{t("admin.orders.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>
                        #{order.id.slice(0, 8)}
                      </td>
                      <td>{order.fullName}</td>
                      <td style={{ fontWeight: 600 }}>
                        {order.totalAmount} {t("common.currency")}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="sm:hidden"
              style={{
                padding: "var(--space-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              {orders.slice(0, 5).map((order) => (
                <RecentOrderCard key={order.id} order={order} t={t} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={ShoppingBagIcon}
            title={t("admin.dashboard.noOrders")}
            description={
              t("admin.dashboard.noOrdersDesc") ||
              "New orders will appear here as customers check out."
            }
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">
        <Icon className="w-5 h-5" />
      </div>
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{value}</p>
      <p className="admin-stat-desc">{description}</p>
    </div>
  );
}
