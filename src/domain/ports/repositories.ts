/**
 * Repository port interfaces (driven ports in hexagonal architecture)
 * @module domain/ports/repositories
 */

import type { CookiePiece, CookieBox, Product } from "../entities/product";
import type { Order, CreateOrderPayload, OrderFilters, WilayaOrderStats } from "../entities/order";
import type { VoteCandidate } from "../entities/vote";
import type { WeeklyDrop } from "../entities/drop";
import type { DeliveryZone } from "../entities/delivery";

/**
 * Product repository interface
 */
export interface IProductRepository {
  /**
   * Get all products (including inactive)
   */
  getAll(): Promise<Product[]>;

  /**
   * Get all active products
   */
  getAllActive(): Promise<Product[]>;

  /**
   * Get all active products with pagination
   */
  getAllActivePaginated(limit: number, offset: number): Promise<Product[]>;

  /**
   * Get count of active products
   */
  getActiveCount(): Promise<number>;

  /**
   * Get product by slug
   */
  getBySlug(slug: string): Promise<Product | null>;

  /**
   * Get product by ID
   */
  getById(id: string): Promise<Product | null>;

  /**
   * Get all cookie pieces
   */
  getAllCookies(): Promise<CookiePiece[]>;

  /**
   * Get all boxes
   */
  getAllBoxes(): Promise<CookieBox[]>;

  /**
   * Create new product
   */
  create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;

  /**
   * Update product
   */
  update(id: string, product: Partial<Product>): Promise<Product>;

  /**
   * Toggle product active status
   */
  toggleActive(id: string): Promise<void>;

  /**
   * Delete product
   */
  delete(id: string): Promise<void>;
}

/**
 * Order repository interface
 */
export interface IOrderRepository {
  /**
   * Create new order
   */
  create(payload: CreateOrderPayload): Promise<Order>;

  /**
   * Get order by ID
   */
  getById(id: string): Promise<Order | null>;

  /**
   * Get all orders (for admin)
   */
  getAll(limit?: number): Promise<Order[]>;

  /**
   * Get orders with filters
   */
  getAllWithFilters(filters?: OrderFilters, limit?: number): Promise<Order[]>;

  /**
   * Get top wilayas by order count
   */
  getTopWilayas(limit?: number): Promise<WilayaOrderStats[]>;

  /**
   * Update order status
   */
  updateStatus(id: string, status: Order["status"]): Promise<void>;

  /**
   * Get recent orders
   */
  getRecent(count: number): Promise<Order[]>;

  /**
   * Delete order
   */
  delete(id: string): Promise<void>;
}

/**
 * Vote repository interface
 */
export interface IVoteRepository {
  /**
   * Get all active vote candidates
   */
  getAllActive(): Promise<VoteCandidate[]>;

  /**
   * Get candidate by ID
   */
  getById(id: string): Promise<VoteCandidate | null>;

  /**
   * Check if voter has already voted for candidate
   */
  hasVoted(candidateId: string, voterFingerprint: string): Promise<boolean>;

  /**
   * Increment vote count for candidate
   */
  vote(candidateId: string, voterFingerprint?: string): Promise<void>;

  /**
   * Create new candidate (admin)
   */
  create(
    candidate: Omit<VoteCandidate, "id" | "voteCount" | "createdAt">
  ): Promise<VoteCandidate>;

  /**
   * Delete candidate (admin)
   */
  delete(id: string): Promise<void>;

  /**
   * Reset all votes (admin)
   */
  resetAll(): Promise<void>;

  /**
   * Toggle candidate active status
   */
  toggleActive(id: string): Promise<void>;
}

/**
 * Drop repository interface
 */
export interface IDropRepository {
  /**
   * Get current active drop
   */
  getCurrent(): Promise<WeeklyDrop | null>;

  /**
   * Create new drop schedule
   */
  create(drop: Omit<WeeklyDrop, "id" | "createdAt">): Promise<WeeklyDrop>;

  /**
   * Mark drop as revealed
   */
  markRevealed(id: string): Promise<void>;

  /**
   * Cancel drop
   */
  cancel(id: string): Promise<void>;

  /**
   * Get all drops
   */
  getAll(): Promise<WeeklyDrop[]>;
}

/**
 * Delivery repository interface
 */
export interface IDeliveryRepository {
  /**
   * Get all distinct wilayas (provinces)
   */
  getWilayas(): Promise<DeliveryZone[]>;

  /**
   * Get all communes for a specific wilaya
   */
  getCommunesByWilaya(wilayaCode: string): Promise<DeliveryZone[]>;

  /**
   * Get a specific delivery zone by ID
   */
  getZone(id: string): Promise<DeliveryZone | null>;
}

/**
 * Storage service interface for image uploads
 */
export interface IStorageService {
  /**
   * Upload image file
   */
  upload(file: File, path: string): Promise<string>;

  /**
   * Delete image by URL
   */
  delete(url: string): Promise<void>;

  /**
   * Get public URL for path
   */
  getPublicUrl(path: string): string;
}

/**
 * Notification service interface for Telegram
 */
export interface INotificationService {
  /**
   * Send order notification
   */
  sendOrderNotification(order: Order): Promise<void>;

  /**
   * Test connection
   */
  testConnection(): Promise<boolean>;
}
