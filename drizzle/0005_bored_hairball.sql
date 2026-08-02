CREATE TYPE "public"."product_gender" AS ENUM('male', 'female', 'unisex');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gender" "product_gender";