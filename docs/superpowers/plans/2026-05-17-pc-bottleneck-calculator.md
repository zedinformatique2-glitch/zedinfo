# PC Bottleneck Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a hybrid (catalog-deterministic + AI-fallback) PC bottleneck calculator at `/[locale]/bottleneck-calculator/` that converts traffic into upgrade purchases via socket-aware product recommendations.

**Architecture:** Curated `tierScore` numbers added to CPU/GPU products in the seed; a pure-TS engine (`lib/bottleneck-engine.ts`) computes resolution-aware bottleneck % from those scores. Free-text inputs fall through to a Convex action that calls OpenRouter (Claude Haiku) and caches results in a new `bottleneckCache` table. Recommendations are produced by a `recommendUpgrades` query that filters by socket (for CPU upgrades) or PCIe (for GPUs).

**Tech Stack:** Next.js 15 App Router, next-intl 3.26 (FR/AR/EN), Tailwind CSS, Convex (queries/mutations/actions), Claude Haiku via OpenRouter (existing key), Zustand (not used here), react-hook-form (not used — simple useState form is enough).

**Reference spec:** `docs/superpowers/specs/2026-05-17-pc-bottleneck-calculator-design.md`

---

## Project-specific notes (read first)

- **No test framework** in this repo (CLAUDE.md confirms). "Verify" steps below use TypeScript compilation (`npm run build`) and manual browser smoke-testing, not Jest/Vitest. Do not introduce a test framework — out of scope.
- **`products.specs` is `v.any()`** — no schema validator change is needed to add `tierScore` or other fields to the typed spec blob. Types are enforced at the app layer (TS interfaces in `lib/bottleneck-engine.ts`).
- **Convex `_generated`** is committed. After any schema or function change, `npx convex dev` regenerates `convex/_generated/api.d.ts`. **You must `git add convex/_generated/api.d.ts`** in the same commit as the feature change, or the Vercel build will fail (per CLAUDE.md "Standard update flow").
- **OpenRouter** key is already in Convex env: `OPENROUTER_API_KEY`. Model: `anthropic/claude-haiku-4-5` (same as `convex/fpsEstimate.ts`).
- **3 locales:** every translation key must be added to `messages/fr.json`, `messages/ar.json`, AND `messages/en.json`.
- **RTL:** any directional spacing must use `ms-*` / `me-*` / `ps-*` / `pe-*`, not `ml-*` / `mr-*`.
- **Styling pattern for tool pages** matches `components/fps-estimator/FpsEstimatorStandalone.tsx` — dark gradient background (`from-slate-950 via-slate-900`), translucent panels (`bg-white/5 backdrop-blur ring-1 ring-white/10`), `rounded-2xl` on panels and `rounded-xl` on inputs.
- **Branch:** create a feature branch before starting: `git checkout -b feat/bottleneck-calculator`. Push to a worktree if you prefer isolation.

---

## File structure

```
convex/
  schema.ts                                  (edit: add bottleneckCache table)
  seedReal.ts                                (edit: add tierScore + benchmark_score to every cpu/gpu spec)
  products.ts                                (edit: add searchByType query for autocomplete)
  bottleneck.ts                              (new: recommendUpgrades query + cache helpers)
  bottleneckAi.ts                            (new: "use node" estimate action)
  _generated/api.d.ts                        (auto-regenerated; commit it)
lib/
  bottleneck-engine.ts                       (new: pure TS engine)
app/[locale]/bottleneck-calculator/
  page.tsx                                   (new: server component shell + metadata)
components/
  bottleneck/
    BottleneckCalculator.tsx                 (new: client form + result panel)
    PartAutocomplete.tsx                     (new: CPU/GPU autocomplete)
    ToolCrossPromo.tsx                       (new: cross-promo card; reused by fps page too)
  fps-estimator/
    FpsEstimatorStandalone.tsx               (edit: append ToolCrossPromo for bottleneck)
  layout/
    Header.tsx                               (edit: add nav link)
    MobileNav.tsx                            (edit: add nav link)
messages/
  fr.json                                    (edit: bottleneck namespace + nav.bottleneck)
  ar.json                                    (edit: same)
  en.json                                    (edit: same)
app/[locale]/
  page.tsx                                   (edit: add home-page card linking to /bottleneck-calculator)
```

---

## Tier-score reference table

This is the source of truth for hand-curated scores. Scores normalize PassMark CPU Mark (CPUs) and 3DMark Time Spy Graphics (GPUs) to a 1-100 scale where current flagships ≈ 100. Add scores to the matching product in `convex/seedReal.ts` (see Task 2 for the exact edit format).

**CPUs (PassMark CPU Mark, late-2025 / early-2026 normalized):**

| Slug | tierScore | Notes |
|---|---|---|
| `amd-ryzen-7-9800x3d` | 95 | Top gaming CPU 2026 |
| `amd-ryzen-9-9900x` | 92 | Zen 5 12-core |
| `amd-ryzen-7-7800x3d` | 80 | Last-gen V-cache flagship |
| `intel-core-ultra-7-265k` | 88 | Arrow Lake high-end |
| `intel-core-ultra-7-265kf` | 88 | Same silicon, no iGPU |
| `intel-core-i7-14700kf` | 85 | Raptor Lake Refresh |
| `intel-core-ultra-5-245k` | 75 | Arrow Lake mid |
| `amd-ryzen-5-9600x` | 70 | Zen 5 mid |
| `amd-ryzen-7-8700g` | 65 | APU (Phoenix), lower for gaming |

**GPUs (3DMark Time Spy Graphics, late-2025 / early-2026 normalized):**

| Slug | tierScore | Notes |
|---|---|---|
| `zotac-rtx-5080-solid-core` | 85 | Blackwell flagship-1 |
| `zotac-rtx-4080-super-trinity` | 75 | Last-gen flagship-1 |
| `sapphire-rx-9070-xt` | 68 | RDNA 4 high-end |
| `gigabyte-rtx-5070-eagle-oc` | 58 | Blackwell mid |
| `xfx-rx-7900-xt` | 55 | RDNA 3 high-end |
| `*-rtx-4070-super-*` | 53 | (search seed for slug) |
| `*-rtx-5060-ti-16gb-*` | 45 | |
| `*-rtx-5060-ti-8gb-*` | 43 | |
| `*-rx-9060-xt-*` | 42 | |

If new SKUs are added later, use these calibration points as anchors. If the seed file contains other CPUs/GPUs not in this table, give them scores by interpolating from the nearest anchors — and add a one-line comment with reasoning above the spec.

---

## Task 1: Add `bottleneckCache` table to schema

**Files:**
- Modify: `convex/schema.ts:222` (insert before final `});`)

- [ ] **Step 1: Add the table definition**

Open `convex/schema.ts`. After the `landingPages` table's closing brace (line 221, just before the final `});` on line 222), insert:

```ts
  bottleneckCache: defineTable({
    key: v.string(),
    result: v.string(),
    hits: v.number(),
    createdAt: v.number(),
  }).index("by_key", ["key"]),
```

- [ ] **Step 2: Let Convex regenerate types**

Run `npx convex dev` in a second terminal (if not already running). Wait until it logs `Convex functions ready!`. This regenerates `convex/_generated/dataModel.d.ts` and `api.d.ts`.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: build succeeds (or fails only on missing files we haven't created yet — schema change alone should be clean).

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts convex/_generated/
git commit -m "schema: add bottleneckCache table for AI result caching"
```

---

## Task 2: Add `tierScore` to CPU/GPU products in `seedReal.ts`

**Files:**
- Modify: `convex/seedReal.ts` (every CPU and GPU product entry)

- [ ] **Step 1: Add `tierScore` to each CPU entry**

For every product in `convex/seedReal.ts` whose `specs.type === "cpu"`, add `tierScore: <N>` to the spec object. Use values from the CPU table above. Example edit (line 131):

Before:
```ts
    specs: { type: "cpu", socket: "AM5", tdp: 120, cores: 8 },
```

After:
```ts
    specs: { type: "cpu", socket: "AM5", tdp: 120, cores: 8, tierScore: 95 },
```

Walk the file and apply this transformation to every CPU. Match by slug to the reference table above.

- [ ] **Step 2: Add `tierScore` to each GPU entry**

For every product with `specs.type === "gpu"`, add `tierScore: <N>` using the GPU table above. Example (line 259):

Before:
```ts
    specs: { type: "gpu", tdp: 360, lengthMm: 310, powerConnectors: "16-pin" },
```

After:
```ts
    specs: { type: "gpu", tdp: 360, lengthMm: 310, powerConnectors: "16-pin", tierScore: 85 },
```

For any GPU SKU NOT in the reference table, interpolate from neighbors (e.g., a "RTX 5060 8GB" would be ~38, a "RTX 5070 Ti" would be ~65). Add a one-line comment above the spec when you interpolate, e.g.:
```ts
    // tierScore interpolated: between RTX 5070 (58) and RTX 5080 (85)
    specs: { ..., tierScore: 70 },
```

- [ ] **Step 3: Re-seed dev**

Run: `npx convex run seedReal:default`
Expected output: log lines about deleting + inserting products.

- [ ] **Step 4: Verify tier scores are stored**

Run: `npx convex run products:list --no-push -- '{"categorySlug":"processors","limit":3}'`
Expected: products print with `specs.tierScore` present on each.

(If your shell mangles JSON args, use the Convex dashboard at https://dashboard.convex.dev/d/nautical-squid-800/data → products table → click any CPU/GPU and confirm `specs.tierScore` exists.)

- [ ] **Step 5: Commit**

```bash
git add convex/seedReal.ts
git commit -m "seed: curate tierScore for all CPUs and GPUs (PassMark/Time Spy normalized)"
```

---

## Task 3: Build `lib/bottleneck-engine.ts` (pure TS)

**Files:**
- Create: `lib/bottleneck-engine.ts`

- [ ] **Step 1: Create the engine file**

Create `lib/bottleneck-engine.ts` with this content (verbatim):

```ts
export type Resolution = "1080p" | "1440p" | "4K";
export type WorkloadTask = "gaming" | "streaming" | "content";

export type EngineCpu = {
  name: string;
  tierScore?: number;
  socket?: string;
  tdp?: number;
};

export type EngineGpu = {
  name: string;
  tierScore?: number;
  tdp?: number;
};

export type BottleneckInput = {
  cpu: EngineCpu;
  gpu: EngineGpu;
  resolution: Resolution;
  task: WorkloadTask;
  ramGb?: number;
  psuWatts?: number;
};

export type BottleneckWarning = {
  type: "ram" | "psu" | "socket";
  messageKey: string;
  values?: Record<string, string | number>;
};

export type BottleneckResult = {
  bottleneckPercent: number;
  bottleneckedComponent: "cpu" | "gpu" | "balanced";
  cpuEffectiveScore: number;
  gpuEffectiveScore: number;
  warnings: BottleneckWarning[];
};

const RESOLUTION_WEIGHTS: Record<Resolution, { cpu: number; gpu: number }> = {
  "1080p": { cpu: 1.0, gpu: 0.85 },
  "1440p": { cpu: 0.9, gpu: 1.0 },
  "4K": { cpu: 0.7, gpu: 1.0 },
};

const TASK_CPU_BOOST: Record<WorkloadTask, number> = {
  gaming: 0,
  streaming: 0.15,
  content: 0.25,
};

const BOTTLENECK_CAP_PERCENT = 40;
const BALANCED_THRESHOLD_PERCENT = 5;

export function canRunDeterministic(input: BottleneckInput): boolean {
  return (
    typeof input.cpu.tierScore === "number" &&
    typeof input.gpu.tierScore === "number"
  );
}

export function calculateBottleneck(
  input: BottleneckInput
): BottleneckResult | null {
  if (!canRunDeterministic(input)) return null;

  const cpuScore = input.cpu.tierScore!;
  const gpuScore = input.gpu.tierScore!;
  const w = RESOLUTION_WEIGHTS[input.resolution];
  const cpuBoost = TASK_CPU_BOOST[input.task];

  const cpuEff = cpuScore * (w.cpu + cpuBoost);
  const gpuEff = gpuScore * w.gpu;

  const diff = Math.abs(cpuEff - gpuEff);
  const max = Math.max(cpuEff, gpuEff);
  const rawPercent = max > 0 ? (diff / max) * 100 : 0;
  const bottleneckPercent = Math.min(
    Math.round(rawPercent * 10) / 10,
    BOTTLENECK_CAP_PERCENT
  );

  let bottleneckedComponent: "cpu" | "gpu" | "balanced";
  if (bottleneckPercent < BALANCED_THRESHOLD_PERCENT) {
    bottleneckedComponent = "balanced";
  } else {
    bottleneckedComponent = cpuEff < gpuEff ? "cpu" : "gpu";
  }

  const warnings = computeWarnings(input);

  return {
    bottleneckPercent,
    bottleneckedComponent,
    cpuEffectiveScore: Math.round(cpuEff * 10) / 10,
    gpuEffectiveScore: Math.round(gpuEff * 10) / 10,
    warnings,
  };
}

export function computeWarnings(input: BottleneckInput): BottleneckWarning[] {
  const warnings: BottleneckWarning[] = [];

  if (typeof input.ramGb === "number") {
    if (input.ramGb < 16) {
      warnings.push({
        type: "ram",
        messageKey: "warnings.ram.below16",
        values: { ramGb: input.ramGb },
      });
    } else if (input.ramGb < 32 && input.task === "content") {
      warnings.push({
        type: "ram",
        messageKey: "warnings.ram.contentNeeds32",
        values: { ramGb: input.ramGb },
      });
    }
  }

  if (typeof input.psuWatts === "number") {
    const cpuTdp = input.cpu.tdp ?? 100;
    const gpuTdp = input.gpu.tdp ?? 200;
    const recommendedPsu = Math.ceil(((cpuTdp + gpuTdp + 100) * 1.3) / 50) * 50;
    if (input.psuWatts < recommendedPsu) {
      warnings.push({
        type: "psu",
        messageKey: "warnings.psu.under",
        values: { current: input.psuWatts, recommended: recommendedPsu },
      });
    }
  }

  return warnings;
}

export function recommendedPsuWatts(cpu: EngineCpu, gpu: EngineGpu): number {
  const cpuTdp = cpu.tdp ?? 100;
  const gpuTdp = gpu.tdp ?? 200;
  return Math.ceil(((cpuTdp + gpuTdp + 100) * 1.3) / 50) * 50;
}

export function normalizeForCacheKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/\s+/g, " ");
}

export function buildCacheKey(input: {
  cpuName: string;
  gpuName: string;
  resolution: Resolution;
  task: WorkloadTask;
  locale: string;
  promptVersion: number;
}): string {
  return [
    `v${input.promptVersion}`,
    input.locale,
    input.resolution,
    input.task,
    normalizeForCacheKey(input.cpuName),
    normalizeForCacheKey(input.gpuName),
  ].join("|");
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: build succeeds (engine has no React/Convex deps; pure TS).

If the build complains about unused imports in *other* files (pre-existing), ignore — fix only errors stemming from your changes.

- [ ] **Step 3: Smoke-test the engine in a Node REPL**

Run this one-liner in a terminal at the repo root:

```bash
node --import tsx -e "import('./lib/bottleneck-engine.ts').then(m => { const r = m.calculateBottleneck({ cpu: { name:'9800X3D', tierScore: 95, tdp: 120 }, gpu: { name:'RTX 5080', tierScore: 85, tdp: 360 }, resolution: '1080p', task: 'gaming', ramGb: 16, psuWatts: 750 }); console.log(JSON.stringify(r, null, 2)); });"
```

Expected output: an object with `bottleneckPercent ≈ 15.0`, `bottleneckedComponent: "gpu"` (because at 1080p the CPU is heavier-weighted, so the GPU appears as the limiter relative to the cranked-up CPU effective score), `warnings: []` or a single PSU warning depending on calc.

If `tsx` is not installed, run `npm i -D tsx` first. (`tsx` is the typescript-aware loader for Node; some repos already have it.)

- [ ] **Step 4: Commit**

```bash
git add lib/bottleneck-engine.ts
git commit -m "engine: pure-TS bottleneck calculator with resolution + task weights"
```

---

## Task 4: Add autocomplete query to `convex/products.ts`

**Files:**
- Modify: `convex/products.ts` (append a new query at the bottom, before the closing of the file)

- [ ] **Step 1: Add `searchByType` query**

Open `convex/products.ts`. After the existing `search` query (line 138) and before the `create` mutation (line 140), insert:

```ts
export const searchByType = query({
  args: {
    specType: v.union(v.literal("cpu"), v.literal("gpu")),
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { specType, q, limit }) => {
    const max = limit ?? 8;
    const normalized = normalizeSearch(q);
    const all = await ctx.db.query("products").collect();
    const matches = all.filter((p) => {
      const t = (p.specs as { type?: string } | undefined)?.type;
      if (t !== specType) return false;
      if (!normalized) return true;
      const haystack = normalizeSearch(`${p.nameFr} ${p.nameAr} ${p.brand} ${p.slug}`);
      return haystack.includes(normalized);
    });
    return matches.slice(0, max).map((p) => ({
      _id: p._id,
      slug: p.slug,
      nameFr: p.nameFr,
      nameAr: p.nameAr,
      brand: p.brand,
      priceDzd: p.priceDzd,
      images: p.images,
      specs: p.specs,
    }));
  },
});
```

- [ ] **Step 2: Verify Convex regenerated types**

Confirm `npx convex dev` (running in another terminal) logged `Convex functions ready!` after the save. Confirm `convex/_generated/api.d.ts` now has `searchByType` under `products`:

Run: `grep -n searchByType convex/_generated/api.d.ts`
Expected: one match showing the function signature.

- [ ] **Step 3: Smoke-test the query**

Run: `npx convex run products:searchByType '{"specType":"cpu","q":"9800"}'`
Expected: a JSON array containing the `amd-ryzen-7-9800x3d` product with `specs.tierScore: 95`.

- [ ] **Step 4: Commit**

```bash
git add convex/products.ts convex/_generated/
git commit -m "products: add searchByType query for bottleneck autocomplete"
```

---

## Task 5: Build `convex/bottleneck.ts` (cache + recommendations)

**Files:**
- Create: `convex/bottleneck.ts`

- [ ] **Step 1: Create the file**

Create `convex/bottleneck.ts` with this content:

```ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCached = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("bottleneckCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return row ? row.result : null;
  },
});

export const setCached = mutation({
  args: { key: v.string(), result: v.string() },
  handler: async (ctx, { key, result }) => {
    const existing = await ctx.db
      .query("bottleneckCache")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { hits: existing.hits + 1 });
      return;
    }
    await ctx.db.insert("bottleneckCache", {
      key,
      result,
      hits: 1,
      createdAt: Date.now(),
    });
  },
});

export const recommendUpgrades = query({
  args: {
    bottleneckedComponent: v.union(v.literal("cpu"), v.literal("gpu"), v.literal("balanced")),
    minTierScore: v.number(),
    sourceCpuSocket: v.optional(v.string()),
    sourceCpuId: v.optional(v.id("products")),
    sourceGpuId: v.optional(v.id("products")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    if (args.bottleneckedComponent === "balanced") {
      return { products: [], socketMismatch: false };
    }

    const all = await ctx.db.query("products").collect();
    const targetType = args.bottleneckedComponent;
    const excludeId = args.bottleneckedComponent === "cpu" ? args.sourceCpuId : args.sourceGpuId;

    const candidates = all.filter((p) => {
      if (excludeId && p._id === excludeId) return false;
      const specs = p.specs as { type?: string; tierScore?: number; socket?: string } | undefined;
      if (specs?.type !== targetType) return false;
      if (typeof specs.tierScore !== "number") return false;
      if (specs.tierScore < args.minTierScore) return false;
      return true;
    });

    if (args.bottleneckedComponent === "gpu") {
      candidates.sort((a, b) => a.priceDzd - b.priceDzd);
      return {
        products: candidates.slice(0, limit),
        socketMismatch: false,
      };
    }

    // CPU upgrade path — socket-aware
    if (args.sourceCpuSocket) {
      const sameSocket = candidates.filter((p) => {
        const s = (p.specs as { socket?: string }).socket;
        return s === args.sourceCpuSocket;
      });
      if (sameSocket.length > 0) {
        sameSocket.sort((a, b) => a.priceDzd - b.priceDzd);
        return {
          products: sameSocket.slice(0, limit),
          socketMismatch: false,
        };
      }
    }

    candidates.sort((a, b) => a.priceDzd - b.priceDzd);
    return {
      products: candidates.slice(0, limit),
      socketMismatch: true,
    };
  },
});
```

- [ ] **Step 2: Verify Convex regenerated types**

`npx convex dev` should log `Convex functions ready!`. Run: `grep -n "bottleneck:" convex/_generated/api.d.ts | head -20`
Expected: lines mentioning `getCached`, `setCached`, `recommendUpgrades` under `bottleneck`.

- [ ] **Step 3: Smoke-test recommendUpgrades**

Run: `npx convex run bottleneck:recommendUpgrades '{"bottleneckedComponent":"gpu","minTierScore":60}'`
Expected: a JSON object with `products: [...]` containing at least one GPU with `tierScore ≥ 60` and `socketMismatch: false`.

- [ ] **Step 4: Commit**

```bash
git add convex/bottleneck.ts convex/_generated/
git commit -m "convex: add bottleneck cache + recommendUpgrades query"
```

---

## Task 6: Build `convex/bottleneckAi.ts` (AI fallback action)

**Files:**
- Create: `convex/bottleneckAi.ts`

- [ ] **Step 1: Create the file**

Create `convex/bottleneckAi.ts` with this content:

```ts
"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

const PROMPT_VERSION = 1;

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
  handler: async (ctx, args) => {
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
        return JSON.parse(cached);
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
```

- [ ] **Step 2: Verify Convex regenerated types**

Run: `grep -n "bottleneckAi:" convex/_generated/api.d.ts | head -5`
Expected: line mentioning `estimate` under `bottleneckAi`.

- [ ] **Step 3: Smoke-test (will hit OpenRouter)**

Run: `npx convex run bottleneckAi:estimate '{"cpuName":"Ryzen 5 5600","gpuName":"RTX 3060","resolution":"1080p","task":"gaming","locale":"fr"}'`
Expected: JSON with `bottleneckPercent`, `verdict` in French, etc. Returns within ~4s.
Re-run the same command — second time should return instantly (cache hit).

If the call fails with `OPENROUTER_API_KEY not set`, run: `npx convex env get OPENROUTER_API_KEY` to confirm it's set in dev. If not, set it: `npx convex env set OPENROUTER_API_KEY "<key from .env.local or 1Password>"`.

- [ ] **Step 4: Commit**

```bash
git add convex/bottleneckAi.ts convex/_generated/
git commit -m "convex: AI bottleneck fallback action with result caching"
```

---

## Task 7: Build `components/bottleneck/PartAutocomplete.tsx`

**Files:**
- Create: `components/bottleneck/PartAutocomplete.tsx`

- [ ] **Step 1: Create the component**

Create `components/bottleneck/PartAutocomplete.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Suggestion = {
  _id: Id<"products">;
  slug: string;
  nameFr: string;
  nameAr: string;
  brand: string;
  priceDzd: number;
  specs: Record<string, unknown>;
};

export type PartSelection =
  | { kind: "catalog"; product: Suggestion; freeText: null }
  | { kind: "freeText"; product: null; freeText: string };

export function PartAutocomplete({
  specType,
  value,
  onChange,
  label,
  placeholder,
}: {
  specType: "cpu" | "gpu";
  value: string;
  onChange: (next: PartSelection) => void;
  label: string;
  placeholder: string;
}) {
  const locale = useLocale();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(value);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const suggestions = useQuery(
    api.products.searchByType,
    debounced.trim().length === 0 ? "skip" : { specType, q: debounced, limit: 8 }
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(s: Suggestion) {
    const name = locale === "ar" ? s.nameAr : s.nameFr;
    setQuery(name);
    setOpen(false);
    onChange({ kind: "catalog", product: s, freeText: null });
  }

  function onInputChange(v: string) {
    setQuery(v);
    setOpen(true);
    onChange({ kind: "freeText", product: null, freeText: v });
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {open && suggestions && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl bg-slate-900/95 backdrop-blur ring-1 ring-white/15 shadow-card max-h-72 overflow-auto">
          {suggestions.map((s) => {
            const name = locale === "ar" ? s.nameAr : s.nameFr;
            return (
              <button
                key={s._id}
                type="button"
                onClick={() => pick(s)}
                className="w-full text-start px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors flex items-baseline justify-between gap-3"
              >
                <span className="truncate">{name}</span>
                <span className="text-xs text-slate-400 shrink-0">{s.brand}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: builds clean (the new component isn't imported anywhere yet, but its own types compile).

- [ ] **Step 3: Commit**

```bash
git add components/bottleneck/PartAutocomplete.tsx
git commit -m "bottleneck: autocomplete input that supports catalog or free-text"
```

---

## Task 8: Build `components/bottleneck/BottleneckCalculator.tsx`

**Files:**
- Create: `components/bottleneck/BottleneckCalculator.tsx`

- [ ] **Step 1: Create the component**

Create `components/bottleneck/BottleneckCalculator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/Icon";
import { PartAutocomplete, type PartSelection } from "./PartAutocomplete";
import {
  calculateBottleneck,
  canRunDeterministic,
  type BottleneckInput,
  type Resolution,
  type WorkloadTask,
} from "@/lib/bottleneck-engine";
import { formatDzd } from "@/lib/format";
import { localizedName } from "@/lib/products";

const RESOLUTIONS: Resolution[] = ["1080p", "1440p", "4K"];
const TASKS: WorkloadTask[] = ["gaming", "streaming", "content"];

type CalcResult = {
  bottleneckPercent: number;
  bottleneckedComponent: "cpu" | "gpu" | "balanced";
  verdict: string;
  explanation: string;
  confidence: string;
  warnings: { type: string; messageKey?: string; message?: string; values?: Record<string, string | number> }[];
  source: "catalog" | "ai";
  error?: string;
};

function percentColor(pct: number) {
  if (pct < 5) return "text-green-400";
  if (pct < 15) return "text-amber-400";
  return "text-red-400";
}

function verdictBg(pct: number) {
  if (pct < 5) return "bg-green-500/10 ring-green-500/30";
  if (pct < 15) return "bg-amber-500/10 ring-amber-500/30";
  return "bg-red-500/10 ring-red-500/30";
}

export function BottleneckCalculator() {
  const t = useTranslations("bottleneck");
  const locale = useLocale();
  const aiEstimate = useAction(api.bottleneckAi.estimate);

  const [cpuSel, setCpuSel] = useState<PartSelection>({ kind: "freeText", product: null, freeText: "" });
  const [gpuSel, setGpuSel] = useState<PartSelection>({ kind: "freeText", product: null, freeText: "" });
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [task, setTask] = useState<WorkloadTask>("gaming");
  const [ramGb, setRamGb] = useState<string>("");
  const [psuWatts, setPsuWatts] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [shake, setShake] = useState(false);

  const hasBoth = (cpuSel.kind === "catalog" || (cpuSel.freeText?.trim() ?? "").length > 0) &&
                  (gpuSel.kind === "catalog" || (gpuSel.freeText?.trim() ?? "").length > 0);

  const sourceCpuId = cpuSel.kind === "catalog" ? cpuSel.product._id : undefined;
  const sourceGpuId = gpuSel.kind === "catalog" ? gpuSel.product._id : undefined;
  const sourceCpuSocket =
    cpuSel.kind === "catalog"
      ? (cpuSel.product.specs as { socket?: string }).socket
      : undefined;

  const upgrades = useQuery(
    api.bottleneck.recommendUpgrades,
    result && result.bottleneckedComponent !== "balanced"
      ? {
          bottleneckedComponent: result.bottleneckedComponent,
          minTierScore: 0,
          sourceCpuSocket,
          sourceCpuId,
          sourceGpuId,
          limit: 3,
        }
      : "skip"
  );

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function onCalculate() {
    if (!hasBoth) {
      triggerShake();
      return;
    }
    setLoading(true);
    setResult(null);

    const cpuName =
      cpuSel.kind === "catalog"
        ? localizedName({ nameFr: cpuSel.product.nameFr, nameAr: cpuSel.product.nameAr }, locale)
        : cpuSel.freeText ?? "";
    const gpuName =
      gpuSel.kind === "catalog"
        ? localizedName({ nameFr: gpuSel.product.nameFr, nameAr: gpuSel.product.nameAr }, locale)
        : gpuSel.freeText ?? "";

    const ramNum = ramGb ? Number(ramGb) : undefined;
    const psuNum = psuWatts ? Number(psuWatts) : undefined;

    const engineInput: BottleneckInput = {
      cpu: {
        name: cpuName,
        tierScore: cpuSel.kind === "catalog" ? (cpuSel.product.specs as { tierScore?: number }).tierScore : undefined,
        socket: sourceCpuSocket,
        tdp: cpuSel.kind === "catalog" ? (cpuSel.product.specs as { tdp?: number }).tdp : undefined,
      },
      gpu: {
        name: gpuName,
        tierScore: gpuSel.kind === "catalog" ? (gpuSel.product.specs as { tierScore?: number }).tierScore : undefined,
        tdp: gpuSel.kind === "catalog" ? (gpuSel.product.specs as { tdp?: number }).tdp : undefined,
      },
      resolution,
      task,
      ramGb: ramNum,
      psuWatts: psuNum,
    };

    if (canRunDeterministic(engineInput)) {
      const calc = calculateBottleneck(engineInput)!;
      setResult({
        bottleneckPercent: calc.bottleneckPercent,
        bottleneckedComponent: calc.bottleneckedComponent,
        verdict: t(`verdicts.${calc.bottleneckedComponent}`, { percent: calc.bottleneckPercent }),
        explanation: t(`explanations.${calc.bottleneckedComponent}`),
        confidence: "high",
        warnings: calc.warnings.map((w) => ({
          type: w.type,
          messageKey: w.messageKey,
          values: w.values,
        })),
        source: "catalog",
      });
      setLoading(false);
      return;
    }

    try {
      const ai = await aiEstimate({
        cpuName,
        gpuName,
        resolution,
        task,
        locale,
        ramGb: ramNum,
        psuWatts: psuNum,
      });
      if ("error" in ai && ai.error === "invalid_hardware") {
        setResult({
          bottleneckPercent: 0,
          bottleneckedComponent: "balanced",
          verdict: t("invalidHardware"),
          explanation: "",
          confidence: "low",
          warnings: [],
          source: "ai",
          error: "invalid_hardware",
        });
      } else {
        setResult({ ...ai, source: "ai" } as CalcResult);
      }
    } catch {
      setResult({
        bottleneckPercent: 0,
        bottleneckedComponent: "balanced",
        verdict: t("error"),
        explanation: "",
        confidence: "low",
        warnings: [],
        source: "ai",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="pt-20 pb-10 text-center px-4">
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Icon name="speed" className="text-[18px]" />
          <span className="text-blue-300">{t("badge")}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
          {t("title")}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-20">
        {/* Form panel */}
        <div className={`rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-5 sm:p-6 mb-6 transition-all ${shake ? "animate-shake ring-red-500/60" : ""}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <PartAutocomplete
              specType="cpu"
              value={cpuSel.kind === "catalog" ? localizedName({ nameFr: cpuSel.product.nameFr, nameAr: cpuSel.product.nameAr }, locale) : cpuSel.freeText ?? ""}
              onChange={setCpuSel}
              label={`${t("cpuLabel")} *`}
              placeholder={t("cpuPlaceholder")}
            />
            <PartAutocomplete
              specType="gpu"
              value={gpuSel.kind === "catalog" ? localizedName({ nameFr: gpuSel.product.nameFr, nameAr: gpuSel.product.nameAr }, locale) : gpuSel.freeText ?? ""}
              onChange={setGpuSel}
              label={`${t("gpuLabel")} *`}
              placeholder={t("gpuPlaceholder")}
            />
          </div>

          {/* Resolution + task */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("resolution")}</div>
              <div className="flex gap-1.5">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      resolution === r
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("task")}</div>
              <div className="flex gap-1.5">
                {TASKS.map((tk) => (
                  <button
                    key={tk}
                    type="button"
                    onClick={() => setTask(tk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      task === tk
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {t(`tasks.${tk}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional RAM + PSU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                {t("ramLabel")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={ramGb}
                onChange={(e) => setRamGb(e.target.value)}
                placeholder={t("ramPlaceholder")}
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                {t("psuLabel")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={psuWatts}
                onChange={(e) => setPsuWatts(e.target.value)}
                placeholder={t("psuPlaceholder")}
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onCalculate}
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
          >
            {loading ? t("calculating") : t("calculate")}
          </button>

          {!hasBoth && shake && (
            <p className="text-red-400 text-sm mt-3 text-center">{t("needCpuGpu")}</p>
          )}
        </div>

        {/* Result panel */}
        {loading && (
          <div className="rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-8 text-center">
            <div className="animate-spin inline-block w-10 h-10 border-3 border-primary border-t-transparent rounded-full mb-3" />
            <p className="text-sm text-slate-400">{t("calculating")}</p>
          </div>
        )}

        {result && !loading && (
          <div className="rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 p-6 sm:p-8 space-y-5">
            {result.error === "invalid_hardware" ? (
              <p className="text-center text-slate-300">{t("invalidHardware")}</p>
            ) : (
              <>
                <div className="text-center">
                  <div className={`text-6xl sm:text-7xl font-black ${percentColor(result.bottleneckPercent)}`}>
                    {result.bottleneckPercent.toFixed(1)}%
                  </div>
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">
                    {t(`componentLabels.${result.bottleneckedComponent}`)}
                  </div>
                </div>

                <div className={`rounded-xl ring-1 px-4 py-3 text-sm text-slate-100 ${verdictBg(result.bottleneckPercent)}`}>
                  {result.verdict}
                </div>

                {result.explanation && (
                  <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                )}

                <div className="flex items-center justify-center gap-3 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-white/10 text-slate-300 font-semibold">
                    {t("confidence")}: {t(`confidenceLabels.${result.confidence}`)}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/10 text-slate-300 font-semibold">
                    {t(`sourceLabels.${result.source}`)}
                  </span>
                </div>

                {result.warnings.length > 0 && (
                  <div className="space-y-2">
                    {result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 bg-amber-500/10 ring-1 ring-amber-500/30 rounded-xl p-3">
                        <Icon name="warning" className="text-amber-400 text-[18px] shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-100">
                          {w.messageKey ? t(w.messageKey, w.values ?? {}) : w.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {result.bottleneckedComponent !== "balanced" && upgrades && upgrades.products.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-sm font-bold text-white mb-3">{t("upgrades.heading")}</h3>
                    {upgrades.socketMismatch && (
                      <div className="mb-3 flex items-start gap-2 bg-amber-500/10 ring-1 ring-amber-500/30 rounded-xl p-3">
                        <Icon name="info" className="text-amber-400 text-[18px] shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-100">{t("upgrades.socketMismatch")}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {upgrades.products.map((p) => (
                        <Link
                          key={p._id}
                          href={`/product/${p.slug}`}
                          className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 hover:ring-primary/50 hover:bg-white/10 transition-all"
                        >
                          <div className="text-xs text-slate-400 mb-1">{p.brand}</div>
                          <div className="text-sm font-semibold text-white mb-2 line-clamp-2">
                            {localizedName(p, locale)}
                          </div>
                          <div className="text-sm font-bold text-primary-200">
                            {formatDzd(p.priceDzd, locale)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {result.bottleneckedComponent === "balanced" && (
                  <div className="text-center text-sm text-slate-300">
                    <p className="mb-3">{t("balancedCta")}</p>
                    <Link
                      href="/shop/graphics-cards"
                      className="inline-flex items-center gap-1 text-primary-200 hover:text-primary-100 font-semibold"
                    >
                      {t("balancedCtaLink")}
                      <Icon name="arrow_forward" className="text-[16px]" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Confirm helpers exist**

The component uses `formatDzd` from `@/lib/format` and `localizedName` from `@/lib/products`. Confirm both exist:

Run: `grep -n "export function formatDzd\|export function localizedName" lib/format.ts lib/products.ts`

If `localizedName` doesn't exist (per CLAUDE.md it should), or `lib/products.ts` doesn't exist, find where it's defined — try `grep -rn "function localizedName" lib/ components/`. Wherever it lives, update the import path in `BottleneckCalculator.tsx`.

- [ ] **Step 3: Typecheck**

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 4: Commit**

```bash
git add components/bottleneck/
git commit -m "bottleneck: main calculator client component"
```

---

## Task 9: Build the page route `app/[locale]/bottleneck-calculator/page.tsx`

**Files:**
- Create: `app/[locale]/bottleneck-calculator/page.tsx`

- [ ] **Step 1: Create the route**

Create `app/[locale]/bottleneck-calculator/page.tsx`:

```tsx
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BottleneckCalculator } from "@/components/bottleneck/BottleneckCalculator";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bottleneck.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/bottleneck-calculator`,
      languages: {
        fr: "/fr/bottleneck-calculator",
        ar: "/ar/bottleneck-calculator",
        en: "/en/bottleneck-calculator",
      },
    },
  };
}

export default async function BottleneckCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BottleneckCalculator />;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: builds clean. Build will fail on missing translation keys — that's OK, we add them in Task 10.

If the build error is *only* about missing `bottleneck.*` keys, proceed to Task 10. Any other error must be fixed here first.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/bottleneck-calculator/
git commit -m "bottleneck: page route with locale-aware SEO metadata"
```

---

## Task 10: Add i18n keys to `messages/{fr,ar,en}.json`

**Files:**
- Modify: `messages/fr.json`
- Modify: `messages/ar.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add the `bottleneck` namespace to `fr.json`**

Open `messages/fr.json`. Find a top-level closing brace where a new key would be appropriate (e.g., before the final `}` of the file). Add this JSON object as a new top-level entry:

```json
"bottleneck": {
  "badge": "Goulot d'étranglement",
  "title": "Calculateur de Goulot d'Étranglement PC",
  "subtitle": "Vérifiez si votre CPU et votre GPU sont équilibrés. Recommandations de mise à niveau adaptées à votre configuration.",
  "cpuLabel": "Processeur (CPU)",
  "cpuPlaceholder": "ex: Ryzen 7 5800X3D",
  "gpuLabel": "Carte graphique (GPU)",
  "gpuPlaceholder": "ex: RTX 4070 SUPER",
  "resolution": "Résolution",
  "task": "Usage",
  "tasks": {
    "gaming": "Gaming",
    "streaming": "Streaming",
    "content": "Création"
  },
  "ramLabel": "RAM (GB) — optionnel",
  "ramPlaceholder": "ex: 16",
  "psuLabel": "Alimentation (W) — optionnel",
  "psuPlaceholder": "ex: 650",
  "calculate": "Calculer",
  "calculating": "Calcul en cours...",
  "needCpuGpu": "Veuillez choisir un CPU et un GPU.",
  "invalidHardware": "Composants non reconnus. Essayez de les choisir dans la liste.",
  "error": "Une erreur est survenue.",
  "componentLabels": {
    "cpu": "Goulot d'étranglement CPU",
    "gpu": "Goulot d'étranglement GPU",
    "balanced": "Configuration équilibrée"
  },
  "verdicts": {
    "cpu": "Votre CPU limite votre GPU de {percent}% à cette résolution.",
    "gpu": "Votre GPU limite votre CPU de {percent}% à cette résolution.",
    "balanced": "Votre configuration est bien équilibrée."
  },
  "explanations": {
    "cpu": "Le CPU n'arrive pas à alimenter le GPU avec assez de données par seconde. Vous perdez des FPS potentiels que le GPU pourrait produire.",
    "gpu": "Le GPU est le maillon faible. Le CPU pourrait soutenir plus d'images par seconde si vous aviez une carte plus puissante.",
    "balanced": "CPU et GPU sont bien appariés pour cette résolution et cet usage."
  },
  "confidence": "Confiance",
  "confidenceLabels": {
    "high": "élevée",
    "medium": "moyenne",
    "low": "faible"
  },
  "sourceLabels": {
    "catalog": "Données catalogue",
    "ai": "Estimation IA"
  },
  "warnings": {
    "ram": {
      "below16": "Vous avez {ramGb} GB de RAM. 16 GB est le minimum recommandé pour le gaming moderne.",
      "contentNeeds32": "Vous avez {ramGb} GB de RAM. La création de contenu nécessite plutôt 32 GB."
    },
    "psu": {
      "under": "Alimentation {current}W trop juste. Recommandé : {recommended}W minimum."
    }
  },
  "upgrades": {
    "heading": "Mises à niveau recommandées",
    "socketMismatch": "Ces mises à niveau nécessitent une nouvelle carte mère (socket différent)."
  },
  "balancedCta": "Vous voulez plus de performances ? Visez une résolution supérieure.",
  "balancedCtaLink": "Voir les cartes graphiques",
  "meta": {
    "title": "Calculateur de Goulot d'Étranglement PC — CPU GPU | ZED Informatique",
    "description": "Calculez le goulot d'étranglement entre votre CPU et GPU. Gratuit, rapide, avec recommandations de mise à niveau. Algérie."
  }
}
```

Make sure you add a comma after the previous top-level key. Verify the file is still valid JSON: `node -e "JSON.parse(require('fs').readFileSync('messages/fr.json'))" && echo OK`. Expected: `OK`.

- [ ] **Step 2: Add `nav.bottleneck` to `fr.json`**

In `messages/fr.json`, find the `nav` namespace (top-level, around line 34-49 originally). Add a new entry after `fpsEstimator`:

```json
"bottleneck": "Goulot"
```

(Short label to fit nav alongside existing items. Don't change `fpsEstimator`.)

Re-verify JSON: `node -e "JSON.parse(require('fs').readFileSync('messages/fr.json'))" && echo OK`.

- [ ] **Step 3: Add the same keys to `ar.json` (Arabic)**

Add the `bottleneck` namespace to `messages/ar.json`. Use these translations:

```json
"bottleneck": {
  "badge": "تضييق الأداء",
  "title": "حاسبة تضييق الأداء بين المعالج وكرت الشاشة",
  "subtitle": "تحقق من توازن المعالج وكرت الشاشة. توصيات ترقية مخصصة لإعدادك.",
  "cpuLabel": "المعالج (CPU)",
  "cpuPlaceholder": "مثال: Ryzen 7 5800X3D",
  "gpuLabel": "كرت الشاشة (GPU)",
  "gpuPlaceholder": "مثال: RTX 4070 SUPER",
  "resolution": "الدقة",
  "task": "الاستخدام",
  "tasks": {
    "gaming": "الألعاب",
    "streaming": "البث المباشر",
    "content": "إنشاء المحتوى"
  },
  "ramLabel": "RAM (GB) — اختياري",
  "ramPlaceholder": "مثال: 16",
  "psuLabel": "مزود الطاقة (W) — اختياري",
  "psuPlaceholder": "مثال: 650",
  "calculate": "احسب",
  "calculating": "جاري الحساب...",
  "needCpuGpu": "اختر المعالج وكرت الشاشة.",
  "invalidHardware": "لم نتعرف على المكونات. حاول اختيارها من القائمة.",
  "error": "حدث خطأ.",
  "componentLabels": {
    "cpu": "تضييق من المعالج",
    "gpu": "تضييق من كرت الشاشة",
    "balanced": "إعداد متوازن"
  },
  "verdicts": {
    "cpu": "المعالج يحد من كرت الشاشة بنسبة {percent}% في هذه الدقة.",
    "gpu": "كرت الشاشة يحد من المعالج بنسبة {percent}% في هذه الدقة.",
    "balanced": "إعدادك متوازن جيدًا."
  },
  "explanations": {
    "cpu": "المعالج لا يستطيع تغذية كرت الشاشة بالبيانات الكافية. تفقد إطارات في الثانية كان يمكن لكرت الشاشة إنتاجها.",
    "gpu": "كرت الشاشة هو الحلقة الأضعف. المعالج قادر على دعم إطارات أكثر لو كان لديك كرت أقوى.",
    "balanced": "المعالج وكرت الشاشة متناسبان جيدًا لهذه الدقة والاستخدام."
  },
  "confidence": "الثقة",
  "confidenceLabels": {
    "high": "عالية",
    "medium": "متوسطة",
    "low": "منخفضة"
  },
  "sourceLabels": {
    "catalog": "بيانات الكتالوج",
    "ai": "تقدير بالذكاء الاصطناعي"
  },
  "warnings": {
    "ram": {
      "below16": "لديك {ramGb} GB من RAM. الحد الأدنى الموصى به هو 16 GB للألعاب الحديثة.",
      "contentNeeds32": "لديك {ramGb} GB من RAM. إنشاء المحتوى يتطلب 32 GB."
    },
    "psu": {
      "under": "مزود الطاقة {current}W ضعيف. الموصى به: {recommended}W على الأقل."
    }
  },
  "upgrades": {
    "heading": "ترقيات موصى بها",
    "socketMismatch": "هذه الترقيات تتطلب لوحة أم جديدة (مقبس مختلف)."
  },
  "balancedCta": "تريد أداء أعلى؟ استهدف دقة أعلى.",
  "balancedCtaLink": "عرض بطاقات الرسوميات",
  "meta": {
    "title": "حاسبة تضييق الأداء بين CPU و GPU | ZED Informatique",
    "description": "احسب تضييق الأداء بين المعالج وكرت الشاشة. مجاني، سريع، مع توصيات الترقية. الجزائر."
  }
}
```

And in `nav` namespace of `ar.json`, add `"bottleneck": "تضييق الأداء"` after `fpsEstimator`.

Re-verify: `node -e "JSON.parse(require('fs').readFileSync('messages/ar.json'))" && echo OK`.

- [ ] **Step 4: Add the same keys to `en.json` (English)**

Add the `bottleneck` namespace to `messages/en.json`:

```json
"bottleneck": {
  "badge": "Bottleneck",
  "title": "PC Bottleneck Calculator",
  "subtitle": "Check whether your CPU and GPU are balanced. Upgrade picks tailored to your build.",
  "cpuLabel": "Processor (CPU)",
  "cpuPlaceholder": "e.g. Ryzen 7 5800X3D",
  "gpuLabel": "Graphics card (GPU)",
  "gpuPlaceholder": "e.g. RTX 4070 SUPER",
  "resolution": "Resolution",
  "task": "Workload",
  "tasks": {
    "gaming": "Gaming",
    "streaming": "Streaming",
    "content": "Content creation"
  },
  "ramLabel": "RAM (GB) — optional",
  "ramPlaceholder": "e.g. 16",
  "psuLabel": "PSU (W) — optional",
  "psuPlaceholder": "e.g. 650",
  "calculate": "Calculate",
  "calculating": "Calculating...",
  "needCpuGpu": "Please pick a CPU and a GPU.",
  "invalidHardware": "We didn't recognize those parts. Try picking from the dropdown.",
  "error": "Something went wrong.",
  "componentLabels": {
    "cpu": "CPU bottleneck",
    "gpu": "GPU bottleneck",
    "balanced": "Balanced build"
  },
  "verdicts": {
    "cpu": "Your CPU is holding back your GPU by {percent}% at this resolution.",
    "gpu": "Your GPU is holding back your CPU by {percent}% at this resolution.",
    "balanced": "Your build is well balanced."
  },
  "explanations": {
    "cpu": "The CPU can't feed the GPU enough data per second. You're losing potential FPS the GPU could otherwise produce.",
    "gpu": "The GPU is the weak link. The CPU could sustain higher framerates if you paired it with a stronger card.",
    "balanced": "CPU and GPU are well matched for this resolution and workload."
  },
  "confidence": "Confidence",
  "confidenceLabels": {
    "high": "high",
    "medium": "medium",
    "low": "low"
  },
  "sourceLabels": {
    "catalog": "Catalog data",
    "ai": "AI estimate"
  },
  "warnings": {
    "ram": {
      "below16": "You have {ramGb} GB of RAM. 16 GB is the minimum we'd recommend for modern gaming.",
      "contentNeeds32": "You have {ramGb} GB of RAM. Content creation really needs 32 GB or more."
    },
    "psu": {
      "under": "PSU {current}W is undersized. Recommended: {recommended}W minimum."
    }
  },
  "upgrades": {
    "heading": "Recommended upgrades",
    "socketMismatch": "These upgrades require a new motherboard (different socket)."
  },
  "balancedCta": "Want more performance? Aim for a higher resolution.",
  "balancedCtaLink": "Browse graphics cards",
  "meta": {
    "title": "PC Bottleneck Calculator — CPU GPU | ZED Informatique",
    "description": "Calculate CPU/GPU bottleneck. Free, fast, with tailored upgrade picks. Algeria."
  }
}
```

And in `nav` namespace of `en.json`, add `"bottleneck": "Bottleneck"` after `fpsEstimator`.

Re-verify: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json'))" && echo OK`.

- [ ] **Step 5: Build and smoke-test the page**

Run: `npm run build`
Expected: clean build.

Start dev server: `npm run dev` (and ensure `npx convex dev` is still running). Open three URLs and verify the page renders:
- http://localhost:3000/fr/bottleneck-calculator
- http://localhost:3000/ar/bottleneck-calculator (check RTL: form should flow right-to-left)
- http://localhost:3000/en/bottleneck-calculator

Type `9800x3d` in the CPU field and verify the autocomplete shows the Ryzen 7 9800X3D. Pick it, type `5080` in GPU, pick RTX 5080, click Calculate. Expected: a "GPU bottleneck" result (per the smoke test in Task 3) with 3 GPU upgrade cards.

Test free-text path: clear and type `Ryzen 5 5600` and `RTX 3060`, click Calculate. Expected: AI loader spins for ~3s, then result appears with `AI estimate` badge.

- [ ] **Step 6: Commit**

```bash
git add messages/
git commit -m "i18n: bottleneck calculator strings in fr/ar/en"
```

---

## Task 11: Add cross-promo card component and wire it into both tool pages

**Files:**
- Create: `components/bottleneck/ToolCrossPromo.tsx`
- Modify: `components/bottleneck/BottleneckCalculator.tsx`
- Modify: `components/fps-estimator/FpsEstimatorStandalone.tsx`

- [ ] **Step 1: Create the cross-promo component**

Create `components/bottleneck/ToolCrossPromo.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { Icon } from "@/components/ui/Icon";

export function ToolCrossPromo({ target }: { target: "fps" | "bottleneck" }) {
  const t = useTranslations(target === "fps" ? "bottleneck.crossPromo" : "fpsEstimator.crossPromo");
  const href = target === "fps" ? "/fps-estimator" : "/bottleneck-calculator";
  const icon = target === "fps" ? "speed" : "balance";

  return (
    <Link
      href={href}
      className="block max-w-3xl mx-auto rounded-2xl bg-white/5 backdrop-blur ring-1 ring-white/10 hover:ring-primary/50 hover:bg-white/10 transition-all p-5 sm:p-6 mt-8"
    >
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-primary/20 p-3 shrink-0">
          <Icon name={icon} className="text-primary-200 text-[24px]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-primary-200 mb-1">
            {t("badge")}
          </div>
          <div className="text-base font-bold text-white">{t("title")}</div>
          <div className="text-sm text-slate-400">{t("subtitle")}</div>
        </div>
        <Icon name="arrow_forward" className="text-slate-400 text-[20px] shrink-0" />
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Add `crossPromo` translation keys to all three locales**

In `messages/fr.json`, inside the `bottleneck` namespace, append `crossPromo`:

```json
"crossPromo": {
  "badge": "Outil complémentaire",
  "title": "Essayez le calculateur de goulot d'étranglement",
  "subtitle": "Vérifiez l'équilibre CPU/GPU et obtenez des recommandations de mise à niveau."
}
```

And inside the `fpsEstimator` namespace (which already exists), append:

```json
"crossPromo": {
  "badge": "Outil complémentaire",
  "title": "Estimer les FPS de votre configuration",
  "subtitle": "Sélectionnez un jeu et obtenez une estimation FPS pour votre setup."
}
```

Apply the same pattern to `messages/ar.json`:

`bottleneck.crossPromo`:
```json
"crossPromo": {
  "badge": "أداة إضافية",
  "title": "جرب حاسبة تضييق الأداء",
  "subtitle": "تحقق من توازن المعالج وكرت الشاشة واحصل على توصيات للترقية."
}
```

`fpsEstimator.crossPromo`:
```json
"crossPromo": {
  "badge": "أداة إضافية",
  "title": "قدّر الإطارات في الثانية لإعدادك",
  "subtitle": "اختر لعبة واحصل على تقدير الإطارات لجهازك."
}
```

And `messages/en.json`:

`bottleneck.crossPromo`:
```json
"crossPromo": {
  "badge": "Companion tool",
  "title": "Try the bottleneck calculator",
  "subtitle": "Check CPU/GPU balance and get tailored upgrade picks."
}
```

`fpsEstimator.crossPromo`:
```json
"crossPromo": {
  "badge": "Companion tool",
  "title": "Estimate FPS for your build",
  "subtitle": "Pick a game and get an FPS estimate for your setup."
}
```

Re-verify all three JSON files parse: `node -e "for (const f of ['fr','ar','en']) JSON.parse(require('fs').readFileSync('messages/'+f+'.json'))" && echo OK`.

- [ ] **Step 3: Render the cross-promo in `BottleneckCalculator.tsx`**

In `components/bottleneck/BottleneckCalculator.tsx`, just before the final `</div>` that closes the outer `<div className="min-h-screen ...">` (the very last div before the `<style jsx>` block), insert:

```tsx
        <ToolCrossPromo target="fps" />
```

Add the import at the top:

```tsx
import { ToolCrossPromo } from "./ToolCrossPromo";
```

(`target="fps"` means "link from bottleneck → fps-estimator". The component reads strings from the current page's namespace.)

Wait — re-read the `ToolCrossPromo` component: when `target === "fps"`, the link goes to `/fps-estimator` and the strings come from `bottleneck.crossPromo` (i.e., the *current* page's namespace describing the other tool). That's correct.

- [ ] **Step 4: Render the cross-promo in `FpsEstimatorStandalone.tsx`**

In `components/fps-estimator/FpsEstimatorStandalone.tsx`, just before the `<style jsx>` block at the bottom (around line 320), insert:

```tsx
        <ToolCrossPromo target="bottleneck" />
```

Add the import at the top:

```tsx
import { ToolCrossPromo } from "@/components/bottleneck/ToolCrossPromo";
```

(`target="bottleneck"` → links to `/bottleneck-calculator`, reads from `fpsEstimator.crossPromo`.)

- [ ] **Step 5: Build and smoke-test**

Run: `npm run build`
Expected: clean.

Visit http://localhost:3000/fr/bottleneck-calculator — confirm a card at the bottom of the page promoting the FPS estimator. Click it → lands on `/fr/fps-estimator`. From there, confirm a card at the bottom promoting the bottleneck calculator. Click it → lands on `/fr/bottleneck-calculator`.

- [ ] **Step 6: Commit**

```bash
git add components/bottleneck/ToolCrossPromo.tsx components/bottleneck/BottleneckCalculator.tsx components/fps-estimator/FpsEstimatorStandalone.tsx messages/
git commit -m "tools: cross-promo cards between fps estimator and bottleneck calculator"
```

---

## Task 12: Add nav links in Header and MobileNav

**Files:**
- Modify: `components/layout/Header.tsx:13-20`
- Modify: `components/layout/MobileNav.tsx`

- [ ] **Step 1: Add the link to `Header.tsx`**

In `components/layout/Header.tsx`, the `links` array currently has 6 entries (line 13-20). Add a new entry after `fpsEstimator`:

Before:
```ts
  const links = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("products") },
    { href: "/configurator", label: t("buildPc") },
    { href: "/support", label: t("services") },
    { href: "/track", label: t("trackOrder") },
    { href: "/fps-estimator", label: t("fpsEstimator") },
  ];
```

After:
```ts
  const links = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("products") },
    { href: "/configurator", label: t("buildPc") },
    { href: "/support", label: t("services") },
    { href: "/track", label: t("trackOrder") },
    { href: "/fps-estimator", label: t("fpsEstimator") },
    { href: "/bottleneck-calculator", label: t("bottleneck") },
  ];
```

- [ ] **Step 2: Add the link to `MobileNav.tsx`**

Open `components/layout/MobileNav.tsx`. Find where `fpsEstimator` link is defined (search for `fps-estimator`). Add a sibling link for `/bottleneck-calculator` immediately after it, using `t("bottleneck")` for the label. Copy the exact JSX shape of the existing FPS-estimator entry.

If `MobileNav` builds its menu from a similar `links` array, follow the same pattern as Step 1.

- [ ] **Step 3: Build and smoke-test**

Run: `npm run build` — expected clean.

Open http://localhost:3000/fr — confirm "Goulot" appears in the header nav (between Estimator FPS and the locale switcher). Resize browser to mobile width or open the hamburger menu, confirm the same link appears. Click it → lands on `/fr/bottleneck-calculator`.

Repeat for `/ar` (label should be in Arabic) and `/en`.

- [ ] **Step 4: Commit**

```bash
git add components/layout/
git commit -m "nav: link the bottleneck calculator from header and mobile nav"
```

---

## Task 13: Add a home page card linking to the bottleneck calculator

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Inspect the home page**

Run: `head -50 app/[locale]/page.tsx` (or use Read tool).
Identify a natural insertion point — typically after the hero / featured products section, near the existing FPS estimator promo card if one exists. The home page is a server component using next-intl translations.

- [ ] **Step 2: Add the card**

Insert a section that links to `/bottleneck-calculator` with the bottleneck cross-promo styling. Reuse the `ToolCrossPromo` pattern if it composes — but since the home page is RSC and `ToolCrossPromo` is a client component, you can either render `ToolCrossPromo` directly (it's allowed; client components can be children of server components) OR inline a plain Link:

```tsx
import { Link } from "@/lib/i18n/routing";
import { Icon } from "@/components/ui/Icon";

// In the JSX, somewhere in the home page flow:
<section className="container mx-auto px-4 py-10">
  <Link
    href="/bottleneck-calculator"
    className="block rounded-2xl bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 ring-1 ring-primary/30 hover:ring-primary/60 transition-all p-6 sm:p-8"
  >
    <div className="flex items-center gap-4">
      <div className="rounded-xl bg-primary/30 p-3 shrink-0">
        <Icon name="balance" className="text-white text-[28px]" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-bold uppercase tracking-wider text-primary-200 mb-1">
          {t("home.bottleneckCard.badge")}
        </div>
        <div className="text-lg sm:text-2xl font-bold text-white">
          {t("home.bottleneckCard.title")}
        </div>
        <div className="text-sm text-slate-300 mt-1">
          {t("home.bottleneckCard.subtitle")}
        </div>
      </div>
      <Icon name="arrow_forward" className="text-white text-[24px] shrink-0" />
    </div>
  </Link>
</section>
```

(Get the `t` instance from the existing translations setup on the page; this is likely already imported. If `t` isn't available, use `const t = await getTranslations({ locale, namespace: "" });`.)

- [ ] **Step 3: Add `home.bottleneckCard` translations**

In each of `fr.json`, `ar.json`, `en.json`, inside the `home` namespace, add:

`fr.json`:
```json
"bottleneckCard": {
  "badge": "Nouvel outil",
  "title": "Calculez votre goulot d'étranglement",
  "subtitle": "CPU + GPU + résolution = pourcentage de goulot d'étranglement et recommandations."
}
```

`ar.json`:
```json
"bottleneckCard": {
  "badge": "أداة جديدة",
  "title": "احسب تضييق الأداء لديك",
  "subtitle": "المعالج + كرت الشاشة + الدقة = نسبة التضييق وتوصيات الترقية."
}
```

`en.json`:
```json
"bottleneckCard": {
  "badge": "New tool",
  "title": "Calculate your bottleneck",
  "subtitle": "CPU + GPU + resolution = bottleneck percentage and upgrade picks."
}
```

Verify JSON: `node -e "for (const f of ['fr','ar','en']) JSON.parse(require('fs').readFileSync('messages/'+f+'.json'))" && echo OK`.

- [ ] **Step 4: Build and smoke-test**

Run: `npm run build` — clean.

Visit http://localhost:3000/fr — confirm the new card is visible somewhere on the home page. Click it → lands on `/fr/bottleneck-calculator`. Repeat for `/ar` (RTL — arrow icon should be on the left), `/en`.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/page.tsx messages/
git commit -m "home: card promoting the bottleneck calculator"
```

---

## Task 14: Final end-to-end smoke test + production deploy

**Files:** none (verification + deploy only)

- [ ] **Step 1: Full local smoke test**

With `npm run dev` and `npx convex dev` both running:

1. Visit `/fr/bottleneck-calculator`. Pick `Ryzen 7 9800X3D` from CPU autocomplete. Pick `RTX 5080` from GPU autocomplete. Select 1080p, Gaming. Click Calculate. Expected: instant result, bottleneck % shown, "GPU bottleneck" component label, "Catalog data" badge, 3 GPU upgrade cards. No socket warning.

2. Switch resolution to 4K and recalculate. Expected: bottleneck flips or shrinks (GPU is now heavier-weighted). Same upgrade cards (GPU path doesn't care about socket).

3. Pick `Ryzen 7 9800X3D` (AM5 socket) for CPU but type free-text `RTX 4060` for GPU. Click Calculate. Expected: AI path runs (~3s spinner), result appears with "AI estimate" badge.

4. Type free-text `i5-12400F` for CPU (LGA1700) and pick `RTX 5080` from catalog. Calculate. Result should be CPU bottleneck. Upgrade cards: since `i5-12400F` is free text we can't know its socket → recommendations come without socket filter, and the **socket mismatch warning shows**.

5. Fill RAM = 8 and PSU = 400. Calculate. Expected: amber warnings for RAM and PSU shown above (or below) the verdict.

6. Test the invalid-hardware path: type `potato` and `banana` (free text). Expected: AI returns invalid_hardware, UI shows "We didn't recognize those parts..." message.

7. Test all three locales render correctly (FR, AR with RTL, EN).

8. Test nav links from Header and MobileNav.

9. Test cross-promo card on `/fps-estimator` links to bottleneck calculator.

10. Test home page card.

- [ ] **Step 2: Verify Convex env in production**

Run: `npx convex env list --prod`
Expected: `OPENROUTER_API_KEY` is present. If missing: `npx convex env set --prod OPENROUTER_API_KEY "<value>"`.

- [ ] **Step 3: Deploy Convex to production**

Run: `npx convex deploy --yes`
Expected: success log showing the new schema, queries, mutations, and action all pushed.

This regenerates `convex/_generated/api.d.ts` against production. If it's different from what you committed earlier, commit the update:

```bash
git add convex/_generated/api.d.ts
git diff --staged --quiet || git commit -m "convex: regenerate api.d.ts after prod deploy"
```

- [ ] **Step 4: Push to GitHub (triggers Vercel auto-deploy)**

Push the feature branch:
```bash
git push -u origin feat/bottleneck-calculator
```

If the push stalls (GitHub HTTP/2 flake per CLAUDE.md), retry with HTTP/1.1:
```bash
git -c http.version=HTTP/1.1 push -u origin feat/bottleneck-calculator
```

- [ ] **Step 5: Open a pull request**

```bash
gh pr create --title "feat: PC bottleneck calculator" --body "$(cat <<'EOF'
## Summary
- Hybrid CPU↔GPU bottleneck calculator at `/[locale]/bottleneck-calculator/`
- Curated tier scores in catalog (CPUs + GPUs) for deterministic path
- AI fallback (Claude Haiku via OpenRouter) for free-text inputs, with result caching
- Socket-aware CPU upgrade recommendations
- FR / AR / EN with RTL support
- Cross-promo cards between FPS estimator and bottleneck calculator
- Home page card linking to the tool

## Test plan
- [x] Local smoke test of all 6 inputs (CPU, GPU, resolution, task, RAM, PSU) at all 3 locales
- [x] Catalog path returns instantly with "High confidence" badge
- [x] AI path returns within ~4s, cached calls instant
- [x] Socket-aware CPU upgrades (warns when crossing AM5/LGA1700/LGA1851)
- [x] Invalid hardware (`potato`/`banana`) handled gracefully
- [ ] Production smoke after Vercel deploys

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Production smoke test**

After Vercel finishes (~2 min), visit the deployed URL (e.g., `https://zedinformatique.dz/fr/bottleneck-calculator`).

Repeat smoke test items 1, 3, 5, 6 from Step 1 against production. If anything fails, check Vercel build logs and Convex prod logs. Common issues per CLAUDE.md:
- Missing `OPENROUTER_API_KEY` on prod Convex
- `convex/_generated/api.d.ts` mismatch (regenerate + commit)
- Translation key missing in one locale (build will fail loudly with `MISSING_MESSAGE`)

- [ ] **Step 7: Merge**

Once production smoke passes:
```bash
gh pr merge --squash
```

---

## Open follow-ups (do NOT do in this plan)

- Add an admin UI for editing `tierScore` per product (currently you edit `seedReal.ts` and re-seed). Defer until catalog-editing pain is real.
- Add score-only entries for off-catalog popular SKUs (Ryzen 5 5600, RTX 3060, etc.) — defer until catalog hit rate proves <10% after 1 month per spec success criteria.
- Track recommendation click-through rate via a GA4 event on the upgrade cards. Spec target: ≥20%. Easy add but out of scope for v1.
- Server-side render the result for SEO when query params are present (e.g., `/bottleneck-calculator?cpu=ryzen-7-9800x3d&gpu=rtx-5080`). Would help with long-tail SEO ("ryzen 7 9800x3d bottleneck rtx 5080"). Defer.
