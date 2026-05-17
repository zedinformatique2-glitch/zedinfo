# PC Bottleneck Calculator — Design

**Date:** 2026-05-17
**Status:** Approved (design phase)

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
   - A row of 2-4 catalog product cards that would fix the bottleneck

## Architecture

### Hybrid calculation engine

- **Catalog path (deterministic):** When both CPU and GPU were picked from the autocomplete (i.e., resolved to a product ID), compute the bottleneck % from a tier-score formula using fields already on the product specs (cores, base/boost clock, generation for CPUs; cuda/stream cores, vram, base/boost clock for GPUs). Returns instantly. Confidence: "High".
- **AI fallback:** When at least one input is free text, call a new Convex action `bottleneck.estimate` that uses OpenRouter + Claude Haiku (same pattern as `convex/fpsEstimate.ts`). Confidence: "Estimated".

Both paths return the same shape:
```ts
{
  bottleneckPercent: number,           // 0-100
  bottleneckedComponent: "cpu" | "gpu" | "balanced",
  verdict: string,                      // one-line, localized
  explanation: string,                  // 2-3 lines, localized
  confidence: "high" | "medium" | "low",
  warnings: { type: "ram" | "psu", message: string }[],
  recommendedUpgrades: { productId: Id<"products">, reason: string }[],
}
```

### Tier-score formula (catalog path)

Each CPU and GPU gets a normalized score 0-100 derived from its specs. The score is **resolution-aware**:

- **CPU effective score** = base_cpu_score × resolution_cpu_weight (1080p heavier on CPU, 4K lighter).
- **GPU effective score** = base_gpu_score × resolution_gpu_weight (4K heavier on GPU).

Bottleneck % = `abs(cpuEff - gpuEff) / max(cpuEff, gpuEff) × 100`, capped at a sane ceiling (e.g., 40%).
Bottlenecked component = whichever has the lower effective score.
Task type modifies weights: "Streaming" and "Content creation" push CPU weight up.

Tier-score derivation lives in a new pure-TS module `lib/bottleneck-engine.ts` (mirrors `lib/configurator-engine.ts`). Pure function, easily testable, no Convex deps.

### AI fallback prompt

`convex/bottleneck.ts` (new file, `"use node"` action). Prompt asks Claude Haiku for the same JSON shape the deterministic path returns. Locale-aware (FR/AR/EN strings).

### Upgrade recommendations

After computing the bottleneck:
- If CPU-bottlenecked, query `products` for CPUs with a higher tier-score than the current CPU, sorted by price ascending. Take 3.
- If GPU-bottlenecked, same but for GPUs.
- If balanced (<5% bottleneck), return an empty array — show "Your build is well balanced" instead of products.

Helper lives in `convex/bottleneck.ts` as a query `bottleneck.recommendUpgrades({ category, minScore, maxBudget? })`.

## File-by-file plan

| File | Action | Purpose |
|---|---|---|
| `lib/bottleneck-engine.ts` | new | Pure TS: tier scores per part + bottleneck formula |
| `convex/bottleneck.ts` | new | `estimate` action (AI fallback) + `recommendUpgrades` query |
| `app/[locale]/bottleneck-calculator/page.tsx` | new | Server component shell, locale + metadata |
| `components/bottleneck/BottleneckCalculator.tsx` | new | Client form + result panel |
| `components/bottleneck/PartAutocomplete.tsx` | new | Shared autocomplete (CPU and GPU variants) |
| `convex/products.ts` | edit | Add `searchByCategory(category, query)` query for autocomplete |
| `messages/fr.json`, `ar.json`, `en.json` | edit | Add `bottleneck.*` translation keys |
| `components/layout/Header.tsx` | edit | Add nav link |
| `app/[locale]/page.tsx` | edit | Add home-page card linking to the tool |
| `components/fps-estimator/FpsEstimatorStandalone.tsx` | edit | Add cross-promo card to bottleneck calculator |
| `app/[locale]/bottleneck-calculator/page.tsx` metadata | — | SEO title/description targeting bottleneck keywords (FR + AR + EN) |

## i18n

Three locale files (`fr.json`, `ar.json`, `en.json`). All UI strings, verdicts, explanations, and AI prompts must be locale-aware. The AI action receives `locale` and returns localized `verdict` / `explanation`.

## Design system compliance

- All boxes use `rounded-2xl` (form panel, result panel) or `rounded-xl` (inputs, autocomplete items).
- Product recommendation cards reuse `components/shop/ProductCard.tsx`.
- Primary CTA button uses `components/ui/Button.tsx`.
- No new colors — stick to the existing palette.

## Out of scope (explicitly not building)

- Per-game bottleneck variations (the FPS estimator already handles game-specific FPS).
- Historical / saved calculations.
- User accounts or sharing.
- Bottleneck % for non-CPU/GPU combos (RAM bottleneck, storage bottleneck) — those become RAM/PSU side warnings only.
- Tier score editor in admin — initial scores are derived from specs in code; if we need overrides later, that's a future task.

## Success criteria

- Page ranks for "bottleneck calculator" (FR/AR) within ~3 months of launch (tracked in Search Console).
- ≥30% of calculator users click through to a recommended product page.
- AI fallback returns valid JSON ≥95% of the time (same threshold as the FPS estimator).
- Catalog path returns in <50ms; AI path in <4s p95.
