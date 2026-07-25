"use client";

import * as React from "react";
import { cn } from "@/presentation/lib/utils";

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
}) => {
  const isSmall = size === "sm";
  const decrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const increment = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0 bg-[#F0E6D6] rounded-full overflow-hidden border border-[#E8D5C0]",
        disabled && "opacity-50"
      )}
    >
      <button
        onClick={decrement}
        disabled={disabled || value <= min}
        className={cn(
          "flex items-center justify-center text-[#5C3D2E] hover:bg-[#FFF0F5] transition-colors disabled:cursor-not-allowed cursor-pointer",
          isSmall ? "w-6 h-6" : "w-10 h-10"
        )}
        aria-label="Decrease quantity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={isSmall ? 12 : 16}
          height={isSmall ? 12 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <span className={cn(
        "text-center font-bold text-[#2C1810]",
        isSmall ? "w-6 text-xs" : "w-10"
      )}>{value}</span>
      <button
        onClick={increment}
        disabled={disabled || value >= max}
        className={cn(
          "flex items-center justify-center text-[#F4538A] hover:bg-[#FFF0F5] transition-colors disabled:cursor-not-allowed cursor-pointer",
          isSmall ? "w-6 h-6" : "w-10 h-10"
        )}
        aria-label="Increase quantity"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={isSmall ? 12 : 16}
          height={isSmall ? 12 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};
