"use client";

import * as React from "react";
import { cn } from "@/presentation/lib/utils";

export type BadgeVariant = "default" | "pink" | "outline" | "soldOut" | "new";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<BadgeVariant, string> = {
      default: "bg-[#F0E6D6] text-[#5C3D2E]",
      pink: "bg-[#F4538A] text-white",
      outline: "border border-[#E8D5C0] text-[#5C3D2E]",
      soldOut: "bg-[#A07850] text-white",
      new: "bg-[#F4538A] text-white",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
