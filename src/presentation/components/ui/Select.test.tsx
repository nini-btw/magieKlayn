import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select, type SelectOption } from "./Select";

const options: SelectOption[] = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];

describe("Select", () => {
  it("shows the placeholder when no value is selected", () => {
    render(<Select value="" onChange={jest.fn()} options={options} placeholder="Pick one" />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("shows the selected option's label", () => {
    render(<Select value="b" onChange={jest.fn()} options={options} />);
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  it("opens the option list on click", async () => {
    render(<Select value="" onChange={jest.fn()} options={options} />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("calls onChange with the clicked option's value and closes the list", async () => {
    const onChange = jest.fn();
    render(<Select value="" onChange={onChange} options={options} />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("option", { name: "Option A" }));
    expect(onChange).toHaveBeenCalledWith("a");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders an optional label", () => {
    render(<Select value="" onChange={jest.fn()} options={options} label="Wilaya" />);
    expect(screen.getByText("Wilaya")).toBeInTheDocument();
  });
});
