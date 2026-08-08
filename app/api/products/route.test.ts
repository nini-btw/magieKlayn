import { NextRequest } from "next/server";

jest.mock("@/infrastructure/db/product.adapter", () => ({
  productRepository: {
    getAllActivePaginated: jest.fn(),
    getActiveCount: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock("@/infrastructure/auth/supabase-auth", () => ({
  getAdminSession: jest.fn(),
}));

import { GET, POST } from "./route";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

const mockedProductRepository = productRepository as jest.Mocked<typeof productRepository>;
const mockedGetAdminSession = getAdminSession as jest.Mock;

function validProductBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Rose Land",
    slug: "rose-land",
    description: "A juicy floral mist.",
    price: 1100,
    colorHex: "#f5027e",
    sizeMl: 100,
    images: ["https://example.com/a.jpg"],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/products", () => {
  it("returns paginated active products with default page/limit", async () => {
    mockedProductRepository.getAllActivePaginated.mockResolvedValue([]);
    mockedProductRepository.getActiveCount.mockResolvedValue(0);
    const req = new NextRequest("http://localhost/api/products");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockedProductRepository.getAllActivePaginated).toHaveBeenCalledWith(20, 0);
  });

  it("clamps a page below 1 up to 1", async () => {
    mockedProductRepository.getAllActivePaginated.mockResolvedValue([]);
    mockedProductRepository.getActiveCount.mockResolvedValue(0);
    const req = new NextRequest("http://localhost/api/products?page=-5");
    await GET(req);
    const [, offset] = mockedProductRepository.getAllActivePaginated.mock.calls[0];
    expect(offset).toBe(0); // (clamped page 1 - 1) * limit
  });

  it("clamps a limit above 100 down to 100", async () => {
    mockedProductRepository.getAllActivePaginated.mockResolvedValue([]);
    mockedProductRepository.getActiveCount.mockResolvedValue(0);
    const req = new NextRequest("http://localhost/api/products?limit=500");
    await GET(req);
    const [limit] = mockedProductRepository.getAllActivePaginated.mock.calls[0];
    expect(limit).toBe(100);
  });

  it("computes the correct offset for page 3", async () => {
    mockedProductRepository.getAllActivePaginated.mockResolvedValue([]);
    mockedProductRepository.getActiveCount.mockResolvedValue(0);
    const req = new NextRequest("http://localhost/api/products?page=3&limit=20");
    await GET(req);
    const [limit, offset] = mockedProductRepository.getAllActivePaginated.mock.calls[0];
    expect(limit).toBe(20);
    expect(offset).toBe(40);
  });

  it("computes totalPages from totalCount and limit", async () => {
    mockedProductRepository.getAllActivePaginated.mockResolvedValue([]);
    mockedProductRepository.getActiveCount.mockResolvedValue(45);
    const req = new NextRequest("http://localhost/api/products?limit=20");
    const res = await GET(req);
    const json = await res.json();
    expect(json.pagination.totalPages).toBe(3);
  });
});

describe("POST /api/products", () => {
  it("returns 401 when not an admin", async () => {
    mockedGetAdminSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify(validProductBody()),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(mockedProductRepository.create).not.toHaveBeenCalled();
  });

  it("creates a product for an authenticated admin with a valid body", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedProductRepository.create.mockResolvedValue({ id: "prod-1" } as any);
    const req = new NextRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify(validProductBody()),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("rejects an invalid body via zod (bad colorHex)", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    const req = new NextRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify(validProductBody({ colorHex: "not-a-color" })),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockedProductRepository.create).not.toHaveBeenCalled();
  });

  it("maps a Postgres unique-constraint error to 409", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedProductRepository.create.mockRejectedValue({ code: "23505", message: "duplicate" });
    const req = new NextRequest("http://localhost/api/products", {
      method: "POST",
      body: JSON.stringify(validProductBody()),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
