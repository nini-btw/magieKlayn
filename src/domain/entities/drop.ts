/**
 * Weekly drop entity definitions
 * @module domain/entities/drop
 */

import type { CookiePiece } from "./product";

/**
 * Weekly drop entity for scheduled cookie reveals
 */
export interface WeeklyDrop {
  id: string;
  productId?: string;
  product?: CookiePiece;
  scheduledAt: Date;
  isActive: boolean;
  revealedAt?: Date;
  createdAt: Date;
}

/**
 * Drop status derived from current time
 */
export type DropStatus = "upcoming" | "live" | "ended";

/**
 * Time remaining for countdown display
 */
export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/**
 * Determine drop status based on current time
 */
export function getDropStatus(drop: WeeklyDrop): DropStatus {
  const now = new Date();
  const scheduled = new Date(drop.scheduledAt);

  if (drop.revealedAt) return "ended";
  if (now >= scheduled) return "live";
  return "upcoming";
}

/**
 * Calculate time remaining until drop
 */
export function getTimeRemaining(scheduledAt: Date): TimeRemaining {
  const total = new Date(scheduledAt).getTime() - Date.now();
  const seconds = Math.max(0, Math.floor((total / 1000) % 60));
  const minutes = Math.max(0, Math.floor((total / 1000 / 60) % 60));
  const hours = Math.max(0, Math.floor((total / (1000 * 60 * 60)) % 24));
  const days = Math.max(0, Math.floor(total / (1000 * 60 * 60 * 24)));

  return { days, hours, minutes, seconds, total };
}
