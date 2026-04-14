import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const promotions = await ctx.db
      .query("promotions")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
    const results = [];
    for (const promo of promotions) {
      const product = await ctx.db.get(promo.productId);
      results.push({ ...promo, product });
    }
    return results;
  },
});

export const getById = query({
  args: { id: v.id("promotions") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("promotions") },
  handler: async (ctx, { id }) => {
    const promo = await ctx.db.get(id);
    if (promo) {
      await ctx.storage.delete(promo.imageStorageId);
      await ctx.db.delete(id);
    }
  },
});

export const save = internalMutation({
  args: {
    productId: v.id("products"),
    prompt: v.string(),
    imageStorageId: v.id("_storage"),
    imageUrl: v.string(),
    aspectRatio: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("promotions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const markPosted = internalMutation({
  args: {
    id: v.id("promotions"),
    platform: v.union(v.literal("facebook"), v.literal("instagram"), v.literal("both")),
    postId: v.string(),
  },
  handler: async (ctx, { id, platform, postId }) => {
    await ctx.db.patch(id, {
      platform,
      postedAt: Date.now(),
      postId,
    });
  },
});
