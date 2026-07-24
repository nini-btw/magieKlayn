CREATE TYPE "public"."packaging_type" AS ENUM('standard', 'luxury_coffret');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"product_slug" varchar(255) NOT NULL,
	"product_image" varchar(500),
	"product_color_hex" varchar(7),
	"quantity" integer NOT NULL,
	"price_snapshot" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"address" text NOT NULL,
	"gift_note" text,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" integer NOT NULL,
	"packaging_type" "packaging_type" DEFAULT 'standard' NOT NULL,
	"coffret_fee" integer,
	"delivery_zone_id" uuid NOT NULL,
	"delivery_type" "delivery_type",
	"delivery_fee" integer,
	"wilaya_code" varchar(2),
	"wilaya_name" varchar(255),
	"commune_name" varchar(255),
	"order_date" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price" integer NOT NULL,
	"color_hex" varchar(7) NOT NULL,
	"size_ml" integer NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"is_sold_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "delivery_zones" DROP CONSTRAINT "delivery_zone_unique";--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_delivery_zones_wilaya_code" ON "delivery_zones" USING btree ("wilaya_code");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_delivery_zones_wilaya_commune" ON "delivery_zones" USING btree ("wilaya_code","commune_name_ascii");