"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import HeroSection from "./HeroSection";
import { useTranslations } from "next-intl";
import type { Product } from "@/domain/entities/product";
import { getLuminance } from "@/presentation/lib/color";
import Image from "next/image";

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

  // Featured product for the hero: prefer an isNew fragrance, fall back to
  // the first active one. No hardcoded placeholder — if there are no
  // products yet, the hero renders its own empty state.
  const featuredProduct = products.find((p) => p.isNew) || products[0] || null;

  const tickerNames = products.map((p) => p.name);
  const tickerItems =
    tickerNames.length > 0 ? [...tickerNames, ...tickerNames] : [];

  // Story-section swatches are the brand's real bottle colors, not a
  // second hardcoded palette — every fragrance currently in the shop,
  // deduplicated, capped to fill the 3x3 grid.
  const storySwatches = Array.from(
    new Set(products.map((p) => p.colorHex)),
  ).slice(0, 9);

  return (
    <>
      <HeroSection featuredProduct={featuredProduct} loading={loading} />

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
            {products.map((product) => {
              const liquidDeep = `color-mix(in srgb, ${product.colorHex} 70%, black)`;
              const labelColor =
                getLuminance(product.colorHex) > 0.6 ? "#1D1D1D" : "#FFFFFF";
              return (
                <Link
                  href={`/shop/${product.slug}`}
                  key={product.id}
                  className="product-card"
                >
                  {/*  <div
                    className="bottle"
                    style={
                      {
                        "--liquid": product.colorHex,
                        "--liquid-deep": liquidDeep,
                        "--label-color": labelColor,
                      } as React.CSSProperties
                    }
                  >
                    <span className="bottle-cap" />
                    <span className="bottle-shoulder" />
                    <span className="bottle-label">
                      <span className="bottle-label-name">{product.name}</span>
                    </span>
                  </div> */}
                  <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[var(--color-bg-soft)]">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className={`object-cover transition-opacity duration-700 ease-[var(--ease-luxury)] `}
                      sizes="(max-width: 700px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
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

      <section className="story" id="about">
        <div className="story-inner">
          <div className="story-swatches" aria-hidden="true">
            {storySwatches.map((c, i) => (
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
