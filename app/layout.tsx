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

const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  fr: "fr_DZ",
  ar: "ar_DZ",
};

const KEYWORDS = [
  "Magie Klayn",
  "ماجيك كلاين",
  "parfum de luxe Algérie",
  "parfum Oran",
  "parfum Alger",
  "brume parfumée",
  "coffret parfum Algérie",
  "livraison parfum Algérie",
];

async function buildMetadata(): Promise<Metadata> {
  const { locale, messages } = await getLocaleAndMessages();
  const meta = messages.metadata as { title: string; description: string };

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
      locale: OG_LOCALE[locale] ?? "fr_DZ",
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
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    image: `${SITE_URL}/opengraph-image`,
    sameAs: [
      "https://www.instagram.com/magie.klayn.algerie/",
      "https://www.tiktok.com/@magieklaynalgerie",
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
