/** Cheerful liquid palette (game content). Index 0..7 used by level data.
 *
 * Tuned as vivid "candy jelly" tones: saturated base, bright top light and a
 * deep shade so the banded toon shading reads clearly in 3D while every hue
 * stays instantly distinguishable from its neighbours at a glance.
 */
export interface LiquidColor {
  base: string;
  light: string;
  dark: string;
}

export const LIQUIDS: LiquidColor[] = [
  { base: "#F64848", light: "#FFA3A3", dark: "#A81E2C" }, // red — raspberry
  { base: "#FF8E2B", light: "#FFC48F", dark: "#B54F10" }, // orange — tangerine
  { base: "#FFC41F", light: "#FFEDA3", dark: "#A87800" }, // yellow — honey
  { base: "#43C04C", light: "#A9EBA3", dark: "#187A28" }, // green — apple
  { base: "#17C4B1", light: "#93F0E3", dark: "#0A7C6F" }, // teal — mint
  { base: "#3E82F7", light: "#A9C9FF", dark: "#1C4FB0" }, // blue — blueberry
  { base: "#9B57E9", light: "#D0B1F5", dark: "#5E2AA0" }, // purple — grape
  { base: "#F75FA9", light: "#FFB9DB", dark: "#B02C70" }, // pink — bubblegum
];

export function liquid(i: number): LiquidColor {
  return LIQUIDS[i % LIQUIDS.length];
}
