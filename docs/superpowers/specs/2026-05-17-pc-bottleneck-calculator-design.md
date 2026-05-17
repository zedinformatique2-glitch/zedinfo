# PC Bottleneck Calculator — Design

**Date:** 2026-05-17
**Status:** Approved (design phase) — revised v2

## Goal

Add a CPU↔GPU bottleneck calculator at `/[locale]/bottleneck-calculator/` to capture high-volume search traffic ("bottleneck calculator", "CPU GPU bottleneck") and convert visitors into upgrade buyers by recommending parts from the Zed Informatique catalog.

## User flow

1. User lands on `/[locale]/bottleneck-calculator/` (linked from main nav, home page, and a cross-promo card on `/fps-estimator`).
2. Picks a CPU and a GPU via autocomplete inputs backed by the `products` catalog. Free text accepted if no match.
3. Picks a resolution (1080p / 1440p / 4K) and a task type (Gaming / Streaming / Content creation).
4. Optionally fills in RAM size (GB) and PSU wattage (W).
5. Clicks "Calculate". Result panel appears below with:
   - Big bottleneck % and one-line verdict
   - 2-3 line plain-language explanation
   - Optional side warnings about RAM / PSU
   - A row of 2-4 catalog product cards that would fix the bottleneck (socket-filtered when possible)

## Architecture

### Hybrid calculation engine

- **Catalog path:** When both CPU and GPU were picked from the autocomplete (i.e., resolved to a product ID), look up each part's curated `tierScore` from product specs and compute the bottleneck % from the formula below. Returns instantly. Confidence: "High (catalog data)".
- **AI fallback:** When at least one input is free text, call a new Convex action `bottleneck.estimate` that uses OpenRouter + Claude Haiku (same pattern as `convex/fpsEstimate.ts`). Confidence: "Estimated".

Both paths return the same shape:
```ts
{
  bottleneckPercent: number,           // 0-100
  bottleneckedComponent: "cpu" | "gpu" | "balanced",
  verdict: string,                      // one-line, localized
  explanation: string,                  // 2-3 lines, localized
  confidence: "high" | "medium" | "low",
  warnings: { type: "ram" | "psu" | "socket", message: string }[],
  recommendedUpgrades: { productId: Id<"products">, reason: string }[],
  sourceCpuSocket?: string,             // when catalog path; used by frontend for disclaimer
}
```

### Tier scores: curated at seed, not derived from specs

This is the change vs v1. We do **not** try to derive tier scores from `cores × clock × generation` — that produces wrong-looking math for parts where IPC, memory controller, or cache differences dominate.

Instead, the `cpu` and `gpu` spec types in `convex/schema.ts` get a new field:

```ts
tierScore: v.number()      // 1-100, calibrated against PassMark CPU Mark / 3DMark Time Spy Graphics
```

Scores are hand-set in `convex/seedReal.ts` based on public benchmark data (PassMark for CPUs, 3DMark Time Spy Graphics for GPUs) normalized to a 1-100 scale where current flagships ≈ 100. A short rationale comment lives next to each scoring section in the seed file so future maintainers know how to score new SKUs.

Trade-off: adding a new SKU requires looking up one benchmark number. That's worth the honesty — the calculator is now deterministic *and* aligned with real-world benchmarks.

### Bottleneck formula (catalog path)

The score is **resolution-aware** and **task-aware**:

- **CPU effective score** = `cpu.tierScore × cpuWeight[resolution][task]`
- **GPU effective score** = `gpu.tierScore × gpuWeight[resolution][task]`

Weight tables (live in `lib/bottleneck-engine.ts` as constants, easy to tune):
- Gaming at 1080p: CPU 1.0, GPU 0.85 (CPU-heavier)
- Gaming at 1440p: CPU 0.9, GPU 1.0 (balanced)
- Gaming at 4K: CPU 0.7, GPU 1.0 (GPU-heavier)
- Streaming: +0.15 CPU weight on top of resolution weights
- Content creation: +0.25 CPU weight on top of resolution weights

Bottleneck % = `abs(cpuEff - gpuEff) / max(cpuEff, gpuEff) × 100`, capped at 40% (above which the result is more "wrong build" than "bottleneck").
Bottlenecked component = whichever has the lower effective score. Within 5% = "balanced".

Tier-score lookups and formula live in `lib/bottleneck-engine.ts` (mirrors `lib/configurator-engine.ts`). Pure functions, easily testable, no Convex deps.

### AI fallback prompt

`convex/bottleneck.ts` (new file, `"use node"` action). Prompt asks Claude Haiku for the same JSON shape the deterministic path returns. Includes:
- Locale-aware output (FR/AR/EN)
- Explicit instruction to refuse non-hardware inputs ("if the CPU or GPU name doesn't look like real hardware, return `{ "error": "invalid_hardware" }`")
- Same weight intuitions as the deterministic path described in the prompt, so the two paths give comparable answers for similar inputs

Front-end handles the `invalid_hardware` error by showing a "We couldn't recognize that part — try picking from the dropdown" message.

### AI result caching

New Convex table `bottleneckCache`:

```ts
bottleneckCache: defineTable({
  key: v.string(),       // normalized hash of `${cpu}|${gpu}|${resolution}|${task}|${locale}|${promptVersion}`
  result: v.string(),    // JSON-stringified result blob
  hits: v.number(),
  createdAt: v.number(),
}).index("by_key", ["key"])
```

Flow: AI action hashes inputs → looks up cache → returns cached result if found (and increments `hits`). Otherwise calls OpenRouter, stores result, returns. `promptVersion` is a constant in code — bump it whenever the prompt or model changes to invalidate the cache.

No TTL; results stay stable per prompt version. The `hits` counter helps spot popular combos for product-page suggestions later.

### Upgrade recommendations

After computing the bottleneck, `bottleneck.recommendUpgrades` (Convex query) returns 2-3 catalog products that would close the gap:

**GPU bottleneck** — Trivial. Query `products` for GPUs with `tierScore` ≥ `cpu.tierScore × 1.05`, sort by price ascending, take 3. No socket constraint (all modern GPUs are PCIe x16).

**CPU bottleneck** — Socket-aware:
- If the source CPU came from the catalog, we know its socket from specs. Query CPUs with the same socket and `tierScore` ≥ `gpu.tierScore`, sort by price, take 3.
- If no same-socket CPU is strong enough, fall back to recommending across all sockets and append a `warnings: [{ type: "socket", message: "These require a new motherboard..." }]` notice. The UI shows this prominently above the recommendations.
- If the source CPU is free text, we can't know the socket. Recommend across all CPUs but include the same socket warning unconditionally.

**Balanced (<5% gap)** — Return an empty array. Show "Your build is well balanced. Looking for more performance? [Browse high-end GPUs →]" as a soft conversion path.

### Catalog coverage — known constraint

The catalog currently has roughly 8-12 CPU SKUs and 6-10 GPU SKUs (from `seedReal.ts`). Realistically, most users will type something the catalog doesn't have → AI fallback handles them. The catalog path is the high-trust path for the parts we actually sell. We accept this asymmetry — the calculator works for everyone, and visitors who type a part we *do* stock get a small "verified by catalog" badge that subtly nudges trust.

If catalog hit rate is <10% after 1 month, we'll consider expanding the curated tier-score table to common non-stocked parts (Ryzen 5 5600, i5-12400F, RTX 3060, RTX 4060, etc.) — these would be score-only entries, not products. That work is out of scope for v1.

## File-by-file plan

| File | Action | Purpose |
|---|---|---|
| `convex/schema.ts` | edit | Add `tierScore` to cpu and gpu spec validators; add `bottleneckCache` table |
| `convex/seedReal.ts` | edit | Add curated `tierScore` to every CPU and GPU; comment with benchmark source |
| `lib/bottleneck-engine.ts` | new | Pure TS: weight tables, bottleneck formula, helpers |
| `convex/bottleneck.ts` | new | `estimate` action (AI + cache), `recommendUpgrades` query |
| `app/[locale]/bottleneck-calculator/page.tsx` | new | Server component shell, locale + SEO metadata |
| `components/bottleneck/BottleneckCalculator.tsx` | new | Client form + result panel |
| `components/bottleneck/PartAutocomplete.tsx` | new | CPU/GPU autocomplete (reuses existing combobox patterns if any; otherwise built from scratch with `rounded-xl` items) |
| `convex/products.ts` | edit | Add `searchByCategory(category, query)` query for autocomplete (uses existing text search index on `nameFr`) |
| `messages/{fr,ar,en}.json` | edit | Add `bottleneck.*` translation keys (all three locales) |
| `components/layout/Header.tsx` | edit | Add nav link |
| `app/[locale]/page.tsx` | edit | Add home-page card linking to the tool |
| `components/fps-estimator/FpsEstimatorStandalone.tsx` | edit | Add cross-promo card to bottleneck calculator |

## i18n

Three locale files (`fr.json`, `ar.json`, `en.json`). All UI strings, verdicts, explanations, warnings, and AI prompts must be locale-aware. The AI action receives `locale` and returns localized `verdict` / `explanation` / `warnings[].message`. RTL on `ar` follows the existing pattern — use `ms-*` / `me-*` / `ps-*` / `pe-*` for any directional spacing.

## Design system compliance

- All boxes use `rounded-2xl` (form panel, result panel) or `rounded-xl` (inputs, autocomplete items).
- Product recommendation cards reuse `components/shop/ProductCard.tsx`.
- Primary CTA button uses `components/ui/Button.tsx`.
- No new colors — stick to the existing palette. Bottleneck % uses primary navy for the number, with a subtle color hint (green <5%, amber 5-15%, red >15%) on the verdict line only.

## Out of scope (explicitly not building)

- Per-game bottleneck variations (the FPS estimator already handles game-specific FPS).
- Historical / saved calculations.
- User accounts or sharing.
- Bottleneck % for non-CPU/GPU combos (RAM bottleneck, storage bottleneck) — those become RAM/PSU side warnings only.
- Tier score editor in admin — initial scores are hand-set in `seedReal.ts`. An admin editor is a future task if maintainers don't want to edit code.
- Score-only entries (parts we score but don't sell) for catalog-path coverage of common SKUs. Defer to v2 based on catalog hit rate.

## Success criteria

- Page ranks for "bottleneck calculator" (FR/AR) within 6-12 months of launch (tracked in Search Console). Initial 3-month target: indexed and starting to appear for long-tail queries.
- ≥20% of calculator users click through to a recommended product page (relaxed from 30% — depends on catalog coverage of the bottleneck case).
- AI fallback returns valid JSON ≥95% of the time (same threshold as the FPS estimator), tracked in Convex action logs.
- Catalog path returns in <50ms; AI path in <4s p95 (cached); <8s p95 (cold).
- Cache hit rate ≥40% after 1 month (popular combos getting reused).
