/** Cheerful liquid palette (game content). Index 0..7 used by level data. */
export interface LiquidColor {
  base: string;
  light: string;
  dark: string;
}

export const LIQUIDS: LiquidColor[] = [
  { base: "#E94F4F", light: "#FF8A80", dark: "#B23131" }, // red
  { base: "#F59E42", light: "#FFC98A", dark: "#C46F1F" }, // orange
  { base: "#F5D23F", light: "#FFEB9C", dark: "#C9A618" }, // yellow
  { base: "#55B85B", light: "#9CE0A0", dark: "#358741" }, // green
  { base: "#3EC5B0", light: "#8FE8DB", dark: "#1F8F7E" }, // teal
  { base: "#5A8FDE", light: "#9CC4F5", dark: "#3563A8" }, // blue
  { base: "#A267D8", light: "#CBAFF0", dark: "#7542A8" }, // purple
  { base: "#F06EA9", light: "#FFAED2", dark: "#C2447E" }, // pink
];

export function liquid(i: number): LiquidColor {
  return LIQUIDS[i % LIQUIDS.length];
}
