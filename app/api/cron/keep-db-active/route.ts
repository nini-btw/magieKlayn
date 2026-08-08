/**
 * Keep-Alive Cron Route
 * @route GET /api/cron/keep-db-active - Pings the database so Supabase's free tier
 *   doesn't auto-pause the project after 7 days of inactivity. Triggered by Vercel Cron
 *   (see vercel.json) once a week; Vercel automatically sends the CRON_SECRET as a
 *   Bearer token on its own invocations.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/infrastructure/db/client";
import { products } from "@/infrastructure/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * @swagger
 * /api/cron/keep-db-active:
 *   get:
 *     tags: [Cron]
 *     summary: Ping the database to prevent Supabase free-tier auto-pause (cron only)
 *     security: [{ cronSecret: [] }]
 *     responses:
 *       200:
 *         description: Ping succeeded (or DB is in mock mode, nothing to ping)
 *       401:
 *         description: Missing/invalid CRON_SECRET
 *       500:
 *         description: Database ping failed
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    console.warn("⚠️  Cron: skipped keep-alive ping — DB running in mock mode");
    return NextResponse.json({
      success: false,
      message: "DB not configured (mock mode)",
    });
  }

  try {
    await db.select().from(products).limit(1);

    console.log("✅ Cron: Database keep-alive successful");
    return NextResponse.json({
      success: true,
      message: "Database kept active",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Cron: Keep-alive failed:", error);
    return NextResponse.json(
      { error: "Database ping failed", details: error.message },
      { status: 500 }
    );
  }
}
