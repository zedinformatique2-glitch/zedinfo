import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getAdapter } from "./carriers";

const DEFAULT_CARRIERS = [
  { slug: "yalidine", name: "Yalidine", hasApi: true },
  { slug: "zr_express", name: "ZR Express", hasApi: true },
  { slug: "maystro", name: "Maystro Delivery", hasApi: true },
  { slug: "ecotrack", name: "Ecotrack", hasApi: true },
  { slug: "noest", name: "Noest Express", hasApi: true },
  { slug: "ems", name: "EMS / Algérie Poste", hasApi: false },
  { slug: "northeast", name: "NorthEast Delivery", hasApi: false },
  { slug: "custom", name: "Custom", hasApi: false },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("deliveryCarriers").collect();
  },
});

export const getEnabledCarriers = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("deliveryCarriers").collect();
    return all.filter((c) => c.enabled);
  },
});

export const upsert = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    enabled: v.boolean(),
    credentials: v.optional(v.object({
      apiId: v.optional(v.string()),
      apiToken: v.optional(v.string()),
      bearerToken: v.optional(v.string()),
      userGuid: v.optional(v.string()),
    })),
    isDefault: v.boolean(),
    hasApi: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deliveryCarriers")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    // If setting as default, unset others
    if (args.isDefault) {
      const all = await ctx.db.query("deliveryCarriers").collect();
      for (const c of all) {
        if (c.isDefault && c.slug !== args.slug) {
          await ctx.db.patch(c._id, { isDefault: false });
        }
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        enabled: args.enabled,
        credentials: args.credentials,
        isDefault: args.isDefault,
        hasApi: args.hasApi,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("deliveryCarriers", {
        ...args,
        verified: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deliveryCarriers")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const setVerified = internalMutation({
  args: { slug: v.string(), verified: v.boolean() },
  handler: async (ctx, args) => {
    const carrier = await ctx.db
      .query("deliveryCarriers")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (carrier) {
      await ctx.db.patch(carrier._id, { verified: args.verified });
    }
  },
});

export const ensureDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("deliveryCarriers").collect();
    const existing = new Set(all.map((c) => c.slug));
    let added = 0;
    for (const c of DEFAULT_CARRIERS) {
      if (existing.has(c.slug)) continue;
      await ctx.db.insert("deliveryCarriers", {
        slug: c.slug,
        name: c.name,
        enabled: false,
        isDefault: false,
        hasApi: c.hasApi,
        verified: false,
        createdAt: Date.now(),
      });
      added++;
    }
    return { added };
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("deliveryCarriers").take(1);
    if (existing.length > 0) return "already seeded";

    for (const c of DEFAULT_CARRIERS) {
      await ctx.db.insert("deliveryCarriers", {
        slug: c.slug,
        name: c.name,
        enabled: false,
        isDefault: false,
        hasApi: c.hasApi,
        verified: false,
        createdAt: Date.now(),
      });
    }
    return "seeded";
  },
});

export const testConnection = action({
  args: {
    slug: v.string(),
    credentials: v.object({
      apiId: v.optional(v.string()),
      apiToken: v.optional(v.string()),
      bearerToken: v.optional(v.string()),
      userGuid: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const adapter = getAdapter(args.slug, args.credentials);
    if (!adapter) return { success: false, error: "No API adapter for this carrier" };

    try {
      const ok = await adapter.testConnection();
      await ctx.runMutation(internal.delivery.setVerified, { slug: args.slug, verified: ok });
      return { success: ok, error: ok ? undefined : "Connection failed" };
    } catch (e: any) {
      await ctx.runMutation(internal.delivery.setVerified, { slug: args.slug, verified: false });
      return { success: false, error: e.message || "Connection error" };
    }
  },
});

export const getFees = action({
  args: {
    slug: v.string(),
    credentials: v.object({
      apiId: v.optional(v.string()),
      apiToken: v.optional(v.string()),
      bearerToken: v.optional(v.string()),
      userGuid: v.optional(v.string()),
    }),
    fromWilaya: v.number(),
    toWilaya: v.number(),
    stopDesk: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    const adapter = getAdapter(args.slug, args.credentials);
    if (!adapter) return { fee: 0, error: "No adapter" };

    try {
      const fee = await adapter.getFees(args.fromWilaya, args.toWilaya, { stopDesk: args.stopDesk });
      return { fee, error: undefined };
    } catch (e: any) {
      return { fee: 0, error: e.message };
    }
  },
});

export const getDesks = action({
  args: {
    slug: v.string(),
    credentials: v.object({
      apiId: v.optional(v.string()),
      apiToken: v.optional(v.string()),
      bearerToken: v.optional(v.string()),
      userGuid: v.optional(v.string()),
    }),
  },
  handler: async (_ctx, args) => {
    const adapter = getAdapter(args.slug, args.credentials);
    if (!adapter || !adapter.getDesks) return { desks: [], error: "Carrier does not support desks" };
    try {
      const desks = await adapter.getDesks();
      return { desks, error: undefined };
    } catch (e: any) {
      return { desks: [], error: e.message };
    }
  },
});

export const createShipment = action({
  args: {
    slug: v.string(),
    credentials: v.object({
      apiId: v.optional(v.string()),
      apiToken: v.optional(v.string()),
      bearerToken: v.optional(v.string()),
      userGuid: v.optional(v.string()),
    }),
    shipment: v.object({
      orderNumber: v.string(),
      customerName: v.string(),
      phone: v.string(),
      address: v.string(),
      wilaya: v.string(),
      commune: v.optional(v.string()),
      totalAmount: v.number(),
      weight: v.optional(v.number()),
      isCod: v.boolean(),
      deliveryType: v.optional(v.union(v.literal("home"), v.literal("stopdesk"))),
      stationCode: v.optional(v.string()),
      productSummary: v.optional(v.string()),
    }),
  },
  handler: async (_ctx, args) => {
    const adapter = getAdapter(args.slug, args.credentials);
    if (!adapter) return { tracking: "", error: "No adapter" };

    try {
      const result = await adapter.createShipment(args.shipment);
      const trackingUrl = adapter.getTrackingUrl(result.tracking);
      return { ...result, trackingUrl, error: undefined };
    } catch (e: any) {
      return { tracking: "", error: e.message };
    }
  },
});
