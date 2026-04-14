"use node";

import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";

export const generateImage = action({
  args: {
    productId: v.id("products"),
    prompt: v.string(),
    aspectRatio: v.string(),
  },
  handler: async (ctx, { productId, prompt, aspectRatio }): Promise<{ promoId: string; imageUrl: string }> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    // Fetch product
    const products: any[] = await ctx.runQuery(api.products.byIds, { ids: [productId] });
    const product = products[0];
    if (!product) throw new Error("Product not found");

    // Try to get product image as base64 for multimodal input
    let imageContent: any[] = [];
    if (product.images && product.images.length > 0) {
      try {
        const imgUrl = product.images[0];
        const imgResp = await fetch(imgUrl);
        if (imgResp.ok) {
          const buffer = await imgResp.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = imgResp.headers.get("content-type") || "image/jpeg";
          imageContent = [
            {
              type: "image_url",
              image_url: { url: `data:${contentType};base64,${base64}` },
            },
          ];
        }
      } catch {
        // Continue without image
      }
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        modalities: ["text", "image"],
        messages: [
          {
            role: "user",
            content: [
              ...imageContent,
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message;

    // Extract image from response - Gemini returns inline_data in content parts
    let imageBase64: string | null = null;
    let mimeType = "image/png";

    if (choice?.content && Array.isArray(choice.content)) {
      for (const part of choice.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          const dataUrl: string = part.image_url.url;
          if (dataUrl.startsWith("data:")) {
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              mimeType = match[1];
              imageBase64 = match[2];
            }
          }
        } else if (part.type === "inline_data") {
          mimeType = part.mime_type || "image/png";
          imageBase64 = part.data;
        }
      }
    }

    if (!imageBase64) {
      throw new Error("No image returned from AI model. Response: " + JSON.stringify(data.choices?.[0]?.message).slice(0, 500));
    }

    // Upload to Convex storage
    const binaryData = Buffer.from(imageBase64, "base64");
    const blob = new Blob([binaryData], { type: mimeType });
    const storageId = await ctx.storage.store(blob);
    const imageUrl = (await ctx.storage.getUrl(storageId))!;

    // Save record
    const promoId = await ctx.runMutation(internal.promotions.save, {
      productId,
      prompt,
      imageStorageId: storageId,
      imageUrl,
      aspectRatio,
    });

    return { promoId, imageUrl };
  },
});

export const postToMeta = action({
  args: {
    promoId: v.id("promotions"),
    platform: v.union(v.literal("facebook"), v.literal("instagram"), v.literal("both")),
    caption: v.string(),
  },
  handler: async (ctx, { promoId, platform, caption }) => {
    const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
    const pageId = process.env.META_PAGE_ID;
    const igAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID;

    if (!pageToken) throw new Error("META_PAGE_ACCESS_TOKEN not set");

    const promo: any = await ctx.runQuery(api.promotions.getById, { id: promoId });
    if (!promo) throw new Error("Promotion not found");

    const results: { facebook?: string; instagram?: string } = {};

    // Facebook
    if ((platform === "facebook" || platform === "both") && pageId) {
      const fbResp = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/photos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: promo.imageUrl,
            message: caption,
            access_token: pageToken,
          }),
        }
      );
      const fbData = await fbResp.json();
      if (fbData.id) results.facebook = fbData.id;
      else throw new Error("Facebook post failed: " + JSON.stringify(fbData));
    }

    // Instagram (two-step)
    if ((platform === "instagram" || platform === "both") && igAccountId) {
      const createResp = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: promo.imageUrl,
            caption,
            access_token: pageToken,
          }),
        }
      );
      const createData = await createResp.json();
      if (!createData.id) throw new Error("IG container failed: " + JSON.stringify(createData));

      const publishResp = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: createData.id,
            access_token: pageToken,
          }),
        }
      );
      const publishData = await publishResp.json();
      if (publishData.id) results.instagram = publishData.id;
      else throw new Error("IG publish failed: " + JSON.stringify(publishData));
    }

    // Update promotion record
    const postId = [results.facebook, results.instagram].filter(Boolean).join(",");
    await ctx.runMutation(internal.promotions.markPosted, {
      id: promoId,
      platform,
      postId,
    });

    return results;
  },
});
