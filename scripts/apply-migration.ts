/**
 * Apply migration script - creates delivery_zones table
 */

import dotenv from "dotenv";
import path from "path";
import postgres from "postgres";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

const sql = postgres(dbUrl, { prepare: false });

async function applyMigration() {
  console.log("🚀 Applying migration...");

  try {
    // Create delivery_type enum (if not exists workaround)
    const typeExists = await sql`
      SELECT 1 FROM pg_type WHERE typname = 'delivery_type'
    `;
    if (typeExists.length === 0) {
      await sql`CREATE TYPE delivery_type AS ENUM ('stop_desk', 'home')`;
      console.log("✅ Created delivery_type enum");
    } else {
      console.log("⚠️  delivery_type enum already exists");
    }

    // Create delivery_zones table
    await sql`
      CREATE TABLE IF NOT EXISTS delivery_zones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wilaya_code VARCHAR(2) NOT NULL,
        wilaya_name_ascii VARCHAR(255) NOT NULL,
        wilaya_name VARCHAR(255) NOT NULL,
        commune_name_ascii VARCHAR(255) NOT NULL,
        commune_name VARCHAR(255) NOT NULL,
        stop_desk_fee INTEGER NOT NULL,
        home_fee INTEGER NOT NULL,
        has_stop_desk BOOLEAN DEFAULT true NOT NULL,
        has_home_delivery BOOLEAN DEFAULT true NOT NULL
      )
    `;
    console.log("✅ Created delivery_zones table");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_delivery_zones_wilaya_code ON delivery_zones(wilaya_code)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_zones_wilaya_commune ON delivery_zones(wilaya_code, commune_name_ascii)`;
    console.log("✅ Created indexes");

    // Add delivery fields to orders table (check if column exists first)
    const ordersColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'delivery_zone_id'
    `;
    
    if (ordersColumns.length === 0) {
      await sql`ALTER TABLE orders ADD COLUMN delivery_zone_id UUID REFERENCES delivery_zones(id)`;
      console.log("✅ Added delivery_zone_id to orders");
    } else {
      console.log("⚠️  delivery_zone_id already exists in orders");
    }

    const deliveryTypeCol = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'delivery_type'
    `;
    
    if (deliveryTypeCol.length === 0) {
      await sql`ALTER TABLE orders ADD COLUMN delivery_type delivery_type`;
      console.log("✅ Added delivery_type to orders");
    } else {
      console.log("⚠️  delivery_type already exists in orders");
    }

    const deliveryFeeCol = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'delivery_fee'
    `;
    
    if (deliveryFeeCol.length === 0) {
      await sql`ALTER TABLE orders ADD COLUMN delivery_fee INTEGER`;
      console.log("✅ Added delivery_fee to orders");
    } else {
      console.log("⚠️  delivery_fee already exists in orders");
    }

    // Create index on delivery_zone_id
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_delivery_zone_id ON orders(delivery_zone_id)`;
    console.log("✅ Created index on orders.delivery_zone_id");

    console.log("\n🎉 Migration applied successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
