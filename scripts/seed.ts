/**
 * Database seed script for Supabase — Magie Klayn
 * @usage: npm run db:seed
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables!");
  console.error("Make sure you have:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * The 11 fragrances, pulled directly from the homepage HTML's product grid.
 *
 * ⚠️ EDIT BEFORE RUNNING:
 *   - `description` and `notes` below are placeholders written to match each
 *     name's mood — replace with your real copy before this is production data.
 *   - `price` is a placeholder (900 DA) applied to all 11 since the physical
 *     bottles suggest a uniform line price — correct this if any fragrance
 *     is actually priced differently.
 *   - `images` are empty — wire these up once you've decided the real
 *     photography vs. illustrated-bottle approach (still an open question
 *     from Phase 4 of the plan).
 */
const fragrances = [
  {
    name: "Lovely Day",
    slug: "lovely-day",
    description:
      "Un sillage lumineux et joyeux, pour les journées qui donnent envie de sourire.",
    notes: ["Fleur de cerisier", "Musc doux", "Pêche blanche"],
    price: 900,
    color_hex: "#C43A63",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
  {
    name: "Belle de Nuit",
    slug: "belle-de-nuit",
    description:
      "Une brume douce et mystérieuse, pensée pour les soirées élégantes.",
    notes: ["Jasmin de nuit", "Vanille poudrée", "Musc blanc"],
    price: 900,
    color_hex: "#E8C9DC",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: true,
    is_sold_out: false,
  },
  {
    name: "Femme Desirée",
    slug: "femme-desiree",
    description:
      "Un parfum intense et captivant, signature de la femme sûre d'elle.",
    notes: ["Fruits rouges", "Rose bulgare", "Ambre chaud"],
    price: 900,
    color_hex: "#D0223A",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
  {
    name: "Femme Interdite",
    slug: "femme-interdite",
    description:
      "Un sillage profond et sensuel, pour celles qui aiment se démarquer.",
    notes: ["Cassis noir", "Patchouli", "Vanille noire"],
    price: 900,
    color_hex: "#7A1F2B",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
  {
    name: "My Belle",
    slug: "my-belle",
    description:
      "Une fragrance chaleureuse et gourmande, douce comme une confidence.",
    notes: ["Fleur d'oranger", "Miel", "Bois de santal"],
    price: 900,
    color_hex: "#EFAE7D",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
  {
    name: "Lady Show",
    slug: "lady-show",
    description:
      "Un parfum solaire et pétillant, pour briller en toute occasion.",
    notes: ["Mandarine", "Fleur de frangipanier", "Musc solaire"],
    price: 900,
    color_hex: "#F4CE55",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
  {
    name: "Cool Lady",
    slug: "cool-lady",
    description:
      "Une brume fraîche et moderne, entre douceur florale et fraîcheur boisée.",
    notes: ["Freesia", "Bois flottant", "Musc frais"],
    price: 900,
    color_hex: "#A98AE0",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: true,
    is_sold_out: false,
  },
  {
    name: "Very Women",
    slug: "very-women",
    description:
      "Un parfum affirmé et raffiné, pour la femme qui assume chaque étape de sa journée.",
    notes: ["Iris", "Fleur de tiaré", "Bois précieux"],
    price: 900,
    color_hex: "#7A3E9E",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
  {
    name: "Vague d'Amour",
    slug: "vague-damour",
    description:
      "Une fragrance aquatique et romantique, comme une brise au bord de la mer.",
    notes: ["Fleur de lotus", "Accord marin", "Musc léger"],
    price: 900,
    color_hex: "#2FB6A8",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
  {
    name: "Miss Dame",
    slug: "miss-dame",
    description:
      "Un sillage doux et poudré, d'une élégance discrète et intemporelle.",
    notes: ["Poudre de riz", "Fleur blanche", "Musc doux"],
    price: 900,
    color_hex: "#F7F1E7",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
  {
    name: "Miss Black",
    slug: "miss-black",
    description:
      "Un parfum audacieux et mystérieux, pour celles qui n'ont peur de rien.",
    notes: ["Fève tonka", "Cuir doux", "Ambre noir"],
    price: 900,
    color_hex: "#1B1B1B",
    size_ml: 250,
    images: [],
    is_active: true,
    is_new: false,
    is_sold_out: false,
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function testConnection() {
  console.log("🔌 Testing Supabase connection...\n");

  try {
    const { error } = await supabase.from("products").select("count");

    if (error) {
      if (
        error.message.includes("relation") ||
        error.message.includes("does not exist")
      ) {
        console.log("⚠️  Tables do not exist yet. Run migrations first:");
        console.log("   npm run db:migrate\n");
        return false;
      }
      throw error;
    }

    console.log("✅ Supabase connection successful!\n");
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error);
    return false;
  }
}

async function clearTables() {
  console.log("🧹 Clearing existing data...");

  // Order matters: children before parents, to respect FK constraints.
  // delivery_zones is intentionally NOT cleared — it's seeded separately
  // and orders depend on it existing.
  const tables = ["order_items", "orders", "products", "admin_users"];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.log(`   ⚠️  Could not clear ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ Cleared ${table}`);
    }
  }

  console.log("");
}

async function seedAdminUser() {
  console.log("👤 Creating admin user...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  const { error } = await supabase.from("admin_users").insert({
    email: "admin@magieklayn.com",
    password_hash: passwordHash,
  });

  if (error) {
    console.error("   ❌ Failed to create admin:", error.message);
    return;
  }

  console.log("   ✅ Admin user created");
  console.log("   📧 Email: admin@magieklayn.com");
  console.log("   🔑 Password: admin123 (change this before going live)\n");
}

async function seedFragrances() {
  console.log("🌸 Seeding fragrances...");

  for (const fragrance of fragrances) {
    const { error } = await supabase.from("products").insert(fragrance);
    if (error) {
      console.error(`   ❌ Failed to insert ${fragrance.name}:`, error.message);
    } else {
      console.log(`   ✅ ${fragrance.name}`);
    }
  }

  console.log("");
}

async function seedOrders() {
  console.log("📋 Seeding sample orders...");

  // Sample orders need real fragrance rows and a real delivery zone row.
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price")
    .limit(10);

  if (!products || products.length < 4) {
    console.log("   ⚠️  Not enough products found, skipping orders\n");
    return;
  }

  const { data: zones } = await supabase
    .from("delivery_zones")
    .select(
      "id, wilaya_code, wilaya_name, commune_name, stop_desk_fee, home_fee",
    )
    .limit(1);

  if (!zones || zones.length === 0) {
    console.log(
      "   ⚠️  No delivery zones found — seed delivery zones first, skipping orders\n",
    );
    return;
  }

  const zone = zones[0];

  // Order 1: standard packaging, 3 items — below coffret threshold
  const order1Items = products.slice(0, 3);
  const order1Total =
    order1Items.reduce((sum, p) => sum + p.price, 0) + zone.stop_desk_fee;

  // Order 2: luxury coffret — exactly 4 distinct products, coffret fee applied
  const order2Items = products.slice(0, 4);
  const coffretFee = 500; // placeholder — confirm the real luxury packaging fee
  const order2Total =
    order2Items.reduce((sum, p) => sum + p.price, 0) +
    coffretFee +
    zone.home_fee;

  const orders = [
    {
      full_name: "Amina Bensaid",
      phone: "+213 555 111 222",
      address: "12 Rue des Fleurs, Oran",
      gift_note: null,
      status: "confirmed",
      total_amount: order1Total,
      packaging_type: "standard",
      coffret_fee: null,
      delivery_zone_id: zone.id,
      delivery_type: "stop_desk",
      delivery_fee: zone.stop_desk_fee,
      wilaya_code: zone.wilaya_code,
      wilaya_name: zone.wilaya_name,
      commune_name: zone.commune_name,
      items: order1Items.map((p) => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: 1,
      })),
    },
    {
      full_name: "Yasmine Cherif",
      phone: "+213 555 333 444",
      address: "45 Boulevard de la Soummam, Oran",
      gift_note: "Joyeux anniversaire !",
      status: "pending",
      total_amount: order2Total,
      packaging_type: "luxury_coffret",
      coffret_fee: coffretFee,
      delivery_zone_id: zone.id,
      delivery_type: "home",
      delivery_fee: zone.home_fee,
      wilaya_code: zone.wilaya_code,
      wilaya_name: zone.wilaya_name,
      commune_name: zone.commune_name,
      items: order2Items.map((p) => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: 1,
      })),
    },
  ];

  for (const order of orders) {
    const { items, ...orderRow } = order;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert(orderRow)
      .select();

    if (orderError || !orderData) {
      console.error(
        `   ❌ Failed to create order for ${order.full_name}:`,
        orderError?.message,
      );
      continue;
    }

    const orderId = orderData[0].id;
    const orderItemRows = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.name,
      product_slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      quantity: item.quantity,
      price_snapshot: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemRows);

    if (itemsError) {
      console.error("   ❌ Failed to create order items:", itemsError.message);
    } else {
      console.log(
        `   ✅ Order from ${order.full_name} (${order.packaging_type})`,
      );
    }
  }

  console.log("");
}

async function verifyData() {
  console.log("🔍 Verifying seeded data...\n");

  const tables = [
    { name: "products", label: "Products" },
    { name: "orders", label: "Orders" },
    { name: "order_items", label: "Order Items" },
    { name: "admin_users", label: "Admin Users" },
    { name: "delivery_zones", label: "Delivery Zones" },
  ];

  for (const { name, label } of tables) {
    const { count, error } = await supabase
      .from(name)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`   ❌ ${label}: Error - ${error.message}`);
    } else {
      console.log(`   ✅ ${label}: ${count} records`);
    }
  }

  console.log("");
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║       🌸 Magie Klayn Database Seed Script               ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  await clearTables();

  await seedAdminUser();
  await sleep(100);

  await seedFragrances();
  await sleep(100);

  await seedOrders();
  await sleep(100);

  await verifyData();

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Database seeded successfully!                       ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📊 Summary:");
  console.log("   • 11 fragrances added");
  console.log("   • 2 sample orders added (1 standard, 1 luxury coffret)");
  console.log("   • 1 admin user created\n");

  console.log("🔑 Admin Login:");
  console.log("   Email: admin@magieklayn.com");
  console.log("   Password: admin123\n");

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seed script failed:", error);
  process.exit(1);
});
