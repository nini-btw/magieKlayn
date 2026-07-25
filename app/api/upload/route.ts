/**
 * File Upload API Route
 * @route POST /api/upload - Upload an image file (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";
import { storageService } from "@/infrastructure/storage/supabase-storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

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
    const url = await storageService.upload(buffer, file.name, file.type);

    return NextResponse.json({ success: true, url, message: "File uploaded successfully" });
  } catch (error: any) {
    console.error("Failed to upload file:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
