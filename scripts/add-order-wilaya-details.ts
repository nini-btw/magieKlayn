/**
 * Migration: Add wilaya/commune details to orders table
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
  console.log("🚀 Adding wilaya/commune details to orders...");

  try {
    // Check if columns exist
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `;
    const existingColumns = columns.map(c => c.column_name);

    if (!existingColumns.includes('wilaya_name')) {
      await sql`ALTER TABLE orders ADD COLUMN wilaya_name VARCHAR(255)`;
      console.log("✅ Added wilaya_name column");
    }

    if (!existingColumns.includes('wilaya_code')) {
      await sql`ALTER TABLE orders ADD COLUMN wilaya_code VARCHAR(2)`;
      console.log("✅ Added wilaya_code column");
    }

    if (!existingColumns.includes('commune_name')) {
      await sql`ALTER TABLE orders ADD COLUMN commune_name VARCHAR(255)`;
      console.log("✅ Added commune_name column");
    }

    if (!existingColumns.includes('order_date')) {
      await sql`ALTER TABLE orders ADD COLUMN order_date DATE DEFAULT CURRENT_DATE`;
      console.log("✅ Added order_date column");
    }

    // Create indexes for filtering
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_wilaya_code ON orders(wilaya_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
    console.log("✅ Created indexes");

    console.log("\n🎉 Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
