import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("categories").collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

/** Top-level parent categories only (parentId undefined) */
export const listParents = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("categories").collect();
    return all
      .filter((c) => c.parentId === undefined)
      .sort((a, b) => a.order - b.order);
  },
});

/** Children of a given parent category */
export const listChildren = query({
  args: { parentId: v.id("categories") },
  handler: async (ctx, { parentId }) => {
    const children = await ctx.db
      .query("categories")
      .withIndex("by_parentId", (q) => q.eq("parentId", parentId))
      .collect();
    return children.sort((a, b) => a.order - b.order);
  },
});

/** Full hierarchy: parents with nested children array */
export const listHierarchy = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("categories").collect();
    const parents = all
      .filter((c) => c.parentId === undefined)
      .sort((a, b) => a.order - b.order);

    return parents.map((parent) => ({
      ...parent,
      children: all
        .filter((c) => c.parentId === parent._id)
        .sort((a, b) => a.order - b.order),
    }));
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    nameFr: v.string(),
    nameAr: v.string(),
    icon: v.string(),
    order: v.number(),
    parentId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    slug: v.string(),
    nameFr: v.string(),
    nameAr: v.string(),
    icon: v.string(),
    order: v.number(),
    parentId: v.optional(v.id("categories")),
  },
  handler: async (ctx, { id, ...rest }) => {
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
