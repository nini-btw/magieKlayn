/**
 * Admin Products API Route
 * @route GET /api/admin/products - Get ALL products including inactive (admin only)
 */

import { NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

/**
 * GET /api/admin/products
 * Get all products including inactive (admin only)
 */
export async function GET() {
  try {
    // Check admin auth
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all products (including inactive) from repository
    const allProducts = await productRepository.getAll();

    return NextResponse.json({ success: true, data: allProducts });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
