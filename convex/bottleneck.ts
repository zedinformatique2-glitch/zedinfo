import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCached = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("bottleneckCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return row ? row.result : null;
  },
});

export const setCached = mutation({
  args: { key: v.string(), result: v.string() },
  handler: async (ctx, { key, result }) => {
    const existing = await ctx.db
      .query("bottleneckCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { hits: existing.hits + 1 });
      return;
    }
    await ctx.db.insert("bottleneckCache", {
      key,
      result,
      hits: 1,
      createdAt: Date.now(),
    });
  },
});

export const recommendUpgrades = query({
  args: {
    bottleneckedComponent: v.union(v.literal("cpu"), v.literal("gpu"), v.literal("balanced")),
    minTierScore: v.number(),
    sourceCpuSocket: v.optional(v.string()),
    sourceCpuId: v.optional(v.id("products")),
    sourceGpuId: v.optional(v.id("products")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    if (args.bottleneckedComponent === "balanced") {
      return { products: [], socketMismatch: false };
    }

    const all = await ctx.db.query("products").collect();
    const targetType = args.bottleneckedComponent;
    const excludeId = args.bottleneckedComponent === "cpu" ? args.sourceCpuId : args.sourceGpuId;

    const candidates = all.filter((p) => {
      if (excludeId && p._id === excludeId) return false;
      const specs = p.specs as { type?: string; tierScore?: number; socket?: string } | undefined;
      if (specs?.type !== targetType) return false;
      if (typeof specs.tierScore !== "number") return false;
      if (specs.tierScore < args.minTierScore) return false;
      return true;
    });

    if (args.bottleneckedComponent === "gpu") {
      candidates.sort((a, b) => a.priceDzd - b.priceDzd);
      return {
        products: candidates.slice(0, limit),
        socketMismatch: false,
      };
    }

    // CPU upgrade path — socket-aware
    if (args.sourceCpuSocket) {
      const sameSocket = candidates.filter((p) => {
        const s = (p.specs as { socket?: string }).socket;
        return s === args.sourceCpuSocket;
      });
      if (sameSocket.length > 0) {
        sameSocket.sort((a, b) => a.priceDzd - b.priceDzd);
        return {
          products: sameSocket.slice(0, limit),
          socketMismatch: false,
        };
      }
    }

    candidates.sort((a, b) => a.priceDzd - b.priceDzd);
    return {
      products: candidates.slice(0, limit),
      socketMismatch: true,
    };
  },
});
