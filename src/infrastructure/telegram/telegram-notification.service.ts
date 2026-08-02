/**
 * Telegram notification service adapter
 * @module infrastructure/telegram/telegram-notification.service
 *
 * Security notes:
 * - Bot token lives only in server env vars, never sent to the client.
 * - Messages only ever go to OWNER_CHAT_ID, a fixed value set by the store
 *   owner in env — no request-supplied value can redirect a notification.
 * - Any customer-supplied text (name, phone, gift note) is HTML-escaped
 *   before being interpolated, since we use parse_mode: "HTML".
 * - Errors are logged, never thrown, so Telegram being down can't fail
 *   order creation.
 */

import type { INotificationService } from "@/domain/ports/notifications";
import type { Order } from "@/domain/entities/order";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export class TelegramNotificationService implements INotificationService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID;

  async notifyNewOrder(order: Order): Promise<void> {
    if (!this.botToken || !this.ownerChatId) {
      console.warn(
        "[TelegramNotificationService] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_OWNER_CHAT_ID — skipping notification",
      );
      return;
    }

    try {
      const response = await fetch(
        `${TELEGRAM_API_BASE}/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: this.ownerChatId,
            text: this.formatOrderMessage(order),
            parse_mode: "HTML",
          }),
        },
      );

      if (!response.ok) {
        console.error(
          `[TelegramNotificationService] Telegram API error ${response.status}: ${await response.text()}`,
        );
      }
    } catch (error) {
      console.error(
        "[TelegramNotificationService] Failed to send notification:",
        error,
      );
    }
  }

  private formatOrderMessage(order: Order): string {
    const itemsList = order.items
      .map(
        (item) =>
          `  • ${this.escapeHtml(item.productName)} × ${item.quantity} — ${item.priceSnapshot} DA`,
      )
      .join("\n");

    const packagingLine =
      order.packagingType === "luxury_coffret"
        ? `🎁 Coffret de luxe${order.boxColor ? ` (${order.boxColor})` : ""}`
        : "";

    const deliveryLine = [
      order.communeName,
      order.wilayaName,
      order.deliveryType === "home" ? "Livraison à domicile" : "Stop Desk",
    ]
      .filter(Boolean)
      .join(" — ");

    const giftNoteLine = order.giftNote
      ? `📝 Note: ${this.escapeHtml(order.giftNote)}`
      : "";

    return [
      "🛍️ <b>Nouvelle commande !</b>",
      "",
      `👤 ${this.escapeHtml(order.fullName)}`,
      `📞 ${this.escapeHtml(order.phone)}`,
      "",
      itemsList,
      packagingLine,
      "",
      `📍 ${this.escapeHtml(deliveryLine)}`,
      `💰 Total: <b>${order.totalAmount} DA</b>`,
      giftNoteLine,
    ]
      .filter((line) => line !== "")
      .join("\n");
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

export const telegramNotificationService = new TelegramNotificationService();
