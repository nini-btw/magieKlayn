import uiReducer, {
  openCart,
  closeCart,
  toggleCart,
  openMobileMenu,
  closeMobileMenu,
  toggleMobileMenu,
  addToast,
  removeToast,
  clearToasts,
  selectCartOpen,
  selectMobileMenuOpen,
  selectToasts,
  type UIState,
} from "./ui.slice";

const initialState: UIState = { cartOpen: false, mobileMenuOpen: false, toasts: [] };

describe("ui reducer — cart drawer", () => {
  it("openCart sets cartOpen true", () => {
    expect(uiReducer(initialState, openCart()).cartOpen).toBe(true);
  });

  it("closeCart sets cartOpen false", () => {
    const open: UIState = { ...initialState, cartOpen: true };
    expect(uiReducer(open, closeCart()).cartOpen).toBe(false);
  });

  it("toggleCart flips the current state", () => {
    expect(uiReducer(initialState, toggleCart()).cartOpen).toBe(true);
    const open: UIState = { ...initialState, cartOpen: true };
    expect(uiReducer(open, toggleCart()).cartOpen).toBe(false);
  });
});

describe("ui reducer — mobile menu", () => {
  it("openMobileMenu / closeMobileMenu / toggleMobileMenu", () => {
    expect(uiReducer(initialState, openMobileMenu()).mobileMenuOpen).toBe(true);
    const open: UIState = { ...initialState, mobileMenuOpen: true };
    expect(uiReducer(open, closeMobileMenu()).mobileMenuOpen).toBe(false);
    expect(uiReducer(initialState, toggleMobileMenu()).mobileMenuOpen).toBe(true);
  });
});

describe("ui reducer — toasts", () => {
  it("addToast appends a toast with a generated id", () => {
    const state = uiReducer(initialState, addToast({ message: "Added to cart", type: "success" }));
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]).toMatchObject({ message: "Added to cart", type: "success" });
    expect(typeof state.toasts[0].id).toBe("string");
    expect(state.toasts[0].id.length).toBeGreaterThan(0);
  });

  it("addToast preserves existing toasts", () => {
    const withOne = uiReducer(initialState, addToast({ message: "first" }));
    const withTwo = uiReducer(withOne, addToast({ message: "second" }));
    expect(withTwo.toasts).toHaveLength(2);
  });

  it("removeToast removes only the matching id", () => {
    const withTwo = uiReducer(
      uiReducer(initialState, addToast({ message: "first" })),
      addToast({ message: "second" }),
    );
    const idToRemove = withTwo.toasts[0].id;
    const state = uiReducer(withTwo, removeToast(idToRemove));
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].message).toBe("second");
  });

  it("clearToasts empties the toast list", () => {
    const withOne = uiReducer(initialState, addToast({ message: "first" }));
    expect(uiReducer(withOne, clearToasts()).toasts).toEqual([]);
  });
});

describe("ui selectors", () => {
  const rootState = {
    ui: { cartOpen: true, mobileMenuOpen: false, toasts: [{ id: "1", message: "hi" }] } as UIState,
  };

  it("select cartOpen / mobileMenuOpen / toasts", () => {
    expect(selectCartOpen(rootState)).toBe(true);
    expect(selectMobileMenuOpen(rootState)).toBe(false);
    expect(selectToasts(rootState)).toEqual([{ id: "1", message: "hi" }]);
  });
});
