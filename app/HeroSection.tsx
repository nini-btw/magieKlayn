"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// TODO: wire this up to your real "featured fragrance" data (e.g. the first
// active product, or an editorially-picked one) instead of this placeholder.
const FEATURED = {
  name: "Femme Desirée",
  liquid: "#E2264A",
  liquidDeep: "#A3172C",
  labelColor: "#1D1D1D",
};

export default function HeroSection() {
  const t = useTranslations();

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

        <p className="hero-color-tag">{FEATURED.name}</p>

        <div
          className="bottle bottle-lg"
          style={
            {
              "--liquid": FEATURED.liquid,
              "--liquid-deep": FEATURED.liquidDeep,
              "--label-color": FEATURED.labelColor,
            } as React.CSSProperties
          }
        >
          <span className="bottle-cap" />
          <span className="bottle-shoulder" />
          <span className="bottle-label">
            <span className="bottle-label-brand">Magie Klayn</span>
            <span className="bottle-label-name">{FEATURED.name}</span>
            <span className="bottle-label-sub">
              {t("home.hero.bodySplashLabel")}
            </span>
          </span>
        </div>
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
