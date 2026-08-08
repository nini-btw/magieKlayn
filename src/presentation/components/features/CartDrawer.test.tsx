import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/presentation/test-utils";
import { CartDrawer } from "./CartDrawer";
import type { CartState } from "@/presentation/store/cart/cart.slice";
import type { UIState } from "@/presentation/store/ui/ui.slice";
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

function preloadedState(cart: Partial<CartState>, ui: Partial<UIState> = { cartOpen: true }) {
  return {
    cart: { items: [], giftNote: null, boxColors: [], ...cart },
    ui: { cartOpen: false, mobileMenuOpen: false, toasts: [], ...ui },
  };
}

describe("CartDrawer", () => {
  it("renders nothing when the cart is closed", () => {
    const { container } = renderWithProviders(<CartDrawer />, {
      preloadedState: preloadedState({}, { cartOpen: false }),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the empty-cart message when there are no items", () => {
    renderWithProviders(<CartDrawer />, { preloadedState: preloadedState({ items: [] }) });
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("lists cart items and the running total", () => {
    renderWithProviders(<CartDrawer />, {
      preloadedState: preloadedState({
        items: [
          { product: makeProduct({ id: "a", price: 1000 }), quantity: 2 },
          { product: makeProduct({ id: "b", name: "Ambre Nuit", price: 500 }), quantity: 1 },
        ],
      }),
    });
    expect(screen.getByText("Rose Land")).toBeInTheDocument();
    expect(screen.getByText("Ambre Nuit")).toBeInTheDocument();
    expect(screen.getByText(/2[.,\s]?500/)).toBeInTheDocument(); // total: 2500
  });

  it("dispatches removeItem when the trash icon is clicked", async () => {
    const { store } = renderWithProviders(<CartDrawer />, {
      preloadedState: preloadedState({
        items: [{ product: makeProduct({ id: "a" }), quantity: 1 }],
      }),
    });
    await userEvent.click(screen.getByLabelText("Remove item"));
    expect(store.getState().cart.items).toHaveLength(0);
  });

  it("dispatches updateQuantity when the stepper is used", async () => {
    const { store } = renderWithProviders(<CartDrawer />, {
      preloadedState: preloadedState({
        items: [{ product: makeProduct({ id: "a" }), quantity: 1 }],
      }),
    });
    await userEvent.click(screen.getByLabelText("Increase quantity"));
    expect(store.getState().cart.items[0].quantity).toBe(2);
  });

  it("disables checkout when the cart is empty, enables it otherwise", () => {
    const { rerender } = renderWithProviders(<CartDrawer />, {
      preloadedState: preloadedState({ items: [] }),
    });
    expect(screen.getByTestId("checkout-button")).toBeDisabled();

    renderWithProviders(<CartDrawer />, {
      preloadedState: preloadedState({
        items: [{ product: makeProduct(), quantity: 1 }],
      }),
    });
    expect(screen.getAllByTestId("checkout-button").at(-1)).not.toBeDisabled();
  });

  it("dispatches closeCart when the close button is clicked", async () => {
    const { store } = renderWithProviders(<CartDrawer />, {
      preloadedState: preloadedState({ items: [] }),
    });
    await userEvent.click(screen.getByLabelText("Close cart"));
    expect(store.getState().ui.cartOpen).toBe(false);
  });
});
