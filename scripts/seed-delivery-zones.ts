/**
 * Seed script for delivery zones - Optimized with batch inserts
 * Reads algeria_cities.json and inserts into delivery_zones table
 * @module scripts/seed-delivery-zones
 */

import dotenv from "dotenv";
import path from "path";
import postgres from "postgres";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Debug: Check if DATABASE_URL is loaded
console.log(
  "📡 DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ Found" : "❌ Not found",
);

import algeriaCities from "./data/algeria_cities.json";

/**
 * Fee overrides per wilaya code
 * Default: stop_desk = 400 DA, home = 700 DA
 */
const WILAYA_FEES: Record<
  string,
  { stopDesk: number; home: number; hasStopDesk?: boolean; hasHome?: boolean }
> = {
  // Algiers (16) - higher fees for capital
  "16": { stopDesk: 500, home: 800 },
  // Oran (31) - major city
  "31": { stopDesk: 450, home: 750 },
  // Constantine (25) - major city
  "25": { stopDesk: 450, home: 750 },
  // Annaba (23) - major city
  "23": { stopDesk: 450, home: 750 },
  // Remote areas - higher fees
  "33": { stopDesk: 600, home: 1000 }, // Illizi
  "11": { stopDesk: 600, home: 1000 }, // Tamanrasset
};

const DEFAULT_STOP_DESK_FEE = 400;
const DEFAULT_HOME_FEE = 700;

interface AlgeriaCity {
  id: number;
  commune_name_ascii: string;
  commune_name: string;
  daira_name_ascii: string;
  daira_name: string;
  wilaya_code: string;
  wilaya_name_ascii: string;
  wilaya_name: string;
}

async function seedDeliveryZones() {
  console.log("🚀 Starting delivery zones seeding...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not configured");
    process.exit(1);
  }

  const client = postgres(dbUrl, { prepare: false });
  const cities = algeriaCities as AlgeriaCity[];
  console.log(`📊 Found ${cities.length} communes to insert`);

  // Check if already seeded
  const existingCount =
    await client`SELECT COUNT(*) as count FROM delivery_zones`;
  if (existingCount[0].count > 0) {
    console.log(
      `⚠️  Table already has ${existingCount[0].count} rows. Skipping seed.`,
    );
    console.log(
      "   To re-seed, truncate the table first: TRUNCATE delivery_zones;",
    );
    await client.end();
    process.exit(0);
  }

  // Prepare all values

  const values = cities.map((city) => {
    const fees = WILAYA_FEES[city.wilaya_code] || {
      stopDesk: DEFAULT_STOP_DESK_FEE,
      home: DEFAULT_HOME_FEE,
    };

    return {
      wilayaCode: city.wilaya_code,
      wilayaNameAscii: city.wilaya_name_ascii,
      wilayaName: city.wilaya_name,
      communeNameAscii: city.commune_name_ascii,
      communeName: city.commune_name,
      stopDeskFee: fees.stopDesk,
      homeFee: fees.home,
      hasStopDesk: fees.hasStopDesk !== false,
      hasHomeDelivery: fees.hasHome !== false,
    };
  });

  // Batch insert in chunks of 100
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);

    await client`
      INSERT INTO delivery_zones (
        wilaya_code, wilaya_name_ascii, wilaya_name,
        commune_name_ascii, commune_name,
        stop_desk_fee, home_fee, has_stop_desk, has_home_delivery
      )
      ${client(batch)}
      ON CONFLICT (wilaya_code, commune_name_ascii) DO NOTHING
    `;

    inserted += batch.length;
    console.log(`⏳ Inserted ${inserted}/${cities.length}...`);
  }

  console.log(`\n✅ Seeding complete! Inserted ${inserted} zones`);

  // Verify count
  const countResult =
    await client`SELECT COUNT(*) as count FROM delivery_zones`;
  console.log(`📦 Total zones in database: ${countResult[0].count}`);

  await client.end();
  console.log("🔌 Database connection closed");
  process.exit(0);
}

seedDeliveryZones().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
