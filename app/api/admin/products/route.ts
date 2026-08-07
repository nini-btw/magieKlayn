/**
 * Admin Products API Route
 * @route GET /api/admin/products - Get ALL products including inactive (admin only)
 */

import { NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     tags: [Products]
 *     summary: List ALL products, including inactive ones (admin only)
 *     security: [{ adminSession: [] }]
 *     responses:
 *       200:
 *         description: All products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *       401: { description: Unauthorized }
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
