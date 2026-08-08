/**
 * Reset an admin's Supabase Auth shadow-user link
 * @module scripts/fix-auth
 *
 * If an admin's Supabase Auth session gets into a broken state (e.g. the
 * shadow user was deleted/edited directly in the Supabase dashboard, or
 * the login flow logged an "Update password error"/"Authentication setup
 * failed" and login is now failing), this clears their
 * `admin_users.supabase_auth_secret` column. The *next* login through
 * the app (`adminLogin()` in `src/infrastructure/auth/supabase-auth.ts`)
 * will then see an empty secret, generate a fresh random one, and
 * (re)sync the Supabase Auth user's password to it — exactly the same
 * first-time-secret path a brand-new admin goes through. This script
 * intentionally does NOT touch Supabase Auth directly (no delete/create
 * user calls) — the real login flow is the single source of truth for
 * how that sync happens, this just clears the flag that tells it to redo
 * the sync.
 *
 * Older version of this script (pre security-audit) computed its own
 * password formula and pushed it directly onto the Supabase Auth user.
 * That formula never matched `supabase-auth.ts`'s (a known drift issue —
 * see AUTH_DOCUMENTATION.md §10.3) and, since `adminLogin()` no longer
 * overwrites the Supabase password on every login, running the old
 * script would have permanently desynced login until manually fixed.
 * This version avoids that class of bug entirely by not duplicating the
 * sync logic.
 *
 * Usage:
 *   npx tsx scripts/fix-auth.ts admin@magieklayn.com
 *   npx tsx scripts/fix-auth.ts            # lists admin_users emails, does nothing
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

async function main() {
  // Deferred import: db/client.ts reads process.env.* at module-load
  // time, so it must come after loadEnv() above, not as a static
  // top-of-file import (which JS would hoist before loadEnv() runs).
  const { db } = await import("../src/infrastructure/db/client");
  const { adminUsers } = await import("../src/infrastructure/db/schema");
  const { eq } = await import("drizzle-orm");

  if (!db) {
    console.error("❌ DATABASE_URL is unset/a placeholder — db is in mock mode.");
    process.exit(1);
  }

  const targetEmail = process.argv[2];

  const admins = await db.select().from(adminUsers);

  if (!targetEmail) {
    console.log("Usage: npx tsx scripts/fix-auth.ts <email>\n");
    console.log("Known admin_users emails:");
    for (const a of admins) {
      console.log(`  - ${a.email} (secret ${a.supabaseAuthSecret ? "set" : "empty"})`);
    }
    // db's underlying postgres-js connection stays open otherwise (this
    // script is a one-off CLI run, not a long-lived server process).
    process.exit(0);
  }

  const admin = admins.find((a: (typeof admins)[number]) => a.email === targetEmail);
  if (!admin) {
    console.error(`❌ No admin_users row for "${targetEmail}".`);
    process.exit(1);
  }

  await db
    .update(adminUsers)
    .set({ supabaseAuthSecret: null })
    .where(eq(adminUsers.id, admin.id));

  console.log(`✅ Cleared supabase_auth_secret for ${targetEmail}.`);
  console.log("   Next login through /admin/login will regenerate and re-sync it.");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Failed:", error);
  process.exit(1);
});
