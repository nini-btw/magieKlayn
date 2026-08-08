/**
 * Checkout payload validation
 * @module domain/validation/checkout
 *
 * `POST /api/orders`'s existing manual `if (!body.field)` checks only
 * verify presence, not shape/length/format — this schema adds those
 * constraints as a defense-in-depth layer, parsed before the manual
 * checks run. Kept intentionally permissive on business rules already
 * enforced elsewhere (coffret box counts, delivery-zone existence, etc.)
 * — this is about basic type/length safety, not re-deriving business
 * logic already covered by `app/api/orders/route.ts`.
 */
import { z } from "zod";

const cartItemSchema = z.object({
  product: z
    .object({
      id: z.string().min(1),
    })
    .passthrough(), // other product fields are overwritten server-side anyway
  quantity: z.number().int().positive().max(50),
});

export const checkoutSchema = z.object({
  customer: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    // Loose format check — Algerian numbers vary, this just bounds length
    // and character set rather than enforcing an exact pattern.
    phone: z
      .string()
      .trim()
      .min(6)
      .max(20)
      .regex(/^[0-9+\s()-]+$/, "Invalid phone number"),
  }),
  notes: z
    .object({
      giftNote: z.string().max(500).optional(),
    })
    .optional()
    .default({}),
  items: z.array(cartItemSchema).min(1).max(100),
  packagingType: z.enum(["standard", "luxury_coffret"]).optional(),
  boxColors: z.array(z.enum(["white", "black"])).optional(),
  deliveryZoneId: z.string().min(1),
  deliveryType: z.enum(["stop_desk", "home", "store_pickup"]),
  deliveryFee: z.number().min(0),
  stopdeskCenterId: z.number().int().positive().optional(),
  stopdeskCommuneName: z.string().max(200).optional(),
  coffretFee: z.number().optional(), // recomputed server-side regardless
});

export type CheckoutSchemaInput = z.infer<typeof checkoutSchema>;
