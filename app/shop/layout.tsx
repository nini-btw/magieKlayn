import type { Metadata } from "next";
import { getAllProducts } from "../actions";

// SEO metadata pinned to French, same rationale as app/layout.tsx.
const TITLE = "Boutique";
const DESCRIPTION =
  "Découvrez notre collection complète de parfums de luxe et nos coffrets cadeaux, livrés partout en Algérie.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    type: "website",
    url: "/shop",
    title: `${TITLE} · Magie Klayn`,
    description: DESCRIPTION,
  },
};

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.magieklayn.com";

  // Server-rendered ItemList JSON-LD to accompany the server-rendered
  // product grid in shop/page.tsx.
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
