CREATE TYPE "public"."delivery_type" AS ENUM('stop_desk', 'home');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wilaya_code" varchar(2) NOT NULL,
	"wilaya_name_ascii" varchar(255) NOT NULL,
	"wilaya_name" varchar(255) NOT NULL,
	"commune_name_ascii" varchar(255) NOT NULL,
	"commune_name" varchar(255) NOT NULL,
	"stop_desk_fee" integer NOT NULL,
	"home_fee" integer NOT NULL,
	"has_stop_desk" boolean DEFAULT true NOT NULL,
	"has_home_delivery" boolean DEFAULT true NOT NULL
);
