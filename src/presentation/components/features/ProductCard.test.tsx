import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/presentation/test-utils";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/domain/entities/product";

function makeProduct(overrides: Partial<Product> = {}): Product {
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
    // A non-empty images array picks the <Image> render branch — the
    // no-image fallback renders the product name a second time inside a
    // decorative "bottle" mockup, which isn't what these tests care about.
    images: ["https://example.com/rose-land.jpg"],
    isActive: true,
    isNew: false,
    isSoldOut: false,
    inspiredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("ProductCard", () => {
  it("renders the product name and formatted price", () => {
    renderWithProviders(<ProductCard product={makeProduct({ price: 1500 })} />);
    expect(screen.getByText("Rose Land")).toBeInTheDocument();
    expect(screen.getByText(/1[.,\s]?500/)).toBeInTheDocument();
  });

  it("shows the New badge for a new, in-stock product", () => {
    renderWithProviders(<ProductCard product={makeProduct({ isNew: true })} />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("shows Sold Out instead of New when both are true, and hides add-to-cart", () => {
    renderWithProviders(
      <ProductCard product={makeProduct({ isNew: true, isSoldOut: true })} />,
    );
    expect(screen.getByText("Sold Out")).toBeInTheDocument();
    expect(screen.queryByText("New")).not.toBeInTheDocument();
    expect(screen.queryByTestId("add-to-cart-button")).not.toBeInTheDocument();
  });

  it("dispatches addItem and a success toast when add-to-cart is clicked", async () => {
    const product = makeProduct();
    const { store } = renderWithProviders(<ProductCard product={product} />);

    await userEvent.click(screen.getByTestId("add-to-cart-button"));

    const state = store.getState();
    expect(state.cart.items).toHaveLength(1);
    expect(state.cart.items[0].product.id).toBe(product.id);
    expect(state.cart.items[0].quantity).toBe(1);
    expect(state.ui.toasts).toHaveLength(1);
    expect(state.ui.toasts[0].type).toBe("success");
  });

  it("links to the product's shop detail page", () => {
    renderWithProviders(<ProductCard product={makeProduct({ slug: "rose-land" })} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/shop/rose-land");
  });
});
