import {
  CPUS,
  FPS_GAMES,
  GPUS,
  type Cpu,
  type FpsGame,
  type FpsResolution,
  type Gpu,
  type Preset,
} from "./fps-data";

export type FpsInput = {
  cpuId: string;
  gpuId: string;
  gameId: string;
  resolution: FpsResolution;
  ramGb?: number;
};

export type FpsTip = { key: string; values?: Record<string, string | number> };

export type FpsEstimate = {
  /** FPS at the recommended preset. */
  fps: number;
  preset: Preset;
  byPreset: Record<Preset, number>;
  /** FPS at each resolution, on the recommended preset. */
  byResolution: Record<FpsResolution, number>;
  limitedBy: "gpu" | "cpu" | "engine";
  tips: FpsTip[];
};

const PRESETS_HIGH_TO_LOW: Preset[] = ["ultra", "high", "medium", "low"];
const RESOLUTIONS: FpsResolution[] = ["1080p", "1440p", "4K"];
/** Softness of the CPU/GPU limit blend: higher = closer to a hard min(). */
const BLEND = 5;
const RAM_8GB_PENALTY = 0.85;

export const findGpu = (id: string): Gpu | undefined => GPUS.find((g) => g.id === id);
export const findCpu = (id: string): Cpu | undefined => CPUS.find((c) => c.id === id);
export const findGame = (id: string): FpsGame | undefined => FPS_GAMES.find((g) => g.id === id);

function vramNeeded(game: FpsGame, res: FpsResolution) {
  return game.vramHigh + (res === "1440p" ? 1 : res === "4K" ? 2 : 0);
}

type Point = { fps: number; limitedBy: FpsEstimate["limitedBy"] };

function point(gpu: Gpu, cpu: Cpu, game: FpsGame, res: FpsResolution, preset: Preset, ramGb?: number): Point {
  let gpuFps = game.gpuRef[res] * (gpu.score / 100) * game.presets[preset];
  if (gpu.vram < vramNeeded(game, res)) {
    if (preset === "high" || preset === "ultra") gpuFps *= 0.75;
    else if (preset === "medium") gpuFps *= 0.9;
  }
  const cpuFps = game.cpuRef * (cpu.score / 100);
  // Smooth minimum: the slower part dominates, the other still costs a little.
  let fps = Math.pow(Math.pow(gpuFps, -BLEND) + Math.pow(cpuFps, -BLEND), -1 / BLEND);
  if (ramGb !== undefined && ramGb <= 8 && game.ramHeavy) fps *= RAM_8GB_PENALTY;

  let limitedBy: Point["limitedBy"] = cpuFps < gpuFps ? "cpu" : "gpu";
  if (game.engineCap && fps >= game.engineCap) {
    fps = game.engineCap;
    limitedBy = "engine";
  }
  return { fps: Math.round(fps), limitedBy };
}

function bestPreset(gpu: Gpu, cpu: Cpu, game: FpsGame, res: FpsResolution, ramGb?: number) {
  const target = game.competitive ? 144 : 60;
  for (const p of PRESETS_HIGH_TO_LOW) {
    const pt = point(gpu, cpu, game, res, p, ramGb);
    if (pt.fps >= Math.min(target, game.engineCap ?? Infinity)) return { preset: p, ...pt };
  }
  return { preset: "low" as Preset, ...point(gpu, cpu, game, res, "low", ramGb) };
}

export function estimateFps(input: FpsInput): FpsEstimate | null {
  const gpu = findGpu(input.gpuId);
  const cpu = findCpu(input.cpuId);
  const game = findGame(input.gameId);
  if (!gpu || !cpu || !game) return null;
  const { resolution: res, ramGb } = input;

  const best = bestPreset(gpu, cpu, game, res, ramGb);
  const byPreset = Object.fromEntries(
    PRESETS_HIGH_TO_LOW.map((p) => [p, point(gpu, cpu, game, res, p, ramGb).fps])
  ) as Record<Preset, number>;
  const byResolution = Object.fromEntries(
    RESOLUTIONS.map((r) => [r, point(gpu, cpu, game, r, best.preset, ramGb).fps])
  ) as FpsEstimate["byResolution"];

  const tips: FpsTip[] = [];
  if (best.limitedBy === "engine") {
    tips.push({ key: "engineCap", values: { cap: game.engineCap! } });
  }
  if (best.limitedBy === "cpu") {
    tips.push({ key: "cpuBound", values: { cpu: cpu.name } });
  }
  if (best.limitedBy === "gpu" && best.fps < 60) {
    tips.push({ key: gpu.dlss ? "upscaleDlss" : "upscaleFsr" });
  }
  if (gpu.vram < vramNeeded(game, res)) {
    tips.push({ key: "vram", values: { need: vramNeeded(game, res), have: gpu.vram } });
  }
  if (ramGb !== undefined && ramGb <= 8 && game.ramHeavy) {
    tips.push({ key: "ram" });
  }
  if (best.fps >= 144 && best.limitedBy !== "engine") {
    tips.push({ key: "highRefresh" });
  } else if (tips.length === 0) {
    tips.push({ key: "balanced" });
  }

  return { fps: best.fps, preset: best.preset, byPreset, byResolution, limitedBy: best.limitedBy, tips };
}

/* ───────────── search ───────────── */

const STOP_WORDS = new Set(["geforce", "nvidia", "radeon", "intel", "core", "amd", "graphics"]);
const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Loose name search over a hardware list; empty query returns popular items. */
export function searchHardware<T extends { id: string; name: string; score: number; popular?: boolean }>(
  list: T[],
  query: string,
  limit = 8
): T[] {
  const tokens = query
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .map(compact)
    .filter((t) => t && !STOP_WORDS.has(t));
  if (tokens.length === 0) {
    return list.filter((x) => x.popular).sort((a, b) => a.score - b.score).slice(0, limit);
  }
  const joined = tokens.join("");
  return list
    .map((x) => {
      const hay = `${compact(x.name)} ${compact(x.id)}`;
      const ok = hay.includes(joined) || tokens.every((t) => hay.includes(t));
      return ok ? x : null;
    })
    .filter((x): x is T => x !== null)
    .sort(
      (a, b) =>
        compact(a.id).length - compact(b.id).length ||
        Number(!!b.popular) - Number(!!a.popular) ||
        a.score - b.score
    )
    .slice(0, limit);
}
