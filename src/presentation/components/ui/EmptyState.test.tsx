import { render, screen } from "@testing-library/react";
import { PackageIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title and icon", () => {
    render(<EmptyState icon={PackageIcon} title="No products yet" />);
    expect(screen.getByText("No products yet")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(
      <EmptyState icon={PackageIcon} title="No products yet" description="Add your first one" />,
    );
    expect(screen.getByText("Add your first one")).toBeInTheDocument();
  });

  it("omits the description paragraph when not provided", () => {
    const { container } = render(<EmptyState icon={PackageIcon} title="No products yet" />);
    expect(container.querySelector(".admin-empty-desc")).not.toBeInTheDocument();
  });
});
