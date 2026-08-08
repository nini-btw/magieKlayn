/**
 * File Upload API Route
 * @route POST /api/upload - Upload an image file (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";
import { storageService } from "@/infrastructure/storage/supabase-storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * Magic-byte sniff for the 4 allowed image formats — the browser-supplied
 * `file.type` (checked below) is just a label the client attaches and
 * can't be trusted on its own; this confirms the actual file bytes match
 * one of the allowed formats before it's accepted.
 */
export function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * @swagger
 * /api/upload:
 *   post:
 *     tags: [Upload]
 *     summary: Upload a product image to Supabase Storage (admin only)
 *     security: [{ adminSession: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: image/jpeg, image/png, image/webp, or image/gif, max 5MB
 *     responses:
 *       200:
 *         description: Uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 url: { type: string, format: uri }
 *                 message: { type: string }
 *       400: { description: No file provided, invalid file type, or file too large }
 *       401: { description: Unauthorized }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "File too large" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const sniffedType = sniffImageType(buffer);
    if (!sniffedType || !ALLOWED_TYPES.includes(sniffedType)) {
      return NextResponse.json(
        { success: false, error: "File content does not match an allowed image type" },
        { status: 400 },
      );
    }

    const url = await storageService.upload(buffer, file.name, sniffedType);

    return NextResponse.json({ success: true, url, message: "File uploaded successfully" });
  } catch (error: any) {
    console.error("Failed to upload file:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
