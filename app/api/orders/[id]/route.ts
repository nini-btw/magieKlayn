/**
 * Individual Order API Routes
 * @route GET /api/orders/[id] - Get order by ID (admin only)
 * @route PUT /api/orders/[id] - Update order status (admin only)
 * @route DELETE /api/orders/[id] - Delete order (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { orderRepository } from "@/infrastructure/db/order.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";
import type { Order } from "@/domain/entities/order";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by ID (admin only)
 *     security: [{ adminSession: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Order' }
 *       401: { description: Unauthorized }
 *       404: { description: Order not found }
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Check if admin
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const order = await orderRepository.getById(id);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Update an order's status (admin only)
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, confirmed, preparing, ready, delivered, cancelled] }
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: Missing or invalid status }
 *       401: { description: Unauthorized }
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // Check if admin
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: "Missing status field" },
        { status: 400 }
      );
    }

    const validStatuses: Order["status"][] = [
      "pending", "confirmed", "preparing", "ready", "delivered", "cancelled"
    ];
    
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    await orderRepository.updateStatus(id, body.status);
    
    return NextResponse.json(
      { success: true, message: "Order status updated successfully" }
    );
  } catch (error: any) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Delete an order (admin only). Only cancelled orders can be deleted.
 *     security: [{ adminSession: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Order deleted }
 *       401: { description: Unauthorized }
 *       500: { description: "Order not found, or not cancelled (only cancelled orders can be deleted)" }
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Check if admin
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await orderRepository.delete(id);
    
    return NextResponse.json(
      { success: true, message: "Order deleted successfully" }
    );
  } catch (error: any) {
    console.error("Failed to delete order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}
