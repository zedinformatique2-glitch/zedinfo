"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

const PROMPT_VERSION = 1;

type BottleneckEstimateResult =
  | {
      bottleneckPercent: number;
      bottleneckedComponent: "cpu" | "gpu" | "balanced";
      verdict: string;
      explanation: string;
      confidence: string;
      warnings: unknown[];
      error?: string;
    }
  | { error: string };

function normalize(s: string): string {
  return s.toLowerCase().trim().normalize("NFKD").replace(/\s+/g, " ");
}

function buildKey(args: {
  cpuName: string;
  gpuName: string;
  resolution: string;
  task: string;
  locale: string;
}): string {
  return [
    `v${PROMPT_VERSION}`,
    args.locale,
    args.resolution,
    args.task,
    normalize(args.cpuName),
    normalize(args.gpuName),
  ].join("|");
}

export const estimate = action({
  args: {
    cpuName: v.string(),
    gpuName: v.string(),
    resolution: v.string(),
    task: v.string(),
    locale: v.optional(v.string()),
    ramGb: v.optional(v.number()),
    psuWatts: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<BottleneckEstimateResult> => {
    const locale = args.locale ?? "fr";
    const cacheKey = buildKey({
      cpuName: args.cpuName,
      gpuName: args.gpuName,
      resolution: args.resolution,
      task: args.task,
      locale,
    });

    const cached: string | null = await ctx.runQuery(api.bottleneck.getCached, {
      key: cacheKey,
    });
    if (cached) {
      try {
        return JSON.parse(cached) as BottleneckEstimateResult;
      } catch {
        // Corrupt cache entry — ignore and recompute.
      }
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    const lang =
      locale === "ar" ? "Arabic" : locale === "en" ? "English" : "French";

    const prompt = `You are a PC hardware bottleneck expert.

Estimate the CPU/GPU bottleneck for this setup:
CPU: ${args.cpuName}
GPU: ${args.gpuName}
Resolution: ${args.resolution}
Workload: ${args.task} (gaming / streaming / content)
${args.ramGb ? `RAM: ${args.ramGb} GB` : ""}
${args.psuWatts ? `PSU: ${args.psuWatts} W` : ""}

If the CPU or GPU name is not real hardware, return:
{"error":"invalid_hardware"}

Otherwise, reply with ONLY valid JSON, no extra text:
{"bottleneckPercent": <0-40>, "bottleneckedComponent": "<cpu|gpu|balanced>", "verdict": "<one short sentence in ${lang}>", "explanation": "<2-3 sentences in ${lang}>", "confidence": "<low|medium|high>", "warnings": [{"type":"<ram|psu>","message":"<short string in ${lang}>"}]}

Rules:
- bottleneckPercent: 0 = perfectly balanced, 40 = severe mismatch
- bottleneckedComponent: "cpu" if CPU limits, "gpu" if GPU limits, "balanced" if <5%
- 1080p tilts toward CPU, 4K tilts toward GPU. Streaming/content add CPU load.
- Only include warnings array entries when the RAM or PSU value provided is clearly insufficient. Omit the warnings field entirely if no concerns.
- Be realistic; lean conservative (lower confidence) for parts you don't recognize.`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-haiku-4-5",
          max_tokens: 512,
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return {
        bottleneckPercent: 0,
        bottleneckedComponent: "balanced",
        verdict: "",
        explanation: "",
        confidence: "low",
        warnings: [],
        error: "parse_failure",
      };
    }

    if ((parsed as { error?: string }).error === "invalid_hardware") {
      return { error: "invalid_hardware" };
    }

    const result = {
      bottleneckPercent: Math.min(
        Math.max(Number(parsed.bottleneckPercent) || 0, 0),
        40
      ),
      bottleneckedComponent:
        (parsed.bottleneckedComponent as "cpu" | "gpu" | "balanced") ??
        "balanced",
      verdict: String(parsed.verdict ?? ""),
      explanation: String(parsed.explanation ?? ""),
      confidence: String(parsed.confidence ?? "medium"),
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };

    await ctx.runMutation(api.bottleneck.setCached, {
      key: cacheKey,
      result: JSON.stringify(result),
    });

    return result;
  },
});
