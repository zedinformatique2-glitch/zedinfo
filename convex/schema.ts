import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    slug: v.string(),
    nameFr: v.string(),
    nameAr: v.string(),
    icon: v.string(),
    order: v.number(),
    parentId: v.optional(v.id("categories")),
  }).index("by_slug", ["slug"])
    .index("by_parentId", ["parentId"]),

  products: defineTable({
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
    comparePriceDzd: v.optional(v.number()),
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
    specs: v.any(), // Typed spec blob handled at app layer
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_featured", ["featured"])
    .searchIndex("search_name", {
      searchField: "nameFr",
      filterFields: ["categoryId", "brand"],
    }),

  prebuilts: defineTable({
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
  }).index("by_slug", ["slug"]),

  orders: defineTable({
    orderNumber: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("shipping"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
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
    subtotalDzd: v.number(),
    shippingDzd: v.number(),
    totalDzd: v.number(),
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
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
    carrierTrackingUrl: v.optional(v.string()),
    deliveryType: v.optional(v.union(v.literal("home"), v.literal("stopdesk"))),
    stationCode: v.optional(v.string()),
    statusHistory: v.optional(v.array(v.object({
      status: v.string(),
      timestamp: v.number(),
      note: v.optional(v.string()),
    }))),
    estimatedDelivery: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orderNumber", ["orderNumber"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  deliveryCarriers: defineTable({
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
    verified: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  promotions: defineTable({
    productId: v.id("products"),
    prompt: v.string(),
    imageStorageId: v.id("_storage"),
    imageUrl: v.string(),
    aspectRatio: v.string(),
    platform: v.optional(v.union(v.literal("facebook"), v.literal("instagram"), v.literal("both"))),
    postedAt: v.optional(v.number()),
    postId: v.optional(v.string()),
    costUsd: v.optional(v.number()),
    model: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_product", ["productId"]).index("by_createdAt", ["createdAt"]),

  savedBuilds: defineTable({
    shareCode: v.string(),
    componentIds: v.array(v.id("products")),
    totalDzd: v.number(),
    createdAt: v.number(),
  }).index("by_shareCode", ["shareCode"]),

  landingPages: defineTable({
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
    views: v.number(),
    orders: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_product", ["productId"])
    .index("by_createdAt", ["createdAt"]),
});
