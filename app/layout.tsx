import type { Metadata } from "next";
import { Comfortaa, Noto_Kufi_Arabic } from "next/font/google";
import { cookies } from 'next/headers';
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

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    template: "%s · Crumbleivable!",
    default: "Crumbleivable! — Chewy American Cookies in Wahran",
  },
  description:
    "Chewy, gooey American-style cookies delivered to your door in Wahran (Oran), Algeria. Order online, no account needed.",
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    siteName: "Crumbleivable!",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

async function getLocaleAndMessages() {
  // Read locale from cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  
  const validLocales = locales as readonly string[];
  const locale = localeCookie && validLocales.includes(localeCookie) 
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
  const isRTL = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`${comfortaa.variable} ${notoKufiArabic.variable}`}
    >
      <body className="font-body bg-[#FDF6EE] text-[#2C1810] min-h-screen">
        <Providers locale={locale} messages={messages}>{children}</Providers>
      </body>
    </html>
  );
}
