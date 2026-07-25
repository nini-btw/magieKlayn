"use client";

import * as React from "react";
import { Select } from "@/presentation/components/ui/Select";
import { formatPrice } from "@/presentation/lib/utils";
import { cn } from "@/presentation/lib/utils";
import type { DeliveryZone, DeliveryType, DeliverySelection } from "@/domain/entities/delivery";
import { getDeliveryFee } from "@/domain/entities/delivery";
import { StoreIcon, HomeIcon } from "lucide-react";

interface WilayaCommuneSelectProps {
  onChange: (selection: DeliverySelection | null) => void;
  error?: string;
  t: (key: string) => string;
}

export function WilayaCommuneSelect({ onChange, error, t }: WilayaCommuneSelectProps) {
  const [wilayas, setWilayas] = React.useState<DeliveryZone[]>([]);
  const [communes, setCommunes] = React.useState<DeliveryZone[]>([]);
  const [selectedWilaya, setSelectedWilaya] = React.useState<string>("");
  const [selectedCommune, setSelectedCommune] = React.useState<string>("");
  const [selectedType, setSelectedType] = React.useState<DeliveryType | null>(null);
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
            console.warn("[WilayaCommuneSelect] No wilayas found in database. Run: npx ts-node scripts/seed-delivery-zones.ts");
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
        const response = await fetch(`/api/delivery/communes/${selectedWilaya}`);
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

    const selectedWilayaData = wilayas.find((w) => w.wilayaCode === selectedWilaya);

    setSelectedType(type);
    const fee = getDeliveryFee(selectedZone, type);
    onChange({
      zoneId: selectedZone.id,
      type,
      fee,
      wilayaCode: selectedZone.wilayaCode,
      wilayaName: selectedWilayaData?.wilayaNameAscii || selectedZone.wilayaNameAscii,
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
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <p className="text-sm text-amber-800">
          {t("checkout.noWilayas") || "Delivery zones not available. Please contact support."}
        </p>
      </div>
    );
  }

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
        <div className={loadingCommunes || communes.length === 0 ? "opacity-50 pointer-events-none" : ""}>
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
          <label className="block text-sm font-medium text-[#5C3D2E]">
            {t("checkout.deliveryType") || "Delivery Type"}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Stop Desk Option */}
            {selectedZone.hasStopDesk && (
              <button
                type="button"
                onClick={() => handleTypeSelect("stop_desk")}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                  selectedType === "stop_desk"
                    ? "border-[#F4538A] bg-[#FFF0F5]"
                    : "border-[#E8D5C0] bg-white hover:border-[#F4538A]/50"
                )}
              >
                <StoreIcon
                  className={cn(
                    "w-8 h-8 mb-2",
                    selectedType === "stop_desk"
                      ? "text-[#F4538A]"
                      : "text-[#A07850]"
                  )}
                />
                <span
                  className={cn(
                    "font-medium text-sm",
                    selectedType === "stop_desk"
                      ? "text-[#F4538A]"
                      : "text-[#5C3D2E]"
                  )}
                >
                  {t("checkout.stopDesk") || "Stop Desk"}
                </span>
                <span className="text-xs text-[#A07850] mt-1">
                  {formatPrice(selectedZone.stopDeskFee)}
                </span>
                {selectedType === "stop_desk" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#F4538A] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
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
                  "relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                  selectedType === "home"
                    ? "border-[#F4538A] bg-[#FFF0F5]"
                    : "border-[#E8D5C0] bg-white hover:border-[#F4538A]/50"
                )}
              >
                <HomeIcon
                  className={cn(
                    "w-8 h-8 mb-2",
                    selectedType === "home"
                      ? "text-[#F4538A]"
                      : "text-[#A07850]"
                  )}
                />
                <span
                  className={cn(
                    "font-medium text-sm",
                    selectedType === "home"
                      ? "text-[#F4538A]"
                      : "text-[#5C3D2E]"
                  )}
                >
                  {t("checkout.homeDelivery") || "Home Delivery"}
                </span>
                <span className="text-xs text-[#A07850] mt-1">
                  {formatPrice(selectedZone.homeFee)}
                </span>
                {selectedType === "home" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#F4538A] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
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
        </div>
      )}
    </div>
  );
}
