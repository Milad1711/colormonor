/**
 * Global game state with automatic localStorage persistence.
 * Closing and reopening the game never loses progress: levels, stars,
 * coins, purchases, decor choices, language and sound are all saved.
 */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Lang } from "./i18n";
import {
  ECONOMY,
  ROOMS,
  ROOM_BY_ID,
  variantPrice,
  switchCost,
} from "./decor";
import { setSoundEnabled } from "./audio";

export type Screen =
  | "menu"
  | "levels"
  | "puzzle"
  | "manor"
  | "room"
  | "shop";

export interface LevelRecord {
  stars: 1 | 2 | 3;
  bestMoves: number;
}

interface SaveShape {
  language: Lang | null;
  sound: boolean;
  guideEnabled: boolean;
  coins: number;
  starBalance: number;
  levels: Record<string, LevelRecord>;
  unlockedRooms: string[];
  roomBonusGiven: string[];
  decor: Record<string, { variant: number }>;
  currentLevel: number;
}

interface UIState {
  screen: Screen;
  activeLevel: number;
  activeRoom: string | null;
  /** when the shop was opened from a room slot, we return there after purchase */
  shopContext: { roomId: string; slotId?: string } | null;
  /** room id whose renovation was just completed (for the celebration modal) */
  roomJustCompleted: string | null;
}

export interface GameStore extends SaveShape, UIState {
  // navigation
  goMenu: () => void;
  goLevels: () => void;
  goManor: () => void;
  openRoom: (roomId: string) => void;
  goShop: (ctx?: { roomId: string; slotId?: string }) => void;
  playLevel: (id: number) => void;

  // settings
  setLanguage: (lang: Lang) => void;
  setSound: (on: boolean) => void;
  setGuideEnabled: (on: boolean) => void;
  resetProgress: () => void;

  // gameplay / economy
  finishLevel: (id: number, moves: number, stars: 1 | 2 | 3) => {
    firstClear: boolean;
    coins: number;
  };
  spendHint: () => boolean;
  unlockRoom: (roomId: string) => boolean;
  buyDecor: (slotId: string, itemId: string, variant: number) => boolean;
  switchDecor: (slotId: string, itemId: string, variant: number) => boolean;
  clearRoomJustCompleted: () => void;
}

const initialSave: SaveShape = {
  language: null,
  sound: true,
  guideEnabled: true,
  coins: ECONOMY.startCoins,
  starBalance: 0,
  levels: {},
  unlockedRooms: ["living"],
  roomBonusGiven: [],
  decor: {},
  currentLevel: 1,
};

const initialUI: UIState = {
  screen: "menu",
  activeLevel: 1,
  activeRoom: null,
  shopContext: null,
  roomJustCompleted: null,
};

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialSave,
      ...initialUI,

      goMenu: () => set({ screen: "menu", activeRoom: null, shopContext: null }),
      goLevels: () => set({ screen: "levels" }),
      goManor: () => set({ screen: "manor", activeRoom: null, shopContext: null }),
      openRoom: (roomId) => set({ screen: "room", activeRoom: roomId, shopContext: null }),
      goShop: (ctx) =>
        set({ screen: "shop", shopContext: ctx ?? null }),
      playLevel: (id) => set({ screen: "puzzle", activeLevel: id }),

      setLanguage: (lang) => set({ language: lang }),
      setSound: (on) => {
        setSoundEnabled(on);
        set({ sound: on });
      },
      setGuideEnabled: (on) => set({ guideEnabled: on }),

      resetProgress: () =>
        set({
          ...initialSave,
          language: get().language,
          sound: get().sound,
          guideEnabled: get().guideEnabled,
          screen: "menu",
          activeRoom: null,
          shopContext: null,
        }),

      finishLevel: (id, moves, stars) => {
        const s = get();
        const key = String(id);
        const prev = s.levels[key];
        const firstClear = !prev;
        const coins = firstClear
          ? ECONOMY.firstClearCoins + stars * ECONOMY.coinPerStar
          : ECONOMY.replayCoins;
        const record: LevelRecord = prev
          ? {
              stars: Math.max(prev.stars, stars) as 1 | 2 | 3,
              bestMoves: Math.min(prev.bestMoves, moves),
            }
          : { stars, bestMoves: moves };
        set({
          levels: { ...s.levels, [key]: record },
          coins: s.coins + coins,
          starBalance: s.starBalance + (firstClear ? stars : 0),
          currentLevel: Math.min(Math.max(s.currentLevel, id + 1), 50),
        });
        return { firstClear, coins };
      },

      spendHint: () => {
        const s = get();
        if (s.coins < ECONOMY.hintCost) return false;
        set({ coins: s.coins - ECONOMY.hintCost });
        return true;
      },

      unlockRoom: (roomId) => {
        const s = get();
        const room = ROOM_BY_ID.get(roomId);
        if (!room) return false;
        if (s.unlockedRooms.includes(roomId)) return false;
        if (s.starBalance < room.unlockStars) return false;
        set({
          starBalance: s.starBalance - room.unlockStars,
          unlockedRooms: [...s.unlockedRooms, roomId],
        });
        return true;
      },

      buyDecor: (slotId, itemId, variant) => {
        const s = get();
        if (s.decor[slotId]) return false;
        const price = variantPrice(itemId, variant);
        if (s.coins < price) return false;
        const decor = { ...s.decor, [slotId]: { variant } };
        const patch: Partial<SaveShape & UIState> = { decor, coins: s.coins - price };
        // room completion bonus
        const ctx = s.shopContext;
        const roomId = ctx?.roomId ?? s.activeRoom;
        const room = roomId ? ROOM_BY_ID.get(roomId) : null;
        if (room && !s.roomBonusGiven.includes(room.id)) {
          const complete = room.slots.every((slot) => decor[slot.id]);
          if (complete) {
            patch.roomBonusGiven = [...s.roomBonusGiven, room.id];
            patch.coins = s.coins - price + ECONOMY.roomBonus;
            patch.roomJustCompleted = room.id;
          }
        }
        set(patch as Partial<GameStore> as GameStore);
        return true;
      },

      switchDecor: (slotId, itemId, variant) => {
        const s = get();
        if (!s.decor[slotId]) return false;
        const price = variantPrice(itemId, variant);
        const cost = switchCost(price);
        if (s.coins < cost) return false;
        set({
          decor: { ...s.decor, [slotId]: { variant } },
          coins: s.coins - cost,
        });
        return true;
      },

      clearRoomJustCompleted: () => set({ roomJustCompleted: null }),
    }),
    {
      name: "color-manor-save-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        language: s.language,
        sound: s.sound,
        guideEnabled: s.guideEnabled,
        coins: s.coins,
        starBalance: s.starBalance,
        levels: s.levels,
        unlockedRooms: s.unlockedRooms,
        roomBonusGiven: s.roomBonusGiven,
        decor: s.decor,
        currentLevel: s.currentLevel,
      }),
    },
  ),
);

export const ALL_ROOM_IDS = ROOMS.map((r) => r.id);
