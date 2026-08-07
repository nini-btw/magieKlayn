-- Backfill: preserve any existing single-color coffret choice into the new
-- boxColors array before dropping the old column.
UPDATE "orders" SET "box_colors" = ARRAY["box_color"]::box_color[] WHERE "box_color" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "box_color";
