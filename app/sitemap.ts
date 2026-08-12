import type { MetadataRoute } from "next";
import { getAllProducts } from "./actions";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.magieklayn.com";

const STATIC_ROUTES = [
  { path: "", changeFrequency: "daily" as const, priority: 1 },
  { path: "/shop", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/shipping", changeFrequency: "monthly" as const, priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getAllProducts();
    productEntries = products.map((product) => ({
      url: `${SITE_URL}/shop/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // DB unavailable (e.g. mock mode) — ship the static routes only
    // rather than failing the whole sitemap.
  }

  return [...staticEntries, ...productEntries];
}
