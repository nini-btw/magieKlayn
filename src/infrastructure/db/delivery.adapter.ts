/**
 * Delivery repository adapter
 * @module infrastructure/db/delivery-adapter
 */

import { eq, asc, sql } from "drizzle-orm";
import type { DeliveryZone } from "@/domain/entities/delivery";
import type { IDeliveryRepository } from "@/domain/ports/repositories";
import { db } from "./client";
import { deliveryZones } from "./schema";

// Check if we're in mock mode
const isMockMode = !db;

/**
 * Mock data for delivery zones (empty array, will be populated by seed script)
 */
const mockDeliveryZones: DeliveryZone[] = [];

/**
 * Delivery repository implementation using Drizzle ORM
 */
export class DeliveryRepository implements IDeliveryRepository {
  async getWilayas(): Promise<DeliveryZone[]> {
    if (isMockMode) {
      // Return distinct wilayas from mock data
      const wilayaMap = new Map<string, DeliveryZone>();
      mockDeliveryZones.forEach((zone) => {
        if (!wilayaMap.has(zone.wilayaCode)) {
          wilayaMap.set(zone.wilayaCode, zone);
        }
      });
      return Array.from(wilayaMap.values()).sort((a, b) =>
        a.wilayaCode.localeCompare(b.wilayaCode)
      );
    }

    // Get all zones and deduplicate by wilaya code in memory
    // This is more reliable than complex GROUP BY with SQL
    const allZones = await db
      .select()
      .from(deliveryZones)
      .orderBy(asc(deliveryZones.wilayaCode), asc(deliveryZones.communeNameAscii));

    // Deduplicate by wilaya code, keeping first entry (with lowest commune name)
    const wilayaMap = new Map<string, typeof deliveryZones.$inferSelect>();
    for (const zone of allZones) {
      if (!wilayaMap.has(zone.wilayaCode)) {
        wilayaMap.set(zone.wilayaCode, zone);
      }
    }

    return Array.from(wilayaMap.values()).map(this.mapToEntity);
  }

  async getCommunesByWilaya(wilayaCode: string): Promise<DeliveryZone[]> {
    if (isMockMode) {
      return mockDeliveryZones
        .filter((z) => z.wilayaCode === wilayaCode)
        .sort((a, b) => a.communeNameAscii.localeCompare(b.communeNameAscii));
    }

    const result = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.wilayaCode, wilayaCode))
      .orderBy(asc(deliveryZones.communeNameAscii));

    return result.map(this.mapToEntity);
  }

  async getZone(id: string): Promise<DeliveryZone | null> {
    if (isMockMode) {
      const zone = mockDeliveryZones.find((z) => z.id === id);
      return zone || null;
    }

    const [result] = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.id, id))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  /**
   * Map database record to domain entity
   */
  private mapToEntity(row: typeof deliveryZones.$inferSelect): DeliveryZone {
    return {
      id: row.id,
      wilayaCode: row.wilayaCode,
      wilayaNameAscii: row.wilayaNameAscii,
      wilayaName: row.wilayaName,
      communeNameAscii: row.communeNameAscii,
      communeName: row.communeName,
      stopDeskFee: row.stopDeskFee,
      homeFee: row.homeFee,
      hasStopDesk: row.hasStopDesk,
      hasHomeDelivery: row.hasHomeDelivery,
    };
  }
}

/**
 * Singleton instance
 */
export const deliveryRepository = new DeliveryRepository();
