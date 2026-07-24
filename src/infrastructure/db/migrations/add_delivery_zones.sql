-- Migration: Add delivery zones table and delivery fields to orders
-- Created: 2026-04-12

-- Create delivery_type enum
CREATE TYPE IF NOT EXISTS delivery_type AS ENUM ('stop_desk', 'home');

-- Create delivery_zones table
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
);

-- Create index on wilaya_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_zones_wilaya_code 
    ON delivery_zones(wilaya_code);

-- Create unique index to prevent duplicate commune entries per wilaya
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_zones_wilaya_commune 
    ON delivery_zones(wilaya_code, commune_name_ascii);

-- Add delivery fields to orders table
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_zone_id UUID REFERENCES delivery_zones(id),
    ADD COLUMN IF NOT EXISTS delivery_type delivery_type,
    ADD COLUMN IF NOT EXISTS delivery_fee INTEGER;

-- Create index on delivery_zone_id for order lookups
CREATE INDEX IF NOT EXISTS idx_orders_delivery_zone_id 
    ON orders(delivery_zone_id);
