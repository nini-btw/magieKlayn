/**
 * Color utilities
 * @module presentation/lib/color
 */

/**
 * Relative luminance of a hex color, used to decide whether text/labels
 * on top of it should be dark or white. Threshold ~0.6 is "light enough
 * for dark text" across this codebase (see ProductCard.tsx hover state).
 */
export function getLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
