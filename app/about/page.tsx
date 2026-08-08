"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StoryColorStrip } from "@/presentation/components/features/StoryColorStrip";
import { STORY_PALETTE, INSPIRED_BY } from "@/domain/data/story-palette";

export default function AboutPage() {
  const t = useTranslations();

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
          <StoryColorStrip items={STORY_PALETTE} />
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

            <div className="about-stats-row">
              <div className="about-stat">
                <span className="about-stat-value">{STORY_PALETTE.length}</span>
                <span className="about-stat-label">{t("about.statsMists")}</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">2</span>
                <span className="about-stat-label">{t("about.statsCities")}</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">100%</span>
                <span className="about-stat-label">
                  {t("about.statsSmallBatch")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-inspired">
        <div
          className="section-head"
          style={{
            maxWidth: 620,
            margin: "0 auto",
            padding: "0 var(--space-2xl)",
            textAlign: "center",
          }}
        >
          <p className="eyebrow">{t("about.inspiredEyebrow")}</p>
          <h2 className="section-title">{t("about.inspiredTitle")}</h2>
          <p className="section-description" style={{ margin: "0 auto" }}>
            {t("about.inspiredSubtitle")}
          </p>
        </div>

        <div className="about-inspired-grid">
          {INSPIRED_BY.map((entry) => (
            <div className="about-inspired-card" key={entry.mist}>
              <span className="about-inspired-mist">{entry.mist}</span>
              <span className="about-inspired-arrow" aria-hidden="true">
                →
              </span>
              <span className="about-inspired-original">
                {entry.inspiration}
              </span>
            </div>
          ))}
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
