import { NextRequest, NextResponse } from "next/server";
import { yalidineClient } from "@/infrastructure/yalidine/client";
import type { StopdeskCenter } from "@/domain/entities/delivery";

/**
 * Returns the real list of Yalidine stop-desk centers for a wilaya.
 * Used by checkout to let the customer pick an actual center, instead
 * of guessing one from their home commune (see integration state doc
 * v6 §3 — that guessing approach produces hard Yalidine rejections
 * whenever the customer's commune has no center of its own).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ wilayaCode: string }> },
) {
  const wilayaId = Number((await params).wilayaCode);
  if (!Number.isInteger(wilayaId) || wilayaId <= 0) {
    return NextResponse.json(
      { success: false, error: "Invalid wilaya code" },
      { status: 400 },
    );
  }

  try {
    const res = await yalidineClient.getCenters(wilayaId);
    const centers: StopdeskCenter[] = res.data.map((c) => ({
      centerId: c.center_id,
      name: c.name,
      communeName: c.commune_name,
      address: c.address,
    }));
    return NextResponse.json({ success: true, data: centers });
  } catch (error) {
    console.error(
      `[stopdesk-centers] Failed to fetch centers for wilaya ${wilayaId}:`,
      error,
    );
    return NextResponse.json(
      { success: false, error: "Failed to fetch stop-desk centers" },
      { status: 500 },
    );
  }
}
