"use client";

import * as React from "react";
import type { Product } from "@/domain/entities/product";

export interface CollectionVisualProps {
  products: Product[];
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
) {
  const p1 = polar(cx, cy, r, start);
  const p2 = polar(cx, cy, r, end);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
}

export default function CollectionVisual({ products }: CollectionVisualProps) {
  const slices = React.useMemo(() => products, [products]);

  const [rotation, setRotation] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const r = 480;
  const cx = r,
    cy = r;
  const sliceAngle = slices.length > 0 ? 180 / slices.length : 0;

  React.useEffect(() => {
    if (slices.length === 0) return;
    const id = setInterval(() => {
      setRotation((prev) => prev + sliceAngle);
      // walk the glow to the next wedge in sequence, every tick
      setActiveIndex((prev) => (prev + 1) % slices.length);
    }, 900);
    return () => clearInterval(id);
  }, [slices.length, sliceAngle]);

  if (slices.length === 0) return null;

  return (
    <div className="collection-visual" aria-hidden="true">
      <svg
        viewBox={`0 0 ${r} ${r * 2}`}
        preserveAspectRatio="xMaxYMid meet"
        className="collection-pie"
        role="presentation"
      >
        <defs>
          {slices.map((p) => (
            <linearGradient
              key={p.id}
              id={`pie-grad-${p.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" style={{ stopColor: p.colorHex }} />
              <stop
                offset="100%"
                style={{
                  stopColor: `color-mix(in srgb, ${p.colorHex} 75%, black)`,
                }}
              />
            </linearGradient>
          ))}
        </defs>

        <g
          className="collection-pie-wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          {slices.map((product, i) => {
            const start = 90 + i * sliceAngle;
            const end = start + sliceAngle;
            const d = wedgePath(cx, cy, r, start, end);
            const isActive = i === activeIndex;

            return (
              <g key={product.id} className="pie-wedge">
                <path d={d} fill={`url(#pie-grad-${product.id})`} />
                <path
                  d={d}
                  fill="none"
                  stroke={product.colorHex}
                  strokeWidth={3}
                  className={`pie-wedge-rim${isActive ? " pie-wedge-rim--active" : ""}`}
                  style={
                    { "--wedge-glow": product.colorHex } as React.CSSProperties
                  }
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
