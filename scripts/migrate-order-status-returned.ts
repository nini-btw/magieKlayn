/**
 * Adds 'returned' to the order_status enum and migrates any legacy
 * 'preparing'/'ready' orders to 'confirmed', since the app's status set is
 * now pending/confirmed/delivered/cancelled/returned (preparing/ready are
 * retired). Idempotent — safe to run more than once.
 */

import dotenv from "dotenv";
import path from "path";
import postgres from "postgres";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

const sql = postgres(dbUrl, { prepare: false });

async function migrate() {
  console.log("🚀 Migrating order_status enum...");

  try {
    const before = await sql`
      SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY status
    `;
    console.log("Status counts before:", before);

    const enumValues = await sql`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = 'order_status'::regtype
      ORDER BY enumsortorder
    `;
    const hasReturned = enumValues.some((r) => r.enumlabel === "returned");

    if (!hasReturned) {
      await sql`ALTER TYPE order_status ADD VALUE 'returned'`;
      console.log("✅ Added 'returned' to order_status enum");
    } else {
      console.log("⚠️  'returned' already exists on order_status enum");
    }

    const migrated = await sql`
      UPDATE orders SET status = 'confirmed'
      WHERE status IN ('preparing', 'ready')
      RETURNING id
    `;
    console.log(
      `✅ Migrated ${migrated.length} legacy 'preparing'/'ready' order(s) to 'confirmed'`,
    );

    const after = await sql`
      SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY status
    `;
    console.log("Status counts after:", after);

    console.log("\n🎉 Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
