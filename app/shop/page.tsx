import { getAllProducts } from "../actions";
import { ShopPageClient } from "./ShopPageClient";

/**
 * Shop listing page — server-rendered so crawlers (and the initial
 * paint) get the real product grid instead of an empty shell that
 * only fills in after a client-side `/api/products` fetch. Sorting
 * stays client-side (see ShopPageClient) since it's just a re-order
 * of already-fetched data.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParamsData = await searchParams;
  const initialSort =
    searchParamsData.sort === "name-desc" ? "name-desc" : "name-asc";

  const products = await getAllProducts();

  return (
    <ShopPageClient initialProducts={products} initialSort={initialSort} />
  );
}
