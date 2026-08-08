/**
 * Product entity definitions — Magie Klayn
 * @module domain/entities/product
 *
 * Mirrors `infrastructure/db/schema.ts` (`products` table) 1:1.
 *
 * A product represents a single fragrance bottle.
 * There are no product subtypes (, box, etc.).
 *
 * Gift packaging (Luxury Coffret) is an order-level option and
 * therefore does not belong to this entity.
 */
export type ProductGender = "male" | "female" | "unisex";

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
  gender: ProductGender | null;

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

  /**
   * Optional fragrance icon this mist draws its mood from, e.g.
   * "Tom Ford Vanille Sex". Shown on the product detail page and in the
   * About page's "Inspired By" section when set. Null when not curated.
   */
  inspiredBy: string | null;

  createdAt: Date;
  updatedAt: Date;
}
/**
 * Serialized product — the shape a Product takes once it enters
 * Redux state or any other JSON-serializable boundary. Dates become
 * ISO strings (or null) since real Date objects aren't serializable.
 */
export type SerializedProduct = Omit<Product, "createdAt" | "updatedAt"> & {
  createdAt: string | null;
  updatedAt: string | null;
};

/**
 * UI helper type.
 * Not stored in the database.
 */
export interface ProductWithBadge extends Product {
  badge?: string;
}
