"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Product } from "@/domain/entities/product";
import { StoryColorStrip } from "@/presentation/components/features/StoryColorStrip";

export default function AboutPage() {
  const t = useTranslations();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        const result = await response.json();
        if (result.success) {
          setProducts(result.data.filter((p: Product) => p.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    }
    fetchProducts();
  }, []);

  return (
    <>
      <section className="page-hero">
        <p className="eyebrow">{t("about.pageEyebrow")}</p>
        <h1 className="section-title">
          {t("about.pageTitleLine1")}
          <br />
          {t("about.pageTitleLine2")}
        </h1>
        <p className="section-description">{t("about.pageIntro")}</p>
      </section>

      <section className="about-story">
        <div className="about-story-inner">
          <StoryColorStrip
            items={products.map((p) => ({ colorHex: p.colorHex, name: p.name }))}
          />
          <div className="about-story-text">
            <p className="eyebrow">{t("about.eyebrow")}</p>
            <h2 className="section-title">
              {t("about.titleLine1")}
              <br />
              {t("about.titleLine2")}
              <br />
              {t("about.titleLine3")}
            </h2>
            <p className="section-description">
              {t("about.description")} <em>{t("about.tagline")}</em>
            </p>
          </div>
        </div>
      </section>

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
          <p className="eyebrow">{t("about.valuesEyebrow")}</p>
          <h2 className="section-title">{t("about.valuesTitle")}</h2>
        </div>

        <div className="value-grid">
          <div className="value-card">
            <span className="value-card-index">01</span>
            <h3 className="value-card-title">{t("about.value1Title")}</h3>
            <p className="value-card-desc">{t("about.value1Desc")}</p>
          </div>
          <div className="value-card">
            <span className="value-card-index">02</span>
            <h3 className="value-card-title">{t("about.value2Title")}</h3>
            <p className="value-card-desc">{t("about.value2Desc")}</p>
          </div>
          <div className="value-card">
            <span className="value-card-index">03</span>
            <h3 className="value-card-title">{t("about.value3Title")}</h3>
            <p className="value-card-desc">{t("about.value3Desc")}</p>
          </div>
        </div>
      </section>

      <section className="about-find-us">
        <p className="eyebrow">{t("about.findUsEyebrow")}</p>
        <h2
          className="section-title"
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
            marginBottom: "var(--space-sm)",
          }}
        >
          {t("about.findUsTitle")}
        </h2>
        <p className="section-description">{t("about.findUsDesc")}</p>
        <Link href="/shipping" className="btn btn-secondary">
          {t("shipping.title") || "Shipping & Pickup"}
        </Link>
      </section>

      <section className="page-cta">
        <p className="eyebrow">{t("about.ctaTitle")}</p>
        <h2
          className="section-title"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            marginBottom: "var(--space-sm)",
          }}
        >
          {t("about.ctaDesc")}
        </h2>
        <Link href="/shop" className="btn btn-primary">
          {t("about.ctaButton")}
        </Link>
      </section>
    </>
  );
}
