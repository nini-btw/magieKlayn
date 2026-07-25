"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

      <section className="story">
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
