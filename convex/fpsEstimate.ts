"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const estimateFps = action({
  args: {
    cpuName: v.string(),
    gpuName: v.string(),
    ramInfo: v.optional(v.string()),
    game: v.string(),
    resolution: v.string(),
    locale: v.optional(v.string()),
  },
  handler: async (_ctx, { cpuName, gpuName, ramInfo, game, resolution, locale }) => {
    const lang = locale === "ar" ? "Arabic" : locale === "en" ? "English" : "French";
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    const prompt = `You are a PC gaming benchmark expert. Estimate the FPS for this setup playing "${game}" at ${resolution} resolution.

CPU: ${cpuName}
GPU: ${gpuName}${ramInfo ? `\nRAM: ${ramInfo}` : ""}

Reply with ONLY valid JSON, no extra text:
{"fps": <number>, "quality": "<Low|Medium|High|Ultra>", "confidence": "<low|medium|high>", "tip": "<one short sentence recommendation in ${lang}>"}

Rules:
- fps = estimated average FPS at the quality preset you recommend
- quality = the preset that gives a good balance of visuals and performance for this hardware
- confidence = how confident you are based on known benchmarks
- tip = a short practical recommendation (in ${lang})
- Be realistic based on real-world benchmarks you know`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 256,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        fps: Number(parsed.fps) || 60,
        quality: String(parsed.quality || "Medium"),
        confidence: String(parsed.confidence || "medium"),
        tip: String(parsed.tip || ""),
      };
    } catch {
      return { fps: 60, quality: "Medium", confidence: "low", tip: "Estimation approximative." };
    }
  },
});
