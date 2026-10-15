import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { CONFIG_SLOTS } from "../lib/configurator-engine";
import { MAX_BUILD_ITEMS, isValidShareCode } from "../lib/saved-build";

const SLOT_KEYS = new Set<string>(CONFIG_SLOTS.map((s) => s.key));

function genShareCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to misread
  let code = "";
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export const saveBuild = mutation({
  args: {
    componentIds: v.array(v.id("products")),
    totalDzd: v.number(),
    items: v.optional(
      v.array(v.object({ slot: v.string(), productId: v.id("products") }))
    ),
  },
  handler: async (ctx, args) => {
    // Newer pages send `items` (slot + product); older cached pages only send ids.
    const items = args.items ?? null;
    const ids = items ? items.map((i) => i.productId) : args.componentIds;
    if (ids.length === 0) throw new Error("Choose at least one part before saving.");
    if (ids.length > MAX_BUILD_ITEMS) throw new Error("This build has too many parts to save.");
    if (items && items.some((i) => !SLOT_KEYS.has(i.slot))) {
      throw new Error("This build contains an unknown part type.");
    }

    // Total comes from current catalog prices, not from the browser.
    let totalDzd = 0;
    for (const id of ids) {
      const p = await ctx.db.get(id);
      if (!p) throw new Error("One of the parts in this build no longer exists.");
      totalDzd += p.priceDzd;
    }

    let shareCode = genShareCode();
    for (let tries = 0; tries < 5; tries++) {
      const taken = await ctx.db
        .query("savedBuilds")
        .withIndex("by_shareCode", (q) => q.eq("shareCode", shareCode))
        .first();
      if (!taken) break;
      shareCode = genShareCode();
    }

    await ctx.db.insert("savedBuilds", {
      shareCode,
      componentIds: ids,
      totalDzd,
      createdAt: Date.now(),
      ...(items ? { items } : {}),
    });
    return { shareCode };
  },
});

/** Configurator slot for a product, from its category (or the category's parent). */
async function slotForProduct(ctx: QueryCtx, p: Doc<"products">): Promise<string | null> {
  const cat = await ctx.db.get(p.categoryId);
  if (!cat) return null;
  const parent = cat.parentId ? await ctx.db.get(cat.parentId) : null;
  const slugs = [cat.slug, parent?.slug];
  return CONFIG_SLOTS.find((s) => slugs.includes(s.categorySlug))?.key ?? null;
}

export const byCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    if (!isValidShareCode(code)) return null;
    const build = await ctx.db
      .query("savedBuilds")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", code.toUpperCase()))
      .first();
    if (!build) return null;

    const components = (
      await Promise.all(build.componentIds.map((id) => ctx.db.get(id)))
    ).filter((c): c is Doc<"products"> => c !== null);

    let items: { slot: string; productId: Id<"products"> }[];
    if (build.items) {
      items = build.items;
    } else {
      items = [];
      for (const p of components) {
        const slot = await slotForProduct(ctx, p);
        if (slot) items.push({ slot, productId: p._id });
      }
    }
    return { shareCode: build.shareCode, totalDzd: build.totalDzd, createdAt: build.createdAt, items, components };
  },
});
