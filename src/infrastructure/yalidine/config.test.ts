describe("getOriginWilayaId (default env — override set empty)", () => {
  // Import lazily per describe block so config.ts's module-level env
  // reads happen under whatever process.env state that block sets up.
  const { getOriginWilayaId } = require("./config");

  it("resolves to the default origin wilaya for an ordinary destination", () => {
    expect(getOriginWilayaId("16")).toBe(16);
    expect(getOriginWilayaId(31)).toBe(16);
  });

  it("accepts both string and number destination ids", () => {
    expect(getOriginWilayaId("1")).toBe(getOriginWilayaId(1));
  });

  it.each([0, 59, -1, 1.5, NaN])("throws for an out-of-range id: %s", (bad) => {
    expect(() => getOriginWilayaId(bad as number)).toThrow(/Invalid destination wilaya id/);
  });

  it("throws for a non-numeric string", () => {
    expect(() => getOriginWilayaId("not-a-wilaya")).toThrow(/Invalid destination wilaya id/);
  });

  it("accepts the boundary values 1 and 58", () => {
    expect(getOriginWilayaId(1)).toBe(16);
    expect(getOriginWilayaId(58)).toBe(16);
  });
});

describe("getOriginWilayaId (override configured via env)", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it("ships from the override origin when the destination is in the override list", () => {
    jest.resetModules();
    process.env.YALIDINE_DEFAULT_ORIGIN_WILAYA_ID = "16";
    process.env.YALIDINE_OVERRIDE_ORIGIN_WILAYA_ID = "31";
    process.env.YALIDINE_OVERRIDE_DESTINATION_IDS = "9,25";

    const { getOriginWilayaId: getOriginWilayaIdWithOverride } = require("./config");

    expect(getOriginWilayaIdWithOverride(9)).toBe(31);
    expect(getOriginWilayaIdWithOverride(25)).toBe(31);
    // A destination not in the override list still uses the default.
    expect(getOriginWilayaIdWithOverride(16)).toBe(16);
  });
});

describe("calculateParcelWeight", () => {
  const { calculateParcelWeight } = require("./config");

  it("scales with item count for small orders", () => {
    const oneBottle = calculateParcelWeight(1, 0);
    const fourBottles = calculateParcelWeight(4, 0);
    expect(fourBottles).toBeGreaterThan(oneBottle);
  });

  it("caps weight below the heavy-order box threshold", () => {
    // Large item count but few boxes -> capped at 4.5kg.
    const weight = calculateParcelWeight(50, 1);
    expect(weight).toBeLessThanOrEqual(4.5);
  });

  it("allows weight to exceed the cap once boxCount reaches the heavy-order threshold", () => {
    const weight = calculateParcelWeight(50, 4);
    expect(weight).toBeGreaterThan(4.5);
  });
});
