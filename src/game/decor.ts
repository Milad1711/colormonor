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

  /* ---- extra slots for the original wings (110-level campaign) ---- */
  wall_art: { id: "wall_art", category: "decoration", prices: [65, 90, 120] },
  sconce: { id: "sconce", category: "lighting", prices: [55, 75, 100] },
  globe: { id: "globe", category: "decoration", prices: [70, 95, 130] },
  wall_map: { id: "wall_map", category: "decoration", prices: [60, 85, 115] },
  fridge: { id: "fridge", category: "utility", prices: [160, 215, 290] },
  kitchen_shelf: { id: "kitchen_shelf", category: "utility", prices: [75, 105, 140] },
  dresser: { id: "dresser", category: "furniture", prices: [130, 175, 240] },
  wall_lamp: { id: "wall_lamp", category: "lighting", prices: [55, 75, 100] },
  workbench: { id: "workbench", category: "utility", prices: [110, 150, 200] },
  green_hanger: { id: "green_hanger", category: "outdoor", prices: [60, 80, 110] },
  birdhouse: { id: "birdhouse", category: "outdoor", prices: [55, 75, 100] },
  umbrella: { id: "umbrella", category: "outdoor", prices: [90, 125, 165] },
  coat_rack: { id: "coat_rack", category: "utility", prices: [70, 95, 130] },
  hall_painting: { id: "hall_painting", category: "decoration", prices: [70, 95, 130] },

  /* ---- bathroom ---- */
  bathtub: { id: "bathtub", category: "furniture", prices: [180, 240, 325] },
  sink: { id: "sink", category: "furniture", prices: [110, 150, 200] },
  towel_rack: { id: "towel_rack", category: "utility", prices: [60, 80, 110] },
  bath_mirror: { id: "bath_mirror", category: "decoration", prices: [85, 115, 155] },
  bath_mat: { id: "bath_mat", category: "decoration", prices: [55, 75, 100] },
  bath_plant: { id: "bath_plant", category: "outdoor", prices: [65, 90, 120] },

  /* ---- dining room ---- */
  dining_table: { id: "dining_table", category: "furniture", prices: [150, 200, 270] },
  dining_chair: { id: "dining_chair", category: "furniture", prices: [70, 95, 130] },
  dining_sideboard: { id: "dining_sideboard", category: "furniture", prices: [140, 190, 255] },
  dining_chandelier: { id: "dining_chandelier", category: "lighting", prices: [125, 170, 230] },
  dining_vase: { id: "dining_vase", category: "decoration", prices: [50, 70, 95] },
  dining_carpet: { id: "dining_carpet", category: "decoration", prices: [95, 130, 175] },

  /* ---- music room ---- */
  piano: { id: "piano", category: "furniture", prices: [200, 270, 360] },
  cello: { id: "cello", category: "furniture", prices: [130, 175, 235] },
  music_stand: { id: "music_stand", category: "utility", prices: [55, 75, 100] },
  music_lamp: { id: "music_lamp", category: "lighting", prices: [90, 125, 165] },
  music_carpet: { id: "music_carpet", category: "decoration", prices: [85, 115, 155] },

  /* ---- study ---- */
  desk: { id: "desk", category: "furniture", prices: [150, 200, 270] },
  office_chair: { id: "office_chair", category: "furniture", prices: [95, 130, 175] },
  study_lamp: { id: "study_lamp", category: "lighting", prices: [85, 115, 155] },
  office_bookcase: { id: "office_bookcase", category: "utility", prices: [145, 195, 265] },
  study_rug: { id: "study_rug", category: "decoration", prices: [80, 110, 150] },

  /* ---- attic ---- */
  attic_chest: { id: "attic_chest", category: "utility", prices: [90, 120, 160] },
  attic_boxes: { id: "attic_boxes", category: "utility", prices: [50, 70, 95] },
  attic_lamp: { id: "attic_lamp", category: "lighting", prices: [70, 95, 130] },
  attic_carpet: { id: "attic_carpet", category: "decoration", prices: [70, 95, 130] },
  attic_plant: { id: "attic_plant", category: "outdoor", prices: [60, 85, 115] },

  /* ---- garden gazebo (yard) ---- */
  gazebo_seat: { id: "gazebo_seat", category: "outdoor", prices: [100, 135, 180] },
  gazebo_table: { id: "gazebo_table", category: "outdoor", prices: [75, 105, 140] },
  gazebo_lantern: { id: "gazebo_lantern", category: "lighting", prices: [65, 90, 120] },
  gazebo_plants: { id: "gazebo_plants", category: "outdoor", prices: [55, 75, 100] },

  /* ---- guest cottage (yard) ---- */
  guest_bed: { id: "guest_bed", category: "furniture", prices: [170, 230, 310] },
  guest_table: { id: "guest_table", category: "furniture", prices: [100, 135, 180] },
  guest_lamp: { id: "guest_lamp", category: "lighting", prices: [60, 80, 110] },
  guest_rug: { id: "guest_rug", category: "decoration", prices: [85, 115, 155] },

  /* ---- stable (yard) ---- */
  stable_horse: { id: "stable_horse", category: "furniture", prices: [160, 215, 290] },
  stable_hay: { id: "stable_hay", category: "utility", prices: [55, 75, 100] },
  stable_saddle: { id: "stable_saddle", category: "utility", prices: [80, 110, 150] },
  stable_bucket: { id: "stable_bucket", category: "utility", prices: [45, 60, 85] },

  /* ---- orchard (yard) ---- */
  fruit_tree: { id: "fruit_tree", category: "outdoor", prices: [120, 160, 215] },
  fruit_basket: { id: "fruit_basket", category: "outdoor", prices: [50, 70, 95] },
  orchard_ladder: { id: "orchard_ladder", category: "utility", prices: [70, 95, 130] },
  orchard_crate: { id: "orchard_crate", category: "utility", prices: [50, 70, 95] },
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
  /**
   * Where the item belongs in the 3D room:
   *  - "floor"  (default) stands on the floor
   *  - "wall"    mounted on the back wall (z just in front of it)
   *  - "window"  mounted ON the window (curtains frame it exactly)
   */
  place?: "floor" | "wall" | "window";
  /** height of the anchor for wall/window items (world units above floor) */
  wy?: number;
  /** explicit floor depth override (world z), for items that lean on the wall */
  z?: number;
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
      { id: "living_curtain", item: "curtain", x: 322, y: 152, scale: 1.0, place: "window", wy: 1.0 },
      { id: "living_chandelier", item: "chandelier", x: 205, y: 0, scale: 0.95, anchorTop: true },
      { id: "living_sofa", item: "sofa", x: 160, y: G - 6, scale: 1.1 },
      { id: "living_armchair", item: "armchair", x: 290, y: G - 4, scale: 0.95 },
      { id: "living_coffee_table", item: "coffee_table", x: 78, y: G - 2, scale: 0.85 },
      { id: "living_wall_art", item: "wall_art", x: 240, y: 132, scale: 0.75, place: "wall", wy: 1.5 },
      { id: "living_sconce", item: "sconce", x: 30, y: 140, scale: 0.6, place: "wall", wy: 1.6 },
    ],
  },
  {
    id: "library",
    nameKey: "room_names_library",
    unlockStars: 3,
    slots: [
      { id: "library_rug", item: "rug", x: 200, y: G + 8, scale: 1.15 },
      { id: "library_bookcase", item: "bookcase", x: 108, y: G - 4, scale: 1.1 },
      { id: "library_shelf", item: "shelf", x: 330, y: 132, scale: 0.85, place: "wall", wy: 0 },
      { id: "library_chair", item: "chair", x: 268, y: G - 4, scale: 1.0 },
      { id: "library_floor_lamp", item: "floor_lamp", x: 42, y: G - 2, scale: 1.0 },
      { id: "library_globe", item: "globe", x: 368, y: G, scale: 0.6 },
      { id: "library_wall_map", item: "wall_map", x: 280, y: 118, scale: 0.75, place: "wall", wy: 1.35 },
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
      { id: "kitchen_decor", item: "kitchen_decor", x: 340, y: 150, scale: 0.75, place: "wall", wy: 0.85 },
      { id: "kitchen_fridge", item: "fridge", x: 30, y: G - 4, scale: 1.0 },
      { id: "kitchen_shelf", item: "kitchen_shelf", x: 60, y: 120, scale: 0.7, place: "wall", wy: 1.5 },
    ],
  },
  {
    id: "bedroom",
    nameKey: "room_names_bedroom",
    unlockStars: 9,
    slots: [
      { id: "bedroom_carpet", item: "bed_carpet", x: 222, y: G + 8, scale: 1.1 },
      { id: "bedroom_curtain", item: "bed_curtain", x: 322, y: 148, scale: 1.0, place: "window", wy: 1.05 },
      { id: "bedroom_bed", item: "bed", x: 135, y: G - 2, scale: 1.2 },
      { id: "bedroom_wardrobe", item: "wardrobe", x: 60, y: G - 4, scale: 1.0 },
      { id: "bedroom_lamp", item: "bedside_lamp", x: 248, y: G - 2, scale: 0.7 },
      { id: "bedroom_dresser", item: "dresser", x: 300, y: G - 2, scale: 0.9 },
      { id: "bedroom_wall_lamp", item: "wall_lamp", x: 60, y: 140, scale: 0.6, place: "wall", wy: 1.55 },
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
      { id: "greenhouse_workbench", item: "workbench", x: 260, y: G - 2, scale: 0.95 },
      { id: "greenhouse_hanger", item: "green_hanger", x: 320, y: 0, scale: 0.7, anchorTop: true },
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
      { id: "garden_birdhouse", item: "birdhouse", x: 355, y: 240, scale: 0.75 },
      { id: "garden_umbrella", item: "umbrella", x: 100, y: 238, scale: 0.9 },
    ],
  },
  {
    id: "hallway",
    nameKey: "room_names_hallway",
    unlockStars: 18,
    slots: [
      { id: "hallway_runner", item: "runner", x: 200, y: G + 10, scale: 1.15 },
      { id: "hallway_chandelier", item: "hall_chandelier", x: 200, y: 0, scale: 0.95, anchorTop: true },
      { id: "hallway_console_table", item: "console_table", x: 130, y: G - 2, scale: 0.95, z: -1.5 },
      { id: "hallway_mirror", item: "mirror", x: 200, y: 128, scale: 0.8, place: "wall", wy: 0 },
      { id: "hallway_plant", item: "hall_plant", x: 366, y: G - 2, scale: 0.95, z: -1.5 },
      { id: "hallway_coat_rack", item: "coat_rack", x: 330, y: G - 2, scale: 0.9 },
      { id: "hallway_painting", item: "hall_painting", x: 120, y: 120, scale: 0.7, place: "wall", wy: 1.3 },
    ],
  },
  {
    id: "bathroom",
    nameKey: "room_names_bathroom",
    unlockStars: 24,
    slots: [
      { id: "bath_mat", item: "bath_mat", x: 180, y: G + 8, scale: 0.9 },
      { id: "bath_tub", item: "bathtub", x: 110, y: G - 2, scale: 1.15 },
      { id: "bath_sink", item: "sink", x: 250, y: G - 4, scale: 0.9 },
      { id: "bath_mirror", item: "bath_mirror", x: 250, y: 110, scale: 0.7, place: "wall", wy: 1.5 },
      { id: "bath_towel", item: "towel_rack", x: 60, y: 130, scale: 0.75, place: "wall", wy: 1.2 },
      { id: "bath_plant", item: "bath_plant", x: 340, y: G - 2, scale: 0.7 },
    ],
  },
  {
    id: "dining",
    nameKey: "room_names_dining",
    unlockStars: 32,
    slots: [
      { id: "dining_carpet", item: "dining_carpet", x: 200, y: G + 12, scale: 1.1 },
      { id: "dining_chandelier", item: "dining_chandelier", x: 200, y: 0, scale: 0.9, anchorTop: true },
      { id: "dining_table", item: "dining_table", x: 200, y: G, scale: 1.15 },
      { id: "dining_chair", item: "dining_chair", x: 120, y: G - 2, scale: 0.85 },
      { id: "dining_sideboard", item: "dining_sideboard", x: 330, y: G - 4, scale: 1.0 },
      { id: "dining_vase", item: "dining_vase", x: 280, y: G + 2, scale: 0.55 },
    ],
  },
  {
    id: "music",
    nameKey: "room_names_music",
    unlockStars: 40,
    slots: [
      { id: "music_carpet", item: "music_carpet", x: 190, y: G + 8, scale: 1.0 },
      { id: "music_piano", item: "piano", x: 140, y: G - 4, scale: 1.15 },
      { id: "music_cello", item: "cello", x: 300, y: G - 2, scale: 0.9 },
      { id: "music_stand", item: "music_stand", x: 250, y: G, scale: 0.7 },
      { id: "music_lamp", item: "music_lamp", x: 45, y: G - 2, scale: 0.9 },
    ],
  },
  {
    id: "study",
    nameKey: "room_names_study",
    unlockStars: 48,
    slots: [
      { id: "study_rug", item: "study_rug", x: 180, y: G + 10, scale: 1.0 },
      { id: "study_desk", item: "desk", x: 150, y: G - 4, scale: 1.1 },
      { id: "study_chair", item: "office_chair", x: 230, y: G, scale: 0.85 },
      { id: "study_lamp", item: "study_lamp", x: 40, y: G - 2, scale: 0.8 },
      { id: "study_bookcase", item: "office_bookcase", x: 320, y: G - 4, scale: 1.05 },
    ],
  },
  {
    id: "attic",
    nameKey: "room_names_attic",
    unlockStars: 56,
    slots: [
      { id: "attic_carpet", item: "attic_carpet", x: 240, y: G + 8, scale: 0.9 },
      { id: "attic_lamp", item: "attic_lamp", x: 200, y: 0, scale: 0.8, anchorTop: true },
      { id: "attic_chest", item: "attic_chest", x: 100, y: G - 2, scale: 0.9 },
      { id: "attic_boxes", item: "attic_boxes", x: 170, y: G, scale: 0.75 },
      { id: "attic_plant", item: "attic_plant", x: 340, y: G - 2, scale: 0.8 },
    ],
  },
  /* ---------------- yard buildings around the manor ---------------- */
  {
    id: "gazebo",
    nameKey: "room_names_gazebo",
    unlockStars: 70,
    slots: [
      { id: "gazebo_seat", item: "gazebo_seat", x: 200, y: 240, scale: 1.0 },
      { id: "gazebo_table", item: "gazebo_table", x: 140, y: 236, scale: 0.7 },
      { id: "gazebo_lantern", item: "gazebo_lantern", x: 280, y: 238, scale: 0.7 },
      { id: "gazebo_plants", item: "gazebo_plants", x: 90, y: 240, scale: 0.8 },
    ],
  },
  {
    id: "guesthouse",
    nameKey: "room_names_guesthouse",
    unlockStars: 85,
    slots: [
      { id: "guest_rug", item: "guest_rug", x: 190, y: G + 8, scale: 0.95 },
      { id: "guest_bed", item: "guest_bed", x: 120, y: G - 2, scale: 1.05 },
      { id: "guest_table", item: "guest_table", x: 260, y: G - 4, scale: 0.85 },
      { id: "guest_lamp", item: "guest_lamp", x: 320, y: G - 2, scale: 0.65 },
    ],
  },
  {
    id: "stable",
    nameKey: "room_names_stable",
    unlockStars: 100,
    slots: [
      { id: "stable_horse", item: "stable_horse", x: 150, y: 240, scale: 1.0 },
      { id: "stable_hay", item: "stable_hay", x: 260, y: 242, scale: 0.8 },
      { id: "stable_saddle", item: "stable_saddle", x: 330, y: 244, scale: 0.7 },
      { id: "stable_bucket", item: "stable_bucket", x: 90, y: 244, scale: 0.55 },
    ],
  },
  {
    id: "orchard",
    nameKey: "room_names_orchard",
    unlockStars: 115,
    slots: [
      { id: "orchard_tree", item: "fruit_tree", x: 110, y: 238, scale: 1.1 },
      { id: "orchard_basket", item: "fruit_basket", x: 230, y: 242, scale: 0.65 },
      { id: "orchard_ladder", item: "orchard_ladder", x: 310, y: 236, scale: 0.85 },
      { id: "orchard_crate", item: "orchard_crate", x: 175, y: 244, scale: 0.6 },
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

/**
 * i18n key describing exactly WHERE a slot's item is installed
 * (floor / wall / window / ceiling) — used by the room placement
 * guide, the empty-slot labels and the shop detail dialog.
 */
export function slotPlaceKey(slot: {
  anchorTop?: boolean;
  place?: "floor" | "wall" | "window";
}): string {
  if (slot.anchorTop) return "place_ceiling";
  if (slot.place === "window") return "place_window";
  if (slot.place === "wall") return "place_wall";
  return "place_floor";
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
