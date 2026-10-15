// Pure data tools for the PC-builder assistant (convex/aiChat.ts).
// The model never sees the raw catalog: it calls these through tool use, and
// every build it proposes goes through reviewBuild() before the customer sees it.

import {
  checkCompatibility,
  type ConfigComponent,
  type ConfigSelection,
} from "./configurator-engine";

export type CatalogProduct = {
  _id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  brand: string;
  priceDzd: number;
  stock: number;
  specs?: { type?: string; [key: string]: unknown };
};

export type SearchFilters = {
  type?: string;
  query?: string;
  minPriceDzd?: number;
  maxPriceDzd?: number;
  socket?: string;
  ramType?: string;
  limit?: number;
};

export type PartHit = {
  slug: string;
  name: string;
  brand: string;
  priceDzd: number;
  stock: number;
  specs?: CatalogProduct["specs"];
};

const SINGLE_SLOTS = ["cpu", "motherboard", "gpu", "psu", "case"] as const;
const MULTI_SLOTS = ["ram", "storage", "cooler"] as const;
/** Without these the PC cannot be ordered as a working machine. GPU and cooler are optional (iGPU, boxed cooler). */
const ESSENTIAL_SLOTS = ["cpu", "motherboard", "ram", "storage", "psu", "case"] as const;
const LOW_STOCK = 3;

export type BuildSlugs = Record<string, string | string[]>;

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();
}

const eq = (a: unknown, b: string) =>
  typeof a === "string" && a.trim().toUpperCase() === b.trim().toUpperCase();

/** One line per in-stock category ("cpu", "PC Gaming", "Moniteurs", …) with count and price range. */
export function catalogOverview(products: CatalogProduct[]): string {
  const groups = new Map<string, number[]>();
  for (const p of products) {
    if (p.stock <= 0) continue;
    const kind = p.specs?.type?.trim() || "other";
    const prices = groups.get(kind) ?? [];
    prices.push(p.priceDzd);
    groups.set(kind, prices);
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([kind, prices]) => `${kind}: ${prices.length} in stock, ${Math.min(...prices)}–${Math.max(...prices)} DZD`)
    .join("\n");
}

export function searchParts(products: CatalogProduct[], f: SearchFilters): PartHit[] {
  const tokens = f.query ? normalize(f.query).split(" ").filter(Boolean) : [];
  const limit = Math.min(Math.max(f.limit ?? 8, 1), 30);

  return products
    .filter((p) => {
      if (p.stock <= 0) return false;
      if (f.type && !eq(p.specs?.type, f.type)) return false;
      if (f.minPriceDzd !== undefined && p.priceDzd < f.minPriceDzd) return false;
      if (f.maxPriceDzd !== undefined && p.priceDzd > f.maxPriceDzd) return false;
      if (f.socket && !eq(p.specs?.socket, f.socket)) return false;
      if (f.ramType && !eq(p.specs?.ramType, f.ramType)) return false;
      if (tokens.length) {
        const hay = normalize(`${p.nameFr} ${p.nameAr} ${p.brand} ${p.slug}`);
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    })
    .sort((a, b) => b.priceDzd - a.priceDzd)
    .slice(0, limit)
    .map((p) => ({
      slug: p.slug,
      name: p.nameFr,
      brand: p.brand,
      priceDzd: p.priceDzd,
      stock: p.stock,
      specs: p.specs,
    }));
}

function toComp(p: CatalogProduct): ConfigComponent {
  return {
    _id: p._id,
    slug: p.slug,
    nameFr: p.nameFr,
    nameAr: p.nameAr,
    priceDzd: p.priceDzd,
    specs: p.specs as ConfigComponent["specs"],
  };
}

export function resolveBuild(
  build: BuildSlugs,
  products: CatalogProduct[]
): { selection: ConfigSelection; problems: string[] } {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const selection: ConfigSelection = {};
  const problems: string[] = [];

  const pick = (slot: string, slug: string): ConfigComponent | undefined => {
    const p = bySlug.get(slug);
    if (!p) {
      problems.push(`${slot}: "${slug}" is not in the catalog`);
      return undefined;
    }
    if (p.stock <= 0) {
      problems.push(`${slot}: "${slug}" is out of stock`);
      return undefined;
    }
    if (p.specs?.type !== slot) {
      problems.push(`${slot}: "${slug}" is a ${p.specs?.type ?? "non-PC product"}, not a ${slot}`);
      return undefined;
    }
    return toComp(p);
  };

  for (const slot of SINGLE_SLOTS) {
    const v = build[slot];
    const slug = Array.isArray(v) ? v[0] : v;
    if (!slug) continue;
    const c = pick(slot, slug);
    if (c) (selection as Record<string, unknown>)[slot] = c;
  }
  for (const slot of MULTI_SLOTS) {
    const v = build[slot];
    const slugs = Array.isArray(v) ? v : v ? [v] : [];
    // Repeated slugs mean several units (two RAM sticks): there must be enough in stock.
    const counts = new Map<string, number>();
    for (const s of slugs) counts.set(s, (counts.get(s) ?? 0) + 1);
    for (const [s, n] of counts) {
      const stock = bySlug.get(s)?.stock ?? 0;
      if (n > 1 && stock > 0 && n > stock) problems.push(`${slot}: "${s}" ×${n} but only ${stock} in stock`);
    }
    const comps = slugs.map((s) => pick(slot, s)).filter((c): c is ConfigComponent => !!c);
    if (comps.length) (selection as Record<string, unknown>)[slot] = comps;
  }
  return { selection, problems };
}

export type ProductLine = { slug: string; qty: number };

/** Standalone products (ready-made PCs, monitors, peripherals) the customer can order as-is. */
export function reviewProducts(
  lines: ProductLine[],
  products: CatalogProduct[]
): { ok: boolean; errors: string[]; items: ProductLine[]; totalDzd: number } {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const errors: string[] = [];
  const items: ProductLine[] = [];
  let totalDzd = 0;
  for (const { slug, qty } of lines) {
    const p = bySlug.get(slug);
    const n = Math.max(1, Math.floor(qty || 1));
    if (!p) errors.push(`"${slug}" is not in the catalog`);
    else if (p.stock <= 0) errors.push(`"${slug}" is out of stock`);
    else if (n > p.stock) errors.push(`"${slug}": only ${p.stock} in stock`);
    else {
      items.push({ slug, qty: n });
      totalDzd += p.priceDzd * n;
    }
  }
  return { ok: errors.length === 0 && items.length > 0, errors, items, totalDzd };
}

export type BuildReview = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  missingSlots: string[];
  totalDzd: number;
  recommendedPsuW: number;
  lowStock: string[];
  selection: ConfigSelection;
};

export function reviewBuild(build: BuildSlugs, products: CatalogProduct[]): BuildReview {
  const { selection, problems } = resolveBuild(build, products);
  const compat = checkCompatibility(selection);
  const missingSlots = ESSENTIAL_SLOTS.filter((s) => {
    const v = (selection as Record<string, unknown>)[s];
    return Array.isArray(v) ? v.length === 0 : !v;
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const usedSlugs = new Set(
    Object.values(selection)
      .flat()
      .map((c) => (c as ConfigComponent).slug)
  );
  const lowStock = [...usedSlugs].filter((s) => (bySlug.get(s)?.stock ?? 0) <= LOW_STOCK);
  const errors = [...problems, ...compat.errors];

  return {
    ok: errors.length === 0 && missingSlots.length === 0,
    errors,
    warnings: compat.warnings,
    missingSlots,
    totalDzd: compat.totalPrice,
    recommendedPsuW: compat.recommendedPsu,
    lowStock,
    selection,
  };
}
