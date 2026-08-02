CREATE TYPE "public"."box_color" AS ENUM('white', 'black');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "box_color" "box_color";