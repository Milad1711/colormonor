"use client";

/**
 * Shop catalog, manor rooms and renovation economy.
 *
 * Economy targets (balanced for normal play, no real-money need):
 * - Level first clear: 20 coins + 8 per star  (typical 2-3 stars)
 * - Replay: flat 8 coins
 * - Room completion bonus: 100 coins
 * - Hint: 20 coins (free on tutorial levels 1-5)
 * - Cheapest full furnishing (all base variants) is reachable within a
 *   normal playthrough + a handful of replays.
 */

export type ItemCategory =
  | "furniture"
  | "lighting"
  | "decoration"
  | "utility"
  | "outdoor";

export const CATEGORY_KEYS: ItemCategory[] = [
  "furniture",
  "lighting",
  "decoration",
  "utility",
  "outdoor",
];

export const CATEGORY_ITEM_KEYS: Record<ItemCategory, string> = {
  furniture: "furniture",
  lighting: "lighting",
  decoration: "decoration",
  utility: "utility",
  outdoor: "outdoor",
};

export interface ShopItem {
  id: string;
  category: ItemCategory;
  /** price of the 3 models (classic / modern / rustic) */
  prices: [number, number, number];
}

export const SHOP_ITEMS: Record<string, ShopItem> = {
  sofa: { id: "sofa", category: "furniture", prices: [160, 220, 300] },
  armchair: { id: "armchair", category: "furniture", prices: [80, 110, 150] },
  coffee_table: { id: "coffee_table", category: "furniture", prices: [90, 125, 170] },
  chandelier: { id: "chandelier", category: "lighting", prices: [120, 170, 230] },
  curtain: { id: "curtain", category: "decoration", prices: [70, 100, 135] },
  carpet: { id: "carpet", category: "decoration", prices: [100, 140, 190] },

  bookcase: { id: "bookcase", category: "utility", prices: [150, 205, 280] },
  shelf: { id: "shelf", category: "utility", prices: [80, 110, 150] },
  chair: { id: "chair", category: "furniture", prices: [85, 120, 160] },
  floor_lamp: { id: "floor_lamp", category: "lighting", prices: [95, 130, 180] },
  rug: { id: "rug", category: "decoration", prices: [80, 110, 150] },

  cabinet: { id: "cabinet", category: "utility", prices: [170, 230, 310] },
  kitchen_table: { id: "kitchen_table", category: "furniture", prices: [110, 150, 205] },
  kitchen_chair: { id: "kitchen_chair", category: "furniture", prices: [60, 85, 115] },
  pendant_light: { id: "pendant_light", category: "lighting", prices: [85, 120, 160] },
  kitchen_decor: { id: "kitchen_decor", category: "decoration", prices: [70, 95, 130] },

  bed: { id: "bed", category: "furniture", prices: [190, 255, 345] },
  wardrobe: { id: "wardrobe", category: "furniture", prices: [140, 190, 260] },
  bedside_lamp: { id: "bedside_lamp", category: "lighting", prices: [60, 85, 115] },
  bed_curtain: { id: "bed_curtain", category: "decoration", prices: [70, 95, 130] },
  bed_carpet: { id: "bed_carpet", category: "decoration", prices: [95, 130, 180] },

  planter: { id: "planter", category: "outdoor", prices: [90, 125, 170] },
  flower_stand: { id: "flower_stand", category: "outdoor", prices: [80, 110, 150] },
  green_shelf: { id: "green_shelf", category: "utility", prices: [110, 150, 205] },
  grow_lamp: { id: "grow_lamp", category: "lighting", prices: [80, 110, 150] },
  watering_set: { id: "watering_set", category: "utility", prices: [50, 70, 95] },

  fountain: { id: "fountain", category: "outdoor", prices: [200, 270, 365] },
  bench: { id: "bench", category: "outdoor", prices: [105, 145, 195] },
  flower_bed: { id: "flower_bed", category: "outdoor", prices: [85, 115, 155] },
  garden_planter: { id: "garden_planter", category: "outdoor", prices: [60, 85, 115] },
  garden_lamp: { id: "garden_lamp", category: "lighting", prices: [70, 95, 130] },

  hall_chandelier: { id: "hall_chandelier", category: "lighting", prices: [130, 180, 245] },
  console_table: { id: "console_table", category: "furniture", prices: [105, 145, 195] },
  mirror: { id: "mirror", category: "decoration", prices: [95, 130, 175] },
  runner: { id: "runner", category: "decoration", prices: [80, 110, 150] },
  hall_plant: { id: "hall_plant", category: "outdoor", prices: [60, 85, 115] },
};

export interface RoomSlot {
  id: string;
  item: string;
  /** placement in the room scene (SVG units in a 400x280 viewbox) */
  x: number;
  y: number;
  scale: number;
  /** ceiling items hang from the top edge instead of standing on the floor */
  anchorTop?: boolean;
}

export interface RoomDef {
  id: string;
  nameKey: string;
  /** star balance required to unlock this wing */
  unlockStars: number;
  slots: RoomSlot[];
}

/** ground line shared by indoor scenes (garden uses its own layout) */
const G = 244;

export const ROOMS: RoomDef[] = [
  {
    id: "living",
    nameKey: "room_names_living",
    unlockStars: 0,
    slots: [
      { id: "living_carpet", item: "carpet", x: 155, y: G + 6, scale: 1.2 },
      { id: "living_curtain", item: "curtain", x: 322, y: 152, scale: 1.0 },
      { id: "living_chandelier", item: "chandelier", x: 205, y: 0, scale: 0.95, anchorTop: true },
      { id: "living_sofa", item: "sofa", x: 160, y: G - 6, scale: 1.1 },
      { id: "living_armchair", item: "armchair", x: 290, y: G - 4, scale: 0.95 },
      { id: "living_coffee_table", item: "coffee_table", x: 78, y: G - 2, scale: 0.85 },
    ],
  },
  {
    id: "library",
    nameKey: "room_names_library",
    unlockStars: 3,
    slots: [
      { id: "library_rug", item: "rug", x: 200, y: G + 8, scale: 1.15 },
      { id: "library_bookcase", item: "bookcase", x: 108, y: G - 4, scale: 1.1 },
      { id: "library_shelf", item: "shelf", x: 330, y: 132, scale: 0.85 },
      { id: "library_chair", item: "chair", x: 268, y: G - 4, scale: 1.0 },
      { id: "library_floor_lamp", item: "floor_lamp", x: 42, y: G - 2, scale: 1.0 },
    ],
  },
  {
    id: "kitchen",
    nameKey: "room_names_kitchen",
    unlockStars: 6,
    slots: [
      { id: "kitchen_cabinet", item: "cabinet", x: 95, y: G - 4, scale: 1.15 },
      { id: "kitchen_table", item: "kitchen_table", x: 250, y: G - 2, scale: 1.05 },
      { id: "kitchen_chair", item: "kitchen_chair", x: 325, y: G, scale: 0.9 },
      { id: "kitchen_pendant_light", item: "pendant_light", x: 250, y: 0, scale: 0.9, anchorTop: true },
      { id: "kitchen_decor", item: "kitchen_decor", x: 340, y: 150, scale: 0.75 },
    ],
  },
  {
    id: "bedroom",
    nameKey: "room_names_bedroom",
    unlockStars: 9,
    slots: [
      { id: "bedroom_carpet", item: "bed_carpet", x: 222, y: G + 8, scale: 1.1 },
      { id: "bedroom_curtain", item: "bed_curtain", x: 322, y: 148, scale: 1.0 },
      { id: "bedroom_bed", item: "bed", x: 135, y: G - 2, scale: 1.2 },
      { id: "bedroom_wardrobe", item: "wardrobe", x: 350, y: G - 4, scale: 1.0 },
      { id: "bedroom_lamp", item: "bedside_lamp", x: 248, y: G - 2, scale: 0.7 },
    ],
  },
  {
    id: "greenhouse",
    nameKey: "room_names_greenhouse",
    unlockStars: 12,
    slots: [
      { id: "greenhouse_planter", item: "planter", x: 88, y: G - 4, scale: 1.0 },
      { id: "greenhouse_flower_stand", item: "flower_stand", x: 178, y: G - 2, scale: 0.95 },
      { id: "greenhouse_shelf", item: "green_shelf", x: 298, y: G - 6, scale: 1.0 },
      { id: "greenhouse_grow_lamp", item: "grow_lamp", x: 178, y: 0, scale: 0.85, anchorTop: true },
      { id: "greenhouse_watering_set", item: "watering_set", x: 362, y: G + 2, scale: 0.65 },
    ],
  },
  {
    id: "garden",
    nameKey: "room_names_garden",
    unlockStars: 15,
    slots: [
      { id: "garden_flower_bed", item: "flower_bed", x: 62, y: 244, scale: 1.0 },
      { id: "garden_fountain", item: "fountain", x: 200, y: 234, scale: 1.15 },
      { id: "garden_bench", item: "bench", x: 322, y: 240, scale: 1.0 },
      { id: "garden_planter", item: "garden_planter", x: 134, y: 238, scale: 0.7 },
      { id: "garden_lamp", item: "garden_lamp", x: 270, y: 238, scale: 0.7 },
    ],
  },
  {
    id: "hallway",
    nameKey: "room_names_hallway",
    unlockStars: 18,
    slots: [
      { id: "hallway_runner", item: "runner", x: 200, y: G + 10, scale: 1.15 },
      { id: "hallway_chandelier", item: "hall_chandelier", x: 200, y: 0, scale: 0.95, anchorTop: true },
      { id: "hallway_console_table", item: "console_table", x: 88, y: G - 2, scale: 0.95 },
      { id: "hallway_mirror", item: "mirror", x: 88, y: 128, scale: 0.8 },
      { id: "hallway_plant", item: "hall_plant", x: 330, y: G - 2, scale: 0.95 },
    ],
  },
];

export const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

/* ----------------------------- economy ----------------------------- */

export const ECONOMY = {
  startCoins: 120,
  firstClearCoins: 20,
  coinPerStar: 8,
  replayCoins: 8,
  roomBonus: 100,
  hintCost: 20,
  switchCostRate: 0.3,
} as const;

export function switchCost(newPrice: number): number {
  return Math.max(10, Math.round((newPrice * ECONOMY.switchCostRate) / 5) * 5);
}

export function variantPrice(itemId: string, variant: number): number {
  return SHOP_ITEMS[itemId].prices[Math.min(Math.max(variant, 0), 2)];
}

/** 3 stars: close to optimal. 2 stars: reasonable. else 1. */
export function starsForMoves(moves: number, par: number): 1 | 2 | 3 {
  if (moves <= par + 2) return 3;
  if (moves <= Math.ceil(par * 1.8) + 2) return 2;
  return 1;
}

export function firstClearReward(stars: number): number {
  return ECONOMY.firstClearCoins + stars * ECONOMY.coinPerStar;
}

export const VARIANT_NAME_KEYS = ["variant_classic", "variant_modern", "variant_rustic"];
