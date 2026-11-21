import { LEVELS_DATA, type LevelData } from "./levels-data";

export const LEVELS: LevelData[] = LEVELS_DATA;
export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(id: number): LevelData {
  return LEVELS[Math.min(Math.max(id, 1), TOTAL_LEVELS) - 1];
}
