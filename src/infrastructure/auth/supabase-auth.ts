/**
 * Supabase Auth utilities for admin authentication
 * @module infrastructure/auth/supabase-auth
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/infrastructure/db/client";
import { adminUsers } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simple consistent password for Supabase Auth
// In production, use a more secure approach
function getSupabaseAuthPassword(email: string) {
  return `auth_${email}_fixed_password_v1`;
}

/**
 * Create a Supabase server client with cookie handling
 */
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Handle error silently
        }
      },
    },
  });
}

/**
 * Create a Supabase admin client (for server-side user management)
 */
function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if user is authenticated as admin
 */
export async function getAdminSession() {
  const supabase = await createAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Verify user exists in admin_users table
  const admin = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, user.email!))
    .limit(1);

  if (admin.length === 0) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    role: "admin",
  };
}

/**
 * Require admin authentication - redirects to login if not authenticated
 */
export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

/**
 * Admin login with email and password
 * Validates against admin_users table and creates Supabase session
 */
export async function adminLogin(email: string, password: string) {
  try {
    // Check if admin exists in database
    const admin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (admin.length === 0) {
      return { success: false, error: "Invalid email or password" };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      admin[0].passwordHash
    );

    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" };
    }

    // Use admin client to manage auth user
    const adminClient = createAdminClient();
    const supabasePassword = getSupabaseAuthPassword(email);

    // Check if user exists in auth
    const { data: users } = await adminClient.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === email);

    if (existingUser) {
      // Update password to ensure it matches
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        { password: supabasePassword }
      );
      
      if (updateError) {
        console.error("Update password error:", updateError);
        // Continue anyway - might still work
      }
    } else {
      // Create new auth user
      const { error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: supabasePassword,
        email_confirm: true,
        user_metadata: { role: "admin" },
      });

      if (createError && !createError.message.includes("already been registered")) {
        console.error("Create user error:", createError);
        return { success: false, error: "Authentication setup failed" };
      }
    }

    // Sign in with server client to set cookies
    const supabase = await createAuthClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: supabasePassword,
    });

    if (signInError) {
      console.error("Sign in error:", signInError);
      return { success: false, error: signInError.message };
    }

    return { success: true, user: data.user };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "An error occurred" };
  }
}

/**
 * Admin logout
 */
export async function adminLogout() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/**
 * Check if user is authenticated (for middleware)
 */
export async function isAuthenticated(request: {
  cookies: { get: (name: string) => { value?: string } | undefined };
}) {
  const cookie = request.cookies.get("sb-access-token");
  if (!cookie?.value) return false;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return [
          { name: "sb-access-token", value: cookie.value! },
        ];
      },
      setAll() {},
    },
  });

  const { data } = await supabase.auth.getUser();
  return !!data.user;
}
