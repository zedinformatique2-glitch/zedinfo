import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function genOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `ZED-${yy}${mm}${dd}-${rand}`;
}

export const create = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.optional(v.id("products")),
        slug: v.string(),
        nameFr: v.string(),
        nameAr: v.string(),
        priceDzd: v.number(),
        qty: v.number(),
        image: v.string(),
      })
    ),
    shippingDzd: v.number(),
    customer: v.object({
      fullName: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      wilaya: v.string(),
      commune: v.optional(v.string()),
      address: v.string(),
      notes: v.optional(v.string()),
    }),
    paymentMethod: v.union(v.literal("cod"), v.literal("whatsapp")),
    locale: v.union(v.literal("fr"), v.literal("ar"), v.literal("en")),
  },
  handler: async (ctx, args) => {
    const subtotal = args.items.reduce((s, i) => s + i.priceDzd * i.qty, 0);
    const total = subtotal + args.shippingDzd;
    const now = Date.now();
    const orderNumber = genOrderNumber();

    // Decrement stock atomically
    for (const item of args.items) {
      if (!item.productId) continue;
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          stock: Math.max(0, product.stock - item.qty),
        });
      }
    }

    const id = await ctx.db.insert("orders", {
      orderNumber,
      status: "pending",
      items: args.items,
      subtotalDzd: subtotal,
      shippingDzd: args.shippingDzd,
      totalDzd: total,
      customer: args.customer,
      paymentMethod: args.paymentMethod,
      locale: args.locale,
      createdAt: now,
      updatedAt: now,
    });
    return { id, orderNumber };
  },
});

export const byId = query({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const byOrderNumber = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, { orderNumber }) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", orderNumber))
      .unique();
  },
});

export const listAdmin = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("preparing"),
        v.literal("shipping"),
        v.literal("delivered"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, { status }) => {
    if (status) {
      return await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("orders").withIndex("by_createdAt").order("desc").take(200);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("shipping"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, note }) => {
    const order = await ctx.db.get(id);
    if (!order) throw new Error("Order not found");
    const now = Date.now();
    const historyEntry = { status, timestamp: now, note };
    const statusHistory = [...(order.statusHistory ?? []), historyEntry];
    await ctx.db.patch(id, { status, statusHistory, updatedAt: now });
  },
});

export const updateTracking = mutation({
  args: {
    id: v.id("orders"),
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
    carrierTrackingUrl: v.optional(v.string()),
    estimatedDelivery: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...tracking }) => {
    await ctx.db.patch(id, { ...tracking, updatedAt: Date.now() });
  },
});

export const trackOrder = query({
  args: {
    orderNumber: v.string(),
    phoneLast4: v.string(),
  },
  handler: async (ctx, { orderNumber, phoneLast4 }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", orderNumber))
      .unique();
    if (!order) return null;
    const cleanPhone = order.customer.phone.replace(/[^0-9]/g, "");
    if (!cleanPhone.endsWith(phoneLast4)) return null;
    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      subtotalDzd: order.subtotalDzd,
      shippingDzd: order.shippingDzd,
      totalDzd: order.totalDzd,
      customer: { fullName: order.customer.fullName, wilaya: order.customer.wilaya },
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      carrierTrackingUrl: order.carrierTrackingUrl,
      statusHistory: order.statusHistory,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
    };
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("orders").collect();
    const now = Date.now();
    const d7 = now - 7 * 24 * 60 * 60 * 1000;
    const d30 = now - 30 * 24 * 60 * 60 * 1000;
    return {
      totalOrders: all.length,
      pending: all.filter((o) => o.status === "pending").length,
      revenue7d: all.filter((o) => o.createdAt > d7).reduce((s, o) => s + o.totalDzd, 0),
      revenue30d: all.filter((o) => o.createdAt > d30).reduce((s, o) => s + o.totalDzd, 0),
    };
  },
});
