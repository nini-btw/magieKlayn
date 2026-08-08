/**
 * OpenAPI spec generation for the Magie Klayn API.
 * @module infrastructure/swagger/config
 *
 * Scans every `app/api/**\/route.ts` file for `@swagger` JSDoc blocks
 * (next-swagger-doc) and assembles them into a single OpenAPI 3.0
 * document. Served as JSON by app/api/openapi.json/route.ts and
 * rendered interactively at /api-docs (swagger-ui-react), which lets
 * you "Try it out" against the real running dev server — public routes
 * work immediately, admin-only routes work once you're logged in at
 * /admin/login in the same browser (the Supabase session cookie is
 * sent automatically by the browser's fetch, same-origin).
 */
import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Magie Klayn API",
        version: "1.0.0",
        description:
          "REST API for the Magie Klayn storefront and admin back-office. " +
          "Response envelope convention: { success, data?, error?, message?, pagination? }. " +
          "Admin-only routes require an authenticated Supabase admin session cookie " +
          "(log in at /admin/login first).",
      },
      servers: [{ url: "/", description: "Current environment" }],
      tags: [
        { name: "Products", description: "Public catalogue + admin product management" },
        { name: "Orders", description: "Checkout + admin order management" },
        { name: "Delivery", description: "Wilaya/commune/stop-desk lookups for checkout" },
        { name: "Upload", description: "Admin image uploads to Supabase Storage" },
      ],
      components: {
        securitySchemes: {
          adminSession: {
            type: "apiKey",
            in: "cookie",
            name: "sb-access-token",
            description:
              "Supabase session cookie, set by logging in at /admin/login. " +
              "Route handlers actually check the full Supabase session via " +
              "getAdminSession(), not just this cookie's presence — this scheme " +
              "documents the requirement, browser-based 'Try it out' calls send " +
              "the real cookies automatically.",
          },
        },
        schemas: {
          Product: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string" },
              notes: { type: "array", items: { type: "string" } },
              price: { type: "integer", description: "DA (Algerian Dinar), smallest unit" },
              gender: { type: "string", enum: ["male", "female", "unisex"], nullable: true },
              colorHex: { type: "string", example: "#D0223A" },
              sizeMl: { type: "integer" },
              images: { type: "array", items: { type: "string", format: "uri" } },
              isActive: { type: "boolean" },
              isNew: { type: "boolean" },
              isSoldOut: { type: "boolean" },
              inspiredBy: { type: "string", nullable: true, description: "Optional fragrance icon this mist draws from, e.g. Dior Lucky" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          OrderItem: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              orderId: { type: "string", format: "uuid" },
              productId: { type: "string", format: "uuid" },
              productName: { type: "string" },
              productSlug: { type: "string" },
              productImage: { type: "string", nullable: true },
              productColorHex: { type: "string", nullable: true },
              quantity: { type: "integer" },
              priceSnapshot: { type: "integer" },
            },
          },
          Order: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              fullName: { type: "string" },
              firstName: { type: "string", nullable: true },
              lastName: { type: "string", nullable: true },
              phone: { type: "string" },
              giftNote: { type: "string", nullable: true },
              status: {
                type: "string",
                enum: ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"],
              },
              totalAmount: { type: "integer" },
              packagingType: { type: "string", enum: ["standard", "luxury_coffret"] },
              coffretFee: { type: "integer", nullable: true },
              boxColors: {
                type: "array",
                items: { type: "string", enum: ["white", "black"] },
                nullable: true,
              },
              deliveryZoneId: { type: "string", format: "uuid" },
              deliveryType: { type: "string", enum: ["stop_desk", "home", "store_pickup"] },
              deliveryFee: { type: "integer", nullable: true },
              wilayaCode: { type: "string", nullable: true },
              wilayaName: { type: "string", nullable: true },
              communeName: { type: "string", nullable: true, description: "Customer's own commune" },
              stopdeskCenterId: { type: "integer", nullable: true, description: "Only set for deliveryType=stop_desk" },
              stopdeskCommuneName: { type: "string", nullable: true, description: "The picked center's own commune, only set for deliveryType=stop_desk" },
              yalidineTracking: { type: "string", nullable: true },
              orderDate: { type: "string", format: "date-time", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
            },
          },
          DeliveryZone: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              wilayaCode: { type: "string" },
              wilayaNameAscii: { type: "string" },
              wilayaName: { type: "string" },
              communeNameAscii: { type: "string" },
              communeName: { type: "string" },
              stopDeskFee: { type: "integer" },
              homeFee: { type: "integer" },
              hasStopDesk: { type: "boolean" },
              hasHomeDelivery: { type: "boolean" },
            },
          },
          StopdeskCenter: {
            type: "object",
            description: "Fetched live from Yalidine, never persisted locally.",
            properties: {
              centerId: { type: "integer" },
              name: { type: "string" },
              communeName: { type: "string" },
              address: { type: "string", nullable: true },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
            },
          },
        },
      },
    },
  });
}
