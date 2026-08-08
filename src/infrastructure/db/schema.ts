/**
 * Drizzle ORM database schema — Magie Klayn
 * @module infrastructure/db/schema
 *
 * PHASE 1: full domain schema.
 *
 * Key design decision — Coffret is NOT a separate product entity:
 * it's an order-level packaging choice. A customer with exactly 4 products
 * in their cart can opt to have them packaged as a "luxury coffret" for an
 * extra fee. This is enforced at the domain/cart-rules layer, not as a
 * DB constraint — the DB just stores the choice once the domain layer
 * has validated it's allowed.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Order status enum
 */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
]);

export const productGenderEnum = pgEnum("product_gender", [
  "male",
  "female",
  "unisex",
]);
/**
 * Delivery type enum
 */
export const deliveryTypeEnum = pgEnum("delivery_type", [
  "stop_desk",
  "home",
  "store_pickup",
]);

export const boxColorEnum = pgEnum("box_color", ["white", "black"]);
/**
 * Packaging type enum — the coffret decision, made at checkout, order-level
 */
export const packagingTypeEnum = pgEnum("packaging_type", [
  "standard",
  "luxury_coffret",
]);

/**
 * Products table (fragrances)
 * Single product type in this brand — no /box-style type split needed.
 */
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  // Fragrance notes — e.g. ["Vanille", "Musc blanc", "Fleur d'oranger"]
  notes: jsonb("notes").$type<string[]>().default([]).notNull(),
  price: integer("price").notNull(), // smallest currency unit (DA)
  // Signature color — core to the brand identity, each fragrance has one
  gender: productGenderEnum("gender"),

  colorHex: varchar("color_hex", { length: 7 }).notNull(), // e.g. "#D0223A"
  sizeMl: integer("size_ml").notNull(),
  images: jsonb("images").$type<string[]>().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isNew: boolean("is_new").default(false).notNull(),
  isSoldOut: boolean("is_sold_out").default(false).notNull(),
  // Optional fragrance icon this mist is inspired by, e.g. "Dior Lucky" —
  // curated per product, shown on the product page and About's Inspired By.
  inspiredBy: varchar("inspired_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Orders table
 */
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 150 }), // new, nullable
  lastName: varchar("last_name", { length: 150 }), // new, nullable — null on all pre-migration orders

  phone: varchar("phone", { length: 50 }).notNull(),
  giftNote: text("gift_note"),
  status: orderStatusEnum("status").default("pending").notNull(),
  totalAmount: integer("total_amount").notNull(),

  // Packaging / coffret choice
  packagingType: packagingTypeEnum("packaging_type")
    .default("standard")
    .notNull(),
  // Only populated when packagingType = 'luxury_coffret'
  coffretFee: integer("coffret_fee"),
  // One entry per box (each box holds exactly 4 bottles); empty/null when
  // packagingType = 'standard'. Postgres enum array, e.g. {white,black}.
  boxColors: boxColorEnum("box_colors").array(),

  deliveryZoneId: uuid("delivery_zone_id")
    .references(() => deliveryZones.id)
    .notNull(),
  deliveryType: deliveryTypeEnum("delivery_type"),
  deliveryFee: integer("delivery_fee"),
  wilayaCode: varchar("wilaya_code", { length: 2 }),
  wilayaName: varchar("wilaya_name", { length: 255 }),
  communeName: varchar("commune_name", { length: 255 }),
  // The customer-picked Yalidine stop-desk center (only set when
  // deliveryType = "stop_desk"). stopdeskCommuneName is the CENTER's own
  // commune (not the customer's) — Yalidine's createParcels requires
  // to_commune_name to match the center, not the delivery address. See
  // src/domain/entities/delivery.ts's DeliverySelection doc comment.
  stopdeskCenterId: integer("stopdesk_center_id"),
  stopdeskCommuneName: varchar("stopdesk_commune_name", { length: 255 }),
  yalidineTracking: varchar("yalidine_tracking", { length: 50 }),

  orderDate: timestamp("order_date").defaultNow(),
  deletedAt: timestamp("deleted_at"), // soft delete
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Order items table
 * No productType column needed — single product type in this brand.
 */
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productSlug: varchar("product_slug", { length: 255 }).notNull(),
  productImage: varchar("product_image", { length: 500 }),
  productColorHex: varchar("product_color_hex", { length: 7 }), // snapshot, in case the fragrance's color is ever updated later
  quantity: integer("quantity").notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
});

/**
 * Admin users table — unchanged from Phase 0
 */
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Delivery zones table — unchanged from Phase 0
 */
export const deliveryZones = pgTable(
  "delivery_zones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    wilayaCode: varchar("wilaya_code", { length: 2 }).notNull(),
    wilayaNameAscii: varchar("wilaya_name_ascii", { length: 255 }).notNull(),
    wilayaName: varchar("wilaya_name", { length: 255 }).notNull(),
    communeNameAscii: varchar("commune_name_ascii", { length: 255 }).notNull(),
    communeName: varchar("commune_name", { length: 255 }).notNull(),
    stopDeskFee: integer("stop_desk_fee").notNull(),
    homeFee: integer("home_fee").notNull(),
    hasStopDesk: boolean("has_stop_desk").default(true).notNull(),
    hasHomeDelivery: boolean("has_home_delivery").default(true).notNull(),
  },
  (table) => [
    index("idx_delivery_zones_wilaya_code").on(table.wilayaCode),
    uniqueIndex("idx_delivery_zones_wilaya_commune").on(
      table.wilayaCode,
      table.communeNameAscii,
    ),
  ],
);

/**
 * Type definitions
 */
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type NewDeliveryZone = typeof deliveryZones.$inferInsert;
