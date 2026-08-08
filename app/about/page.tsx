"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { StoryColorStrip } from "@/presentation/components/features/StoryColorStrip";
import {
  STORY_PALETTE,
  type StoryPaletteItem,
} from "@/domain/data/story-palette";

/** Splits `items` into `groups` roughly-even, order-preserving chunks. */
function chunk<T>(items: T[], groups: number): T[][] {
  const size = Math.ceil(items.length / groups);
  return Array.from({ length: groups }, (_, i) =>
    items.slice(i * size, i * size + size),
  ).filter((group) => group.length > 0);
}

/** The subset of a live product this section needs — fetched fresh so the
 * "Inspired By" list always reflects whatever's curated in the admin,
 * rather than duplicating that data as a static file. */
interface InspiredProduct {
  id: string;
  name: string;
  colorHex: string;
  inspiredBy: string | null;
}

export default function AboutPage() {
  const t = useTranslations();
  const reduceMotion = useReducedMotion();

  const paletteChunks = React.useMemo(
    () => chunk<StoryPaletteItem>(STORY_PALETTE, 4),
    [],
  );

  const [inspiredProducts, setInspiredProducts] = React.useState<
    InspiredProduct[]
  >([]);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/products?limit=100")
      .then((res) => res.json())
      .then((result) => {
        if (cancelled || !result.success) return;
        const withInspiration = (result.data as InspiredProduct[]).filter(
          (p) => p.inspiredBy,
        );
        setInspiredProducts(withInspiration);
      })
      .catch(() => {
        // Silent — the section just renders empty if this fails, same
        // failure mode as any other client-fetched list on this site.
      });
    return () => {
      cancelled = true;
    };
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
        <div className="about-story-row">
          <StoryColorStrip items={paletteChunks[0] ?? []} bend="right" />
          <div className="about-story-text">
            <p className="eyebrow">{t("about.eyebrow")}</p>
            <h2 className="section-title">
              {t("about.titleLine1")}
              <br />
              {t("about.titleLine2")}
              <br />
              {t("about.titleLine3")}
            </h2>
          </div>
        </div>

        <div className="about-story-row">
          <StoryColorStrip items={paletteChunks[1] ?? []} bend="left" />
          <div className="about-story-text">
            <p className="section-description">{t("about.description")}</p>
          </div>
        </div>

        <div className="about-story-row">
          <StoryColorStrip items={paletteChunks[2] ?? []} bend="right" />
          <div className="about-story-text">
            <p className="about-story-pullquote">
              <em>{t("about.tagline")}</em>
            </p>
          </div>
        </div>

        <div className="about-story-row">
          <StoryColorStrip items={paletteChunks[3] ?? []} bend="left" />
          <div className="about-story-text">
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

        {inspiredProducts.length > 0 && (
          <div className="about-inspired-list">
            {inspiredProducts.map((product, i) => (
              <motion.div
                className="about-inspired-entry"
                key={product.id}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={
                  reduceMotion ? undefined : { opacity: 1, y: 0 }
                }
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: "easeOut",
                }}
              >
                <span
                  className="about-inspired-swatch"
                  style={{ backgroundColor: product.colorHex }}
                  aria-hidden="true"
                />
                <div className="about-inspired-copy">
                  <span className="about-inspired-name">{product.name}</span>
                  <span className="about-inspired-note">
                    {t("about.inspiredByPrefix")} <em>{product.inspiredBy}</em>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
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
