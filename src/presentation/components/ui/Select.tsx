"use client";

import * as React from "react";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/presentation/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "filled";
}

const sizeClasses: Record<NonNullable<SelectProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

const variantClasses: Record<NonNullable<SelectProps["variant"]>, string> = {
  default:
    "bg-white border-[var(--color-text)]/20 hover:border-[var(--color-text)]/50",
  outline:
    "bg-transparent border-[var(--color-text)]/30 hover:border-[var(--color-text)]",
  filled:
    "bg-[var(--color-bg-soft)] border-transparent hover:bg-[var(--color-border)]",
};

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  className,
  size = "md",
  variant = "default",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-full border transition-all duration-[var(--duration-base)] ease-[var(--ease-luxury)]",
          sizeClasses[size],
          variantClasses[variant],
          selectedOption && !isOpen && "border-[var(--color-text)]",
          isOpen &&
            "border-[var(--color-text)] ring-2 ring-[var(--color-text)]/10",
        )}
      >
        <span
          className={cn(
            "truncate font-medium",
            selectedOption
              ? "text-[var(--color-text)]"
              : "text-[var(--color-text-secondary)]",
          )}
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform duration-[var(--duration-base)]",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]"
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left transition-colors duration-[var(--duration-base)] ease-[var(--ease-luxury)]",
                    isSelected
                      ? "bg-[var(--color-bg-soft)]"
                      : "bg-white hover:bg-[var(--color-bg-soft)]",
                  )}
                >
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    {option.label}
                  </span>
                  {isSelected && (
                    <CheckIcon className="h-4 w-4 shrink-0 text-[var(--color-text)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
