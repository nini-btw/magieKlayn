import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Textarea } from "./Input";

describe("Input", () => {
  it("associates the label with the input via htmlFor/id", () => {
    render(<Input label="Phone" />);
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
  });

  it("shows the error message and applies error styling instead of helperText", () => {
    render(<Input error="Required" helperText="e.g. 0550123456" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.queryByText("e.g. 0550123456")).not.toBeInTheDocument();
  });

  it("shows helperText when there is no error", () => {
    render(<Input helperText="e.g. 0550123456" />);
    expect(screen.getByText("e.g. 0550123456")).toBeInTheDocument();
  });

  it("accepts typed input", async () => {
    render(<Input label="Name" />);
    const input = screen.getByLabelText("Name");
    await userEvent.type(input, "Amine");
    expect(input).toHaveValue("Amine");
  });
});

describe("Textarea", () => {
  it("associates the label with the textarea via htmlFor/id", () => {
    render(<Textarea label="Gift note" />);
    expect(screen.getByLabelText("Gift note")).toBeInTheDocument();
  });

  it("shows the error message when provided", () => {
    render(<Textarea error="Too long" />);
    expect(screen.getByText("Too long")).toBeInTheDocument();
  });
});
