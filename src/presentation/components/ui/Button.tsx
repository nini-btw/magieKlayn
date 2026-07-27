"use client";

import * as React from "react";
import { cn } from "@/presentation/lib/utils";

export type ButtonVariant = "primary" | "ghost" | "outline" | "text" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
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
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-semibold tracking-[0.03em] rounded-full transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variants: Record<ButtonVariant, string> = {
      // Solid ink fill — the site's one strong CTA treatment (matches .btn-primary)
      primary:
        "bg-ink text-white shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 active:translate-y-0",
      // Outline that inverts to solid ink on hover (matches .btn-secondary)
      outline: "border-2 border-ink text-ink hover:bg-ink hover:text-white",
      // Quiet outline, doesn't invert — for lower-emphasis secondary actions
      ghost: "border border-line text-ink hover:bg-bg-soft hover:border-ink",
      // Underlined text link, matches .text-link (opacity dip on hover, no color shift)
      text: "text-ink underline underline-offset-4 decoration-1 hover:opacity-60",
      danger: "bg-danger-bg text-danger hover:opacity-90",
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
          className,
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
  },
);

Button.displayName = "Button";
