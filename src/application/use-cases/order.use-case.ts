/**
 * Order use cases
 * @module application/use-cases/order
 */

import type {
  Order,
  CreateOrderPayload,
  CartItem,
} from "@/domain/entities/order";
import type {
  IOrderRepository,
  INotificationService,
} from "@/domain/ports/repositories";
import { canCheckout } from "@/domain/rules/cart.rules";

/**
 * Result type for order creation
 */
export interface CreateOrderResult {
  success: boolean;
  order?: Order;
  error?: string;
}

/**
 * Create order use case
 */
export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private notificationService: INotificationService
  ) {}

  /**
   * Execute order creation
   */
  async execute(payload: CreateOrderPayload): Promise<CreateOrderResult> {
    try {
      // Validate cart minimum
      if (!canCheckout(payload.items)) {
        return {
          success: false,
          error: "Minimum 3 cookies required for checkout",
        };
      }

      // Create order in database
      const order = await this.orderRepo.create(payload);

      // Send notification
      try {
        await this.notificationService.sendOrderNotification(order);
      } catch (notifyError) {
        // Log but don't fail if notification fails
        console.error("Failed to send notification:", notifyError);
      }

      return { success: true, order };
    } catch (error) {
      console.error("Order creation failed:", error);
      return {
        success: false,
        error: "Failed to create order. Please try again.",
      };
    }
  }
}

/**
 * Get recent orders use case (for admin)
 */
export class GetRecentOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  /**
   * Execute get recent orders
   */
  async execute(count: number): Promise<Order[]> {
    return this.orderRepo.getRecent(count);
  }
}

/**
 * Update order status use case
 */
export class UpdateOrderStatusUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  /**
   * Execute status update
   */
  async execute(
    orderId: string,
    status: Order["status"]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.orderRepo.updateStatus(orderId, status);
      return { success: true };
    } catch (error) {
      console.error("Status update failed:", error);
      return { success: false, error: "Failed to update order status" };
    }
  }
}
