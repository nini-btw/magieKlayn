import { NextRequest } from "next/server";

jest.mock("@/infrastructure/db/order.adapter", () => ({
  orderRepository: {
    getAll: jest.fn(),
    getTopWilayas: jest.fn(),
    getTopProducts: jest.fn(),
  },
}));
jest.mock("@/infrastructure/auth/supabase-auth", () => ({
  getAdminSession: jest.fn(),
}));

import { GET } from "./route";
import { orderRepository } from "@/infrastructure/db/order.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

const mockedOrderRepository = orderRepository as jest.Mocked<typeof orderRepository>;
const mockedGetAdminSession = getAdminSession as jest.Mock;

function makeRequest(query = "") {
  return new NextRequest(`http://localhost/api/orders/stats${query}`);
}

beforeEach(() => {
  mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
});

describe("GET /api/orders/stats", () => {
  it("returns 401 when not an admin", async () => {
    mockedGetAdminSession.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns units-sold-per-product data for type=products", async () => {
    const stats = [
      { productId: "p1", productName: "Oud Royal", productSlug: "oud-royal", quantitySold: 12 },
      { productId: "p2", productName: "Rose Nacree", productSlug: "rose-nacree", quantitySold: 4 },
    ];
    mockedOrderRepository.getTopProducts.mockResolvedValue(stats);

    const res = await GET(makeRequest("?type=products"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(stats);
    expect(mockedOrderRepository.getTopProducts).toHaveBeenCalledWith(undefined);
  });

  it("passes a numeric limit through for type=products when given", async () => {
    mockedOrderRepository.getTopProducts.mockResolvedValue([]);
    await GET(makeRequest("?type=products&limit=5"));
    expect(mockedOrderRepository.getTopProducts).toHaveBeenCalledWith(5);
  });

  it("falls back to general stats when no type is given", async () => {
    mockedOrderRepository.getAll.mockResolvedValue([
      { status: "pending", totalAmount: 1000 } as any,
      { status: "delivered", totalAmount: 2000 } as any,
    ]);
    const res = await GET(makeRequest());
    const json = await res.json();
    expect(json.data).toEqual({
      totalOrders: 2,
      totalRevenue: 3000,
      pendingOrders: 1,
    });
  });
});
