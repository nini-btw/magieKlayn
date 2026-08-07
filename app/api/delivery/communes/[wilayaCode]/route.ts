/**
 * Delivery Communes API Route
 * @route GET /api/delivery/communes/[wilayaCode] - Get communes for a wilaya
 */

import { NextRequest, NextResponse } from "next/server";
import { deliveryRepository } from "@/infrastructure/db/delivery.adapter";

interface Params {
  params: Promise<{ wilayaCode: string }>;
}

/**
 * @swagger
 * /api/delivery/communes/{wilayaCode}:
 *   get:
 *     tags: [Delivery]
 *     summary: List communes (with fees/flags) for a wilaya (public)
 *     parameters:
 *       - in: path
 *         name: wilayaCode
 *         required: true
 *         schema: { type: string, example: "16" }
 *     responses:
 *       200:
 *         description: List of delivery zones (communes) within the wilaya
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/DeliveryZone' }
 *       400: { description: Wilaya code is required }
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { wilayaCode } = await params;

    if (!wilayaCode) {
      return NextResponse.json(
        { success: false, error: "Wilaya code is required" },
        { status: 400 }
      );
    }

    const communes = await deliveryRepository.getCommunesByWilaya(wilayaCode);

    return NextResponse.json({
      success: true,
      data: communes,
    });
  } catch (error) {
    console.error("Failed to fetch communes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch communes" },
      { status: 500 }
    );
  }
}
