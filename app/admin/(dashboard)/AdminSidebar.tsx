"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingBagIcon,
  ClockIcon,
  VoteIcon,
  LogOutIcon,
  CookieIcon,
  UserIcon,
} from "lucide-react";
import { cn } from "@/presentation/lib/utils";
import { logoutAdmin } from "../actions";
import { LanguageSwitcher } from "@/presentation/components/features/LanguageSwitcher";
import { useTranslations, useLocale } from 'next-intl';

export const AdminSidebar: React.FC<{
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ userEmail, isOpen, onClose }) => {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const navItems = [
    { href: "/admin", icon: LayoutDashboardIcon, labelKey: "admin.sidebar.dashboard" },
    { href: "/admin/orders", icon: ShoppingBagIcon, labelKey: "admin.sidebar.orders" },
    { href: "/admin/products", icon: PackageIcon, labelKey: "admin.sidebar.products" },
    { href: "/admin/drop", icon: ClockIcon, labelKey: "admin.sidebar.weeklyDrop" },
    { href: "/admin/votes", icon: VoteIcon, labelKey: "admin.sidebar.votes" },
  ];

  const handleLogout = async () => {
    await logoutAdmin();
  };

  return (
    <>
      {/* Backdrop - click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen w-64 flex-col bg-[#2C1810] text-white transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="border-b border-white/10 p-6">
          <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
            <CookieIcon className="h-8 w-8 text-[#F4538A]" />
            <div>
              <span className="font-display text-xl text-white">crumbleivable!</span>
              <span className="mt-0.5 block text-xs text-white/50">
                {t("admin.topbar.adminDashboard")}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#F4538A] text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
                data-testid={item.href === "/admin/products" ? "nav-products" : undefined}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          {/* Language Switch - Desktop Only */}
          <div className="">
            <LanguageSwitcher variant="admin" />
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-white/60">
            <UserIcon className="h-4 w-4" />
            <span className="truncate">{userEmail}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            <LogOutIcon className="h-5 w-5" />
            {t("admin.sidebar.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
};
