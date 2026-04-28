"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import {
  checkCompatibility,
  type ConfigComponent,
  type ConfigSelection,
} from "../lib/configurator-engine";

type BuildTag = Record<string, string | string[]>;

function resolveBuild(build: BuildTag, products: any[]): ConfigSelection {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const toComp = (slug: string): ConfigComponent | undefined => {
    const p = bySlug.get(slug);
    if (!p) return undefined;
    return {
      _id: p._id,
      slug: p.slug,
      nameFr: p.nameFr,
      nameAr: p.nameAr,
      priceDzd: p.priceDzd,
      specs: p.specs,
    };
  };
  const sel: ConfigSelection = {};
  const single = (k: "cpu" | "motherboard" | "gpu" | "psu" | "case" | "cooler") => {
    const s = build[k];
    if (typeof s === "string") {
      const c = toComp(s);
      if (c) (sel as any)[k] = c;
    }
  };
  const multi = (k: "ram" | "storage") => {
    const s = build[k];
    const slugs = Array.isArray(s) ? s : typeof s === "string" ? [s] : [];
    const comps = slugs.map(toComp).filter((c): c is ConfigComponent => !!c);
    if (comps.length) (sel as any)[k] = comps;
  };
  single("cpu");
  single("motherboard");
  single("gpu");
  single("psu");
  single("case");
  single("cooler");
  multi("ram");
  multi("storage");
  return sel;
}

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
3. STRICT compatibility rules — NEVER violate these:
   a. CPU socket MUST match motherboard socket exactly (e.g. AM5↔AM5, LGA1700↔LGA1700).
   b. RAM type MUST match motherboard ramType (e.g. DDR5↔DDR5). Never pair DDR4 RAM with a DDR5 board.
   c. Motherboard formFactor MUST be in the case's supportedFormFactors list.
   d. GPU lengthMm MUST be ≤ case maxGpuLengthMm.
   e. Cooler socket list MUST include the CPU socket.
   f. Cooler heightMm MUST be ≤ case maxCoolerHeightMm.
   g. PSU wattage MUST be ≥ ceil((cpuTDP + gpuTDP + 100) × 1.3 / 50) × 50.
   h. If motherboard m2Slots is 0, do NOT recommend NVMe storage.
   i. Total RAM sticks MUST be ≤ motherboard ramSlots. Total RAM GB MUST be ≤ motherboard maxRam.
   Before outputting a build, mentally verify ALL rules above. If a rule would be violated, pick a different part or warn the user.
4. Respect budget constraints AND USE THE BUDGET. Prices are in DZD (Algerian Dinar).
   BUDGET TARGETING (critical):
   - Aim to spend 80–100% of the user's budget (or the upper end of a range). Never deliver a build that costs less than 70% of the budget if better parts exist in the catalog.
   - When the user gives a range like "15 to 20 million" (= 150,000–200,000 DZD after darija conversion), target the UPPER end of that range, not the lower.
   - After picking parts, sum the total. If total < 70% of budget, UPGRADE parts (better GPU first, then CPU, then more RAM, then better cooler/case/PSU/storage) until you are inside the target band.
   - If the user's budget exceeds what the catalog offers, say so explicitly and recommend the best build possible plus accessories (monitor, keyboard, mouse, headset) to use the remaining budget.
   - Reverse rule: do not blow past the user's budget. A "20 million" / 200,000 DZD ask must NOT receive a 2,000,000 DZD build.
   ALGERIAN DARIJA BUDGET CONVENTION (very important):
   - In Algerian darija/colloquial speech, "million" / "مليون" refers to centimes, NOT dinars. 1 dinar = 100 centimes, so 1 million centimes = 10,000 DZD.
   - "1 million" / "1 مليون" = 10,000 DZD.
   - "10 million" / "10 مليون" = 100,000 DZD.
   - "20 million" / "20 مليون" = 200,000 DZD.
   - "25 million" / "25 مليون" = 250,000 DZD.
   - "50 million" = 500,000 DZD. "100 million" = 1,000,000 DZD. "200 million" = 2,000,000 DZD.
   - Formula: spoken_millions × 10,000 = budget in DZD.
   - Range example: "20 ل 25 مليون" = 200,000 to 250,000 DZD (NOT 2,000,000 to 2,500,000).
   - Only treat the number as literal DZD if the user explicitly writes "DA", "DZD", "dinars", or "دج/دينار" after it (e.g. "1000000 DZD" is literal).
   - This is the STANDARD convention for ALL Algerian users. Apply it silently. DO NOT ask the user to clarify or confirm the conversion. DO NOT explain "حسب اتفاقية الدارجة" or "according to darija convention" — just use the converted DZD value internally and move on.
   ALGERIAN DARIJA VOCABULARY:
   - "ميكرو" / "micro" in Algerian darija means PC / computer (NOT microphone). "خصتي ميكرو" = "I need a PC". Only treat it as microphone if the user clearly says "ميكروفون" / "microphone" / "mic for streaming" etc.
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

    const callLlm = async (msgs: { role: "system" | "user" | "assistant"; content: string }[]) => {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-haiku-4-5",
          max_tokens: 1024,
          messages: msgs,
        }),
      });
      if (!r.ok) throw new Error(`OpenRouter error ${r.status}: ${await r.text()}`);
      const j = await r.json();
      return (j.choices?.[0]?.message?.content ?? "") as string;
    };

    const conversation: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let text = await callLlm(conversation);

    const parseBuild = (s: string): BuildTag | null => {
      const m = s.match(/<!--BUILD:(.*?)-->/);
      if (!m) return null;
      try {
        return JSON.parse(m[1]);
      } catch {
        return null;
      }
    };

    let build = parseBuild(text);

    // Server-side compatibility validation with one retry
    if (build) {
      const sel = resolveBuild(build, inStock);
      const result = checkCompatibility(sel);
      if (result.errors.length > 0) {
        conversation.push({ role: "assistant", content: text });
        conversation.push({
          role: "user",
          content: `Your build has compatibility errors. Fix them and re-emit the full build tag:\n${result.errors
            .map((e) => `- ${e}`)
            .join("\n")}\n\nDouble-check rule 3 (sockets, RAM type, form factor, GPU/cooler clearance, PSU wattage) before answering.`,
        });
        text = await callLlm(conversation);
        build = parseBuild(text);
      }
    }

    return { text: text.replace(/<!--BUILD:.*?-->/, "").trim(), build };
  },
});
