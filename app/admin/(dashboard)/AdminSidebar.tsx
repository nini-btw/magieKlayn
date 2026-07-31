"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingBagIcon,
  LogOutIcon,
  UserIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { logoutAdmin } from "../actions";
import { LanguageSwitcher } from "@/presentation/components/features/LanguageSwitcher";
import { Logo } from "@/presentation/components/ui/Logo";
import { useTranslations, useLocale } from "next-intl";

export const AdminSidebar: React.FC<{
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ userEmail, isOpen, onClose }) => {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  const navItems = [
    {
      href: "/admin",
      icon: LayoutDashboardIcon,
      labelKey: "admin.sidebar.dashboard",
    },
    {
      href: "/admin/orders",
      icon: ShoppingBagIcon,
      labelKey: "admin.sidebar.orders",
    },
    {
      href: "/admin/products",
      icon: PackageIcon,
      labelKey: "admin.sidebar.products",
    },
  ];

  const handleLogout = async () => {
    await logoutAdmin();
  };

  return (
    <>
      {isOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-sidebar${isOpen ? " is-open" : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Link href="/admin" className="admin-sidebar-brand" onClick={onClose}>
          <span className="admin-sidebar-brand-mark" aria-hidden="true">
            <Logo />
          </span>
          <div>
            <span className="admin-sidebar-brand-text">Magie Klayn</span>
            <span className="admin-sidebar-brand-sub">
              {t("admin.topbar.adminDashboard")}
            </span>
          </div>
        </Link>

        {/* Back to the live storefront — deliberately outside /admin */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-sidebar-view-site"
          onClick={onClose}
        >
          <ExternalLinkIcon className="h-4 w-4" />
          {t("admin.sidebar.viewSite")}
        </Link>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`admin-nav-link${isActive ? " is-active" : ""}`}
                data-testid={
                  item.href === "/admin/products" ? "nav-products" : undefined
                }
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <LanguageSwitcher variant="admin" />

          <div className="admin-user-row">
            <UserIcon className="h-4 w-4" />
            <span>{userEmail}</span>
          </div>

          <button onClick={handleLogout} className="admin-signout">
            <LogOutIcon className="h-5 w-5" />
            {t("admin.sidebar.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
};
