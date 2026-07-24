/**
 * Database client configuration
 * @module infrastructure/db/client
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Check if we're in mock mode
const isMockMode = !process.env.DATABASE_URL || 
  process.env.DATABASE_URL.includes("mock") ||
  process.env.DATABASE_URL.includes("[YOUR_DB_PASSWORD]");

if (isMockMode) {
  console.warn("⚠️  Running in MOCK MODE - No database connection");
}

// Create postgres client
const client = isMockMode 
  ? null 
  : postgres(process.env.DATABASE_URL!, { 
      prepare: false, // Required for Supabase
    });

// Create drizzle database instance
export const db = client 
  ? drizzle(client, { schema })
  : null as any; // Mock mode fallback

// Export schema for type safety
export * as schema from "./schema";

// Re-export types
export type { 
  Product, 
  NewProduct, 
  Order, 
  NewOrder, 
  OrderItem, 
  NewOrderItem, 
  VoteCandidate, 
  NewVoteCandidate, 
  WeeklyDrop, 
  NewWeeklyDrop 
} from "./schema";

// Export mock data for fallback
export { 
  mockProducts, 
  mockOrders, 
  mockVoteCandidates, 
  mockWeeklyDrop 
} from "./mock-data";
