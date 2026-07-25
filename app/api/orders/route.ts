/**
 * Orders API Routes
 * @route GET /api/orders - Get all orders (admin only) with filters
 * @route POST /api/orders - Create a new order
 */

import { NextRequest, NextResponse } from "next/server";
import { orderRepository } from "@/infrastructure/db/order.adapter";
import { deliveryRepository } from "@/infrastructure/db/delivery.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";
import { canCheckout } from "@/domain/rules/cart.rules";
import type { CreateOrderPayload, OrderFilters } from "@/domain/entities/order";

/**
 * GET /api/orders
 * Get all orders (admin only) with optional filters
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
    const limit = parseInt(searchParams.get("limit") || "100");
    
    // Parse filters
    const filters: OrderFilters = {};
    
    const wilayaCode = searchParams.get("wilayaCode");
    if (wilayaCode) filters.wilayaCode = wilayaCode;
    
    const status = searchParams.get("status") as OrderFilters["status"];
    if (status) filters.status = status;
    
    const startDate = searchParams.get("startDate");
    if (startDate) filters.startDate = new Date(startDate);
    
    const endDate = searchParams.get("endDate");
    if (endDate) filters.endDate = new Date(endDate);
    
    const hasFilters = wilayaCode || status || startDate || endDate;
    
    const orders = hasFilters 
      ? await orderRepository.getAllWithFilters(filters, limit)
      : await orderRepository.getAll(limit);
    
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderPayload = await request.json();
    
    // Validate cart minimum
    if (!canCheckout(body.items)) {
      return NextResponse.json(
        { success: false, error: "Minimum 3 cookies required for checkout" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.customer?.fullName || !body.customer?.phone || !body.customer?.address) {
      return NextResponse.json(
        { success: false, error: "Missing customer information" },
        { status: 400 }
      );
    }

    // Validate delivery fields
    if (!body.deliveryZoneId || !body.deliveryType || body.deliveryFee === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing delivery information" },
        { status: 400 }
      );
    }

    // Resolve delivery zone and derive wilaya/commune fields
    const zone = await deliveryRepository.getZone(body.deliveryZoneId);
    if (!zone) {
      return NextResponse.json(
        { success: false, error: "Invalid delivery zone" },
        { status: 400 }
      );
    }

    const order = await orderRepository.create({
      ...body,
      wilayaCode: zone.wilayaCode,
      wilayaName: zone.wilayaNameAscii,
      communeName: zone.communeNameAscii,
    });
    
    return NextResponse.json(
      { success: true, data: order, message: "Order created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
