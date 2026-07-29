"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * Hero now uses two fixed marketing images instead of a per-product photo:
 * - MagieKalynPhone.png  -> small screens
 * - HeroWithBox.png      -> larger screens
 *
 * No more featuredProduct/loading dependency, no colorHex-derived tint —
 * this is a static brand image, so the hero no longer needs product data
 * at all. Content is stripped down to just the CTA(s), centered.
 */
export default function HeroSection() {
  const t = useTranslations();

  return (
    <section className="hero-full" id="top">
      {/* Mobile hero image */}
      <Image
        src="https://gaquniefolcmosxhctmg.supabase.co/storage/v1/object/public/magieKlayn/MagieKalynPhone.png"
        alt="Magie Klayn"
        fill
        priority
        sizes="100vw"
        className="hero-full-image block md:hidden"
      />

      {/* Desktop hero image */}
      <Image
        src="https://gaquniefolcmosxhctmg.supabase.co/storage/v1/object/public/magieKlayn/HeroWithBox.png"
        alt="Magie Klayn"
        fill
        priority
        sizes="100vw"
        className="hero-full-image hidden md:block"
      />

      <div className="hero-full-content hero-full-content--centered">
        <Link href="/shop" className="btn hero-full-cta">
          {t("home.hero.discoverCollection")}
        </Link>
      </div>
    </section>
  );
}
