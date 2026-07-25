/**
 * Delivery Wilayas API Route
 * @route GET /api/delivery/wilayas - Get all distinct wilayas
 */

import { NextResponse } from "next/server";
import { deliveryRepository } from "@/infrastructure/db/delivery.adapter";

/**
 * GET /api/delivery/wilayas
 * Get all distinct wilayas for delivery
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
