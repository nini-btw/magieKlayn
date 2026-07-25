import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { getProductBySlug, getAllProducts } from "../../actions";
import { ProductDetail } from "./ProductDetail";

/**
 * Generate static params for all products
 * Note: Disabled during build to avoid DB connection issues
 */
export async function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  // Alternatively, you could return a few popular product slugs here
  return [];
}

/**
 * Generate metadata for product page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  // Unwrap the Promise
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

/**
 * Product detail page
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // Unwrap the Promise
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-sand/30 border-brown-100 border-b">
        <div className="container-site py-4">
          <nav className="text-brown-400 flex items-center gap-2 text-sm">
            <Link href="/" className="hover:text-brown-700 transition-colors">
              Home
            </Link>
            <ChevronRightIcon className="h-4 w-4" />
            <Link href="/shop" className="hover:text-brown-700 transition-colors">
              Shop
            </Link>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="text-brown-700">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <section className="section">
        <div className="container-site">
          <ProductDetail product={product} />
        </div>
      </section>
    </div>
  );
}
