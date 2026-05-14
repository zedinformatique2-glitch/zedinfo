"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItemColor = {
  hex: string;
  nameFr?: string;
  nameAr?: string;
  image: string;
};

export type CartItem = {
  productId?: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  priceDzd: number;
  image: string;
  qty: number;
  selectedColor?: CartItemColor;
};

export function cartItemKey(item: Pick<CartItem, "slug" | "selectedColor">): string {
  return item.selectedColor?.hex ? `${item.slug}::${item.selectedColor.hex}` : item.slug;
}

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const key = cartItemKey(item);
          const existing = state.items.find((i) => cartItemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i) === key ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        }),
      remove: (key) =>
        set((state) => ({ items: state.items.filter((i) => cartItemKey(i) !== key) })),
      updateQty: (key, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (cartItemKey(i) === key ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.priceDzd * i.qty, 0),
    }),
    {
      name: "zed-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
