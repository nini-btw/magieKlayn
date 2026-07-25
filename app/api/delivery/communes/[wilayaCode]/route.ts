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
 * GET /api/delivery/communes/[wilayaCode]
 * Get all communes for a specific wilaya
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
