/**
 * Products API Routes
 * @route GET /api/products - Get all active products (public)
 * @route POST /api/products - Create a new product (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

/**
 * GET /api/products
 * Get all active products with pagination (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    // Validate pagination params
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit)); // Max 100 per page
    
    const offset = (validatedPage - 1) * validatedLimit;
    
    // Public endpoint: return only active products
    const products = await productRepository.getAllActivePaginated(validatedLimit, offset);
    
    // Get total count for pagination metadata
    const totalCount = await productRepository.getActiveCount();
    
    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validatedLimit),
      }
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create a new product (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const required = ["name", "slug", "description", "price", "type"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const product = await productRepository.create(body);
    return NextResponse.json(
      { success: true, data: product, message: "Product created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create product:", error);
    
    // Check for unique constraint violation (duplicate slug)
    if (error.message?.includes("unique constraint") || error.code === "23505") {
      return NextResponse.json(
        { success: false, error: "A product with this slug already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
