"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import HeroSection from "./HeroSection";
import { useTranslations } from "next-intl";
import type { Product } from "@/domain/entities/product";

// TODO: replace with a real per-product color once your product schema has
// one (e.g. product.accentColor). This palette just cycles so every card
// gets a plausible bottle color, matching the reference design's look.
const BOTTLE_PALETTE: { liquid: string; liquidDeep: string; label: string }[] =
  [
    { liquid: "#C43A63", liquidDeep: "#9C2A4C", label: "#1D1D1D" },
    { liquid: "#E8C9DC", liquidDeep: "#DBAFC9", label: "#1D1D1D" },
    { liquid: "#D0223A", liquidDeep: "#A3172C", label: "#FFFFFF" },
    { liquid: "#7A1F2B", liquidDeep: "#57141F", label: "#FFFFFF" },
    { liquid: "#7A3E9E", liquidDeep: "#5C2C7A", label: "#FFFFFF" },
    { liquid: "#2FB6A8", liquidDeep: "#1F9488", label: "#1D1D1D" },
    { liquid: "#F7F1E7", liquidDeep: "#EDE3D2", label: "#1D1D1D" },
    { liquid: "#1B1B1B", liquidDeep: "#000000", label: "#FFFFFF" },
  ];

const COFFRET_COLORS = [
  "#8E2A46",
  "#C81E3A",
  "#5C2C7A",
  "#EFAE7D",
  "#A98AE0",
  "#8E2A46",
];
const STORY_SWATCHES = [
  "#C43A63",
  "#D0223A",
  "#EFAE7D",
  "#F4CE55",
  "#A98AE0",
  "#7A3E9E",
  "#2FB6A8",
  "#1B1B1B",
  "#E8C9DC",
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const t = useTranslations();

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
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire up to your real newsletter endpoint.
    console.log("newsletter signup:", email);
  }

  const tickerNames = products.map((p) => p.name);
  // duplicate the list so the CSS scroll animation loops seamlessly
  const tickerItems =
    tickerNames.length > 0 ? [...tickerNames, ...tickerNames] : [];

  return (
    <>
      <HeroSection />

      {tickerItems.length > 0 && (
        <section className="ticker" aria-label={t("home.ticker.aria")}>
          <div className="ticker-track">
            {tickerItems.map((name, i) => (
              <React.Fragment key={`${name}-${i}`}>
                <span>{name}</span>
                <span className="dot">•</span>
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      <section className="collection" id="collection">
        <div className="section-head">
          <p className="eyebrow">{t("home.featured.eyebrow")}</p>
          <h2 className="section-title">
            {t("home.featured.titleLine1")}
            <br />
            {t("home.featured.titleLine2")}
          </h2>
          <p className="section-description">{t("home.featured.subtitle")}</p>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 0",
              color: "var(--color-text-secondary)",
            }}
          >
            {t("common.loading")}
          </div>
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map((product, index) => {
              const palette = BOTTLE_PALETTE[index % BOTTLE_PALETTE.length];
              return (
                <Link
                  href={`/shop/${product.id}`}
                  key={product.id}
                  className="product-card"
                >
                  <div
                    className="bottle"
                    style={
                      {
                        "--liquid": palette.liquid,
                        "--liquid-deep": palette.liquidDeep,
                        "--label-color": palette.label,
                      } as React.CSSProperties
                    }
                  >
                    <span className="bottle-cap" />
                    <span className="bottle-shoulder" />
                    <span className="bottle-label">
                      <span className="bottle-label-name">{product.name}</span>
                    </span>
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-meta">
                    {t("home.featured.productMeta")}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 0",
              color: "var(--color-text-secondary)",
            }}
          >
            {t("shop.noProducts")}
          </div>
        )}
      </section>

      <section className="coffret" id="coffret">
        <div className="coffret-visual">
          <div className="coffret-box">
            <span className="coffret-lid" />
            <div className="coffret-row">
              {COFFRET_COLORS.map((c, i) => (
                <span
                  key={i}
                  className="mini-bottle"
                  style={{ "--liquid": c } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="coffret-text">
          <p className="eyebrow">{t("coffret.eyebrow")}</p>
          <h2 className="section-title">
            {t("coffret.titleLine1")}
            <br />
            {t("coffret.titleLine2")}
          </h2>
          <p className="section-description">{t("coffret.subtitle")}</p>
          <Link href="/coffrets" className="btn btn-primary">
            {t("coffret.cta")}
          </Link>
        </div>
      </section>

      <section className="story" id="about">
        <div className="story-inner">
          <div className="story-swatches" aria-hidden="true">
            {STORY_SWATCHES.map((c, i) => (
              <span key={i} style={{ "--c": c } as React.CSSProperties} />
            ))}
          </div>
          <div className="story-text">
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
            <Link href="/shop" className="text-link">
              {t("about.exploreCollection")} →
            </Link>
          </div>
        </div>
      </section>

      <section className="newsletter">
        <div className="newsletter-inner">
          <h2 className="section-title newsletter-title">
            {t("home.newsletter.title")}
          </h2>
          <p className="section-description newsletter-description">
            {t("home.newsletter.subtitle")}
          </p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <label className="sr-only" htmlFor="newsletter-email">
              {t("home.newsletter.emailLabel")}
            </label>
            <input
              className="newsletter-input"
              type="email"
              id="newsletter-email"
              name="email"
              placeholder={t("home.newsletter.placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit">
              {t("home.newsletter.button")}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
