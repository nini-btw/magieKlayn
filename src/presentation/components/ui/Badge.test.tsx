import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("defaults to the 'default' variant class", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toHaveClass("bg-bg-soft");
  });

  it("applies the requested variant's class", () => {
    render(<Badge variant="soldOut">Sold out</Badge>);
    expect(screen.getByText("Sold out")).toHaveClass("bg-line");
  });

  it("merges a custom className alongside variant classes", () => {
    render(
      <Badge variant="new" className="custom-class">
        New
      </Badge>,
    );
    const el = screen.getByText("New");
    expect(el).toHaveClass("custom-class");
    expect(el).toHaveClass("border-ink");
  });
});
