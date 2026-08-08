import { formatPrice, formatDate, slugify, truncate, getLuminance } from "./utils";

describe("formatPrice", () => {
  it("formats a price with the DA suffix, no decimals", () => {
    const result = formatPrice(1000);
    expect(result).toContain("DA");
    expect(result).not.toMatch(/[.,]\d{2}\s*DA/); // no forced 2-decimal fraction
  });

  it("formats 0 without throwing", () => {
    expect(() => formatPrice(0)).not.toThrow();
  });
});

describe("formatDate", () => {
  it("formats a Date instance without throwing and returns a non-empty string", () => {
    const result = formatDate(new Date("2026-08-08T00:00:00Z"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts an ISO date string as well as a Date instance", () => {
    const fromString = formatDate("2026-08-08T00:00:00Z");
    const fromDate = formatDate(new Date("2026-08-08T00:00:00Z"));
    expect(fromString).toBe(fromDate);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Rose Land")).toBe("rose-land");
  });

  it("strips punctuation", () => {
    expect(slugify("Rose Land!")).toBe("rose-land");
  });

  it("collapses repeated separators into a single hyphen", () => {
    expect(slugify("Rose   Land__Mist")).toBe("rose-land-mist");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  -Rose Land-  ")).toBe("rose-land");
  });
});

describe("truncate", () => {
  it("returns text unchanged when within maxLength", () => {
    expect(truncate("short", 10)).toBe("short");
  });

  it("truncates and appends an ellipsis when over maxLength", () => {
    expect(truncate("a very long description", 10)).toBe("a very lon...");
  });

  it("handles the boundary exactly at maxLength (no truncation)", () => {
    expect(truncate("exactly10!", 10)).toBe("exactly10!");
  });
});

describe("getLuminance (utils.ts — BT.601 weights)", () => {
  it("returns 1 for white", () => {
    expect(getLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns 0 for black", () => {
    expect(getLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("weights green highest, consistent with BT.601 coefficients", () => {
    const r = getLuminance("#ff0000");
    const g = getLuminance("#00ff00");
    const b = getLuminance("#0000ff");
    expect(g).toBeGreaterThan(r);
    expect(r).toBeGreaterThan(b);
  });
});
