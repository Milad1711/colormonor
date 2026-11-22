/** Shared timing for pour animations (DOM fallback and WebGL board). */

export const FLY_OUT = 210;
export const FLY_BACK = 190;
export const UNIT_MS = 115;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Split N tubes into 1-2 rows (first row gets the ceil half). */
export function rowSplit(n: number): number[] {
  if (n <= 5) return [n];
  const half = Math.ceil(n / 2);
  return [half, n - half];
}

/** Imperative board API shared by the WebGL board and the DOM fallback. */
export interface TubeBoardApi {
  /** Animate a pour of `count` units of `color` from tube `from` to `to`. */
  pour(from: number, to: number, count: number, color: number): Promise<void>;
}
