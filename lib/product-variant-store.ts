"use client";

import { create } from "zustand";
import type { CartItemColor } from "./cart-store";

type State = {
  selected: Record<string, CartItemColor | undefined>;
  setSelected: (slug: string, color: CartItemColor | undefined) => void;
};

export const useProductVariant = create<State>((set) => ({
  selected: {},
  setSelected: (slug, color) =>
    set((s) => ({ selected: { ...s.selected, [slug]: color } })),
}));
