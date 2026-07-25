"use client";

import * as React from "react";
import { cn } from "@/presentation/lib/utils";

export type ButtonVariant =
  | "primary"
  | "ghost"
  | "outline"
  | "text"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-bold tracking-wide rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4538A] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-[#F4538A] hover:bg-[#D63A72] active:bg-[#D63A72] text-white hover:shadow-[0_8px_24px_rgba(244,83,138,0.4)] active:scale-[0.97]",
      ghost:
        "border-2 border-[#F4538A] text-[#F4538A] hover:bg-[#FFF0F5] active:bg-[#FFD6E7]",
      outline:
        "border-2 border-[#E8D5C0] text-[#5C3D2E] hover:border-[#F4538A] hover:text-[#F4538A]",
      text: "text-[#F4538A] hover:text-[#D63A72] underline underline-offset-2",
      danger: "bg-red-50 text-red-600 hover:bg-red-100",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3.5 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
