-- Migration: Make delivery_zone_id NOT NULL on orders
-- Created: 2026-04-13

-- Backfill strategy: Delete orders with no delivery zone.
-- These are invalid in an e-commerce context. If you prefer to keep them,
-- comment out the DELETE below and uncomment the UPDATE alternative.
DELETE FROM orders WHERE delivery_zone_id IS NULL;

-- Alternative backfill (commented out): assign all NULL rows to the first available zone
-- UPDATE orders
-- SET delivery_zone_id = (SELECT id FROM delivery_zones LIMIT 1)
-- WHERE delivery_zone_id IS NULL;

-- Make delivery_zone_id non-nullable
ALTER TABLE orders ALTER COLUMN delivery_zone_id SET NOT NULL;
