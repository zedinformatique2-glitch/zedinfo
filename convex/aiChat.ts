"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    locale: v.union(v.literal("fr"), v.literal("ar"), v.literal("en")),
  },
  handler: async (ctx, { messages, locale }) => {
    const products: any[] = await ctx.runQuery(api.products.list, {});
    const inStock = products.filter((p) => p.stock > 0 && p.specs?.type);

    const catalog = inStock
      .map(
        (p) =>
          `- slug:"${p.slug}" | ${p.nameFr} | ${p.priceDzd} DZD | type:${p.specs.type} | specs:${JSON.stringify(p.specs)}`
      )
      .join("\n");

    const lang = locale === "ar" ? "Arabic" : "French";

    const systemPrompt = `You are the AI PC builder assistant for Zed Informatique, an Algerian PC/IT shop. Help users build compatible PCs from the available catalog.

RULES:
1. Reply in ${lang}. Be concise, friendly, and helpful.
2. Only recommend products from the catalog below. Never invent products.
3. Ensure compatibility: matching CPU/motherboard socket, correct RAM type for motherboard, form factor fits case, GPU length fits case, cooler supports socket, PSU has 30% headroom over estimated wattage.
4. Respect budget constraints. Prices are in DZD (Algerian Dinar).
5. When recommending a full or partial build, embed a hidden build tag at the END of your message in this exact format:
   <!--BUILD:{"cpu":"slug","motherboard":"slug","ram":"slug","gpu":"slug","storage":"slug","psu":"slug","case":"slug","cooler":"slug"}-->
   Only include slots you are recommending. Use the exact product slug from the catalog.
   For ram and storage, if recommending one item, use a string. For multiple, use an array: "ram":["slug1","slug2"]
6. If the user asks to change one part, re-emit the full build tag with the updated selection.
7. If no products match the user's needs, say so honestly.

AVAILABLE PRODUCTS:
${catalog}`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    // Extract build from hidden tag
    let build: Record<string, string | string[]> | null = null;
    const buildMatch = text.match(/<!--BUILD:(.*?)-->/);
    if (buildMatch) {
      try {
        build = JSON.parse(buildMatch[1]);
      } catch {
        // ignore parse errors
      }
    }

    return { text: text.replace(/<!--BUILD:.*?-->/, "").trim(), build };
  },
});
