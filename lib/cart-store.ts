"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fbTrack, FB_CURRENCY } from "@/lib/fb-pixel";

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
  /** True when this line was added from the PC configurator ("custom build"). */
  fromBuild?: boolean;
};

export function cartItemKey(item: Pick<CartItem, "slug" | "selectedColor">): string {
  return item.selectedColor?.hex ? `${item.slug}::${item.selectedColor.hex}` : item.slug;
}

type AddOptions = {
  /**
   * Skip the Meta `AddToCart` event for this line. Used by the configurator,
   * which adds ~8 components at once and fires a single aggregate event instead.
   */
  silent?: boolean;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number, opts?: AddOptions) => void;
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
      add: (item, qty = 1, opts) => {
        if (!opts?.silent) {
          fbTrack("AddToCart", {
            content_type: "product",
            content_ids: [item.slug],
            content_name: item.nameFr,
            contents: [{ id: item.slug, quantity: qty, item_price: item.priceDzd }],
            num_items: qty,
            value: item.priceDzd * qty,
            currency: FB_CURRENCY,
          });
        }
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
        });
      },
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
