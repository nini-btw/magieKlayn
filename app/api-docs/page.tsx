"use client";

/**
 * Interactive API documentation / manual test console for every route
 * under app/api/**. Not part of the storefront nav — internal dev/admin
 * tooling only, reachable directly at /api-docs.
 *
 * "Try it out" sends real requests against this running server: public
 * routes (products, delivery lookups, public order creation) work
 * immediately; admin-only routes work once you're logged in at
 * /admin/login in the same browser tab, since the request is same-origin
 * and carries the Supabase session cookie automatically.
 */
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <SwaggerUI url="/api/openapi" />
    </div>
  );
}
