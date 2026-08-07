/**
 * Delivery Wilayas API Route
 * @route GET /api/delivery/wilayas - Get all distinct wilayas
 */

import { NextResponse } from "next/server";
import { deliveryRepository } from "@/infrastructure/db/delivery.adapter";

/**
 * @swagger
 * /api/delivery/wilayas:
 *   get:
 *     tags: [Delivery]
 *     summary: List distinct deliverable wilayas (public)
 *     description: Distinct wilayas that have at least one delivery_zones row.
 *     responses:
 *       200:
 *         description: List of wilayas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wilayaCode: { type: string }
 *                       wilayaName: { type: string }
 */
export async function GET() {
  try {
    const wilayas = await deliveryRepository.getWilayas();

    return NextResponse.json({
      success: true,
      data: wilayas,
    });
  } catch (error) {
    console.error("Failed to fetch wilayas:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wilayas" },
      { status: 500 }
    );
  }
}
