"use client";

import * as React from "react";
import { cn } from "@/presentation/lib/utils";

export type BadgeVariant = "default" | "pink" | "outline" | "soldOut" | "new";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    // Variant keys kept as-is (Crumbleivable naming) so existing call sites
    // don't break. There's no second accent color in this brand, so "pink"
    // now just means "solid emphasis" — worth renaming to "accent" project-wide
    // when there's time, but not required for this pass.
    const variants: Record<BadgeVariant, string> = {
      default: "bg-bg-soft text-ink",
      pink: "bg-ink text-white",
      outline: "border border-line text-ink",
      soldOut: "bg-line text-ink-soft",
      new: "border border-ink text-ink bg-white",
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
