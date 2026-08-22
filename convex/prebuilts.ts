import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prebuilts").collect();
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    // `.first()`, not `.unique()` — see the note on `products.bySlug`.
    const pb = await ctx.db
      .query("prebuilts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!pb) return null;
    const components = await Promise.all(pb.componentIds.map((id) => ctx.db.get(id)));
    return { ...pb, components: components.filter((c) => c !== null) };
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    nameFr: v.string(),
    nameAr: v.string(),
    descFr: v.string(),
    descAr: v.string(),
    priceDzd: v.number(),
    componentIds: v.array(v.id("products")),
    heroImage: v.string(),
    gallery: v.array(v.string()),
    benchmarks: v.array(
      v.object({
        game: v.string(),
        fps1080: v.number(),
        fps1440: v.number(),
        fps4k: v.number(),
      })
    ),
    stock: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("prebuilts", args);
  },
});
