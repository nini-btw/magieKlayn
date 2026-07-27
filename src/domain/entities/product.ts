/**
 * Product entity definitions — Magie Klayn
 * @module domain/entities/product
 *
 * Mirrors `infrastructure/db/schema.ts` (`products` table) 1:1.
 *
 * A product represents a single fragrance bottle.
 * There are no product subtypes (cookie, box, etc.).
 *
 * Gift packaging (Luxury Coffret) is an order-level option and
 * therefore does not belong to this entity.
 */

export interface Product {
  /** Unique product identifier */
  id: string;

  /** Display name */
  name: string;

  /** URL slug */
  slug: string;

  /** Product description */
  description: string;

  /**
   * Fragrance notes
   * Example:
   * ["Vanille", "Musc Blanc", "Fleur d'Oranger"]
   */
  notes: string[];

  /** Price in Algerian Dinar (DA) */
  price: number;

  /**
   * Signature bottle/liquid color
   * Example: "#D0223A"
   */
  colorHex: string;

  /** Bottle size in milliliters */
  sizeMl: number;

  /** Product gallery */
  images: string[];

  /** Visible in the shop */
  isActive: boolean;

  /** Display "New" badge */
  isNew: boolean;

  /** Cannot currently be purchased */
  isSoldOut: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * UI helper type.
 * Not stored in the database.
 */
export interface ProductWithBadge extends Product {
  badge?: string;
}
