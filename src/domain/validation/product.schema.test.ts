import { createProductSchema, updateProductSchema } from "./product.schema";

function validProduct(overrides: Record<string, unknown> = {}) {
  return {
    name: "Rose Land",
    slug: "rose-land",
    description: "A juicy floral mist.",
    price: 1100,
    colorHex: "#f5027e",
    sizeMl: 100,
    images: ["https://example.com/a.jpg"],
    ...overrides,
  };
}

describe("createProductSchema", () => {
  it("accepts a well-formed product and applies documented defaults", () => {
    const result = createProductSchema.safeParse(validProduct());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.isNew).toBe(false);
      expect(result.data.isSoldOut).toBe(false);
      expect(result.data.gender).toBeNull();
      expect(result.data.inspiredBy).toBeNull();
      expect(result.data.notes).toEqual([]);
    }
  });

  it("rejects an empty name", () => {
    expect(createProductSchema.safeParse(validProduct({ name: "" })).success).toBe(false);
  });

  it("rejects an uppercase or invalid slug", () => {
    expect(createProductSchema.safeParse(validProduct({ slug: "Rose Land!" })).success).toBe(
      false,
    );
  });

  it("accepts a valid lowercase-hyphenated slug", () => {
    expect(createProductSchema.safeParse(validProduct({ slug: "rose-land-2" })).success).toBe(
      true,
    );
  });

  it("rejects a negative price", () => {
    expect(createProductSchema.safeParse(validProduct({ price: -1 })).success).toBe(false);
  });

  it("rejects a non-integer price", () => {
    expect(createProductSchema.safeParse(validProduct({ price: 10.5 })).success).toBe(false);
  });

  it("rejects a colorHex that isn't a 6-digit hex", () => {
    expect(createProductSchema.safeParse(validProduct({ colorHex: "red" })).success).toBe(
      false,
    );
    expect(createProductSchema.safeParse(validProduct({ colorHex: "#fff" })).success).toBe(
      false,
    );
  });

  it("rejects an empty images array", () => {
    expect(createProductSchema.safeParse(validProduct({ images: [] })).success).toBe(false);
  });

  it("rejects an invalid gender enum value", () => {
    expect(createProductSchema.safeParse(validProduct({ gender: "other" })).success).toBe(
      false,
    );
  });

  it("rejects sizeMl <= 0", () => {
    expect(createProductSchema.safeParse(validProduct({ sizeMl: 0 })).success).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("accepts a partial update with a single field", () => {
    const result = updateProductSchema.safeParse({ price: 1200 });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no-op update)", () => {
    expect(updateProductSchema.safeParse({}).success).toBe(true);
  });

  it("still enforces field-level constraints when a field is present", () => {
    const result = updateProductSchema.safeParse({ colorHex: "not-a-color" });
    expect(result.success).toBe(false);
  });
});
