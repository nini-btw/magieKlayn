/**
 * Mock data for development without database
 * @module infrastructure/db/mock-data
 */

import type { Product, CookiePiece, CookieBox } from "@/domain/entities/product";
import type { Order } from "@/domain/entities/order";
import type { VoteCandidate } from "@/domain/entities/vote";
import type { WeeklyDrop } from "@/domain/entities/drop";

/**
 * Mock cookies
 */
export const mockCookies: CookiePiece[] = [
  {
    id: "cookie-1",
    name: "Mock Cookie One",
    slug: "mock-cookie-one",
    images: [],
    description: "Mock description for cookie one.",
    price: 150,
    isActive: true,
    type: "cookie",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
    flavour: "Mock Flavour One",
    allergens: ["gluten", "dairy", "eggs"],
    isNew: false,
    isSoldOut: false,
  },
  {
    id: "cookie-2",
    name: "Mock Cookie Two",
    slug: "mock-cookie-two",
    images: [],
    description: "Mock description for cookie two.",
    price: 170,
    isActive: true,
    type: "cookie",
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-01-20"),
    flavour: "Mock Flavour Two",
    allergens: ["gluten", "dairy", "eggs"],
    isNew: true,
    isSoldOut: false,
  },
  {
    id: "cookie-3",
    name: "Mock Cookie Three",
    slug: "mock-cookie-three",
    images: [],
    description: "Mock description for cookie three.",
    price: 180,
    isActive: true,
    type: "cookie",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
    flavour: "Mock Flavour Three",
    allergens: ["gluten", "dairy", "eggs", "nuts"],
    isNew: false,
    isSoldOut: false,
  },
  {
    id: "cookie-4",
    name: "Mock Cookie Four",
    slug: "mock-cookie-four",
    images: [],
    description: "Mock description for cookie four.",
    price: 170,
    isActive: true,
    type: "cookie",
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-02-10"),
    flavour: "Mock Flavour Four",
    allergens: ["gluten", "dairy", "eggs"],
    isNew: true,
    isSoldOut: false,
  },
  {
    id: "cookie-5",
    name: "Mock Cookie Five",
    slug: "mock-cookie-five",
    images: [],
    description: "Mock description for cookie five.",
    price: 160,
    isActive: true,
    type: "cookie",
    createdAt: new Date("2026-02-15"),
    updatedAt: new Date("2026-02-15"),
    flavour: "Mock Flavour Five",
    allergens: ["gluten", "dairy", "eggs", "peanuts"],
    isNew: false,
    isSoldOut: true,
  },
  {
    id: "cookie-6",
    name: "Mock Cookie Six",
    slug: "mock-cookie-six",
    images: [],
    description: "Mock description for cookie six.",
    price: 150,
    isActive: true,
    type: "cookie",
    createdAt: new Date("2026-02-20"),
    updatedAt: new Date("2026-02-20"),
    flavour: "Mock Flavour Six",
    allergens: ["gluten", "dairy", "eggs"],
    isNew: false,
    isSoldOut: false,
  },
  {
    id: "cookie-7",
    name: "Mock Cookie Seven",
    slug: "mock-cookie-seven",
    images: [],
    description: "Mock description for cookie seven.",
    price: 170,
    isActive: true,
    type: "cookie",
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-03-01"),
    flavour: "Mock Flavour Seven",
    allergens: ["gluten", "dairy", "eggs"],
    isNew: false,
    isSoldOut: false,
  },
  {
    id: "cookie-8",
    name: "Mock Cookie Eight",
    slug: "mock-cookie-eight",
    images: [],
    description: "Mock description for cookie eight.",
    price: 160,
    isActive: true,
    type: "cookie",
    createdAt: new Date("2026-03-05"),
    updatedAt: new Date("2026-03-05"),
    flavour: "Mock Flavour Eight",
    allergens: ["gluten", "dairy", "eggs"],
    isNew: true,
    isSoldOut: false,
  },
];

/**
 * Mock boxes
 */
export const mockBoxes: CookieBox[] = [
  {
    id: "box-1",
    name: "Mock Box One",
    slug: "mock-box-one",
    description: "Mock description for box one.",
    price: 850,
    isActive: true,
    type: "box",
    images: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    includedCookies: [
      { productId: "cookie-1", productName: "Mock Cookie One", quantity: 2 },
      { productId: "cookie-2", productName: "Mock Cookie Two", quantity: 2 },
      { productId: "cookie-3", productName: "Mock Cookie Three", quantity: 2 },
    ],
  },
  {
    id: "box-2",
    name: "Mock Box Two",
    slug: "mock-box-two",
    description: "Mock description for box two.",
    price: 900,
    isActive: true,
    type: "box",
    images: [],
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
    includedCookies: [
      { productId: "cookie-2", productName: "Mock Cookie Two", quantity: 3 },
      { productId: "cookie-1", productName: "Mock Cookie One", quantity: 2 },
      { productId: "cookie-5", productName: "Mock Cookie Five", quantity: 1 },
    ],
  },
  {
    id: "box-3",
    name: "Mock Box Three",
    slug: "mock-box-three",
    description: "Mock description for box three.",
    price: 1200,
    isActive: true,
    type: "box",
    images: [],
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
    includedCookies: [
      { productId: "cookie-1", productName: "Mock Cookie One", quantity: 3 },
      { productId: "cookie-3", productName: "Mock Cookie Three", quantity: 3 },
      { productId: "cookie-6", productName: "Mock Cookie Six", quantity: 3 },
    ],
  },
];

/**
 * All mock products
 */
export const mockProducts: Product[] = [...mockCookies, ...mockBoxes];

/**
 * Mock orders
 */
export const mockOrders: Order[] = [
  {
    id: "order-1",
    fullName: "Mock Customer One",
    phone: "+213 500 000 001",
    address: "Mock Address One, Oran",
    items: [
      {
        id: "item-1",
        orderId: "order-1",
        productId: "cookie-1",
        productType: "cookie",
        productName: "Mock Cookie One",
        productSlug: "mock-cookie-one",
        productImage: undefined,
        quantity: 3,
        priceSnapshot: 150,
      },
      {
        id: "item-2",
        orderId: "order-1",
        productId: "cookie-2",
        productType: "cookie",
        productName: "Mock Cookie Two",
        productSlug: "mock-cookie-two",
        productImage: undefined,
        quantity: 2,
        priceSnapshot: 170,
      },
    ],
    status: "confirmed",
    totalAmount: 790,
    deliveryZoneId: "e5e13717-7c19-4acc-9d1c-cbbf319672ad",
    createdAt: new Date("2026-04-08T10:30:00"),
    updatedAt: new Date("2026-04-08T10:30:00"),
  },
  {
    id: "order-2",
    fullName: "Mock Customer Two",
    phone: "+213 500 000 002",
    address: "Mock Address Two, Oran",
    items: [
      {
        id: "item-3",
        orderId: "order-2",
        productId: "box-1",
        productType: "box",
        productName: "Mock Box One",
        productSlug: "mock-box-one",
        productImage: undefined,
        quantity: 1,
        priceSnapshot: 850,
      },
    ],
    status: "pending",
    totalAmount: 850,
    deliveryZoneId: "e5e13717-7c19-4acc-9d1c-cbbf319672ad",
    createdAt: new Date("2026-04-08T14:15:00"),
    updatedAt: new Date("2026-04-08T14:15:00"),
  },
  {
    id: "order-3",
    fullName: "Mock Customer Three",
    phone: "+213 500 000 003",
    address: "Mock Address Three, Oran",
    cookingNote: "Mock cooking note.",
    items: [
      {
        id: "item-4",
        orderId: "order-3",
        productId: "cookie-3",
        productType: "cookie",
        productName: "Mock Cookie Three",
        productSlug: "mock-cookie-three",
        productImage: undefined,
        quantity: 4,
        priceSnapshot: 180,
      },
      {
        id: "item-5",
        orderId: "order-3",
        productId: "cookie-7",
        productType: "cookie",
        productName: "Mock Cookie Seven",
        productSlug: "mock-cookie-seven",
        productImage: undefined,
        quantity: 2,
        priceSnapshot: 170,
      },
    ],
    status: "preparing",
    totalAmount: 1060,
    deliveryZoneId: "e5e13717-7c19-4acc-9d1c-cbbf319672ad",
    createdAt: new Date("2026-04-07T16:45:00"),
    updatedAt: new Date("2026-04-07T16:45:00"),
  },
];

/**
 * Mock vote candidates
 */
export const mockVoteCandidates: VoteCandidate[] = [
  {
    id: "vote-1",
    cookieName: "Mock Candidate One",
    description: "Mock description for vote candidate one.",
    imageUrl: "",
    voteCount: 42,
    isActive: true,
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "vote-2",
    cookieName: "Mock Candidate Two",
    description: "Mock description for vote candidate two.",
    imageUrl: "",
    voteCount: 38,
    isActive: true,
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "vote-3",
    cookieName: "Mock Candidate Three",
    description: "Mock description for vote candidate three.",
    imageUrl: "",
    voteCount: 27,
    isActive: true,
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "vote-4",
    cookieName: "Mock Candidate Four",
    description: "Mock description for vote candidate four.",
    imageUrl: "",
    voteCount: 35,
    isActive: true,
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "vote-5",
    cookieName: "Mock Candidate Five",
    description: "Mock description for vote candidate five.",
    imageUrl: "",
    voteCount: 29,
    isActive: true,
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "vote-6",
    cookieName: "Mock Candidate Six",
    description: "Mock description for vote candidate six.",
    imageUrl: "",
    voteCount: 31,
    isActive: true,
    createdAt: new Date("2026-03-01"),
  },
];

/**
 * Mock weekly drop
 */
export const mockWeeklyDrop: WeeklyDrop = {
  id: "drop-1",
  productId: "cookie-8",
  product: mockCookies[7],
  scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  isActive: true,
  createdAt: new Date(),
};
