/**
 * Orders Statistics API Route
 * @route GET /api/orders/stats - Get order statistics (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { orderRepository } from "@/infrastructure/db/order.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

/**
 * @swagger
 * /api/orders/stats:
 *   get:
 *     tags: [Orders]
 *     summary: Order statistics (admin only)
 *     description: >
 *       With ?type=wilayas, returns the top N wilayas by order count/revenue.
 *       Without it, returns totalOrders/totalRevenue/pendingOrders computed
 *       in-memory over all orders (see PROJECT_DOCUMENTATION.md §7 for the
 *       scaling caveat on this path).
 *     security: [{ adminSession: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [wilayas] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *         description: Only used with type=wilayas
 *     responses:
 *       200:
 *         description: Statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *       401: { description: Unauthorized }
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
