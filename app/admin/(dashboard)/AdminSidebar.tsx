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
  MenuIcon,
} from "lucide-react";
import { logoutAdmin } from "../actions";
import { LanguageSwitcher } from "@/presentation/components/features/LanguageSwitcher";
import { Logo } from "@/presentation/components/ui/Logo";
import { useTranslations, useLocale } from "next-intl";

export const AdminSidebar: React.FC<{
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ userEmail, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
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
        className={`admin-sidebar${isOpen ? " is-open" : ""}${isCollapsed ? " is-collapsed" : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-sidebar-brand" onClick={onClose}>
            <span className="admin-sidebar-brand-mark" aria-hidden="true">
              <Logo variant="white" />
            </span>
            <div className="admin-collapsible-label">
              <span className="admin-sidebar-brand-text">Magie Klayn</span>
              <span className="admin-sidebar-brand-sub">
                {t("admin.topbar.adminDashboard")}
              </span>
            </div>
          </Link>
          {/* Desktop-only — mobile already has its own open/close burger in
              AdminTopBar; this one toggles icon-only vs. full sidebar. */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="admin-sidebar-collapse-toggle hidden lg:flex"
            aria-label={t(isCollapsed ? "admin.sidebar.expand" : "admin.sidebar.collapse")}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>

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
                <span className="admin-collapsible-label">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          {/* Back to the live storefront — deliberately outside /admin */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-sidebar-view-site"
            onClick={onClose}
          >
            <ExternalLinkIcon className="h-4 w-4" />
            <span className="admin-collapsible-label">{t("admin.sidebar.viewSite")}</span>
          </Link>

          {/* Needs more than icon-width space to be usable, so it's hidden
              entirely (not just its label) when collapsed. */}
          {!isCollapsed && <LanguageSwitcher variant="admin" />}

          <div className="admin-user-row">
            <UserIcon className="h-4 w-4" />
            <span className="admin-collapsible-label">{userEmail}</span>
          </div>

          <button onClick={handleLogout} className="admin-signout">
            <LogOutIcon className="h-5 w-5" />
            <span className="admin-collapsible-label">{t("admin.sidebar.signOut")}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
