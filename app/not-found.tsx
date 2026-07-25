"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <div className="notfound-visual" aria-hidden="true">
          <span className="notfound-spill">
            <svg viewBox="0 0 220 150" width="100%" height="100%">
              <path
                d="M40 10 C 20 60, 60 90, 50 140"
                stroke="#e8a9b8"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
            </svg>
          </span>
          <span className="notfound-bottle" />
        </div>
        <p className="notfound-code-text">404</p>
        <p className="eyebrow">{t("notFound.eyebrow")}</p>
        <h1 className="section-title notfound-title">{t("notFound.title")}</h1>
        <p className="section-description notfound-description">
          {t("notFound.description")}
        </p>
        <div className="notfound-actions">
          <Link href="/" className="btn btn-primary">
            {t("notFound.backHome")}
          </Link>
          <Link href="/shop" className="btn btn-secondary">
            {t("notFound.browseCollection")}
          </Link>
        </div>
      </div>
    </div>
  );
}
