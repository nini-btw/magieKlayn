import cartReducer, {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setGiftNote,
  setBoxColors,
  hydrateCart,
  selectCartItems,
  selectCartSummary,
  selectTotalItemCount,
  selectCartTotal,
  selectMaxBoxCount,
  selectIsBoxEligible,
  type CartState,
} from "./cart.slice";
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

const initialState: CartState = { items: [], giftNote: null, boxColors: [] };

describe("cart reducer", () => {
  it("addItem appends a new line item", () => {
    const state = cartReducer(
      initialState,
      addItem({ product: makeProduct(), quantity: 2 }),
    );
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("removeItem removes the matching product", () => {
    const withItem: CartState = {
      ...initialState,
      items: [{ product: makeProduct({ id: "a" }), quantity: 1 }],
    };
    const state = cartReducer(withItem, removeItem("a"));
    expect(state.items).toHaveLength(0);
  });

  it("updateQuantity updates the target line item's quantity", () => {
    const withItem: CartState = {
      ...initialState,
      items: [{ product: makeProduct({ id: "a" }), quantity: 1 }],
    };
    const state = cartReducer(
      withItem,
      updateQuantity({ productId: "a", quantity: 9 }),
    );
    expect(state.items[0].quantity).toBe(9);
  });

  it("clearCart resets items, giftNote, and boxColors", () => {
    const dirty: CartState = {
      items: [{ product: makeProduct(), quantity: 1 }],
      giftNote: "hi",
      boxColors: ["white"],
    };
    const state = cartReducer(dirty, clearCart());
    expect(state).toEqual(initialState);
  });

  it("setGiftNote sets the note", () => {
    const state = cartReducer(initialState, setGiftNote("Happy birthday"));
    expect(state.giftNote).toBe("Happy birthday");
  });

  it("setBoxColors fully replaces the box selection", () => {
    const state = cartReducer(initialState, setBoxColors(["white", "black"]));
    expect(state.boxColors).toEqual(["white", "black"]);
  });

  it("hydrateCart replaces the whole cart state, defaulting boxColors when absent", () => {
    const state = cartReducer(
      initialState,
      hydrateCart({ items: [{ product: makeProduct(), quantity: 3 }], giftNote: "x", boxColors: undefined as any }),
    );
    expect(state.items).toHaveLength(1);
    expect(state.giftNote).toBe("x");
    expect(state.boxColors).toEqual([]);
  });

  describe("box-color trimming side effect (invariant: boxColors.length <= maxBoxCount)", () => {
    it("removeItem trims boxColors down to what the shrunk cart still supports", () => {
      // 8 bottles -> 2 boxes fit; choose both, then remove one line item
      // down to 4 bottles -> only 1 box should remain selected.
      const state8: CartState = {
        items: [{ product: makeProduct({ id: "a" }), quantity: 8 }],
        giftNote: null,
        boxColors: ["white", "black"],
      };
      const afterUpdate = cartReducer(
        state8,
        updateQuantity({ productId: "a", quantity: 4 }),
      );
      expect(afterUpdate.boxColors).toEqual(["white"]);
    });

    it("removeItem trims boxColors to empty when the cart no longer supports any box", () => {
      const state: CartState = {
        items: [{ product: makeProduct({ id: "a" }), quantity: 4 }],
        giftNote: null,
        boxColors: ["white"],
      };
      const afterRemove = cartReducer(state, removeItem("a"));
      expect(afterRemove.boxColors).toEqual([]);
    });

    it("addItem does not trim boxColors when the cart still supports the selection", () => {
      const state: CartState = {
        items: [{ product: makeProduct({ id: "a" }), quantity: 4 }],
        giftNote: null,
        boxColors: ["white"],
      };
      const afterAdd = cartReducer(
        state,
        addItem({ product: makeProduct({ id: "b" }), quantity: 4 }),
      );
      expect(afterAdd.boxColors).toEqual(["white"]);
    });
  });
});

describe("cart selectors", () => {
  const rootState = {
    cart: {
      items: [
        { product: makeProduct({ id: "a", price: 1000 }), quantity: 2 },
        { product: makeProduct({ id: "b", price: 500 }), quantity: 1 },
      ],
      giftNote: null,
      boxColors: [],
    } as CartState,
  };

  it("selectCartItems returns the items array", () => {
    expect(selectCartItems(rootState)).toBe(rootState.cart.items);
  });

  it("selectCartTotal / selectTotalItemCount / selectCartSummary derive correctly", () => {
    expect(selectCartTotal(rootState)).toBe(2500);
    expect(selectTotalItemCount(rootState)).toBe(3);
    expect(selectCartSummary(rootState)).toEqual({ itemCount: 3, totalAmount: 2500 });
  });

  it("selectMaxBoxCount / selectIsBoxEligible reflect total quantity", () => {
    // 3 bottles total -> below MAX_BOX_CAPACITY (4) -> 0 boxes, not eligible
    expect(selectMaxBoxCount(rootState)).toBe(0);
    expect(selectIsBoxEligible(rootState)).toBe(false);
  });
});
