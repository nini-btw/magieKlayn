import type { CSSProperties } from "react";

const LIQUID_COLOR = "#EFAE7D";

export function darkenHex(amount = 0.35): string {
  const normalized = LIQUID_COLOR.replace("#", "");

  const bigint = parseInt(normalized, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const darken = (value: number) =>
    Math.max(0, Math.round(value * (1 - amount)));

  const toHex = (value: number) => value.toString(16).padStart(2, "0");

  return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`;
}

export function getLiquidStyle(): CSSProperties {
  return {
    ["--liquid" as string]: LIQUID_COLOR,
    ["--liquid-deep" as string]: darkenHex(),
  } as CSSProperties;
}
