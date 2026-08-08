import {
  calculateCartTotal,
  findCartItem,
  hasProductInCart,
  getTotalItemCount,
  getMaxBoxCount,
  isBoxPackagingEligible,
  calculateCoffretFee,
  MAX_BOX_CAPACITY,
  BOX_FEE,
} from "./cart.rules";
import type { CartItem } from "../entities/order";
import type { SerializedProduct } from "../entities/product";

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

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return { product: makeProduct(), quantity: 1, ...overrides };
}

describe("calculateCartTotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it("sums price * quantity across items", () => {
    const items: CartItem[] = [
      makeItem({ product: makeProduct({ id: "a", price: 1000 }), quantity: 2 }),
      makeItem({ product: makeProduct({ id: "b", price: 500 }), quantity: 3 }),
    ];
    expect(calculateCartTotal(items)).toBe(1000 * 2 + 500 * 3);
  });
});

describe("findCartItem / hasProductInCart", () => {
  const items: CartItem[] = [makeItem({ product: makeProduct({ id: "x" }) })];

  it("finds an existing item by product id", () => {
    expect(findCartItem(items, "x")).toBe(items[0]);
  });

  it("returns undefined when not found", () => {
    expect(findCartItem(items, "missing")).toBeUndefined();
  });

  it("hasProductInCart mirrors findCartItem's presence check", () => {
    expect(hasProductInCart(items, "x")).toBe(true);
    expect(hasProductInCart(items, "missing")).toBe(false);
  });
});

describe("getTotalItemCount", () => {
  it("returns 0 for an empty cart", () => {
    expect(getTotalItemCount([])).toBe(0);
  });

  it("sums quantities, not distinct products", () => {
    const items: CartItem[] = [
      makeItem({ product: makeProduct({ id: "a" }), quantity: 3 }),
      makeItem({ product: makeProduct({ id: "b" }), quantity: 5 }),
    ];
    expect(getTotalItemCount(items)).toBe(8);
  });
});

describe("getMaxBoxCount / isBoxPackagingEligible (boundary behavior)", () => {
  it("0 bottles -> 0 boxes, not eligible", () => {
    expect(getMaxBoxCount([])).toBe(0);
    expect(isBoxPackagingEligible([])).toBe(false);
  });

  it(`${MAX_BOX_CAPACITY - 1} bottles -> 0 boxes (below capacity), not eligible`, () => {
    const items = [makeItem({ quantity: MAX_BOX_CAPACITY - 1 })];
    expect(getMaxBoxCount(items)).toBe(0);
    expect(isBoxPackagingEligible(items)).toBe(false);
  });

  it(`exactly ${MAX_BOX_CAPACITY} bottles -> 1 box, eligible`, () => {
    const items = [makeItem({ quantity: MAX_BOX_CAPACITY })];
    expect(getMaxBoxCount(items)).toBe(1);
    expect(isBoxPackagingEligible(items)).toBe(true);
  });

  it("7 bottles -> 1 box (3 ship unboxed), matches documented example", () => {
    const items = [makeItem({ quantity: 7 })];
    expect(getMaxBoxCount(items)).toBe(1);
  });

  it("8 bottles -> 2 boxes, matches documented example", () => {
    const items = [makeItem({ quantity: 8 })];
    expect(getMaxBoxCount(items)).toBe(2);
  });

  it("counts across multiple line items, not per-item", () => {
    const items = [
      makeItem({ product: makeProduct({ id: "a" }), quantity: 2 }),
      makeItem({ product: makeProduct({ id: "b" }), quantity: 2 }),
    ];
    expect(getMaxBoxCount(items)).toBe(1);
  });
});

describe("calculateCoffretFee", () => {
  it("0 boxes -> 0 fee", () => {
    expect(calculateCoffretFee(0)).toBe(0);
  });

  it("charges BOX_FEE per box, flat", () => {
    expect(calculateCoffretFee(1)).toBe(BOX_FEE);
    expect(calculateCoffretFee(3)).toBe(BOX_FEE * 3);
  });
});
