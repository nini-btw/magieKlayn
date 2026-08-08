import { NextRequest } from "next/server";

jest.mock("@/infrastructure/db/product.adapter", () => ({
  productRepository: { getById: jest.fn() },
}));
jest.mock("@/infrastructure/db/order.adapter", () => ({
  orderRepository: {
    create: jest.fn(),
    getAll: jest.fn(),
    getAllWithFilters: jest.fn(),
  },
}));
jest.mock("@/infrastructure/db/delivery.adapter", () => ({
  deliveryRepository: { getZone: jest.fn() },
}));
jest.mock("@/infrastructure/telegram/telegram-notification.service", () => ({
  telegramNotificationService: { notifyNewOrder: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("../../../scripts/create-parcel", () => ({
  createParcelForOrder: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/infrastructure/auth/supabase-auth", () => ({
  getAdminSession: jest.fn(),
}));

import { GET, POST } from "./route";
import { productRepository } from "@/infrastructure/db/product.adapter";
import { orderRepository } from "@/infrastructure/db/order.adapter";
import { deliveryRepository } from "@/infrastructure/db/delivery.adapter";
import { getAdminSession } from "@/infrastructure/auth/supabase-auth";

const mockedProductRepository = productRepository as jest.Mocked<typeof productRepository>;
const mockedOrderRepository = orderRepository as jest.Mocked<typeof orderRepository>;
const mockedDeliveryRepository = deliveryRepository as jest.Mocked<typeof deliveryRepository>;
const mockedGetAdminSession = getAdminSession as jest.Mock;

const DB_PRODUCT = {
  id: "prod-1",
  name: "Rose Land",
  slug: "rose-land",
  description: "A mist",
  notes: [],
  price: 1100, // the "real" DB price
  gender: null,
  colorHex: "#ff0000",
  sizeMl: 100,
  images: [],
  isActive: true,
  isNew: false,
  isSoldOut: false,
  inspiredBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const DELIVERY_ZONE = {
  id: "zone-1",
  wilayaCode: "16",
  wilayaNameAscii: "Alger",
  wilayaName: "Alger",
  communeNameAscii: "Alger Centre",
  communeName: "Alger Centre",
  stopDeskFee: 400,
  homeFee: 600,
  hasStopDesk: true,
  hasHomeDelivery: true,
};

let ipCounter = 0;
function uniqueIp() {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

function makeRequest(body: unknown, ip = uniqueIp()) {
  return new NextRequest("http://localhost/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    customer: { firstName: "Amine", lastName: "Belkacem", phone: "0550123456" },
    notes: {},
    items: [{ product: { id: "prod-1" }, quantity: 2 }],
    deliveryZoneId: "zone-1",
    deliveryType: "home",
    deliveryFee: 600,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedProductRepository.getById.mockResolvedValue(DB_PRODUCT as any);
  mockedDeliveryRepository.getZone.mockResolvedValue(DELIVERY_ZONE as any);
  mockedOrderRepository.create.mockImplementation(async (payload: any) => ({
    id: "order-1",
    ...payload,
    fullName: `${payload.customer.firstName} ${payload.customer.lastName}`,
    status: "pending",
    totalAmount: 0,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
});

describe("POST /api/orders", () => {
  it("creates an order on a valid payload (happy path)", async () => {
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockedOrderRepository.create).toHaveBeenCalledTimes(1);
  });

  it("SECURITY: overwrites a tampered client-submitted price with the DB price", async () => {
    const body = validBody({
      items: [{ product: { id: "prod-1", price: 1 }, quantity: 2 }],
    });
    await POST(makeRequest(body));

    const createCall = mockedOrderRepository.create.mock.calls[0][0] as any;
    expect(createCall.items[0].product.price).toBe(DB_PRODUCT.price);
    expect(createCall.items[0].product.price).not.toBe(1);
  });

  it("rejects an order referencing a nonexistent product", async () => {
    mockedProductRepository.getById.mockResolvedValueOnce(null);
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(400);
    expect(mockedOrderRepository.create).not.toHaveBeenCalled();
  });

  it("rejects an order referencing a sold-out product", async () => {
    mockedProductRepository.getById.mockResolvedValueOnce({ ...DB_PRODUCT, isSoldOut: true } as any);
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(400);
  });

  it("rejects a malformed payload via zod validation (bad phone)", async () => {
    const res = await POST(
      makeRequest(validBody({ customer: { firstName: "A", lastName: "B", phone: "bad" } })),
    );
    expect(res.status).toBe(400);
    expect(mockedOrderRepository.create).not.toHaveBeenCalled();
  });

  it("rejects an empty items array", async () => {
    const res = await POST(makeRequest(validBody({ items: [] })));
    expect(res.status).toBe(400);
  });

  it("forces deliveryFee to 0 for store_pickup regardless of the submitted value", async () => {
    await POST(
      makeRequest(
        validBody({ deliveryType: "store_pickup", deliveryFee: 999 }),
      ),
    );
    const createCall = mockedOrderRepository.create.mock.calls[0][0] as any;
    expect(createCall.deliveryFee).toBe(0);
  });

  it("returns 400 when deliveryZoneId doesn't resolve to a real zone", async () => {
    mockedDeliveryRepository.getZone.mockResolvedValueOnce(null);
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(400);
  });

  it("requires stopdeskCenterId/stopdeskCommuneName for stop_desk delivery", async () => {
    const res = await POST(makeRequest(validBody({ deliveryType: "stop_desk" })));
    expect(res.status).toBe(400);
  });

  it("accepts stop_desk delivery with a pickup point selected", async () => {
    const res = await POST(
      makeRequest(
        validBody({
          deliveryType: "stop_desk",
          stopdeskCenterId: 42,
          stopdeskCommuneName: "Chlef",
        }),
      ),
    );
    expect(res.status).toBe(201);
  });

  describe("luxury_coffret packaging", () => {
    it("recomputes coffretFee server-side rather than trusting the client value", async () => {
      await POST(
        makeRequest(
          validBody({
            items: [{ product: { id: "prod-1" }, quantity: 4 }],
            packagingType: "luxury_coffret",
            boxColors: ["white"],
            coffretFee: 999999,
          }),
        ),
      );
      const createCall = mockedOrderRepository.create.mock.calls[0][0] as any;
      expect(createCall.coffretFee).toBe(800); // BOX_FEE * 1 box
    });

    it("rejects boxColors exceeding what the cart supports", async () => {
      const res = await POST(
        makeRequest(
          validBody({
            items: [{ product: { id: "prod-1" }, quantity: 4 }], // only 1 box fits
            packagingType: "luxury_coffret",
            boxColors: ["white", "black"], // 2 boxes requested
          }),
        ),
      );
      expect(res.status).toBe(400);
    });

    it("rejects an empty boxColors selection", async () => {
      const res = await POST(
        makeRequest(
          validBody({
            items: [{ product: { id: "prod-1" }, quantity: 4 }],
            packagingType: "luxury_coffret",
            boxColors: [],
          }),
        ),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("rate limiting", () => {
    it("blocks the 11th checkout attempt from the same IP within the window", async () => {
      const ip = uniqueIp();
      for (let i = 0; i < 10; i++) {
        const res = await POST(makeRequest(validBody(), ip));
        expect(res.status).toBe(201);
      }
      const blocked = await POST(makeRequest(validBody(), ip));
      expect(blocked.status).toBe(429);
    });

    it("does not rate-limit a different IP", async () => {
      const ipA = uniqueIp();
      for (let i = 0; i < 10; i++) {
        await POST(makeRequest(validBody(), ipA));
      }
      const ipB = uniqueIp();
      const res = await POST(makeRequest(validBody(), ipB));
      expect(res.status).toBe(201);
    });
  });
});

describe("GET /api/orders", () => {
  it("returns 401 when not an admin", async () => {
    mockedGetAdminSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/orders");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns orders for an authenticated admin", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedOrderRepository.getAll.mockResolvedValue([{ id: "order-1" } as any]);
    const req = new NextRequest("http://localhost/api/orders");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
  });

  it("uses getAllWithFilters when a filter query param is present", async () => {
    mockedGetAdminSession.mockResolvedValue({ id: "admin-1", email: "a@b.com", role: "admin" });
    mockedOrderRepository.getAllWithFilters.mockResolvedValue([]);
    const req = new NextRequest("http://localhost/api/orders?status=pending");
    await GET(req);
    expect(mockedOrderRepository.getAllWithFilters).toHaveBeenCalled();
    expect(mockedOrderRepository.getAll).not.toHaveBeenCalled();
  });
});
