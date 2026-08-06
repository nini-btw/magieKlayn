"use client";

import * as React from "react";
import { Select } from "@/presentation/components/ui/Select";
import { formatPrice } from "@/presentation/lib/utils";
import { cn } from "@/presentation/lib/utils";
import type {
  DeliveryZone,
  DeliveryType,
  DeliverySelection,
} from "@/domain/entities/delivery";
import {
  getDeliveryFee,
  isStorePickupAvailable,
  STORE_PICKUP_ADDRESSES,
} from "@/domain/entities/delivery";
import { StoreIcon, HomeIcon, MapPinIcon } from "lucide-react";

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

  // Reset commune and type when wilaya changes
  const handleWilayaChange = (value: string) => {
    setSelectedWilaya(value);
    setSelectedCommune("");
    setSelectedType(null);
    onChange(null);
  };

  // Reset type when commune changes
  const handleCommuneChange = (value: string) => {
    setSelectedCommune(value);
    setSelectedType(null);
    onChange(null);
  };

  // Update parent when type is selected
  const handleTypeSelect = (type: DeliveryType) => {
    const selectedZone = communes.find((c) => c.id === selectedCommune);
    if (!selectedZone) return;

    const selectedWilayaData = wilayas.find(
      (w) => w.wilayaCode === selectedWilaya,
    );

    setSelectedType(type);
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

  // Prepare options for Select components
  const wilayaOptions = wilayas.map((w) => ({
    value: w.wilayaCode,
    label: `${w.wilayaCode} - ${w.wilayaNameAscii}`,
  }));

  const communeOptions = communes.map((c) => ({
    value: c.id,
    label: c.communeNameAscii,
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
            {selectedZone.hasStopDesk && (
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

          {/* Store address, shown once store_pickup is selected */}
          {selectedType === "store_pickup" && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {t("checkout.storePickupAddress") || "Pickup address"}:{" "}
              {STORE_PICKUP_ADDRESSES[selectedZone.wilayaCode]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
