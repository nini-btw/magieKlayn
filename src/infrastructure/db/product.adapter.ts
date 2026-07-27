/**
 * Product repository adapter
 * @module infrastructure/db/product-adapter
 */

import { eq, desc, sql } from "drizzle-orm";
import type { Product } from "@/domain/entities/product";
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

  async getAllActivePaginated(
    limit: number,
    offset: number,
  ): Promise<Product[]> {
    if (isMockMode) {
      return mockProducts
        .filter((p) => p.isActive)
        .slice(offset, offset + limit);
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
      .select({
        count: sql<number>`count(*)`,
      })
      .from(products)
      .where(eq(products.isActive, true));

    return Number(result[0]?.count ?? 0);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    if (isMockMode) {
      return mockProducts.find((p) => p.slug === slug) ?? null;
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
      return mockProducts.find((p) => p.id === id) ?? null;
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async create(
    product: Omit<Product, "id" | "createdAt" | "updatedAt">,
  ): Promise<Product> {
    if (isMockMode) {
      return {
        ...product,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const result = await db
      .insert(products)
      .values({
        name: product.name,
        slug: product.slug,
        description: product.description,
        notes: product.notes,
        price: product.price,
        colorHex: product.colorHex, // <-- was missing
        sizeMl: product.sizeMl,
        images: product.images,
        isActive: product.isActive,
        isNew: product.isNew,
        isSoldOut: product.isSoldOut,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    if (isMockMode) {
      const existing = mockProducts.find((p) => p.id === id);

      if (!existing) {
        throw new Error("Product not found");
      }

      return {
        ...existing,
        ...product,
        updatedAt: new Date(),
      };
    }

    const result = await db
      .update(products)
      .set({
        ...product,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!result[0]) {
      throw new Error("Product not found");
    }

    return this.mapToEntity(result[0]);
  }

  async toggleActive(id: string): Promise<void> {
    const product = await this.getById(id);

    if (!product || isMockMode) {
      return;
    }

    await db
      .update(products)
      .set({
        isActive: !product.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  }

  async delete(id: string): Promise<void> {
    if (isMockMode) {
      return;
    }

    await db.delete(products).where(eq(products.id, id));
  }

  /**
   * Map database row to domain entity
   */
  private mapToEntity(row: typeof products.$inferSelect): Product {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      notes: row.notes ?? [],
      price: row.price,
      colorHex: row.colorHex, // <-- was missing
      sizeMl: row.sizeMl,
      images: row.images ?? [],
      isActive: row.isActive,
      isNew: row.isNew,
      isSoldOut: row.isSoldOut,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

/**
 * Singleton instance
 */
export const productRepository = new ProductRepository();
