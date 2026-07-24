/**
 * Telegram notification service (MOCK VERSION)
 * @module infrastructure/telegram/service
 * 
 * NOTE: Logs to console instead of sending for UI development
 */

import type { Order } from "@/domain/entities/order";
import type { INotificationService } from "@/domain/ports/repositories";

/**
 * Telegram notification service - MOCK
 */
export class TelegramService implements INotificationService {
  /**
   * Format order for Telegram message
   */
  private formatOrderMessage(order: Order): string {
    const items = order.items
      .map(
        (item) =>
          `  • ${item.productName} x${item.quantity} - ${item.priceSnapshot * item.quantity} DA`
      )
      .join("\n");

    let message = `
🍪 NEW ORDER!

Order ID: ${order.id.slice(0, 8)}
Customer: ${order.fullName}
Phone: ${order.phone}
Address: ${order.address}

Items:
${items}

Total: ${order.totalAmount} DA
    `.trim();

    if (order.cookingNote) {
      message += `\n\n📝 Cooking Note: ${order.cookingNote}`;
    }

    if (order.giftNote) {
      message += `\n\n💌 Gift Note: ${order.giftNote}`;
    }

    return message;
  }

  /**
   * Send order notification (logs to console for mock)
   */
  async sendOrderNotification(order: Order): Promise<void> {
    const message = this.formatOrderMessage(order);
    
    // MOCK: Log to console instead of sending
    console.log("=".repeat(50));
    console.log("TELEGRAM NOTIFICATION (MOCK)");
    console.log("=".repeat(50));
    console.log(message);
    console.log("=".repeat(50));
  }

  /**
   * Test connection (always returns true for mock)
   */
  async testConnection(): Promise<boolean> {
    return true;
  }
}

/**
 * Singleton instance
 */
export const telegramService = new TelegramService();
