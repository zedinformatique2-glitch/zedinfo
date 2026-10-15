"use node";

import Anthropic from "@anthropic-ai/sdk";
import { action } from "./_generated/server";
import { v } from "convex/values";

// Same model and key as the configurator sales assistant (convex/aiChat.ts).
const MODEL = "claude-haiku-5-5";

export const estimateFps = action({
  args: {
    cpuName: v.string(),
    gpuName: v.string(),
    ramInfo: v.optional(v.string()),
    game: v.string(),
    resolution: v.string(),
    locale: v.optional(v.string()),
  },
  handler: async (_ctx, { cpuName, gpuName, ramInfo, game, resolution }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("The FPS estimator is not configured (ANTHROPIC_API_KEY is not set).");

    // Keep user-supplied text short so the prompt stays small.
    const clip = (s: string) => s.slice(0, 200);

    const prompt = `You are a PC gaming benchmark expert. Estimate the FPS for this setup playing "${clip(game)}" at ${clip(resolution)} resolution.

CPU: ${clip(cpuName)}
GPU: ${clip(gpuName)}${ramInfo ? `\nRAM: ${clip(ramInfo)}` : ""}

Reply with ONLY valid JSON, no extra text:
{"fps": <number>, "quality": "<Low|Medium|High|Ultra>", "confidence": "<low|medium|high>"}

Rules:
- fps = estimated average FPS at the quality preset you recommend
- quality = the preset that gives a good balance of visuals and performance for this hardware
- confidence = how confident you are based on known benchmarks
- Be realistic based on real-world benchmarks you know`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    });
    console.log(
      `estimateFps: stop=${response.stop_reason} in=${response.usage.input_tokens} out=${response.usage.output_tokens}`
    );

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        fps: Number(parsed.fps) || 60,
        quality: String(parsed.quality || "Medium"),
        confidence: String(parsed.confidence || "medium"),
        // The configurator shows the number only — no advice that could talk a
        // customer out of the build they are configuring. `tip` stays in the
        // shape because the UI reuses that line for error messages.
        tip: "",
      };
    } catch {
      return { fps: 60, quality: "Medium", confidence: "low", tip: "" };
    }
  },
});
