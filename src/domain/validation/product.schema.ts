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

// Field validators WITHOUT defaults — shared by both schemas below.
// updateProductSchema deliberately builds from these rather than calling
// createProductSchema.partial(), because zod's .partial() only makes a
// field optional to *provide*; a field's own .default(...) still applies
// when it's omitted. That combination previously meant a genuinely
// partial PUT body (e.g. { isSoldOut: true }) silently reset every other
// defaulted field (gender/isActive/isNew/inspiredBy/notes) back to its
// default instead of leaving it untouched — see the (now-updated) test
// in app/api/products/[id]/route.test.ts and PROJECT_DOCUMENTATION.md
// §16 for the full history of this bug.
const productFields = {
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().trim().min(1).max(5000),
  notes: z.array(z.string().max(100)).max(50),
  price: z.number().int().nonnegative().max(100_000_000),
  gender: genderEnum.nullable(),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "colorHex must be a 6-digit hex color"),
  sizeMl: z.number().int().positive().max(10_000),
  images: z.array(z.string().max(2000)).min(1).max(20),
  isActive: z.boolean(),
  isNew: z.boolean(),
  isSoldOut: z.boolean(),
  inspiredBy: z.string().max(200).nullable(),
};

export const createProductSchema = z.object({
  ...productFields,
  notes: productFields.notes.optional().default([]),
  gender: productFields.gender.default(null),
  isActive: productFields.isActive.default(true),
  isNew: productFields.isNew.default(false),
  isSoldOut: productFields.isSoldOut.default(false),
  inspiredBy: productFields.inspiredBy.default(null),
});

// PUT allows partial updates — same field constraints, all optional, and
// (unlike createProductSchema) NO defaults: an omitted field is simply
// absent from the parsed result, not silently reset.
export const updateProductSchema = z.object(productFields).partial();
