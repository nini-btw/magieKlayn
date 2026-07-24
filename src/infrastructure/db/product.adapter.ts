/**
 * Product repository adapter
 * @module infrastructure/db/product-adapter
 */

import { eq, desc, sql, and } from "drizzle-orm";
import type { Product, CookiePiece, CookieBox } from "@/domain/entities/product";
import type { IProductRepository } from "@/domain/ports/repositories";
import { db, mockProducts } from "./client";
import { products } from "./schema";

// Check if we're in mock mode
const isMockMode = !db;

/**
 * Product repository implementation using Drizzle ORM
 */
export class ProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    if (isMockMode) {
      return mockProducts;
    }

    const result = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    return result.map(this.mapToEntity);
  }

  async getAllActive(): Promise<Product[]> {
    if (isMockMode) {
      return mockProducts.filter((p) => p.isActive);
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));

    return result.map(this.mapToEntity);
  }

  async getAllActivePaginated(limit: number, offset: number): Promise<Product[]> {
    if (isMockMode) {
      return mockProducts.filter((p) => p.isActive).slice(offset, offset + limit);
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.mapToEntity);
  }

  async getActiveCount(): Promise<number> {
    if (isMockMode) {
      return mockProducts.filter((p) => p.isActive).length;
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true));

    return result[0]?.count || 0;
  }

  async getBySlug(slug: string): Promise<Product | null> {
    if (isMockMode) {
      return mockProducts.find((p) => p.slug === slug) || null;
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async getById(id: string): Promise<Product | null> {
    if (isMockMode) {
      return mockProducts.find((p) => p.id === id) || null;
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async getAllCookies(): Promise<CookiePiece[]> {
    if (isMockMode) {
      return mockProducts.filter((p): p is CookiePiece => p.type === "cookie" && p.isActive);
    }

    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.type, "cookie"), eq(products.isActive, true)));

    return result.map(this.mapToEntity) as CookiePiece[];
  }

  async getAllBoxes(): Promise<CookieBox[]> {
    if (isMockMode) {
      return mockProducts.filter((p): p is CookieBox => p.type === "box" && p.isActive);
    }

    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.type, "box"), eq(products.isActive, true)));

    return result.map(this.mapToEntity) as CookieBox[];
  }

  async create(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> {
    if (isMockMode) {
      const newProduct = {
        ...product,
        id: `prod-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product;
      return newProduct;
    }

    const result = await db
      .insert(products)
      .values({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        isActive: product.isActive,
        type: product.type,
        images: product.images || [],
        allergens: product.type === "cookie" ? (product as CookiePiece).allergens || [] : undefined,
        includedCookies: product.type === "box" ? (product as CookieBox).includedCookies || [] : undefined,
        isNew: product.type === "cookie" ? (product as CookiePiece).isNew ?? false : undefined,
        isSoldOut: product.type === "cookie" ? (product as CookiePiece).isSoldOut ?? false : undefined,
        flavour: product.type === "cookie" ? (product as CookiePiece).flavour : undefined,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    if (isMockMode) {
      const index = mockProducts.findIndex((p) => p.id === id);
      if (index === -1) throw new Error("Product not found");
      return mockProducts[index];
    }

    const result = await db
      .update(products)
      .set({
        ...product,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!result[0]) throw new Error("Product not found");
    return this.mapToEntity(result[0]);
  }

  async toggleActive(id: string): Promise<void> {
    const product = await this.getById(id);
    if (!product) return;

    if (isMockMode) return;

    await db
      .update(products)
      .set({ isActive: !product.isActive, updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  async delete(id: string): Promise<void> {
    if (isMockMode) return;

    await db.delete(products).where(eq(products.id, id));
  }

  /**
   * Map database record to domain entity
   */
  private mapToEntity(row: typeof products.$inferSelect): Product {
    const base = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: row.price, // Price as-is (no conversion)
      isActive: row.isActive,
      type: row.type,
      images: row.images || [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };

    if (row.type === "cookie") {
      return {
        ...base,
        type: "cookie",
        flavour: row.flavour || "",
        allergens: row.allergens || [],
        isNew: row.isNew ?? false,
        isSoldOut: row.isSoldOut ?? false,
      } as CookiePiece;
    } else {
      return {
        ...base,
        type: "box",
        includedCookies: row.includedCookies || [],
      } as CookieBox;
    }
  }
}

/**
 * Singleton instance
 */
export const productRepository = new ProductRepository();
