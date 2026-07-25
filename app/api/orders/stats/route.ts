/**
 * Orders Statistics API Route
 * @route GET /api/orders/stats - Get order statistics (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { orderRepository } from "@/infrastructure/db/order.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

/**
 * GET /api/orders/stats
 * Get order statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if admin
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    
    if (type === "wilayas") {
      const limit = parseInt(searchParams.get("limit") || "5");
      const topWilayas = await orderRepository.getTopWilayas(limit);
      return NextResponse.json({ success: true, data: topWilayas });
    }

    // Default: return general stats
    const orders = await orderRepository.getAll();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter(o => o.status === "pending").length;

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        pendingOrders,
      }
    });
  } catch (error) {
    console.error("Failed to fetch order stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order statistics" },
      { status: 500 }
    );
  }
}
