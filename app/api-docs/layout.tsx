import { requireAdmin } from "@/infrastructure/auth/supabase-auth";

/**
 * /api-docs is internal dev/admin tooling (a live Swagger UI console that
 * can execute real requests, including against admin-only routes, using
 * the browser's ambient session cookie). It must never be reachable by a
 * non-admin visitor — this layout enforces that the same way every other
 * admin surface does, via requireAdmin() (redirects to /admin/login if
 * the caller isn't in admin_users).
 */
export default async function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
