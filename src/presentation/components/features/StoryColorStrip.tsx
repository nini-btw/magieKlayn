"use client";

/**
 * A thin (~1rem), responsive, top-to-bottom winding color strip built from
 * real product colors — one band per product, in product order. Used on
 * the /about page's story section in place of a hardcoded swatch palette.
 *
 * Path-building approach mirrors app/CollectionVisual.tsx's wedgePath
 * helper (arc/path construction from simple geometry), adapted from a
 * wedge/arc to a chain of cubic-bezier bands that alternate left/right of
 * center for a gentle S-curve.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface StoryColorStripItem {
  colorHex: string;
  name: string;
}

export interface StoryColorStripProps {
  items: StoryColorStripItem[];
}

const SEGMENT_HEIGHT = 160; // viewBox units per color band
const VIEWBOX_WIDTH = 200;
const CENTER_X = VIEWBOX_WIDTH / 2;
const AMPLITUDE = 60;
// Stroke width is kept in real px (~1rem) regardless of the SVG's rendered
// size via vector-effect="non-scaling-stroke" below — the curve itself
// scales with the container, the line thickness does not.
const STROKE_WIDTH = 16;

/** Alternates the curve left/right of center at each band boundary. */
function xAt(index: number): number {
  return index % 2 === 0 ? CENTER_X - AMPLITUDE : CENTER_X + AMPLITUDE;
}

export function StoryColorStrip({ items }: StoryColorStripProps) {
  const reduceMotion = useReducedMotion();

  const waypoints = React.useMemo(
    () => Array.from({ length: items.length + 1 }, (_, i) => xAt(i)),
    [items.length],
  );

  if (items.length === 0) return null;

  const height = items.length * SEGMENT_HEIGHT;

  return (
    <div className="story-color-strip">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
        className="story-color-strip-svg"
        role="img"
        aria-label="A curved strip of every fragrance's signature color"
        preserveAspectRatio="none"
      >
        {items.map((item, i) => {
          const y0 = i * SEGMENT_HEIGHT;
          const y1 = (i + 1) * SEGMENT_HEIGHT;
          const x0 = waypoints[i];
          const x1 = waypoints[i + 1];
          const yMid = (y0 + y1) / 2;
          const d = `M ${x0} ${y0} C ${x0} ${yMid}, ${x1} ${yMid}, ${x1} ${y1}`;

          return (
            <motion.path
              key={`${item.colorHex}-${i}`}
              d={d}
              fill="none"
              stroke={item.colorHex}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="story-color-strip-segment"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              whileInView={
                reduceMotion ? undefined : { pathLength: 1, opacity: 1 }
              }
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: "easeOut",
              }}
              whileHover={
                reduceMotion ? undefined : { strokeWidth: STROKE_WIDTH * 1.6 }
              }
            >
              <title>{item.name}</title>
            </motion.path>
          );
        })}
      </svg>
    </div>
  );
}

export default StoryColorStrip;
