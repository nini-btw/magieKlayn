"use client";

import * as React from "react";
import { cn } from "@/presentation/lib/utils";

export type BadgeVariant =
  | "default"
  | "pink"
  | "outline"
  | "soldOut"
  | "new"
  | "unisex"
  | "gender";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      default: "bg-bg-soft text-ink",
      pink: "bg-ink text-white",
      outline: "border border-line text-ink",
      soldOut: "bg-line text-ink-soft",
      new: "border border-ink text-ink bg-white",
      unisex: "badge-unisex",
      gender: "badge-gender",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";
