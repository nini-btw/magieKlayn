/**
 * Product mutation payload validation
 * @module domain/validation/product
 *
 * Admin-only routes (POST/PUT /api/products), so the risk here is lower
 * than checkout, but a bounds/type check is still cheap insurance against
 * a malformed field (e.g. an absurdly long description, a negative
 * price) reaching the DB unconstrained.
 */
import { z } from "zod";

const genderEnum = z.enum(["male", "female", "unisex"]);

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(1).max(5000),
  notes: z.array(z.string().max(100)).max(50).optional().default([]),
  price: z.number().int().nonnegative().max(100_000_000),
  gender: genderEnum.nullable().default(null),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "colorHex must be a 6-digit hex color"),
  sizeMl: z.number().int().positive().max(10_000),
  images: z.array(z.string().max(2000)).min(1).max(20),
  isActive: z.boolean().default(true),
  isNew: z.boolean().default(false),
  isSoldOut: z.boolean().default(false),
  inspiredBy: z.string().max(200).nullable().default(null),
});

// PUT allows partial updates — same field constraints, all optional.
export const updateProductSchema = createProductSchema.partial();
