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

  // Regression test for a bug found while first writing this suite:
  // updateProductSchema used to be createProductSchema.partial(), and
  // zod's .partial() only makes a field optional to *provide* — fields
  // with .default(...) in the base schema still applied that default
  // when omitted, so a genuinely partial PUT (e.g. only toggling
  // isSoldOut) silently reset gender/isActive/isNew/inspiredBy/notes
  // back to their defaults instead of leaving them untouched. Fixed in
  // src/domain/validation/product.schema.ts by building
  // updateProductSchema from the same field validators MINUS their
  // defaults, rather than deriving it from the defaulted create schema.
  it("a true partial update leaves other fields untouched (does not reset them to defaults)", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedProductRepository.update.mockResolvedValue({} as any);
    const req = new NextRequest("http://localhost/api/products/prod-1", {
      method: "PUT",
      // Intent: only toggle isSoldOut. isActive/isNew/gender/etc. must
      // not be touched.
      body: JSON.stringify({ isSoldOut: true }),
    });
    await PUT(req, paramsFor("prod-1"));
    const [, updatePayload] = mockedProductRepository.update.mock.calls[0];
    expect(updatePayload).toEqual({ isSoldOut: true });
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
