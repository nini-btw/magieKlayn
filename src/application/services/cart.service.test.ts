import { CartService } from "./cart.service";
import type { CartItem } from "@/domain/entities/order";
import type { SerializedProduct } from "@/domain/entities/product";

function makeProduct(overrides: Partial<SerializedProduct> = {}): SerializedProduct {
  return {
    id: "prod-1",
    name: "Rose Land",
    slug: "rose-land",
    description: "A mist",
    notes: [],
    price: 1000,
    gender: null,
    colorHex: "#ff0000",
    sizeMl: 100,
    images: [],
    isActive: true,
    isNew: false,
    isSoldOut: false,
    inspiredBy: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe("CartService", () => {
  let service: CartService;

  beforeEach(() => {
    service = new CartService();
  });

  describe("addItem", () => {
    it("adds a new product as a new line item", () => {
      const result = service.addItem([], makeProduct(), 2);
      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(2);
    });

    it("merges quantity into an existing line item instead of duplicating", () => {
      const existing: CartItem[] = [{ product: makeProduct(), quantity: 1 }];
      const result = service.addItem(existing, makeProduct(), 3);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(4);
    });

    it("defaults quantity to 1 when omitted", () => {
      const result = service.addItem([], makeProduct());
      expect(result.items[0].quantity).toBe(1);
    });
  });

  describe("removeItem", () => {
    it("removes the matching product", () => {
      const existing: CartItem[] = [{ product: makeProduct({ id: "a" }), quantity: 1 }];
      const result = service.removeItem(existing, "a");
      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(0);
    });

    it("fails gracefully when the product isn't in the cart", () => {
      const result = service.removeItem([], "missing");
      expect(result.success).toBe(false);
      expect(result.items).toHaveLength(0);
    });
  });

  describe("updateQuantity", () => {
    it("updates the quantity of an existing item", () => {
      const existing: CartItem[] = [{ product: makeProduct({ id: "a" }), quantity: 1 }];
      const result = service.updateQuantity(existing, "a", 5);
      expect(result.items[0].quantity).toBe(5);
    });

    it("removes the item instead when quantity drops below 1", () => {
      const existing: CartItem[] = [{ product: makeProduct({ id: "a" }), quantity: 1 }];
      const result = service.updateQuantity(existing, "a", 0);
      expect(result.items).toHaveLength(0);
    });

    it("fails gracefully when the product isn't in the cart", () => {
      const result = service.updateQuantity([], "missing", 2);
      expect(result.success).toBe(false);
    });
  });

  describe("clearCart", () => {
    it("always returns an empty cart", () => {
      const result = service.clearCart();
      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
    });
  });

  describe("getCartSummary", () => {
    it("delegates to the pure cart.rules functions", () => {
      const items: CartItem[] = [
        { product: makeProduct({ id: "a", price: 1000 }), quantity: 2 },
        { product: makeProduct({ id: "b", price: 500 }), quantity: 1 },
      ];
      const summary = service.getCartSummary(items);
      expect(summary).toEqual({ itemCount: 3, totalAmount: 2500 });
    });
  });
});
