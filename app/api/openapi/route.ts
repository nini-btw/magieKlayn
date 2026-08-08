import { NextResponse } from "next/server";
import { getApiDocs } from "@/infrastructure/swagger/config";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

/**
 * GET /api/openapi
 * Serves the generated OpenAPI 3.0 spec (from @swagger JSDoc blocks
 * across app/api/**\/route.ts) as JSON. Consumed by the Swagger UI page
 * at /api-docs. Not documented in the spec itself — it's the spec.
 *
 * NOTE: this route intentionally lives at app/api/openapi/route.ts, NOT
 * app/api/openapi.json/route.ts — a directory named "openapi.json"
 * confuses next-swagger-doc's file glob (it matches the directory as a
 * file by extension, then fails with EISDIR trying to read it as one).
 *
 * Admin-gated: the spec documents every route (including admin-only
 * ones) and shapes — it's reconnaissance value for free to anyone if
 * left public, so it's treated like any other admin-only surface.
 */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.json(getApiDocs());
}
