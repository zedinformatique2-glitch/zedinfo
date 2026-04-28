import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db.query("landingPages").withIndex("by_createdAt").order("desc").collect();
    const withProduct = await Promise.all(
      pages.map(async (p) => {
        const product = await ctx.db.get(p.productId);
        return { ...p, product };
      })
    );
    return withProduct;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const page = await ctx.db.query("landingPages").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!page || !page.enabled) return null;
    const product = await ctx.db.get(page.productId);
    if (!product) return null;
    return { ...page, product };
  },
});

export const slugAvailable = query({
  args: { slug: v.string(), excludeId: v.optional(v.id("landingPages")) },
  handler: async (ctx, { slug, excludeId }) => {
    if (!slug.trim()) return true;
    const existing = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!existing) return true;
    return excludeId ? existing._id === excludeId : false;
  },
});

export const getById = query({
  args: { id: v.id("landingPages") },
  handler: async (ctx, { id }) => {
    const page = await ctx.db.get(id);
    if (!page) return null;
    const product = await ctx.db.get(page.productId);
    return { ...page, product };
  },
});

const pageFields = {
  slug: v.string(),
  productId: v.id("products"),
  headlineFr: v.string(),
  headlineAr: v.string(),
  headlineEn: v.optional(v.string()),
  subheadlineFr: v.string(),
  subheadlineAr: v.string(),
  subheadlineEn: v.optional(v.string()),
  bulletsFr: v.array(v.string()),
  bulletsAr: v.array(v.string()),
  bulletsEn: v.optional(v.array(v.string())),
  bulletTitlesFr: v.optional(v.array(v.string())),
  bulletTitlesAr: v.optional(v.array(v.string())),
  bulletTitlesEn: v.optional(v.array(v.string())),
  descriptionFr: v.optional(v.string()),
  descriptionAr: v.optional(v.string()),
  descriptionEn: v.optional(v.string()),
  heroImage: v.optional(v.string()),
  priceOverrideDzd: v.optional(v.number()),
  comparePriceDzd: v.optional(v.number()),
  ctaFr: v.string(),
  ctaAr: v.string(),
  ctaEn: v.optional(v.string()),
  urgencyTextFr: v.optional(v.string()),
  urgencyTextAr: v.optional(v.string()),
  urgencyTextEn: v.optional(v.string()),
  guaranteeTextFr: v.optional(v.string()),
  guaranteeTextAr: v.optional(v.string()),
  guaranteeTextEn: v.optional(v.string()),
  scarcityTextFr: v.optional(v.string()),
  scarcityTextAr: v.optional(v.string()),
  scarcityTextEn: v.optional(v.string()),
  primaryColor: v.optional(v.string()),
  accentColor: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  textColor: v.optional(v.string()),
  defaultLang: v.optional(v.string()),
  showCountdown: v.boolean(),
  countdownEndsAt: v.optional(v.number()),
  showStockUrgency: v.boolean(),
  enabled: v.boolean(),
};

export const create = mutation({
  args: pageFields,
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("landingPages").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (existing) throw new Error("Slug already exists");
    const now = Date.now();
    return await ctx.db.insert("landingPages", {
      ...args,
      views: 0,
      orders: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: { id: v.id("landingPages"), ...pageFields },
  handler: async (ctx, { id, ...rest }) => {
    const existing = await ctx.db.query("landingPages").withIndex("by_slug", (q) => q.eq("slug", rest.slug)).unique();
    if (existing && existing._id !== id) throw new Error("Slug already exists");
    await ctx.db.patch(id, { ...rest, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("landingPages") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const incrementView = mutation({
  args: { id: v.id("landingPages") },
  handler: async (ctx, { id }) => {
    const p = await ctx.db.get(id);
    if (p) await ctx.db.patch(id, { views: p.views + 1 });
  },
});

export const incrementOrder = mutation({
  args: { id: v.id("landingPages") },
  handler: async (ctx, { id }) => {
    const p = await ctx.db.get(id);
    if (p) await ctx.db.patch(id, { orders: p.orders + 1 });
  },
});
