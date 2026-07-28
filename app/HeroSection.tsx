"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Product } from "@/domain/entities/product";
import { getLuminance } from "@/presentation/lib/color";

interface HeroSectionProps {
  featuredProduct: Product | null;
  loading: boolean;
}

export default function HeroSection({
  featuredProduct,
  loading,
}: HeroSectionProps) {
  const t = useTranslations();

  const liquidDeep = featuredProduct
    ? `color-mix(in srgb, ${featuredProduct.colorHex} 70%, black)`
    : "var(--color-border)";
  const labelColor = featuredProduct
    ? getLuminance(featuredProduct.colorHex) > 0.6
      ? "#1D1D1D"
      : "#FFFFFF"
    : "#1D1D1D";

  return (
    <section className="hero" id="top">
      <div className="hero-white">
        <p className="eyebrow">{t("home.hero.eyebrow")}</p>
        <h1 className="hero-headline">
          {t("home.hero.headlineLine1")}
          <br />
          {t("home.hero.headlineLine2")}
          <br />
          {t("home.hero.headlineLine3")}
        </h1>
        <p className="hero-description">{t("home.hero.description")}</p>
        <div className="cta-group">
          <Link href="/shop" className="btn btn-primary">
            {t("home.hero.discoverCollection")}
          </Link>
          <Link href="/about" className="btn btn-secondary">
            {t("home.hero.ourStory")}
          </Link>
        </div>
      </div>

      <div className="hero-color">
        <span className="hero-bubble bubble-1" aria-hidden="true" />
        <span className="hero-bubble bubble-2" aria-hidden="true" />
        <span className="hero-bubble bubble-3" aria-hidden="true" />
        <span className="hero-bubble bubble-4" aria-hidden="true" />
        <span className="hero-bubble bubble-5" aria-hidden="true" />

        {featuredProduct && (
          <p className="hero-color-tag">{featuredProduct.name}</p>
        )}

        {loading || !featuredProduct ? (
          <div
            className="bottle bottle-lg"
            style={
              {
                "--liquid": "var(--color-border)",
                "--liquid-deep": "var(--color-bg-soft)",
              } as React.CSSProperties
            }
          />
        ) : (
          <div
            className="bottle bottle-lg"
            style={
              {
                "--liquid": featuredProduct.colorHex,
                "--liquid-deep": liquidDeep,
                "--label-color": labelColor,
              } as React.CSSProperties
            }
          >
            <span className="bottle-cap" />
            <span className="bottle-shoulder" />
            <span className="bottle-label">
              <span className="bottle-label-brand">Magie Klayn</span>
              <span className="bottle-label-name">{featuredProduct.name}</span>
              <span className="bottle-label-sub">
                {featuredProduct.sizeMl}ml
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="scroll-indicator">
        <span className="mouse-shape" aria-hidden="true">
          <span className="mouse-wheel" />
        </span>
        <span className="scroll-text">{t("home.hero.scroll")}</span>
      </div>
    </section>
  );
}
