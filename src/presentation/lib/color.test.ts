import { getLuminance as getLuminanceWcag } from "./color";
import { getLuminance as getLuminanceBt601 } from "./utils";

describe("getLuminance (color.ts — WCAG relative-luminance weights)", () => {
  it("returns 1 for white", () => {
    expect(getLuminanceWcag("#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns 0 for black", () => {
    expect(getLuminanceWcag("#000000")).toBeCloseTo(0, 5);
  });

  it("weights green highest, consistent with WCAG coefficients", () => {
    const r = getLuminanceWcag("#ff0000");
    const g = getLuminanceWcag("#00ff00");
    const b = getLuminanceWcag("#0000ff");
    expect(g).toBeGreaterThan(r);
    expect(r).toBeGreaterThan(b);
  });
});

// Documents an existing, known-issue divergence (see
// PROJECT_DOCUMENTATION.md §20: "Three divergent getLuminance()
// implementations") rather than silently masking it — this is a
// regression test, not an endorsement. Unifying the implementations is
// a separate refactor, out of scope for this test suite.
describe("getLuminance implementations diverge (known issue, not fixed here)", () => {
  it("utils.ts (BT.601) and color.ts (WCAG) disagree on a pure-red input", () => {
    const bt601 = getLuminanceBt601("#ff0000");
    const wcag = getLuminanceWcag("#ff0000");
    expect(bt601).not.toBeCloseTo(wcag, 3);
  });
});
