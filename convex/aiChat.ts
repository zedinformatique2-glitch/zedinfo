"use node";

import Anthropic from "@anthropic-ai/sdk";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import {
  catalogOverview,
  reviewBuild,
  reviewProducts,
  searchParts,
  type BuildSlugs,
  type CatalogProduct,
  type ProductLine,
} from "../lib/ai-builder";

const MODEL = "claude-haiku-5-5";
const EFFORT = "medium" as const;
const MAX_TOOL_ROUNDS = 8;
const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 2000;

const SYSTEM_PROMPT = `You are the sales advisor of Zed Informatique, an Algerian PC and IT shop. You work inside the shop's PC configurator. Your job is to turn a customer's need into one concrete offer from our catalog and get them to order it.

How you work
- The catalog overview below lists every in-stock category with its price range. Use it to plan, then look up exact products with search_parts. Run independent searches in the same turn.
- Never name, price or promise a product you did not get from a tool in this conversation. Prices and stock change, so trust the tool, not memory.
- Two ways to make an offer, and every offer goes through one of them:
  • propose_build: a custom PC from parts (cpu, motherboard, ram, storage, psu, case, optional gpu and cooler). It checks compatibility, stock and the total with the shop's own engine. If it returns errors, fix the parts and call it again.
  • propose_products: ready-made PCs (category "PC Gaming" and similar), monitors, peripherals or any other product, as they are.
  Only an accepted offer reaches the customer, with a button that puts it in the cart and opens checkout. You may use both in one answer (a build plus a monitor).
- Always end with an accepted offer when anything in the catalog fits the budget. If a custom build does not fit, offer a ready-made PC, a build with integrated graphics, or the closest option. Do not stop at "the budget is not enough", and never send the customer to WhatsApp instead of an offer.
- If propose_build returns an error, replace only the part it names (search for an alternative that fixes it) and propose again. Keep the rest of the build.
- The shop's check only compares socket names. For older Intel, also match the chipset to the CPU generation yourself: on LGA1151, 6th/7th gen (i3/i5/i7-6xxx/7xxx) need a 100/200-series board (H110, B150, H170, Z170, B250, H270, Z270); 8th/9th gen (8xxx/9xxx) need a 300-series board (H310, B360, B365, H370, Z370, Z390).
- Prefer new parts. Offer a used part (USED or "occasion" in its name) only when the budget requires it, and say it is used.
- If the customer asks to change something, call the tool again with the full updated offer.
- Ask at most one short question, and only when you truly cannot choose (no usage and no budget at all). Otherwise assume sensible defaults (gaming at 1080p, 16 GB RAM minimum, SSD) and propose. "Low budget", "cheap" or "pas cher" without a number means: the cheapest build that reaches the customer's goal.

Budget
- Prices are in DZD. Aim for 85–100% of the budget, upper end of a range. Never exceed it. If parts are left over, upgrade GPU first, then CPU, then RAM, then storage.
- Balance a gaming build: the GPU takes the largest share (around 40%), and the CPU should not cost much more than the GPU. Higher resolutions need a stronger GPU, not a stronger CPU. For editing and work, favour CPU cores, 32 GB RAM and a fast NVMe.
- Algerian usage: "million" / "مليون" means a million centimes = 10,000 DZD. "15 مليون" = 150,000 DZD, "20 ل 25 مليون" = 200,000–250,000 DZD. Convert silently, never mention the conversion. Treat a number as plain DZD only when written with DA, DZD, دج or دينار.
- "ميكرو" / "micro" means a PC, not a microphone.
- If the budget is above what a PC needs, use the rest for a monitor or peripherals through propose_products.

Replies
- The customer sees only your final message, written after your last tool call. Put the whole reply there, complete on its own; text written next to a tool call is never shown. Once an offer is accepted, do not call more tools just to double-check.
- Write in the language and dialect of the customer's latest message (French, Arabic, Darija or English). If it mixes languages, use the one most of its words are in. Never answer in a language the customer did not write in. A first message of a few garbled letters is usually a greeting typed on the wrong keyboard; ignore its language. If unclear, use the page language given below. Write only in that language's script, except product names.
- Be short: a one-line intro at most, the offer, the closing line. No long explanations, no greetings, no markdown headers or bold.
- For an offer, list each item as "Item — price" on its own line, then the total. End with one line that closes: payment is cash on delivery, and the button below adds it to the cart. If a tool reports low stock, say so plainly (only then).
- Shipping cost depends on the wilaya and is shown at checkout. Do not invent warranty, delivery times or discounts; for those, point to WhatsApp support.
- Stay on topic: PCs, parts and our products.`;

const LOCALE_NAMES = { fr: "French", ar: "Arabic", en: "English" } as const;

const tools: Anthropic.Tool[] = [
  {
    name: "search_parts",
    description:
      "Search in-stock products, most expensive first. type is a category from the catalog overview: a PC slot (cpu, gpu, motherboard, ram, storage, psu, case, cooler) or any other category such as \"PC Gaming\" or \"Moniteurs\". Add socket/ramType to keep parts compatible, query to match words in the name. Returns slug, name, price in DZD, stock and specs.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", description: "Category from the catalog overview, case-insensitive." },
        query: { type: "string", description: "Words that must appear in the product name, e.g. 'rtx 4060' or 'ecran'." },
        minPriceDzd: { type: "number" },
        maxPriceDzd: { type: "number" },
        socket: { type: "string", description: "CPU/motherboard socket, e.g. AM5, AM4, LGA1700." },
        ramType: { type: "string", description: "DDR4 or DDR5 (RAM and motherboards)." },
        limit: { type: "number", description: "Max results, default 8, max 30." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "propose_build",
    description:
      "Check and present a PC build to the customer. Validates socket, RAM type, form factor, clearances and PSU wattage, checks stock, and computes the total. Requires at least cpu, motherboard, ram, storage, psu and case. Use product slugs from search_parts; ram, storage and cooler accept an array (repeat a slug for two identical sticks).",
    input_schema: {
      type: "object",
      properties: {
        cpu: { type: "string" },
        motherboard: { type: "string" },
        ram: { type: "array", items: { type: "string" } },
        gpu: { type: "string" },
        storage: { type: "array", items: { type: "string" } },
        psu: { type: "string" },
        case: { type: "string" },
        cooler: { type: "array", items: { type: "string" } },
      },
      required: ["cpu", "motherboard", "ram", "storage", "psu", "case"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_products",
    description:
      "Present products sold as they are (ready-made PCs, monitors, keyboards, mice, headsets, any other item) to the customer. Checks that each slug exists and is in stock in the requested quantity, and computes the total.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: { slug: { type: "string" }, qty: { type: "number" } },
            required: ["slug", "qty"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
];

const buildValidator = v.record(v.string(), v.union(v.string(), v.array(v.string())));
const productsValidator = v.array(v.object({ slug: v.string(), qty: v.number() }));

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        build: v.optional(v.union(buildValidator, v.null())),
        products: v.optional(v.union(productsValidator, v.null())),
      })
    ),
    locale: v.union(v.literal("fr"), v.literal("ar"), v.literal("en")),
  },
  handler: async (ctx, { messages, locale }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("The assistant is not configured (ANTHROPIC_API_KEY is not set).");
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      throw new Error("The last message must come from the customer.");
    }
    if (messages.some((m) => m.content.length > MAX_MESSAGE_CHARS)) {
      throw new Error(`Messages are limited to ${MAX_MESSAGE_CHARS} characters.`);
    }

    const products = (await ctx.runQuery(api.products.list, {
      inStockOnly: true,
    })) as unknown as CatalogProduct[];

    // Keep the recent history, starting on a customer message. Earlier builds are
    // replayed as text so the model can edit "the build" the customer is looking at.
    let recent = messages.slice(-MAX_HISTORY);
    while (recent.length && recent[0].role !== "user") recent = recent.slice(1);
    const history: Anthropic.MessageParam[] = recent.map((m) => {
      if (m.role !== "assistant") return { role: m.role, content: m.content };
      const shown = [
        m.build ? `[build shown to the customer: ${JSON.stringify(m.build)}]` : "",
        m.products?.length ? `[products shown to the customer: ${JSON.stringify(m.products)}]` : "",
      ].filter(Boolean);
      return { role: m.role, content: [m.content, ...shown].join("\n") };
    });

    const client = new Anthropic({ apiKey });
    const system: Anthropic.TextBlockParam[] = [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      {
        type: "text",
        text: `Catalog overview (in stock now):\n${catalogOverview(products)}\n\nPage language: ${LOCALE_NAMES[locale]}.`,
      },
    ];

    let build: { slugs: BuildSlugs; totalDzd: number } | null = null;
    let offer: { items: ProductLine[]; totalDzd: number } | null = null;
    let text = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const lastRound = round === MAX_TOOL_ROUNDS - 1;
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        output_config: { effort: EFFORT },
        system,
        tools,
        // On the last round the model must answer with what it has instead of searching again.
        ...(lastRound ? { tool_choice: { type: "none" as const } } : {}),
        messages: history,
      });
      console.log(
        `aiChat round ${round + 1}: stop=${response.stop_reason} in=${response.usage.input_tokens} cached=${response.usage.cache_read_input_tokens ?? 0} out=${response.usage.output_tokens}`
      );

      // The model often writes its answer next to its last tool call and then ends
      // with an empty turn, so keep the latest non-empty text.
      const roundText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      if (roundText) text = roundText;

      if (response.stop_reason !== "tool_use") break;

      history.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const input = (block.input ?? {}) as Record<string, unknown>;

        if (block.name === "search_parts") {
          const hits = searchParts(products, input);
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: hits.length ? JSON.stringify(hits) : "No in-stock product matches these filters.",
          });
        } else if (block.name === "propose_build") {
          const slugs = input as BuildSlugs;
          const review = reviewBuild(slugs, products);
          if (review.ok) build = { slugs, totalDzd: review.totalDzd };
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            is_error: !review.ok,
            content: JSON.stringify({
              accepted: review.ok,
              items: Object.entries(review.selection).flatMap(([slot, c]) =>
                (Array.isArray(c) ? c : [c]).map((x) => ({ slot, name: x.nameFr, priceDzd: x.priceDzd }))
              ),
              totalDzd: review.totalDzd,
              errors: review.errors,
              missingSlots: review.missingSlots,
              warnings: review.warnings,
              recommendedPsuW: review.recommendedPsuW,
              lowStock: review.lowStock,
            }),
          });
        } else if (block.name === "propose_products") {
          const lines = Array.isArray(input.items) ? (input.items as ProductLine[]) : [];
          const review = reviewProducts(lines, products);
          if (review.ok) offer = { items: review.items, totalDzd: review.totalDzd };
          const bySlug = new Map(products.map((p) => [p.slug, p]));
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            is_error: !review.ok,
            content: JSON.stringify({
              accepted: review.ok,
              items: review.items.map((i) => ({
                ...i,
                name: bySlug.get(i.slug)?.nameFr,
                priceDzd: bySlug.get(i.slug)?.priceDzd,
              })),
              totalDzd: review.totalDzd,
              errors: review.errors,
              lowStock: review.items.filter((i) => (bySlug.get(i.slug)?.stock ?? 0) <= 3).map((i) => i.slug),
            }),
          });
        } else {
          results.push({ type: "tool_result", tool_use_id: block.id, is_error: true, content: "Unknown tool." });
        }
      }
      const nextIsLast = round + 1 === MAX_TOOL_ROUNDS - 1;
      history.push({
        role: "user",
        content: nextIsLast
          ? [
              ...results,
              {
                type: "text",
                text: "Search limit reached. Answer the customer now with the best accepted offer, or the closest option if none fits.",
              },
            ]
          : results,
      });
    }

    return {
      text: text || (locale === "ar" ? "عذراً، حاول مرة أخرى." : locale === "en" ? "Sorry, please try again." : "Désolé, réessayez."),
      build: build?.slugs ?? null,
      products: offer?.items ?? null,
      totalDzd: build || offer ? (build?.totalDzd ?? 0) + (offer?.totalDzd ?? 0) : null,
    };
  },
});
