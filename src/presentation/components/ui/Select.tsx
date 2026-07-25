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
  const [mounted, setMounted] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };

  // Variant classes
  const variantClasses = {
    default: "bg-white border-[#E8D5C0] hover:border-[#F4538A]/50",
    outline: "bg-transparent border-[#E8D5C0] hover:border-[#F4538A]",
    filled: "bg-[#F0E6D6] border-transparent hover:bg-[#E8D5C0]",
  };

  if (!mounted) {
    return (
      <div className={cn("relative", className)}>
        {label && (
          <label className="block text-sm font-medium text-[#5C3D2E] mb-1.5">
            {label}
          </label>
        )}
        <div
          className={cn(
            "w-full rounded-full border-2 flex items-center justify-between transition-colors",
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          <span className="text-[#A07850]">{placeholder}</span>
          <ChevronDownIcon className="w-4 h-4 text-[#A07850]" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-[#5C3D2E] mb-1.5">
          {label}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full rounded-full border-2 flex items-center justify-between transition-all duration-200 cursor-pointer",
          sizeClasses[size],
          variantClasses[variant],
          isOpen && "border-[#F4538A] ring-2 ring-[#F4538A]/20"
        )}
      >
        <span className={cn(
          "font-medium truncate",
          selectedOption ? "text-[#2C1810]" : "text-[#A07850]"
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon 
          className={cn(
            "w-4 h-4 text-[#A07850] transition-transform duration-200 flex-shrink-0 ml-2",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E8D5C0] shadow-lg overflow-hidden z-50">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer",
                  value === option.value
                    ? "bg-[#FFF0F5] text-[#F4538A]"
                    : "text-[#5C3D2E] hover:bg-[#F0E6D6]"
                )}
              >
                <span className="font-medium text-sm">{option.label}</span>
                {value === option.value && (
                  <CheckIcon className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
