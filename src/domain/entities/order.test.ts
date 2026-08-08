import { splitOrGetFullName } from "./order";

describe("splitOrGetFullName", () => {
  it("returns structured names when present", () => {
    const result = splitOrGetFullName({
      fullName: "Amine Belkacem",
      firstName: "Amine",
      lastName: "Belkacem",
    });
    expect(result).toEqual({
      firstName: "Amine",
      lastName: "Belkacem",
      display: "Amine Belkacem",
    });
  });

  it("falls back to null firstName/lastName for pre-migration orders", () => {
    const result = splitOrGetFullName({
      fullName: "Legacy Customer",
      firstName: undefined,
      lastName: undefined,
    });
    expect(result).toEqual({
      firstName: null,
      lastName: null,
      display: "Legacy Customer",
    });
  });

  it("display always mirrors fullName regardless of structured fields", () => {
    const result = splitOrGetFullName({
      fullName: "Fallback Display Name",
      firstName: "Ignored",
      lastName: undefined,
    });
    expect(result.display).toBe("Fallback Display Name");
  });
});
