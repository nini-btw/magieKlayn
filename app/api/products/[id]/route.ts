/**
 * Individual Product API Routes
 * @route GET /api/products/[id] - Get product by ID
 * @route PUT /api/products/[id] - Update product (admin only)
 * @route DELETE /api/products/[id] - Delete product (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";
import { updateProductSchema } from "@/domain/validation/product.schema";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Product' }
 *       404: { description: Product not found }
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await productRepository.getById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (admin only)
 *     security: [{ adminSession: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial Product fields to update
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Product' }
 *       401: { description: Unauthorized }
 *       409: { description: A product with this slug already exists }
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const rawBody = await request.json();

    const parsed = updateProductSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid request body",
        },
        { status: 400 },
      );
    }

    const product = await productRepository.update(id, parsed.data);
    
    return NextResponse.json(
      { success: true, data: product, message: "Product updated successfully" }
    );
  } catch (error: any) {
    console.error("Failed to update product:", error);
    
    // Check for unique constraint violation (duplicate slug)
    if (error.message?.includes("unique constraint") || error.code === "23505") {
      return NextResponse.json(
        { success: false, error: "A product with this slug already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (admin only)
 *     security: [{ adminSession: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Product deleted }
 *       401: { description: Unauthorized }
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    await productRepository.delete(id);
    
    return NextResponse.json(
      { success: true, message: "Product deleted successfully" }
    );
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
