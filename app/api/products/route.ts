/**
 * Products API Routes
 * @route GET /api/products - Get all active products (public)
 * @route POST /api/products - Create a new product (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List active products (paginated, public)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of active products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     totalCount: { type: integer }
 *                     totalPages: { type: integer }
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
    const products = await productRepository.getAllActivePaginated(
      validatedLimit,
      offset,
    );

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
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (admin only)
 *     security: [{ adminSession: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, description, price, colorHex, sizeMl, images]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               description: { type: string }
 *               price: { type: integer }
 *               colorHex: { type: string, example: "#D0223A" }
 *               sizeMl: { type: integer }
 *               images: { type: array, items: { type: string } }
 *               notes: { type: array, items: { type: string } }
 *               gender: { type: string, enum: [male, female, unisex] }
 *               isActive: { type: boolean }
 *               isNew: { type: boolean }
 *               isSoldOut: { type: boolean }
 *               inspiredBy: { type: string, description: "Optional fragrance icon this mist draws from, e.g. Dior Lucky" }
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Product' }
 *                 message: { type: string }
 *       400: { description: Missing required field }
 *       401: { description: Unauthorized }
 *       409: { description: A product with this slug already exists }
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate required fields
    const required = [
      "name",
      "slug",
      "description",
      "price",
      "colorHex",
      "sizeMl",
      "images",
    ];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    const product = await productRepository.create(body);
    return NextResponse.json(
      { success: true, data: product, message: "Product created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Failed to create product:", error);

    // Check for unique constraint violation (duplicate slug)
    if (
      error.message?.includes("unique constraint") ||
      error.code === "23505"
    ) {
      return NextResponse.json(
        { success: false, error: "A product with this slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 },
    );
  }
}
