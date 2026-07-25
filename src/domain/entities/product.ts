/**
 * Product entity definitions
 * @module domain/entities/product
 */

/**
 * Base product interface shared by all product types
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // Price as-is (no conversion)
  isActive: boolean;
  type: ProductType;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product type discriminator
 */
export type ProductType = "cookie" | "box";

/**
 * Cookie piece - individual cookie sold separately
 */
export interface CookiePiece extends Product {
  type: "cookie";
  flavour: string;
  allergens: Allergen[];
  isNew?: boolean;
  isSoldOut?: boolean;
}

/**
 * Pre-made cookie box containing multiple cookies
 */
export interface CookieBox extends Product {
  type: "box";
  includedCookies: BoxItem[];
}

/**
 * Item within a cookie box
 */
export interface BoxItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
}

/**
 * Allergen types for cookies
 */
export type Allergen =
  | "gluten"
  | "dairy"
  | "eggs"
  | "nuts"
  | "peanuts"
  | "soy"
  | "sesame";

/**
 * Product with additional badge information for UI display
 */
export interface ProductWithBadge extends Product {
  badge?: string;
}

/**
 * Type guard to check if product is a cookie
 */
export function isCookiePiece(product: Product): product is CookiePiece {
  return product.type === "cookie";
}

/**
 * Type guard to check if product is a box
 */
export function isCookieBox(product: Product): product is CookieBox {
  return product.type === "box";
}
