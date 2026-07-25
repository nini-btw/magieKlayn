/**
 * Cookies API Route
 * @route GET /api/products/cookies - Get all cookie-type products
 */

import { NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/db/product.adapter";

/**
 * GET /api/products/cookies
 * Get all cookie-type products
 * Query params:
 * - includeInactive: boolean (default: false) - include inactive products
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    let cookies;
    if (includeInactive) {
      // Get all products of type cookie (including inactive)
      const allProducts = await productRepository.getAll();
      cookies = allProducts.filter((p) => p.type === "cookie");
    } else {
      cookies = await productRepository.getAllCookies();
    }

    return NextResponse.json({ success: true, data: cookies });
  } catch (error) {
    console.error("Failed to fetch cookies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cookies" },
      { status: 500 }
    );
  }
}
