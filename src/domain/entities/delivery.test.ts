import {
  isStorePickupAvailable,
  getDeliveryFee,
  STORE_PICKUP_WILAYAS,
  type DeliveryZone,
} from "./delivery";

describe("isStorePickupAvailable", () => {
  it("returns true for wilayas in STORE_PICKUP_WILAYAS", () => {
    for (const code of STORE_PICKUP_WILAYAS) {
      expect(isStorePickupAvailable(code)).toBe(true);
    }
  });

  it("returns false for a wilaya not in the list", () => {
    expect(isStorePickupAvailable("99")).toBe(false);
  });
});

describe("getDeliveryFee", () => {
  const zone: DeliveryZone = {
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

  it("store_pickup is always free, regardless of zone fees", () => {
    expect(getDeliveryFee(zone, "store_pickup")).toBe(0);
  });

  it("stop_desk uses the zone's stopDeskFee", () => {
    expect(getDeliveryFee(zone, "stop_desk")).toBe(400);
  });

  it("home uses the zone's homeFee", () => {
    expect(getDeliveryFee(zone, "home")).toBe(600);
  });
});
