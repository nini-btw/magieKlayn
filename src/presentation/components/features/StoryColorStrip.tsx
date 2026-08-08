"use client";

/**
 * A thin (~1rem), responsive color ribbon built from real product colors —
 * one band per product, in product order. Used on the /about page's story
 * section, one instance per alternating row, each bowing toward the side
 * closest to its paired text block.
 *
 * Path-building approach mirrors app/CollectionVisual.tsx's wedgePath
 * helper (arc/path construction from simple geometry), adapted into a
 * chain of cubic-bezier bands sampled along a single sine-based bow rather
 * than a wedge/arc.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface StoryColorStripItem {
  colorHex: string;
  name: string;
}

export interface StoryColorStripProps {
  items: StoryColorStripItem[];
  /** Which side the ribbon bows out toward across its full run — pair this
   * with whichever side of the row the text block sits on. */
  bend?: "left" | "right";
}

const SEGMENT_HEIGHT = 160; // viewBox units per color band
const VIEWBOX_WIDTH = 200;
const CENTER_X = VIEWBOX_WIDTH / 2;
// A pronounced bow (~38% of the viewBox width) so the ribbon reads as a
// real curve, not a subtle wiggle.
const AMPLITUDE = 76;
// Stroke width is kept in real px (~1rem) regardless of the SVG's rendered
// size via vector-effect="non-scaling-stroke" below — the curve itself
// scales with the container, the line thickness does not.
const STROKE_WIDTH = 16;

/** One continuous sine-based bow across the whole run: starts and ends at
 * center, bulges out toward `bend`'s side at the midpoint. */
function xAt(index: number, count: number, bend: "left" | "right"): number {
  const t = count === 0 ? 0 : index / count;
  const direction = bend === "left" ? -1 : 1;
  return CENTER_X + direction * AMPLITUDE * Math.sin(Math.PI * t);
}

export function StoryColorStrip({
  items,
  bend = "right",
}: StoryColorStripProps) {
  const reduceMotion = useReducedMotion();

  const waypoints = React.useMemo(
    () =>
      Array.from({ length: items.length + 1 }, (_, i) =>
        xAt(i, items.length, bend),
      ),
    [items.length, bend],
  );

  if (items.length === 0) return null;

  const height = items.length * SEGMENT_HEIGHT;

  return (
    <div className="story-color-strip">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
        className="story-color-strip-svg"
        role="img"
        aria-label="A curved ribbon of fragrance signature colors"
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
