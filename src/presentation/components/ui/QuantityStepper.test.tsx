import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("displays the current value", () => {
    render(<QuantityStepper value={3} onChange={jest.fn()} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onChange with value+1 when the increment button is clicked", async () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={2} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Increase quantity"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("calls onChange with value-1 when the decrement button is clicked", async () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={2} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Decrease quantity"));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables the decrement button at min and does not call onChange", async () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={1} onChange={onChange} min={1} />);
    const decrementBtn = screen.getByLabelText("Decrease quantity");
    expect(decrementBtn).toBeDisabled();
    await userEvent.click(decrementBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the increment button at max and does not call onChange", async () => {
    const onChange = jest.fn();
    render(<QuantityStepper value={5} onChange={onChange} max={5} />);
    const incrementBtn = screen.getByLabelText("Increase quantity");
    expect(incrementBtn).toBeDisabled();
    await userEvent.click(incrementBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables both buttons when the disabled prop is set", () => {
    render(<QuantityStepper value={2} onChange={jest.fn()} disabled />);
    expect(screen.getByLabelText("Increase quantity")).toBeDisabled();
    expect(screen.getByLabelText("Decrease quantity")).toBeDisabled();
  });
});
