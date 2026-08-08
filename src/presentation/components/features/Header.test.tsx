import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/presentation/test-utils";
import { Header } from "./Header";

describe("Header", () => {
  it("does not show a cart count badge when the cart is empty", () => {
    renderWithProviders(<Header />);
    expect(screen.queryByTestId("cart-count")).not.toBeInTheDocument();
  });

  it("shows the total item count when the cart has items", () => {
    renderWithProviders(<Header />, {
      preloadedState: {
        cart: {
          items: [
            { product: { id: "a", price: 1000 } as any, quantity: 3 },
          ],
          giftNote: null,
          boxColors: [],
        },
        ui: { cartOpen: false, mobileMenuOpen: false, toasts: [] },
      },
    });
    expect(screen.getByTestId("cart-count")).toHaveTextContent("3");
  });

  it("dispatches toggleCart when the cart button is clicked", async () => {
    const { store } = renderWithProviders(<Header />);
    expect(store.getState().ui.cartOpen).toBe(false);
    await userEvent.click(screen.getByTestId("cart-button"));
    expect(store.getState().ui.cartOpen).toBe(true);
  });
});
