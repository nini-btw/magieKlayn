import { checkoutSchema } from "./checkout.schema";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    customer: { firstName: "Amine", lastName: "Belkacem", phone: "0550123456" },
    notes: { giftNote: "Happy birthday" },
    items: [{ product: { id: "prod-1" }, quantity: 2 }],
    deliveryZoneId: "zone-1",
    deliveryType: "home",
    deliveryFee: 600,
    ...overrides,
  };
}

describe("checkoutSchema", () => {
  it("accepts a well-formed payload", () => {
    const result = checkoutSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("defaults notes to {} when omitted", () => {
    const payload = validPayload();
    delete (payload as any).notes;
    const result = checkoutSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toEqual({});
    }
  });

  describe("customer", () => {
    it("rejects an empty firstName", () => {
      const result = checkoutSchema.safeParse(
        validPayload({ customer: { firstName: "", lastName: "B", phone: "0550123456" } }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a phone with letters", () => {
      const result = checkoutSchema.safeParse(
        validPayload({
          customer: { firstName: "A", lastName: "B", phone: "not-a-phone" },
        }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a phone shorter than 6 chars", () => {
      const result = checkoutSchema.safeParse(
        validPayload({ customer: { firstName: "A", lastName: "B", phone: "123" } }),
      );
      expect(result.success).toBe(false);
    });

    it("accepts phones with spaces/parens/dashes (within the 20-char cap)", () => {
      const result = checkoutSchema.safeParse(
        validPayload({
          customer: { firstName: "A", lastName: "B", phone: "0550-12-34-56" },
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe("items", () => {
    it("rejects an empty items array", () => {
      const result = checkoutSchema.safeParse(validPayload({ items: [] }));
      expect(result.success).toBe(false);
    });

    it("rejects a missing product id", () => {
      const result = checkoutSchema.safeParse(
        validPayload({ items: [{ product: {}, quantity: 1 }] }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a zero/negative quantity", () => {
      const result = checkoutSchema.safeParse(
        validPayload({ items: [{ product: { id: "p" }, quantity: 0 }] }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a quantity above the 50 cap", () => {
      const result = checkoutSchema.safeParse(
        validPayload({ items: [{ product: { id: "p" }, quantity: 51 }] }),
      );
      expect(result.success).toBe(false);
    });

    it("allows extra product fields via passthrough (server overwrites price anyway)", () => {
      const result = checkoutSchema.safeParse(
        validPayload({
          items: [{ product: { id: "p", price: 1, name: "Tampered" }, quantity: 1 }],
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe("delivery", () => {
    it("rejects an invalid deliveryType", () => {
      const result = checkoutSchema.safeParse(validPayload({ deliveryType: "teleport" }));
      expect(result.success).toBe(false);
    });

    it("rejects a negative deliveryFee", () => {
      const result = checkoutSchema.safeParse(validPayload({ deliveryFee: -1 }));
      expect(result.success).toBe(false);
    });

    it("rejects an empty deliveryZoneId", () => {
      const result = checkoutSchema.safeParse(validPayload({ deliveryZoneId: "" }));
      expect(result.success).toBe(false);
    });
  });

  describe("coffret fields", () => {
    it("accepts a valid packagingType/boxColors combination", () => {
      const result = checkoutSchema.safeParse(
        validPayload({ packagingType: "luxury_coffret", boxColors: ["white", "black"] }),
      );
      expect(result.success).toBe(true);
    });

    it("rejects an invalid box color", () => {
      const result = checkoutSchema.safeParse(
        validPayload({ boxColors: ["purple"] }),
      );
      expect(result.success).toBe(false);
    });
  });
});
