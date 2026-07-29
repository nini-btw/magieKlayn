"use client";

import * as React from "react";
import type { Product } from "@/domain/entities/product";

export interface StoryGlowFieldProps {
  products: Product[];
}

/** Deterministic PRNG so SSR and client agree on layout. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function StoryGlowField({ products }: StoryGlowFieldProps) {
  const circles = React.useMemo(() => {
    // Reuse products (repeat the list) so the field feels full even with
    // a small catalog — cap at a sensible max for performance.
    const pool = products.length > 0 ? products : [];
    const count =
      pool.length === 0 ? 0 : Math.min(Math.max(pool.length * 3, 9), 24);

    return Array.from({ length: count }, (_, i) => {
      const rand = mulberry32(i * 97 + 13);
      const product = pool[i % pool.length];
      return {
        id: `${product.id}-${i}`,
        color: product.colorHex,
        top: rand() * 100,
        left: rand() * 100,
        size: 16 + rand() * 46,
        duration: 3 + rand() * 4,
        delay: rand() * 5,
      };
    });
  }, [products]);

  if (circles.length === 0) return null;

  return (
    <div className="story-glow-field" aria-hidden="true">
      {circles.map((c) => (
        <span
          key={c.id}
          className="story-glow-circle"
          style={
            {
              top: `${c.top}%`,
              left: `${c.left}%`,
              width: `${c.size}px`,
              height: `${c.size}px`,
              "--glow-color": c.color,
              "--glow-duration": `${c.duration}s`,
              "--glow-delay": `${c.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
