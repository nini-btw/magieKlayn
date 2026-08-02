/**
 * Product repository adapter
 * @module infrastructure/db/product-adapter
 */

import { eq, desc, sql } from "drizzle-orm";
import type { Product } from "@/domain/entities/product";
import type { IProductRepository } from "@/domain/ports/repositories";
import { db } from "./client";
import { products } from "./schema";

/**
 * Product repository implementation using Drizzle ORM
 */
export class ProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    const result = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    return result.map(this.mapToEntity);
  }

  async getAllActive(): Promise<Product[]> {
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
    const result = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(products)
      .where(eq(products.isActive, true));

    return Number(result[0]?.count ?? 0);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async getById(id: string): Promise<Product | null> {
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
    const result = await db
      .insert(products)
      .values({
        name: product.name,
        slug: product.slug,
        description: product.description,
        notes: product.notes,
        price: product.price,
        gender: product.gender,
        colorHex: product.colorHex,
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

    if (!product) {
      throw new Error("Product not found");
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
      gender: row.gender ?? null,
      colorHex: row.colorHex,
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
