"use client";

import * as React from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { toggleCart } from "@/presentation/store/ui/ui.slice";
import { selectTotalItemCount } from "@/presentation/store/cart/cart.slice";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "@/presentation/components/ui/Logo";
import { useTranslations } from "next-intl";

export const Header: React.FC = () => {
  const t = useTranslations();
  const dispatch = useDispatch();
  const cartCount = useSelector(selectTotalItemCount);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="site-header">
      <nav className="nav">
        <div className="nav-left">
          <Link href="/shop" className="nav-link">
            {mounted ? t("nav.collection") : "Collection"}
          </Link>
        </div>

        <div className="nav-center">
          <Link href="/" className="wordmark" aria-label={t("brand.homeAria")}>
            <span className="wordmark-mark" aria-hidden="true">
              <Logo />
            </span>
            <span className="wordmark-text">Magie Klayn</span>
            <span className="wordmark-sub">Body Splash</span>
          </Link>
        </div>

        <div className="nav-right">
          <Link href="/about" className="nav-link nav-link-desktop">
            {mounted ? t("nav.about") : "À propos"}
          </Link>

          <LanguageSwitcher />

          <button
            onClick={() => dispatch(toggleCart())}
            className="icon-circle"
            style={{ position: "relative" }}
            aria-label={t("common.openCart")}
            data-testid="cart-button"
          >
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M4 6h12l-1 10.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 16.5L4 6Z" />
              <path d="M7 6V4.5a3 3 0 0 1 6 0V6" />
            </svg>
            {cartCount > 0 && (
              <span
                data-testid="cart-count"
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "var(--color-text)",
                  color: "var(--color-white)",
                  fontSize: "10px",
                  fontWeight: 700,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};
