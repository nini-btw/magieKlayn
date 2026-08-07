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
/**
 * @swagger
 * /api/delivery/stopdesk-centers/{wilayaCode}:
 *   get:
 *     tags: [Delivery]
 *     summary: List live Yalidine stop-desk pickup centers for a wilaya (public)
 *     description: >
 *       Calls Yalidine's getCenters() directly rather than reading from the
 *       DB — center data is never persisted locally.
 *     parameters:
 *       - in: path
 *         name: wilayaCode
 *         required: true
 *         schema: { type: string, example: "16" }
 *     responses:
 *       200:
 *         description: List of stop-desk centers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/StopdeskCenter' }
 *       400: { description: Invalid wilaya code }
 *       500: { description: Failed to fetch stop-desk centers from Yalidine }
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
