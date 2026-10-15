// Turning a configurator build into a plain list of parts and back.
// Used for the build remembered in the browser and for saved/shared build links,
// so both always reload with the catalog's current prices and stock.

import {
  CONFIG_SLOTS,
  type ConfigComponent,
  type ConfigSelection,
  type ComponentSpec,
  type SlotKey,
} from "./configurator-engine";

export type BuildItem = { slot: string; productId: string };

/** The catalog fields needed to put a product back into a build. */
export type CatalogProduct = {
  _id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  priceDzd: number;
  stock?: number;
  specs: ComponentSpec;
};

const MULTI_SLOTS = new Set<SlotKey>(["ram", "storage", "cooler"]);
const SLOT_KEYS = new Set<string>(CONFIG_SLOTS.map((s) => s.key));

/** Most parts a saved build can hold — far above any real PC, blocks junk input. */
export const MAX_BUILD_ITEMS = 40;

export function isValidShareCode(code: string): boolean {
  return /^[A-Za-z0-9]{1,16}$/.test(code);
}

/** One item per part; RAM/storage/cooling repeat once per unit. */
export function selectionToItems(sel: ConfigSelection): BuildItem[] {
  const items: BuildItem[] = [];
  for (const { key } of CONFIG_SLOTS) {
    const value = (sel as Record<string, ConfigComponent | ConfigComponent[] | undefined>)[key];
    const parts = Array.isArray(value) ? value : value ? [value] : [];
    for (const p of parts) if (p._id) items.push({ slot: key, productId: p._id });
  }
  return items;
}

/**
 * Rebuild a selection from saved items using the live catalog. Parts that are
 * gone, out of stock, beyond available stock, or in an unknown/already-filled
 * slot are left out and counted in `skipped`.
 */
export function itemsToSelection(
  items: BuildItem[],
  catalog: Map<string, CatalogProduct>
): { selection: ConfigSelection; skipped: number } {
  const selection: Record<string, ConfigComponent | ConfigComponent[]> = {};
  const used = new Map<string, number>();
  let skipped = 0;

  for (const { slot, productId } of items.slice(0, MAX_BUILD_ITEMS)) {
    const p = catalog.get(productId);
    const inUse = used.get(productId) ?? 0;
    const multi = MULTI_SLOTS.has(slot as SlotKey);
    if (
      !SLOT_KEYS.has(slot) ||
      !p ||
      (p.stock ?? 0) <= inUse ||
      (!multi && selection[slot])
    ) {
      skipped++;
      continue;
    }
    const comp: ConfigComponent = {
      _id: p._id,
      slug: p.slug,
      nameFr: p.nameFr,
      nameAr: p.nameAr,
      priceDzd: p.priceDzd,
      specs: p.specs,
    };
    if (multi) selection[slot] = [...((selection[slot] as ConfigComponent[]) ?? []), comp];
    else selection[slot] = comp;
    used.set(productId, inUse + 1);
  }
  skipped += Math.max(0, items.length - MAX_BUILD_ITEMS);
  return { selection: selection as ConfigSelection, skipped };
}
