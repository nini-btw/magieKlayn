/**
 * Drop repository adapter
 * @module infrastructure/db/drop-adapter
 */

import { eq, desc, and, isNull } from "drizzle-orm";
import type { WeeklyDrop } from "@/domain/entities/drop";
import type { IDropRepository } from "@/domain/ports/repositories";
import { db, mockWeeklyDrop } from "./client";
import { weeklyDrops, products } from "./schema";

// Check if we're in mock mode
const isMockMode = !db;

/**
 * Drop repository implementation using Drizzle ORM
 */
export class DropRepository implements IDropRepository {
  async getCurrent(): Promise<WeeklyDrop | null> {
    if (isMockMode) {
      return mockWeeklyDrop;
    }

    const result = await db
      .select()
      .from(weeklyDrops)
      .where(and(eq(weeklyDrops.isActive, true), isNull(weeklyDrops.revealedAt)))
      .orderBy(weeklyDrops.scheduledAt) // ASC - get the earliest scheduled drop first
      .limit(1);

    if (!result[0]) return null;

    // Get associated product if exists
    let product = undefined;
    if (result[0].productId) {
      const productResult = await db
        .select()
        .from(products)
        .where(eq(products.id, result[0].productId))
        .limit(1);

      if (productResult[0]) {
        const baseProduct = {
          id: productResult[0].id,
          name: productResult[0].name,
          slug: productResult[0].slug,
          description: productResult[0].description,
          price: productResult[0].price,
          isActive: productResult[0].isActive,
          images: productResult[0].images || [],
          createdAt: new Date(productResult[0].createdAt),
          updatedAt: new Date(productResult[0].updatedAt),
        };
        
        if (productResult[0].type === "cookie") {
          product = {
            ...baseProduct,
            type: "cookie" as const,
            flavour: productResult[0].flavour || "",
            allergens: productResult[0].allergens || [],
            isNew: productResult[0].isNew ?? false,
            isSoldOut: productResult[0].isSoldOut ?? false,
          };
        } else {
          product = {
            ...baseProduct,
            type: "box" as const,
            includedCookies: productResult[0].includedCookies || [],
          };
        }
      }
    }

    return this.mapToEntity(result[0], product);
  }

  async create(drop: Omit<WeeklyDrop, "id" | "createdAt">): Promise<WeeklyDrop> {
    if (isMockMode) {
      return {
        ...drop,
        id: `drop-${Date.now()}`,
        createdAt: new Date(),
      } as WeeklyDrop;
    }

    const result = await db
      .insert(weeklyDrops)
      .values({
        productId: drop.productId,
        scheduledAt: new Date(drop.scheduledAt),
        isActive: drop.isActive ?? true,
      })
      .returning();

    return this.mapToEntity(result[0]);
  }

  async markRevealed(id: string): Promise<void> {
    if (isMockMode) return;

    // Get the drop to find the associated product
    const dropResult = await db
      .select()
      .from(weeklyDrops)
      .where(eq(weeklyDrops.id, id))
      .limit(1);

    const drop = dropResult[0];

    // Update the drop as revealed
    await db
      .update(weeklyDrops)
      .set({ revealedAt: new Date() })
      .where(eq(weeklyDrops.id, id));

    // Also activate the product and mark as new
    if (drop?.productId) {
      await db
        .update(products)
        .set({ 
          isActive: true, 
          isNew: true,
          updatedAt: new Date() 
        })
        .where(eq(products.id, drop.productId));
    }
  }

  async cancel(id: string): Promise<void> {
    if (isMockMode) return;

    await db
      .update(weeklyDrops)
      .set({ isActive: false })
      .where(eq(weeklyDrops.id, id));
  }

  async getAll(): Promise<WeeklyDrop[]> {
    if (isMockMode) {
      return [mockWeeklyDrop];
    }

    const result = await db
      .select()
      .from(weeklyDrops)
      .orderBy(desc(weeklyDrops.scheduledAt));

    return result.map((r: typeof weeklyDrops.$inferSelect) => this.mapToEntity(r));
  }

  /**
   * Map database record to domain entity
   */
  private mapToEntity(
    row: typeof weeklyDrops.$inferSelect,
    product?: any
  ): WeeklyDrop {
    return {
      id: row.id,
      productId: row.productId || undefined,
      product,
      scheduledAt: new Date(row.scheduledAt),
      isActive: row.isActive,
      revealedAt: row.revealedAt ? new Date(row.revealedAt) : undefined,
      createdAt: new Date(row.createdAt),
    };
  }
}

/**
 * Singleton instance
 */
export const dropRepository = new DropRepository();
