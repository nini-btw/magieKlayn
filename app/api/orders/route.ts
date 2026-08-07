/**
 * Orders API Routes
 * @route GET /api/orders - Get all orders (admin only) with filters
 * @route POST /api/orders - Create a new order
 */

import { NextRequest, NextResponse } from "next/server";
import { orderRepository } from "@/infrastructure/db/order.adapter";
import { deliveryRepository } from "@/infrastructure/db/delivery.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";
import type { CreateOrderPayload, OrderFilters } from "@/domain/entities/order";
import { telegramNotificationService } from "@/infrastructure/telegram/telegram-notification.service";
import { createParcelForOrder } from "@/../scripts/create-parcel"; // adjust path to your actual import alias

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders with optional filters (admin only)
 *     security: [{ adminSession: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *       - in: query
 *         name: wilayaCode
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, confirmed, preparing, ready, delivered, cancelled] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Order' }
 *       401: { description: Unauthorized }
 */
export async function GET(request: NextRequest) {
  try {
    // Check if admin
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create an order (checkout, public)
 *     description: >
 *       deliveryFee is recomputed server-side to 0 when deliveryType is
 *       store_pickup, regardless of the submitted value. When deliveryType
 *       is stop_desk, stopdeskCenterId and stopdeskCommuneName are
 *       required — they identify the real Yalidine pickup center the
 *       customer chose (see WilayaCommuneSelect), and are what
 *       scripts/create-parcel.ts uses to create the actual Yalidine
 *       parcel for that order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer, items, deliveryZoneId, deliveryType, deliveryFee]
 *             properties:
 *               customer:
 *                 type: object
 *                 required: [firstName, lastName, phone]
 *                 properties:
 *                   firstName: { type: string }
 *                   lastName: { type: string }
 *                   phone: { type: string, example: "0550123456" }
 *               notes:
 *                 type: object
 *                 properties:
 *                   giftNote: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product: { type: object }
 *                     quantity: { type: integer }
 *               deliveryZoneId: { type: string, format: uuid }
 *               deliveryType: { type: string, enum: [stop_desk, home, store_pickup] }
 *               deliveryFee: { type: number }
 *               stopdeskCenterId:
 *                 type: integer
 *                 description: Required when deliveryType = stop_desk
 *               stopdeskCommuneName:
 *                 type: string
 *                 description: Required when deliveryType = stop_desk — the center's own commune
 *               packagingType: { type: string, enum: [standard, luxury_coffret] }
 *               coffretFee: { type: integer }
 *               boxColor: { type: string, enum: [white, black] }
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Order' }
 *                 message: { type: string }
 *       400: { description: Validation failure (missing customer/delivery/coffret/stop-desk fields, or invalid delivery zone) }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderPayload = await request.json();

    // Validate required fields
    if (
      !body.customer?.firstName ||
      !body.customer?.lastName ||
      !body.customer?.phone
    ) {
      return NextResponse.json(
        { success: false, error: "Missing customer information" },
        { status: 400 },
      );
    }

    // Validate delivery fields
    if (
      !body.deliveryZoneId ||
      !body.deliveryType ||
      body.deliveryFee === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing delivery information" },
        { status: 400 },
      );
    }
    if (body.packagingType === "luxury_coffret") {
      const totalQty = body.items.reduce(
        (s: number, i: any) => s + i.quantity,
        0,
      );
      if (totalQty > 4) {
        return NextResponse.json(
          {
            success: false,
            error: "Coffret packaging is only available for up to 4 bottles",
          },
          { status: 400 },
        );
      }
      if (!body.boxColor) {
        return NextResponse.json(
          { success: false, error: "Please select a box color" },
          { status: 400 },
        );
      }
    }

    // Stop-desk orders must carry the real Yalidine center the customer
    // picked in WilayaCommuneSelect — without it, createParcelForOrder
    // (scripts/create-parcel.ts) has no reliable way to find the right
    // center or the correct to_commune_name to send Yalidine.
    if (body.deliveryType === "stop_desk") {
      if (!body.stopdeskCenterId || !body.stopdeskCommuneName) {
        return NextResponse.json(
          { success: false, error: "Please select a pickup point" },
          { status: 400 },
        );
      }
    }

    // Resolve delivery zone and derive wilaya/commune fields
    const zone = await deliveryRepository.getZone(body.deliveryZoneId);
    if (!zone) {
      return NextResponse.json(
        { success: false, error: "Invalid delivery zone" },
        { status: 400 },
      );
    }

    // Store pickup is always free — never trust a client-supplied fee for it.
    // This also guards against a tampered request pairing "store_pickup"
    // with a non-zero deliveryFee.
    const deliveryFee =
      body.deliveryType === "store_pickup" ? 0 : body.deliveryFee;

    const order = await orderRepository.create({
      ...body,
      deliveryFee,
      wilayaCode: zone.wilayaCode,
      wilayaName: zone.wilayaNameAscii,
      communeName: zone.communeNameAscii,
    });

    // Fire-and-forget: notifyNewOrder already catches all errors internally
    // and never throws, so it can't fail the response — see its own docs.
    await telegramNotificationService.notifyNewOrder(order);
    await createParcelForOrder(order);

    return NextResponse.json(
      { success: true, data: order, message: "Order created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}
