import type { Metadata } from "next";
import { Comfortaa, Noto_Kufi_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "./providers";
import "./globals.css";
import { locales, defaultLocale } from "../i18n.config";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
});
export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.magieklayn.com";

// SEO metadata (title/description/OG) always renders in French,
// independent of the visitor's UI locale (cookie-based, see
// getLocaleAndMessages below): the target audience is Algeria, where
// French dominates search behavior, and crawlers never carry a
// NEXT_LOCALE cookie so they'd otherwise always see the "en" default.
// The <html lang>/UI still switches per-visitor as before — only the
// <head> metadata surface is pinned to French.
const SEO_LOCALE = "fr";

// Common misspellings/phonetic variants of the brand name, gathered from how
// customers actually type it when searching (the "gie"/"y" and "Klayn" parts
// are the two spots people guess wrong). Kept here (not just in the visible
// UI) so search engines can match a typo'd query to the right result —
// listed in KEYWORDS below and as schema.org `alternateName` on the
// Organization JSON-LD, which is the mechanism Google actually uses to
// associate alternate spellings with an entity.
const BRAND_NAME_VARIANTS = [
  "Magie Klayn",
  "Magi Klayn",
  "Magi Klain",
  "Magic Klayn",
  "Magic Klain",
  "Magic Klein",
  "Magik Klayn",
  "Majik Klayn",
  "Maji Klayn",
  "Maji Klain",
  "Magy Klayn",
  "Magie Klain",
  "Magie Klein",
  "Magie Kleyn",
  "Magie Clain",
  "Magie Claine",
  "Magiclaine",
  "Magic Line",
  "Majic Line",
  "Magik Line",
  "ماجي كلاين",
  "ماجيك كلاين",
  "ماجي كلين",
];

const KEYWORDS = [
  ...BRAND_NAME_VARIANTS,
  "parfum de luxe Algérie",
  "parfum Oran",
  "parfum Alger",
  "brume parfumée",
  "coffret parfum Algérie",
  "livraison parfum Algérie",
];

async function buildMetadata(): Promise<Metadata> {
  const seoMessages = (await import(`../messages/${SEO_LOCALE}.json`))
    .default;
  const meta = seoMessages.metadata as { title: string; description: string };

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: "%s · Magie Klayn",
      default: meta.title,
    },
    description: meta.description,
    keywords: KEYWORDS,
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      url: SITE_URL,
      locale: "fr_DZ",
      siteName: "Magie Klayn",
      title: meta.title,
      description: meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata();
}

async function getLocaleAndMessages() {
  // Read locale from cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  const validLocales = locales as readonly string[];
  const locale =
    localeCookie && validLocales.includes(localeCookie)
      ? localeCookie
      : defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, messages } = await getLocaleAndMessages();
  const isRTL = locale === "ar";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Magie Klayn",
    // Misspellings/phonetic variants customers actually search with — this
    // is the field Google uses to match a typo'd query to this entity.
    alternateName: BRAND_NAME_VARIANTS.filter((v) => v !== "Magie Klayn"),
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    image: `${SITE_URL}/opengraph-image`,
    sameAs: [
      "https://www.instagram.com/magie.klayn.algerie/",
      "https://www.tiktok.com/@magieklaynalgerie",
      "https://www.facebook.com/profile.php?id=61577217032982",
    ],
    areaServed: {
      "@type": "Country",
      name: "Algeria",
    },
  };

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${comfortaa.variable} ${notoKufiArabic.variable}`}
    >
      <body className="font-body bg-white text-[#1A1A1A] min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
