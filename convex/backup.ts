import { query } from "./_generated/server";
import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Tables included in a full snapshot. bottleneckCache is intentionally
// excluded — it is a regenerable cache, not business data.
type Snapshot = {
  version: number;
  takenAt: number;
  tables: Record<string, unknown[]>;
};

// Read every business table and bundle it into a single JSON snapshot.
// Returns the snapshot plus the deduped list of image URLs to copy.
export const collectData = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [
      categories,
      products,
      prebuilts,
      orders,
      landingPages,
      savedBuilds,
      promotions,
      deliveryCarriers,
    ] = await Promise.all([
      ctx.db.query("categories").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("prebuilts").collect(),
      ctx.db.query("orders").collect(),
      ctx.db.query("landingPages").collect(),
      ctx.db.query("savedBuilds").collect(),
      ctx.db.query("promotions").collect(),
      ctx.db.query("deliveryCarriers").collect(),
    ]);

    const snapshot: Snapshot = {
      version: 1,
      takenAt: Date.now(),
      tables: {
        categories,
        products,
        prebuilts,
        orders,
        landingPages,
        savedBuilds,
        promotions,
        deliveryCarriers,
      },
    };

    // Collect every image URL referenced anywhere, deduped.
    const urls = new Set<string>();
    const add = (u: unknown) => {
      if (typeof u === "string" && /^https?:\/\//.test(u)) urls.add(u);
    };
    for (const p of products) {
      (p.images ?? []).forEach(add);
      (p.colorVariants ?? []).forEach((c) => add(c.image));
    }
    for (const pb of prebuilts) {
      add(pb.heroImage);
      (pb.gallery ?? []).forEach(add);
    }
    for (const lp of landingPages) add(lp.heroImage);
    for (const promo of promotions) add(promo.imageUrl);
    for (const o of orders) {
      for (const item of o.items) {
        add(item.image);
        if (item.selectedColor) add(item.selectedColor.image);
      }
    }

    const counts = {
      categories: categories.length,
      products: products.length,
      prebuilts: prebuilts.length,
      orders: orders.length,
      landingPages: landingPages.length,
      savedBuilds: savedBuilds.length,
      promotions: promotions.length,
      deliveryCarriers: deliveryCarriers.length,
    };

    return { snapshot, imageUrls: [...urls], counts };
  },
});

export const recordStart = internalMutation({
  args: {
    prefix: v.string(),
    trigger: v.union(v.literal("manual"), v.literal("cron")),
    startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("backups", {
      prefix: args.prefix,
      status: "running",
      trigger: args.trigger,
      startedAt: args.startedAt,
    });
  },
});

export const recordFinish = internalMutation({
  args: {
    id: v.id("backups"),
    finishedAt: v.number(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    counts: v.optional(
      v.object({
        categories: v.number(),
        products: v.number(),
        prebuilts: v.number(),
        orders: v.number(),
        landingPages: v.number(),
        savedBuilds: v.number(),
        promotions: v.number(),
        deliveryCarriers: v.number(),
      })
    ),
    dataBytes: v.optional(v.number()),
    imageBytes: v.optional(v.number()),
    imagesTotal: v.optional(v.number()),
    imagesCopied: v.optional(v.number()),
    imagesFailed: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

// History for the admin panel, newest first.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("backups")
      .withIndex("by_startedAt")
      .order("desc")
      .take(50);
  },
});
