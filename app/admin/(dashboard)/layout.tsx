import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebarWrapper } from "./AdminSidebarWrapper";
import { createAuthClient } from "@/infrastructure/auth/supabase-auth";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin Dashboard for Crumbleivable Cookie Shop",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check auth
  const supabase = await createAuthClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#F0E6D6]/30">
      <AdminSidebarWrapper userEmail={user.email || ''} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
