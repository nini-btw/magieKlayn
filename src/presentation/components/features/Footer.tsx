"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/presentation/components/ui/Logo";

export const Footer: React.FC = () => {
  const t = useTranslations();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link
            href="/"
            className="wordmark wordmark-footer"
            aria-label={t("brand.homeAria")}
          >
            <Logo />
          </Link>
          <div className="footer-social mt-4">
            <a
              href="https://www.instagram.com/magie.klayn.algerie/"
              className="icon-circle"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                viewBox="0 0 20 20"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="14" height="14" rx="4" />
                <circle cx="10" cy="10" r="3.2" />
                <circle
                  cx="14"
                  cy="6"
                  r="0.6"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@magieklaynalgerie"
              className="icon-circle"
              aria-label="TikTok"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                viewBox="0 0 20 20"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M11 3v9.2a2.6 2.6 0 1 1-2-2.53" />
                <path d="M11 3c.3 1.9 1.7 3.3 3.5 3.5" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h3 className="footer-col-title">{t("footer.shop.title")}</h3>
            <Link href="/shop">{t("footer.shop.all")}</Link>
            <Link href="/about">{t("footer.shop.about")}</Link>
          </div>
          <div className="footer-col">
            <h3 className="footer-col-title">{t("footer.help.title")}</h3>
            <Link href="/contact">{t("footer.help.contact")}</Link>
            <Link href="/shipping">{t("footer.help.shipping")}</Link>
            <Link href="/faq">{t("footer.help.faq")}</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Magie Klayn. {t("footer.rights")}.
        </p>
        <div className="footer-legal">
          <Link href="/privacy">{t("footer.legal.privacy")}</Link>
          <Link href="/terms">{t("footer.legal.terms")}</Link>
        </div>
      </div>
    </footer>
  );
};
