import type { Metadata } from "next";
import { AdminSidebarWrapper } from "./AdminSidebarWrapper";
import { requireAdmin } from "@/infrastructure/auth/supabase-auth";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin Dashboard for Magie Klayn",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check auth — requireAdmin() re-verifies admin_users membership (not
  // just "has a Supabase session") and redirects to /admin/login itself
  // if that check fails, matching every admin API route.
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-[#F0E6D6]/30">
      <AdminSidebarWrapper userEmail={admin.email} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
