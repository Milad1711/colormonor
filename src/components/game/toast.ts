"use client";

/** Minimal toast queue (RTL-aware, no external dependency). */
import { create } from "zustand";

export interface ToastState {
  message: string | null;
  tone: "info" | "error" | "success";
  seq: number;
  show: (message: string, tone?: "info" | "error" | "success") => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: "info",
  seq: 0,
  show: (message, tone = "info") => set((s) => ({ message, tone, seq: s.seq + 1 })),
  clear: () => set({ message: null }),
}));

let timer: ReturnType<typeof setTimeout> | null = null;

/** Show a toast for ~2.2s. Safe to call from anywhere. */
export function toast(message: string, tone: "info" | "error" | "success" = "info") {
  useToastStore.getState().show(message, tone);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => useToastStore.getState().clear(), 2200);
}
