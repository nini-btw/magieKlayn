import { NextRequest } from "next/server";

jest.mock("@/infrastructure/db/product.adapter", () => ({
  productRepository: {
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock("@/infrastructure/auth/supabase-auth", () => ({
  getAdminSession: jest.fn(),
}));

import { GET, PUT, DELETE } from "./route";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

const mockedProductRepository = productRepository as jest.Mocked<typeof productRepository>;
const mockedGetAdminSession = getAdminSession as jest.Mock;

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/products/[id]", () => {
  it("returns the product when found", async () => {
    mockedProductRepository.getById.mockResolvedValue({ id: "prod-1" } as any);
    const res = await GET(new NextRequest("http://localhost/api/products/prod-1"), paramsFor("prod-1"));
    expect(res.status).toBe(200);
  });

  it("returns 404 when not found", async () => {
    mockedProductRepository.getById.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/products/missing"), paramsFor("missing"));
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/products/[id]", () => {
  it("returns 401 when not an admin", async () => {
    mockedGetAdminSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/products/prod-1", {
      method: "PUT",
      body: JSON.stringify({ price: 1200 }),
    });
    const res = await PUT(req, paramsFor("prod-1"));
    expect(res.status).toBe(401);
    expect(mockedProductRepository.update).not.toHaveBeenCalled();
  });

  it("updates the requested field for a valid partial body", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedProductRepository.update.mockResolvedValue({ id: "prod-1", price: 1200 } as any);
    const req = new NextRequest("http://localhost/api/products/prod-1", {
      method: "PUT",
      body: JSON.stringify({ price: 1200 }),
    });
    const res = await PUT(req, paramsFor("prod-1"));
    expect(res.status).toBe(200);
    const [, updatePayload] = mockedProductRepository.update.mock.calls[0];
    expect(updatePayload).toMatchObject({ price: 1200 });
  });

  // BUG (found while writing this test, not fixed here — flagged to the
  // user separately): src/domain/validation/product.schema.ts builds
  // updateProductSchema as createProductSchema.partial(). zod's .partial()
  // makes each field optional to *provide*, but fields with .default(...)
  // in the base schema (gender, isActive, isNew, isSoldOut, inspiredBy,
  // notes) still apply that default when omitted — so a genuinely partial
  // PUT (e.g. `{ isSoldOut: true }` from a hypothetical quick-toggle
  // button, or anyone using the documented `/api-docs` "Partial Product
  // fields to update" contract literally) silently resets every other
  // defaulted field back to its default instead of leaving it untouched.
  // No live caller triggers this today — ProductForm's handleSave always
  // submits the full form state — but it's a real trap for the next
  // caller that sends a true partial body.
  it("BUG: a true partial update resets other defaulted fields instead of leaving them untouched", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedProductRepository.update.mockResolvedValue({} as any);
    const req = new NextRequest("http://localhost/api/products/prod-1", {
      method: "PUT",
      // Intent: only toggle isSoldOut. isActive/isNew/gender/etc. are not
      // meant to be touched.
      body: JSON.stringify({ isSoldOut: true }),
    });
    await PUT(req, paramsFor("prod-1"));
    const [, updatePayload] = mockedProductRepository.update.mock.calls[0];
    // This assertion documents the CURRENT (buggy) behavior — it should
    // fail once product.schema.ts is fixed to not apply defaults under
    // .partial(), at which point this test should be updated to assert
    // updatePayload deep-equals just { isSoldOut: true }.
    expect(updatePayload).toEqual({
      isSoldOut: true,
      isActive: true,
      isNew: false,
      gender: null,
      inspiredBy: null,
      notes: [],
    });
  });

  it("rejects an invalid partial body via zod", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    const req = new NextRequest("http://localhost/api/products/prod-1", {
      method: "PUT",
      body: JSON.stringify({ price: -5 }),
    });
    const res = await PUT(req, paramsFor("prod-1"));
    expect(res.status).toBe(400);
    expect(mockedProductRepository.update).not.toHaveBeenCalled();
  });

  it("maps a duplicate-slug error to 409", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedProductRepository.update.mockRejectedValue({ code: "23505" });
    const req = new NextRequest("http://localhost/api/products/prod-1", {
      method: "PUT",
      body: JSON.stringify({ slug: "taken-slug" }),
    });
    const res = await PUT(req, paramsFor("prod-1"));
    expect(res.status).toBe(409);
  });
});

describe("DELETE /api/products/[id]", () => {
  it("returns 401 when not an admin", async () => {
    mockedGetAdminSession.mockResolvedValue(null);
    const res = await DELETE(new NextRequest("http://localhost/api/products/prod-1"), paramsFor("prod-1"));
    expect(res.status).toBe(401);
    expect(mockedProductRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes the product for an authenticated admin", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    const res = await DELETE(new NextRequest("http://localhost/api/products/prod-1"), paramsFor("prod-1"));
    expect(res.status).toBe(200);
    expect(mockedProductRepository.delete).toHaveBeenCalledWith("prod-1");
  });
});
