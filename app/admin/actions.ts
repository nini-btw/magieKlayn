"use server";

import { revalidatePath } from "next/cache";
import { adminLogin, adminLogout } from "@/infrastructure/auth/supabase-auth";

/**
 * Server action for admin login
 */
export async function loginAdmin(email: string, password: string) {
  const result = await adminLogin(email, password);
  
  if (result.success) {
    revalidatePath("/admin");
  }
  
  return result;
}

/**
 * Server action for admin logout
 */
export async function logoutAdmin() {
  await adminLogout();
}
