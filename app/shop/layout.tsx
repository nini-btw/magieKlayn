import type { Metadata } from "next";
import { getAllProducts } from "../actions";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Discover our full collection of luxury fragrances and coffret gift-box packaging.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    type: "website",
    url: "/shop",
    title: "Shop · Magie Klayn",
    description:
      "Discover our full collection of luxury fragrances and coffret gift-box packaging.",
  },
};

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.magieklayn.com";

  // Server-rendered purely so crawlers get a product ItemList — the
  // actual listing UI below is client-rendered (see shop/page.tsx).
  let itemListJsonLd: object | null = null;
  try {
    const products = await getAllProducts();
    itemListJsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/shop/${product.slug}`,
        name: product.name,
      })),
    };
  } catch {
    // DB unavailable — skip structured data rather than failing the page
  }

  return (
    <>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {children}
    </>
  );
}
