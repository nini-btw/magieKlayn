"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { STORE_LOCATIONS } from "@/domain/entities/delivery";

export default function ShippingPage() {
  const t = useTranslations();
  const algiers = STORE_LOCATIONS["16"];
  const oran = STORE_LOCATIONS["31"];

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">{t("shipping.eyebrow")}</p>
        <h1 className="section-title">{t("shipping.title")}</h1>
        <p className="section-description">{t("shipping.subtitle")}</p>
      </section>

      {/* Delivery methods */}
      <div className="shipping-method-grid">
        <div className="shipping-method-card">
          <span className="shipping-method-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M2 5h10v9H2z" />
              <path d="M12 8h4l2 3v3h-6z" />
              <circle cx="5.5" cy="15.5" r="1.5" />
              <circle cx="14.5" cy="15.5" r="1.5" />
            </svg>
          </span>

          <div>
            <h3 className="shipping-method-title">{t("shipping.homeTitle")}</h3>
            <p className="shipping-method-desc">{t("shipping.homeDesc")}</p>
            <span className="shipping-method-meta">
              {t("shipping.homeMeta")}
            </span>
          </div>
        </div>

        <div className="shipping-method-card">
          <span className="shipping-method-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M3 7l7-4 7 4-7 4-7-4Z" />
              <path d="M3 7v6l7 4 7-4V7" />
            </svg>
          </span>

          <div>
            <h3 className="shipping-method-title">
              {t("shipping.pickupTitle")}
            </h3>
            <p className="shipping-method-desc">{t("shipping.pickupDesc")}</p>
            <span className="shipping-method-meta">
              {t("shipping.pickupMeta")}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery notice */}
      <div className="shipping-notice">
        <p className="shipping-notice-text">
          <strong>{t("shipping.noticeLabel")}</strong>{" "}
          {t("shipping.noticeText")}
        </p>
      </div>

      {/* Store locator */}
      <section>
        <div
          className="section-head"
          style={{
            maxWidth: 620,
            margin: "0 auto",
            padding: "0 var(--space-2xl)",
            textAlign: "center",
          }}
        >
          <p className="eyebrow">{t("shipping.storesEyebrow")}</p>
          <h2 className="section-title">{t("shipping.storesTitle")}</h2>
          <p className="section-description" style={{ margin: "0 auto" }}>
            {t("shipping.storesSubtitle")}
          </p>
        </div>

        <div className="store-grid">
          {/* Algiers */}
          <div className="store-card">
            <span className="store-badge">
              {t("shipping.storeAlgiers.badge")}
            </span>

            <h3 className="store-city">{t("shipping.storeAlgiers.city")}</h3>

            <div className="store-detail-row">
              <span className="store-detail-label">
                {t("shipping.addressLabel")}
              </span>
              <span className="store-detail-value">
                {algiers.name}, {algiers.addressLine}
              </span>
            </div>

            <div className="store-detail-row">
              <span className="store-detail-label">
                {t("shipping.hoursLabel")}
              </span>
              <span className="store-detail-value">
                {t("shipping.storeAlgiers.hours")}
              </span>
            </div>

            <div className="store-detail-row">
              <span className="store-detail-label">
                {t("shipping.phoneLabel")}
              </span>
              <span className="store-detail-value">
                <a href={`tel:${algiers.phoneHref}`}>{algiers.phoneDisplay}</a>
              </span>
            </div>

            <a
              href={algiers.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="store-map-link"
            >
              {t("shipping.viewOnMap")} →
            </a>
          </div>

          {/* Oran */}
          <div className="store-card">
            <span className="store-badge">{t("shipping.storeOran.badge")}</span>

            <h3 className="store-city">{t("shipping.storeOran.city")}</h3>

            <div className="store-detail-row">
              <span className="store-detail-label">
                {t("shipping.addressLabel")}
              </span>
              <span className="store-detail-value">
                {oran.name}, {oran.addressLine}
              </span>
            </div>

            <div className="store-detail-row">
              <span className="store-detail-label">
                {t("shipping.hoursLabel")}
              </span>
              <span className="store-detail-value">
                {t("shipping.storeOran.hours")}
              </span>
            </div>

            <div className="store-detail-row">
              <span className="store-detail-label">
                {t("shipping.phoneLabel")}
              </span>
              <span className="store-detail-value">
                <a href={`tel:${oran.phoneHref}`}>{oran.phoneDisplay}</a>
              </span>
            </div>

            <a
              href={oran.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="store-map-link"
            >
              {t("shipping.viewOnMap")} →
            </a>
          </div>
        </div>
      </section>

      <section className="page-cta">
        <p className="eyebrow">{t("shipping.ctaEyebrow")}</p>

        <h2
          className="section-title"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            marginBottom: "var(--space-sm)",
          }}
        >
          {t("shipping.ctaTitle")}
        </h2>

        <Link href="/contact" className="btn btn-primary">
          {t("shipping.ctaButton")}
        </Link>
      </section>
    </>
  );
}
