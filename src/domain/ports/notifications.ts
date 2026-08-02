/**
 * Notification port (driven port in hexagonal architecture)
 * @module domain/ports/notifications
 */

import type { Order } from "../entities/order";

export interface INotificationService {
  /**
   * Notify the store owner that a new order was created.
   * Implementations must never throw — failures should be logged and
   * swallowed so a notification outage can never block order creation.
   */
  notifyNewOrder(order: Order): Promise<void>;
}
