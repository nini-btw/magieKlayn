"use client";

import * as React from "react";
import { Select } from "@/presentation/components/ui/Select";
import { formatPrice } from "@/presentation/lib/utils";
import { cn } from "@/presentation/lib/utils";
import type {
  DeliveryZone,
  DeliveryType,
  DeliverySelection,
  StopdeskCenter,
} from "@/domain/entities/delivery";
import {
  getDeliveryFee,
  isStorePickupAvailable,
  STORE_LOCATIONS,
} from "@/domain/entities/delivery";
import { StoreIcon, HomeIcon, MapPinIcon } from "lucide-react";

// Same normalization as src/infrastructure/yalidine/stopdesk-resolver.ts's
// server-side fallback matcher — diacritics/case/whitespace-insensitive,
// since Yalidine's own commune_name spellings (e.g. "Aïn El Turck") can
// diverge from ours (e.g. "Ain El Turk").
function normalizeCommuneName(name: string): string {
  // Combining diacritical marks are code points 0x0300-0x036f; strip them
  // via numeric comparison rather than a \uXXXX regex literal, which is
  // error-prone to keep as literal escape text across editor tooling.
  const stripped = Array.from(name.trim().toLowerCase().normalize("NFD"))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join("");
  return stripped.replace(/[\s-]+/g, " ");
}

interface WilayaCommuneSelectProps {
  onChange: (selection: DeliverySelection | null) => void;
  error?: string;
  t: (key: string) => string;
}

export function WilayaCommuneSelect({
  onChange,
  error,
  t,
}: WilayaCommuneSelectProps) {
  const [wilayas, setWilayas] = React.useState<DeliveryZone[]>([]);
  const [communes, setCommunes] = React.useState<DeliveryZone[]>([]);
  const [selectedWilaya, setSelectedWilaya] = React.useState<string>("");
  const [selectedCommune, setSelectedCommune] = React.useState<string>("");
  const [selectedType, setSelectedType] = React.useState<DeliveryType | null>(
    null,
  );
  const [loadingWilayas, setLoadingWilayas] = React.useState(true);
  const [loadingCommunes, setLoadingCommunes] = React.useState(false);

  // Stop-desk centers for the selected wilaya — fetched live from Yalidine,
  // independent of delivery_zones.hasStopDesk (see integration state v6 §3).
  const [centers, setCenters] = React.useState<StopdeskCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = React.useState(false);
  const [selectedCenterId, setSelectedCenterId] = React.useState<string>("");

  // Fetch wilayas on mount
  React.useEffect(() => {
    async function fetchWilayas() {
      try {
        const response = await fetch("/api/delivery/wilayas");
        const result = await response.json();
        if (result.success) {
          setWilayas(result.data);
          if (result.data.length === 0) {
            console.warn(
              "[WilayaCommuneSelect] No wilayas found in database. Run: npx ts-node scripts/seed-delivery-zones.ts",
            );
          }
        } else {
          console.error("[WilayaCommuneSelect] API error:", result.error);
        }
      } catch (error) {
        console.error("[WilayaCommuneSelect] Failed to fetch wilayas:", error);
      } finally {
        setLoadingWilayas(false);
      }
    }
    fetchWilayas();
  }, []);

  // Fetch communes when wilaya changes
  React.useEffect(() => {
    if (!selectedWilaya) {
      setCommunes([]);
      setSelectedCommune("");
      setSelectedType(null);
      return;
    }

    async function fetchCommunes() {
      setLoadingCommunes(true);
      try {
        const response = await fetch(
          `/api/delivery/communes/${selectedWilaya}`,
        );
        const result = await response.json();
        if (result.success) {
          setCommunes(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch communes:", error);
      } finally {
        setLoadingCommunes(false);
      }
    }
    fetchCommunes();
  }, [selectedWilaya]);

  // Fetch real stop-desk centers when wilaya changes — independent of
  // which commune is picked, since centers only exist in a handful of
  // communes per wilaya (e.g. wilaya 2: Boukadir, Chlef, Ténès only).
  React.useEffect(() => {
    if (!selectedWilaya) {
      setCenters([]);
      setSelectedCenterId("");
      return;
    }

    async function fetchCenters() {
      setLoadingCenters(true);
      try {
        const response = await fetch(
          `/api/delivery/stopdesk-centers/${selectedWilaya}`,
        );
        const result = await response.json();
        if (result.success) {
          setCenters(result.data);
        } else {
          setCenters([]);
        }
      } catch (error) {
        console.error("Failed to fetch stop-desk centers:", error);
        setCenters([]);
      } finally {
        setLoadingCenters(false);
      }
    }
    fetchCenters();
  }, [selectedWilaya]);

  // Auto-select Stop Desk as the default delivery type once it's offerable
  // for the selected commune (same condition as showing the button —
  // stopDeskOfferable below), sparing the customer a click. Guarded on
  // `selectedType === null` so it never overrides a type the customer
  // already picked themselves, and re-fires correctly if centers are
  // still loading when the commune is first chosen (centers.length goes
  // 0 -> N once the fetch resolves, re-running this effect).
  React.useEffect(() => {
    if (!selectedCommune) return;
    if (selectedType !== null) return;
    if (centers.length === 0) return;
    setSelectedType("stop_desk");
    onChange(null); // matches handleTypeSelect("stop_desk") — waits for a center
  }, [selectedCommune, centers.length, selectedType]);

  // Once Stop Desk is the active type (whether picked manually or by the
  // effect above), auto-pick a center so the whole selection is complete
  // with zero clicks — the customer can still change it via the dropdown,
  // which calls handleCenterSelect normally. Default is the wilaya-level
  // "main" center: the one whose commune matches the wilaya's own name
  // (e.g. wilaya "Chlef" -> a center located in commune "Chlef"), since
  // that's typically the central/main Yalidine center for the wilaya.
  // Falls back to the first center in the list when no center's commune
  // matches the wilaya name.
  React.useEffect(() => {
    if (selectedType !== "stop_desk") return;
    if (selectedCenterId) return;
    if (centers.length === 0) return;

    const wilayaData = wilayas.find((w) => w.wilayaCode === selectedWilaya);
    const normalizedWilayaName = wilayaData
      ? normalizeCommuneName(wilayaData.wilayaNameAscii)
      : "";
    const matchingCenter = centers.find(
      (c) => normalizeCommuneName(c.communeName) === normalizedWilayaName,
    );
    const target = matchingCenter ?? centers[0];

    handleCenterSelect(String(target.centerId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, centers, selectedCenterId, selectedWilaya, wilayas]);

  // Reset commune and type when wilaya changes
  const handleWilayaChange = (value: string) => {
    setSelectedWilaya(value);
    setSelectedCommune("");
    setSelectedType(null);
    setSelectedCenterId("");
    onChange(null);
  };

  // Reset type when commune changes
  const handleCommuneChange = (value: string) => {
    setSelectedCommune(value);
    setSelectedType(null);
    setSelectedCenterId("");
    onChange(null);
  };

  // Update parent when type is selected (non-stop-desk paths finalize
  // immediately; stop-desk waits for a center pick, see handleCenterSelect)
  const handleTypeSelect = (type: DeliveryType) => {
    const selectedZone = communes.find((c) => c.id === selectedCommune);
    if (!selectedZone) return;

    const selectedWilayaData = wilayas.find(
      (w) => w.wilayaCode === selectedWilaya,
    );

    setSelectedType(type);
    setSelectedCenterId("");

    if (type === "stop_desk") {
      // Wait for center selection before calling onChange — a
      // DeliverySelection for stop_desk isn't complete without one.
      onChange(null);
      return;
    }

    const fee = getDeliveryFee(selectedZone, type);
    onChange({
      zoneId: selectedZone.id,
      type,
      fee,
      wilayaCode: selectedZone.wilayaCode,
      wilayaName:
        selectedWilayaData?.wilayaNameAscii || selectedZone.wilayaNameAscii,
      communeName: selectedZone.communeNameAscii,
    });
  };

  // Fires once the customer picks an actual center for stop-desk —
  // this is what makes the DeliverySelection complete for stop_desk.
  const handleCenterSelect = (centerIdValue: string) => {
    setSelectedCenterId(centerIdValue);

    const selectedZone = communes.find((c) => c.id === selectedCommune);
    const center = centers.find((c) => String(c.centerId) === centerIdValue);
    const selectedWilayaData = wilayas.find(
      (w) => w.wilayaCode === selectedWilaya,
    );
    if (!selectedZone || !center) return;

    const fee = getDeliveryFee(selectedZone, "stop_desk");
    onChange({
      zoneId: selectedZone.id,
      type: "stop_desk",
      fee,
      wilayaCode: selectedZone.wilayaCode,
      wilayaName:
        selectedWilayaData?.wilayaNameAscii || selectedZone.wilayaNameAscii,
      communeName: selectedZone.communeNameAscii,
      stopdeskCenterId: center.centerId,
      stopdeskCommuneName: center.communeName,
    });
  };

  // Prepare options for Select components
  const wilayaOptions = wilayas.map((w) => ({
    value: w.wilayaCode,
    label: `${w.wilayaCode} - ${w.wilayaNameAscii}`,
  }));

  const communeOptions = communes.map((c) => ({
    value: c.id,
    label: c.communeNameAscii,
  }));

  const centerOptions = centers.map((c) => ({
    value: String(c.centerId),
    label: `${c.name} — ${c.communeName}`,
  }));

  // Get selected zone for displaying fees
  const selectedZone = communes.find((c) => c.id === selectedCommune);

  // Show message if no wilayas available
  if (!loadingWilayas && wilayas.length === 0) {
    return (
      <div className="p-4 bg-[var(--color-bg-soft)] border border-[var(--color-border)] rounded-[var(--radius-card)]">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t("checkout.noWilayas") ||
            "Delivery zones not available. Please contact support."}
        </p>
      </div>
    );
  }

  const storePickupAvailable = selectedZone
    ? isStorePickupAvailable(selectedZone.wilayaCode)
    : false;

  // Stop-desk offered if this wilaya has any real centers at all — not
  // based on the per-commune hasStopDesk flag, which reflects fee-zone
  // coverage rather than actual center presence (see v6 §3).
  const stopDeskOfferable = centers.length > 0;

  return (
    <div className="space-y-4">
      {/* Wilaya Select */}
      <Select
        value={selectedWilaya}
        onChange={handleWilayaChange}
        options={wilayaOptions}
        label={t("checkout.wilaya") || "Wilaya"}
        placeholder={
          loadingWilayas
            ? t("common.loading") || "Loading..."
            : wilayas.length === 0
              ? t("checkout.noWilayas") || "No wilayas available"
              : t("checkout.selectWilaya") || "Select wilaya"
        }
        className={cn(error && "border-red-500")}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Commune Select */}
      {selectedWilaya && (
        <div
          className={
            loadingCommunes || communes.length === 0
              ? "opacity-50 pointer-events-none"
              : ""
          }
        >
          <Select
            value={selectedCommune}
            onChange={handleCommuneChange}
            options={communeOptions}
            label={t("checkout.commune") || "Commune"}
            placeholder={
              loadingCommunes
                ? t("common.loading") || "Loading..."
                : t("checkout.selectCommune") || "Select commune"
            }
          />
        </div>
      )}
      {/* Delivery Type Selection */}
      {selectedZone && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            {t("checkout.deliveryType") || "Delivery Type"}
          </label>
          <div className="flex gap-3">
            {/* Stop Desk Option */}
            {stopDeskOfferable && (
              <button
                type="button"
                onClick={() => handleTypeSelect("stop_desk")}
                className={cn(
                  "relative flex-1 flex flex-col items-center p-4 rounded-[var(--radius-card)] border-2 transition-all duration-[var(--duration-base)] ease-[var(--ease-luxury)] cursor-pointer",
                  selectedType === "stop_desk"
                    ? "border-[var(--color-text)] bg-[var(--color-bg-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-white)] hover:border-[var(--color-text)]/50",
                )}
              >
                <StoreIcon
                  className={cn(
                    "w-8 h-8 mb-2",
                    selectedType === "stop_desk"
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)]",
                  )}
                />
                <span
                  className={cn(
                    "font-medium text-sm",
                    selectedType === "stop_desk"
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)]",
                  )}
                >
                  {t("checkout.stopDesk") || "Stop Desk"}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {formatPrice(selectedZone.stopDeskFee)}
                </span>
                {selectedType === "stop_desk" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-text)] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-[var(--color-white)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            )}

            {/* Home Delivery Option */}
            {selectedZone.hasHomeDelivery && (
              <button
                type="button"
                onClick={() => handleTypeSelect("home")}
                className={cn(
                  "relative flex-1 flex flex-col items-center p-4 rounded-[var(--radius-card)] border-2 transition-all duration-[var(--duration-base)] ease-[var(--ease-luxury)] cursor-pointer",
                  selectedType === "home"
                    ? "border-[var(--color-text)] bg-[var(--color-bg-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-white)] hover:border-[var(--color-text)]/50",
                )}
              >
                <HomeIcon
                  className={cn(
                    "w-8 h-8 mb-2",
                    selectedType === "home"
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)]",
                  )}
                />
                <span
                  className={cn(
                    "font-medium text-sm",
                    selectedType === "home"
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)]",
                  )}
                >
                  {t("checkout.homeDelivery") || "Home Delivery"}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {formatPrice(selectedZone.homeFee)}
                </span>
                {selectedType === "home" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-text)] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-[var(--color-white)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            )}

            {/* Store Pickup Option — wilaya 16/31 only, free, bypasses Yalidine */}
            {storePickupAvailable && (
              <button
                type="button"
                onClick={() => handleTypeSelect("store_pickup")}
                className={cn(
                  "relative flex-1 flex flex-col items-center p-4 rounded-[var(--radius-card)] border-2 transition-all duration-[var(--duration-base)] ease-[var(--ease-luxury)] cursor-pointer",
                  selectedType === "store_pickup"
                    ? "border-[var(--color-text)] bg-[var(--color-bg-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-white)] hover:border-[var(--color-text)]/50",
                )}
              >
                <MapPinIcon
                  className={cn(
                    "w-8 h-8 mb-2",
                    selectedType === "store_pickup"
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)]",
                  )}
                />
                <span
                  className={cn(
                    "font-medium text-sm",
                    selectedType === "store_pickup"
                      ? "text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)]",
                  )}
                >
                  {t("checkout.storePickup") || "Store Pickup"}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {t("common.free") || "Free"}
                </span>
                {selectedType === "store_pickup" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-text)] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-[var(--color-white)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Center picker — shown once Stop Desk is selected, required
              to complete a valid stop-desk DeliverySelection */}
          {selectedType === "stop_desk" && (
            <div
              className={cn(
                "pt-1",
                loadingCenters && "opacity-50 pointer-events-none",
              )}
            >
              <Select
                value={selectedCenterId}
                onChange={handleCenterSelect}
                options={centerOptions}
                label={t("checkout.stopDeskCenter") || "Pickup point"}
                placeholder={
                  loadingCenters
                    ? t("common.loading") || "Loading..."
                    : t("checkout.selectCenter") || "Select a pickup point"
                }
              />
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {t("checkout.stopDeskHint") ||
                  "Pickup points are only available in certain towns within this wilaya."}
              </p>
            </div>
          )}

          {/* Store address, shown once store_pickup is selected */}
          {selectedType === "store_pickup" &&
            STORE_LOCATIONS[selectedZone.wilayaCode] &&
            (() => {
              const location = STORE_LOCATIONS[selectedZone.wilayaCode];
              return (
                <div className="text-xs text-[var(--color-text-secondary)] mt-1 space-y-0.5">
                  <p>
                    <span className="font-medium text-[var(--color-text)]">
                      {t("checkout.storePickupAddress") || "Pickup address"}:
                    </span>{" "}
                    {location.name}, {location.addressLine}
                  </p>
                  <p>
                    <a
                      href={`tel:${location.phoneHref}`}
                      className="underline hover:text-[var(--color-text)]"
                    >
                      {location.phoneDisplay}
                    </a>
                    {" · "}
                    <a
                      href={location.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--color-text)]"
                    >
                      {t("checkout.getDirections") || "Get directions"}
                    </a>
                  </p>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
}
