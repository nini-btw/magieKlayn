"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@/domain/entities/product";
import { formatPrice, getLuminance } from "@/presentation/lib/utils";
import { gridItem } from "@/presentation/lib/animations";

// Flip this to switch the look for the whole section.
// "solid"   -> full-strength colorHex, subtle diagonal degradé of itself
//              (darker at one corner), no dilution/tint at all.
// "tint"    -> the original soft-tint-over-white treatment.
export type DiscoveryColorMode = "solid" | "tint";
const DEFAULT_COLOR_MODE: DiscoveryColorMode = "solid";

export interface DiscoverySectionProps {
  products: Product[];
  colorMode?: DiscoveryColorMode;
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Background for a card, depending on the chosen color mode. */
function getCardBackground(colorHex: string, mode: DiscoveryColorMode): string {
  if (mode === "tint") {
    return `color-mix(in srgb, ${colorHex} 14%, white)`;
  }
  // "solid": the real colorHex, degrading into a slightly darker shade
  // of itself (never a different hue) so it still reads as one color.
  return `linear-gradient(155deg, ${colorHex} 0%, color-mix(in srgb, ${colorHex} 78%, black) 100%)`;
}

export default function DiscoverySection({
  products,
  colorMode = DEFAULT_COLOR_MODE,
}: DiscoverySectionProps) {
  const t = useTranslations();

  const picks = React.useMemo(() => shuffle(products).slice(0, 3), [products]);

  if (picks.length === 0) return null;

  return (
    <section className="discovery" aria-label={t("home.discovery.aria")}>
      <div className="discovery-head">
        <p className="eyebrow">{t("home.discovery.eyebrow")}</p>
        <h2 className="section-title">{t("home.discovery.title")}</h2>
        <p className="section-description">{t("home.discovery.subtitle")}</p>
      </div>

      <div className="discovery-grid">
        {picks.map((product, i) => {
          const hasPhoto = Boolean(product.images && product.images.length > 0);
          const isSoldOut = Boolean(product.isSoldOut);
          const isNew = Boolean(product.isNew) && !isSoldOut;

          const background = getCardBackground(product.colorHex, colorMode);

          // Contrast is always checked against the *actual* colorHex, since
          // in "solid" mode that's the real background strength, and in
          // "tint" mode the diluted version is light enough that dark text
          // reads fine regardless.
          const needsWhiteText =
            colorMode === "solid" && getLuminance(product.colorHex) < 0.6;
          const textColor = needsWhiteText ? "#ffffff" : "var(--color-text)";

          return (
            <motion.div
              key={product.id}
              variants={gridItem}
              initial="initial"
              animate="animate"
              transition={{ delay: i * 0.08 }}
              className="discovery-cell"
            >
              <Link
                href={`/shop/${product.slug}`}
                className="discovery-card group"
                style={{ background, color: textColor }}
              >
                {(isNew || isSoldOut) && (
                  <div className="discovery-badge">
                    {isSoldOut ? (
                      <span className="badge badge-muted">
                        {t("shop.soldOut")}
                      </span>
                    ) : (
                      <span className="badge badge-new">
                        <span className="badge-dot" />
                        {t("shop.new")}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`discovery-visual ${isSoldOut ? "is-sold-out" : ""}`}
                >
                  {hasPhoto ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 700px) 100vw, 33vw"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div
                      className="bottle discovery-bottle"
                      style={
                        {
                          "--liquid": product.colorHex,
                          "--liquid-deep": product.colorHex,
                        } as React.CSSProperties
                      }
                    >
                      <span className="bottle-cap" />
                      <span className="bottle-shoulder" />
                      <div className="bottle-label">
                        <span className="bottle-label-brand">Magie Klayn</span>
                        <span className="bottle-label-name">
                          {product.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="discovery-content">
                  <span className="discovery-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="discovery-name">{product.name}</h3>
                  <p className="discovery-price">
                    {formatPrice(product.price)}
                  </p>
                  <span className="discovery-cta">
                    {t("home.discovery.cta")}
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
