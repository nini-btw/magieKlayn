"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { adminLogin, adminLogout } from "@/infrastructure/auth/supabase-auth";
import { checkRateLimit, getClientIp } from "@/infrastructure/rate-limit/limiter";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Server action for admin login. Rate-limited by IP — the bcrypt
 * comparison itself has no other brute-force protection.
 */
export async function loginAdmin(email: string, password: string) {
  const ip = getClientIp(await headers());
  const { allowed, retryAfterSeconds } = checkRateLimit(
    `admin-login:${ip}`,
    LOGIN_ATTEMPT_LIMIT,
    LOGIN_WINDOW_MS,
  );

  if (!allowed) {
    return {
      success: false,
      error: `Too many login attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
    };
  }

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
