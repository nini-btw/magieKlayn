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
 * GET /api/orders/[id]
 * Get order by ID (admin only)
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
 * PUT /api/orders/[id]
 * Update order status (admin only)
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
 * DELETE /api/orders/[id]
 * Delete order (admin only)
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
