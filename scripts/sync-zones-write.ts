/**
 * Phase 2 — Yalidine zone sync (WRITE MODE)
 * @module scripts/sync-zones-write
 *
 * Upserts real Yalidine fee data into `delivery_zones`, by the existing
 * unique index (wilayaCode + communeNameAscii). NEVER truncates.
 *
 * SAFETY:
 *  - Without --write, this behaves exactly like the dry-run script: prints
 *    counts only, touches nothing.
 *  - With --write, it still requires typed "yes" confirmation before
 *    running any INSERT/UPDATE, unless --yes is also passed (for
 *    non-interactive/CI use — use with caution).
 *  - Runs as a single DB transaction: if anything fails partway through,
 *    the whole batch rolls back rather than leaving delivery_zones
 *    half-updated.
 *
 * BEFORE FIRST REAL RUN: back up the table.
 *   pg_dump "$DATABASE_URL" -t delivery_zones > delivery_zones_backup_$(date +%Y%m%d).sql
 *
 * Usage:
 *   npx tsx scripts/sync-zones-write.ts                    # dry run only
 *   npx tsx scripts/sync-zones-write.ts --wilayas=16        # dry run, 1 wilaya
 *   npx tsx scripts/sync-zones-write.ts --write             # real upsert, asks to confirm
 *   npx tsx scripts/sync-zones-write.ts --write --wilayas=16 --yes   # real upsert, no prompt
 */

import { SQL, sql } from "drizzle-orm";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import readline from "node:readline/promises";
import { PgTableWithColumns, PgColumn } from "drizzle-orm/pg-core";

function parseWilayaFilter(): number[] | null {
  const arg = process.argv.find((a) => a.startsWith("--wilayas="));
  if (!arg) return null;
  return arg
    .replace("--wilayas=", "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n));
}

const WRITE_MODE = process.argv.includes("--write");
const SKIP_CONFIRM = process.argv.includes("--yes");
const CHUNK_SIZE = 200;

async function confirm(message: string): Promise<boolean> {
  if (SKIP_CONFIRM) return true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(`${message} Type "yes" to proceed: `);
  rl.close();
  return answer.trim().toLowerCase() === "yes";
}

async function main() {
  loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

  console.log("[sync-zones-write] booting...");
  console.log(`[sync-zones-write] mode: ${WRITE_MODE ? "WRITE" : "DRY RUN"}`);

  if (!process.env.YALIDINE_API_ID || !process.env.YALIDINE_API_TOKEN) {
    console.error(
      "\n✗ Missing YALIDINE_API_ID / YALIDINE_API_TOKEN after loading .env.local.",
    );
    process.exit(1);
  }

  // Deferred until after env is loaded — see sync-zones.ts for why.
  const { db } = await import("../src/infrastructure/db/client");
  const { deliveryZones } = await import("../src/infrastructure/db/schema");
  const { fetchCandidateRows } =
    await import("../src/infrastructure/yalidine/zone-sync-helpers");

  const wilayaFilter = parseWilayaFilter();
  if (wilayaFilter) {
    console.log(`Limiting run to wilayas: ${wilayaFilter.join(", ")}\n`);
  }

  console.log("Fetching live data from Yalidine (throttled)...\n");
  const { candidateRows, errors, skippedWilayas } =
    await fetchCandidateRows(wilayaFilter);

  console.log(
    `\nSkipped ${skippedWilayas.length} non-deliverable wilaya(s): ` +
      skippedWilayas.map((w) => `${w.id} (${w.name})`).join(", "),
  );
  console.log(`Fetched ${candidateRows.length} commune fee rows.`);
  if (errors.length > 0) {
    console.log(
      `${errors.length} wilaya(s) failed to fetch — those communes will NOT be ` +
        `upserted this run. Re-run to retry.`,
    );
  }

  if (candidateRows.length === 0) {
    console.log("\nNothing to write. Exiting.");
    return;
  }

  if (!WRITE_MODE) {
    console.log(
      `\nDry run only — would upsert ${candidateRows.length} row(s). ` +
        `Re-run with --write to actually write.`,
    );
    return;
  }

  // --- WRITE MODE from here down ---

  const proceed = await confirm(
    `\n⚠ About to upsert ${candidateRows.length} row(s) into delivery_zones (transaction, ` +
      `rolls back on any error, never truncates).`,
  );

  if (!proceed) {
    console.log("Aborted — no changes made.");
    return;
  }

  console.log(
    `\nWriting ${candidateRows.length} row(s) in batches of ${CHUNK_SIZE}...`,
  );

  let written = 0;

  await db.transaction(
    async (tx: {
      insert: (
        arg0: PgTableWithColumns<{
          name: "delivery_zones";
          schema: undefined;
          columns: {
            id: PgColumn<
              {
                name: "id";
                tableName: "delivery_zones";
                dataType: "string";
                columnType: "PgUUID";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: true;
                isPrimaryKey: true;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: undefined;
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              {}
            >;
            wilayaCode: PgColumn<
              {
                name: "wilaya_code";
                tableName: "delivery_zones";
                dataType: "string";
                columnType: "PgVarchar";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              { length: 2 }
            >;
            wilayaNameAscii: PgColumn<
              {
                name: "wilaya_name_ascii";
                tableName: "delivery_zones";
                dataType: "string";
                columnType: "PgVarchar";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              { length: 255 }
            >;
            wilayaName: PgColumn<
              {
                name: "wilaya_name";
                tableName: "delivery_zones";
                dataType: "string";
                columnType: "PgVarchar";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              { length: 255 }
            >;
            communeNameAscii: PgColumn<
              {
                name: "commune_name_ascii";
                tableName: "delivery_zones";
                dataType: "string";
                columnType: "PgVarchar";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              { length: 255 }
            >;
            communeName: PgColumn<
              {
                name: "commune_name";
                tableName: "delivery_zones";
                dataType: "string";
                columnType: "PgVarchar";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              { length: 255 }
            >;
            stopDeskFee: PgColumn<
              {
                name: "stop_desk_fee";
                tableName: "delivery_zones";
                dataType: "number";
                columnType: "PgInteger";
                data: number;
                driverParam: string | number;
                notNull: true;
                hasDefault: false;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: undefined;
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              {}
            >;
            homeFee: PgColumn<
              {
                name: "home_fee";
                tableName: "delivery_zones";
                dataType: "number";
                columnType: "PgInteger";
                data: number;
                driverParam: string | number;
                notNull: true;
                hasDefault: false;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: undefined;
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              {}
            >;
            hasStopDesk: PgColumn<
              {
                name: "has_stop_desk";
                tableName: "delivery_zones";
                dataType: "boolean";
                columnType: "PgBoolean";
                data: boolean;
                driverParam: boolean;
                notNull: true;
                hasDefault: true;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: undefined;
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              {}
            >;
            hasHomeDelivery: PgColumn<
              {
                name: "has_home_delivery";
                tableName: "delivery_zones";
                dataType: "boolean";
                columnType: "PgBoolean";
                data: boolean;
                driverParam: boolean;
                notNull: true;
                hasDefault: true;
                isPrimaryKey: false;
                isAutoincrement: false;
                hasRuntimeDefault: false;
                enumValues: undefined;
                baseColumn: never;
                identity: undefined;
                generated: undefined;
              },
              {},
              {}
            >;
          };
          dialect: "pg";
        }>,
      ) => {
        (): any;
        new (): any;
        values: {
          (
            arg0: {
              wilayaCode: string;
              wilayaNameAscii: string;
              wilayaName: string;
              communeNameAscii: string;
              communeName: string;
              stopDeskFee: number;
              homeFee: number;
              hasStopDesk: boolean;
              hasHomeDelivery: boolean;
            }[],
          ): {
            (): any;
            new (): any;
            onConflictDoUpdate: {
              (arg0: {
                target: (
                  | PgColumn<
                      {
                        name: "wilaya_code";
                        tableName: "delivery_zones";
                        dataType: "string";
                        columnType: "PgVarchar";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: [string, ...string[]];
                        baseColumn: never;
                        identity: undefined;
                        generated: undefined;
                      },
                      {},
                      { length: 2 }
                    >
                  | PgColumn<
                      {
                        name: "commune_name_ascii";
                        tableName: "delivery_zones";
                        dataType: "string";
                        columnType: "PgVarchar";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: [string, ...string[]];
                        baseColumn: never;
                        identity: undefined;
                        generated: undefined;
                      },
                      {},
                      { length: 255 }
                    >
                )[];
                set: {
                  wilayaNameAscii: SQL<unknown>;
                  wilayaName: SQL<unknown>;
                  communeName: SQL<unknown>;
                  stopDeskFee: SQL<unknown>;
                  homeFee: SQL<unknown>;
                  hasStopDesk: SQL<unknown>;
                  hasHomeDelivery: SQL<unknown>;
                };
              }): any;
              new (): any;
            };
          };
          new (): any;
        };
      };
    }) => {
      for (let i = 0; i < candidateRows.length; i += CHUNK_SIZE) {
        const chunk = candidateRows.slice(i, i + CHUNK_SIZE);

        await tx
          .insert(deliveryZones)
          .values(
            chunk.map((row) => ({
              wilayaCode: row.wilayaCode,
              wilayaNameAscii: row.wilayaNameAscii,
              wilayaName: row.wilayaName,
              communeNameAscii: row.communeNameAscii,
              communeName: row.communeName,
              stopDeskFee: row.stopDeskFee ?? 0,
              homeFee: row.homeFee ?? 0,
              hasStopDesk: row.hasStopDesk,
              hasHomeDelivery: row.hasHomeDelivery,
            })),
          )
          .onConflictDoUpdate({
            target: [deliveryZones.wilayaCode, deliveryZones.communeNameAscii],
            set: {
              wilayaNameAscii: sql`excluded.wilaya_name_ascii`,
              wilayaName: sql`excluded.wilaya_name`,
              communeName: sql`excluded.commune_name`,
              stopDeskFee: sql`excluded.stop_desk_fee`,
              homeFee: sql`excluded.home_fee`,
              hasStopDesk: sql`excluded.has_stop_desk`,
              hasHomeDelivery: sql`excluded.has_home_delivery`,
            },
          });

        written += chunk.length;
        console.log(`  ...${written}/${candidateRows.length}`);
      }
    },
  );

  console.log(`\n✓ Wrote ${written} row(s) into delivery_zones.`);
  console.log(
    "Note: rows present in delivery_zones but NOT returned by Yalidine this run",
  );
  console.log(
    "were left untouched (never auto-deleted) — review those manually if needed.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(
      "\n✗ Write sync failed — transaction rolled back, no partial writes:",
      err,
    );
    process.exit(1);
  });
