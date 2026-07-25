"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBagIcon,
  TrendingUpIcon,
  CookieIcon,
  VoteIcon,
  ArrowRightIcon,
  UserIcon,
} from "lucide-react";
import type { Order } from "@/domain/entities/order";
import type { Product } from "@/domain/entities/product";
import type { VoteCandidate } from "@/domain/entities/vote";
import { useTranslations, useLocale } from 'next-intl';

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// Recent Order Card for Mobile
function RecentOrderCard({ order, t }: { order: Order; t: (key: string) => string }) {
  const statusKey = `admin.orders.statusLabels.${order.status}`;
  const statusLabel = t(statusKey);
  
  return (
    <div className="bg-white border border-[#E8D5C0] rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-[#2C1810]">#{order.id.slice(0, 8)}</p>
          <p className="text-sm text-[#A07850]">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          statusColors[order.status] || "bg-gray-100 text-gray-800"
        }`}>
          {statusLabel}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#F0E6D6] rounded-full flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-[#A07850]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#2C1810] truncate">{order.fullName}</p>
          <p className="text-sm text-[#A07850]">{order.items.length} {t('admin.products.form.items') || 'items'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#F0E6D6]">
        <p className="font-bold text-[#F4538A]">{order.totalAmount} {t('common.currency')}</p>
        <Link
          href={`/admin/orders`}
          className="text-sm text-[#F4538A] hover:text-[#D63A72] font-medium"
        >
          {t('admin.orders.view')} →
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [votes, setVotes] = useState<VoteCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, productsRes, votesRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/products"),
          fetch("/api/votes"),
        ]);

        const ordersData = await ordersRes.json();
        const productsData = await productsRes.json();
        const votesData = await votesRes.json();

        if (ordersData.success) setOrders(ordersData.data);
        if (productsData.success) setProducts(productsData.data);
        if (votesData.success) setVotes(votesData.data);
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
  const activeProducts = products.filter((p) => p.isActive).length;

  // Calculate most ordered product
  const productCounts = new Map<string, number>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const count = productCounts.get(item.productName) || 0;
      productCounts.set(item.productName, count + item.quantity);
    });
  });
  const mostOrdered = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  // Most voted cookie
  const mostVoted = [...votes].sort((a, b) => b.voteCount - a.voteCount)[0];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-[#2C1810]">{t('admin.dashboard.title')}</h1>
          <p className="text-[#A07850] mt-1">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard" className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-[#2C1810]">{t('admin.dashboard.title')}</h1>
        <p className="text-[#A07850] mt-1">{t('admin.dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={ShoppingBagIcon}
          label={t('admin.dashboard.totalOrders')}
          value={totalOrders.toString()}
          description={t('admin.dashboard.viewAll')}
          t={t}
        />
        <StatCard
          icon={TrendingUpIcon}
          label={t('admin.dashboard.revenue')}
          value={`${totalRevenue} ${t('common.currency')}`}
          description={t('admin.dashboard.subtitle')}
          t={t}
        />
        <StatCard
          icon={CookieIcon}
          label={t('admin.dashboard.mostOrdered')}
          value={mostOrdered?.[0] || "N/A"}
          description={mostOrdered ? `${mostOrdered[1]} ${t('admin.products.form.sold')}` : t('admin.dashboard.noOrders')}
          t={t}
        />
        <StatCard
          icon={VoteIcon}
          label={t('admin.dashboard.mostVoted')}
          value={mostVoted?.cookieName || "N/A"}
          description={mostVoted ? `${mostVoted.voteCount} ${t('vote.votes')}` : t('admin.dashboard.noOrders')}
          t={t}
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-3xl border border-[#E8D5C0] overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#E8D5C0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-bold text-[#2C1810] text-lg">{t('admin.dashboard.recentOrders')}</h2>
          <Link
            href="/admin/orders"
            className="text-[#F4538A] hover:text-[#D63A72] text-sm font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            {t('admin.dashboard.viewAll')}
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {orders.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-[#F0E6D6]/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#A07850]">
                      {t('admin.orders.orderId')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#A07850]">
                      {t('admin.orders.customer')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#A07850]">
                      {t('admin.orders.total')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#A07850]">
                      {t('admin.orders.status')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#A07850]">
                      {t('admin.orders.date')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C0]">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FFF0F5]/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 font-medium text-[#2C1810]">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-[#5C3D2E]">{order.fullName}</td>
                      <td className="px-4 sm:px-6 py-4 font-semibold text-[#2C1810]">
                        {order.totalAmount} {t('common.currency')}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[order.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {t(`admin.orders.statusLabels.${order.status}`)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-[#A07850]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden p-4 space-y-3">
              {orders.slice(0, 5).map((order) => (
                <RecentOrderCard key={order.id} order={order} t={t} />
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-[#A07850]">{t('admin.dashboard.noOrders')}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <QuickActionCard
          href="/admin/products"
          title={t('admin.dashboard.manageProducts')}
          description={`${activeProducts} ${t('admin.products.form.active') || 'active'}`}
          t={t}
        />
        <QuickActionCard
          href="/admin/drop"
          title={t('admin.dashboard.scheduleDrop')}
          description={t('admin.drop.subtitle')}
          t={t}
        />
        <QuickActionCard
          href="/admin/votes"
          title={t('admin.dashboard.viewVotes')}
          description={`${votes.length} ${t('admin.votes.candidates')}`}
          t={t}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  t,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  t: (key: string) => string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8D5C0]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-[#FFF0F5] rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#F4538A]" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#A07850]">{label}</span>
      </div>
      <p className="font-display text-2xl sm:text-3xl text-[#2C1810] truncate">{value}</p>
      <p className="text-sm text-[#A07850] mt-1">{description}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  t,
}: {
  href: string;
  title: string;
  description: string;
  t: (key: string) => string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl p-4 sm:p-6 border border-[#E8D5C0] hover:border-[#F4538A] hover:shadow-lg transition-all group cursor-pointer"
    >
      <h3 className="font-bold text-[#2C1810] group-hover:text-[#F4538A] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-[#A07850] mt-1">{description}</p>
    </Link>
  );
}
