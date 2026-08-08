/**
 * One-time backfill — Inspired By
 * @module scripts/seed-inspired-by
 *
 * Populates `products.inspired_by` for the 14 launch mists from the
 * brand's original mist → inspiration pairing (previously kept as a
 * static `INSPIRED_BY` array in src/domain/data/story-palette.ts, now
 * migrated onto the product itself so the About page and product detail
 * page can both read it live instead of from a separate static list).
 *
 * SAFETY: dry run by default (prints planned updates + any unmatched
 * product names, touches nothing). Real writes require --write.
 *
 * Usage:
 *   npx tsx scripts/seed-inspired-by.ts            # dry run
 *   npx tsx scripts/seed-inspired-by.ts --write     # apply
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";

const WRITE_MODE = process.argv.includes("--write");

/** Moved out of story-palette.ts — this script is now the sole owner of
 * this one-time seed data. */
const INSPIRED_BY: { mist: string; inspiration: string }[] = [
  { mist: "Vague d'Amour", inspiration: "Wild Flower" },
  { mist: "Cool Lady", inspiration: "Backstage Angel" },
  { mist: "My Belle", inspiration: "Coconut Passion" },
  { mist: "Miss Dame", inspiration: "Strawberry" },
  { mist: "Femme Desirée", inspiration: "Paradise" },
  { mist: "Carat", inspiration: "Bare Vanilla Noir" },
  { mist: "Libre Choix", inspiration: "Xerjoff Erba Pura" },
  { mist: "Miss Black", inspiration: "Parfum de Marly Delina" },
  { mist: "Lovely Day", inspiration: "Dior Lucky" },
  { mist: "Belle de Nuit", inspiration: "Pune Seduction" },
  { mist: "Femme Interdite", inspiration: "Gucci Flora" },
  { mist: "Rose Land", inspiration: "After Party Angel" },
  { mist: "Very Women", inspiration: "Tom Ford Vanille Sex" },
  { mist: "Lady Show", inspiration: "Jean Paul Gaultier Scandal" },
];

async function main() {
  loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

  console.log("[seed-inspired-by] booting...");
  console.log(`[seed-inspired-by] mode: ${WRITE_MODE ? "WRITE" : "DRY RUN"}`);

  // Deferred until after env is loaded, matching sync-zones.ts's pattern —
  // src/infrastructure/db/client.ts reads process.env at module load time.
  const { db } = await import("../src/infrastructure/db/client");
  const { eq } = await import("drizzle-orm");
  const { products } = await import("../src/infrastructure/db/schema");

  const allProducts = await db
    .select({ id: products.id, name: products.name })
    .from(products);

  const byName = new Map<string, { id: string; name: string }>(
    allProducts.map((p: { id: string; name: string }) => [p.name, p]),
  );

  const matched: { id: string; name: string; inspiration: string }[] = [];
  const unmatched: string[] = [];

  for (const entry of INSPIRED_BY) {
    const product = byName.get(entry.mist);
    if (product) {
      matched.push({
        id: product.id,
        name: product.name,
        inspiration: entry.inspiration,
      });
    } else {
      unmatched.push(entry.mist);
    }
  }

  console.log(`\nMatched ${matched.length}/${INSPIRED_BY.length} mists:`);
  for (const m of matched) {
    console.log(`  ${m.name} → "${m.inspiration}"`);
  }

  if (unmatched.length > 0) {
    console.log(`\nNo product found for ${unmatched.length} mist name(s):`);
    for (const name of unmatched) {
      console.log(`  ✗ ${name}`);
    }
  }

  if (!WRITE_MODE) {
    console.log("\nDry run only — pass --write to apply.");
    process.exit(0);
  }

  console.log("\nApplying updates...");
  for (const m of matched) {
    await db
      .update(products)
      .set({ inspiredBy: m.inspiration })
      .where(eq(products.id, m.id));
  }
  console.log(`✅ Updated ${matched.length} product(s).`);
  // The shared `db` client's connection pool keeps the event loop alive
  // otherwise — explicit exit so this doesn't hang after finishing.
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-inspired-by] failed:", err);
  process.exit(1);
});
