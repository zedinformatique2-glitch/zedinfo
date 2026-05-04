import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    categorySlug: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { categorySlug, featured, limit }) => {
    let products;
    if (categorySlug) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", categorySlug))
        .unique();
      if (!category) return [];

      // If this is a parent category (no parentId), fetch products from all children
      if (category.parentId === undefined) {
        const children = await ctx.db
          .query("categories")
          .withIndex("by_parentId", (q) => q.eq("parentId", category._id))
          .collect();
        const childIds = children.map((c) => c._id);

        // Gather products from all child categories
        const allProducts = [];
        for (const childId of childIds) {
          const childProducts = await ctx.db
            .query("products")
            .withIndex("by_category", (q) => q.eq("categoryId", childId))
            .collect();
          allProducts.push(...childProducts);
        }
        products = allProducts;
      } else {
        products = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();
      }
    } else if (featured !== undefined) {
      products = await ctx.db
        .query("products")
        .withIndex("by_featured", (q) => q.eq("featured", featured))
        .collect();
    } else {
      products = await ctx.db.query("products").collect();
    }
    return limit ? products.slice(0, limit) : products;
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    if (args.categoryId) {
      return await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("products").paginate(args.paginationOpts);
  },
});

export const listPromo = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const all = await ctx.db.query("products").collect();
    const promo = all.filter(
      (p) => p.comparePriceDzd !== undefined && p.comparePriceDzd > p.priceDzd
    );
    return limit ? promo.slice(0, limit) : promo;
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!product) return null;
    const category = await ctx.db.get(product.categoryId);
    return { ...product, category };
  },
});

export const byIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, { ids }) => {
    const rows = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return rows.filter((r) => r !== null);
  },
});

function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export const search = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const normalized = normalizeSearch(q);
    if (!normalized) return [];
    const tokens = normalized.split(" ").filter(Boolean);
    if (tokens.length === 0) return [];

    const all = await ctx.db.query("products").collect();
    type Hit = { product: (typeof all)[number]; score: number };
    const hits: Hit[] = [];

    for (const p of all) {
      const name = normalizeSearch(`${p.nameFr} ${p.nameAr} ${p.brand}`);
      const rest = normalizeSearch(`${p.slug} ${p.descFr} ${p.descAr}`);
      const haystack = `${name} ${rest}`;
      if (!tokens.every((t) => haystack.includes(t))) continue;
      const nameHits = tokens.filter((t) => name.includes(t)).length;
      hits.push({ product: p, score: nameHits });
    }

    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, 50).map((h) => h.product);
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    categoryId: v.id("categories"),
    brand: v.string(),
    nameFr: v.string(),
    nameAr: v.string(),
    descFr: v.string(),
    descAr: v.string(),
    priceDzd: v.number(),
    stock: v.number(),
    images: v.array(v.string()),
    featured: v.boolean(),
    requiresBuild: v.optional(v.boolean()),
    requiresBuildNoteFr: v.optional(v.string()),
    requiresBuildNoteAr: v.optional(v.string()),
    requiresBuildNoteEn: v.optional(v.string()),
    specs: v.any(),
    colorVariants: v.optional(
      v.array(
        v.object({
          hex: v.string(),
          nameFr: v.optional(v.string()),
          nameAr: v.optional(v.string()),
          image: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    patch: v.any(),
  },
  handler: async (ctx, { id, patch }) => {
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
