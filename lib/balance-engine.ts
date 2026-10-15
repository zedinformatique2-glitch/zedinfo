import { FPS_GAMES, type Cpu, type FpsResolution, type Gpu } from "./fps-data";
import { estimateFps, findCpu, findGpu, matchHardware } from "./fps-engine";
import { CPUS, GPUS } from "./fps-data";

/**
 * CPU/GPU balance ("bottleneck") from the same built-in benchmark data as the
 * FPS estimator — no AI, no network.
 *
 * For each game we know how many FPS the GPU can render (gpuRef) and how many
 * the CPU can feed (cpuRef). From the median game at the chosen resolution we
 * get the CPU score this GPU needs; comparing it with the real CPU score gives
 * the balance ratio q:
 *   q < 0.9  → the CPU holds the GPU back
 *   q > 2.2  → the GPU is the weak part (the CPU has lots of headroom)
 *   else     → balanced (being slightly GPU-bound is the healthy normal)
 */

export type Workload = "gaming" | "streaming" | "content";

export type BalanceInput = {
  cpuId: string;
  gpuId: string;
  resolution: FpsResolution;
  task: Workload;
  ramGb?: number;
  psuWatts?: number;
};

export type Verdict = "balanced" | "cpu" | "gpu";

export type BalanceResult = {
  verdict: Verdict;
  /** How much the weak part holds the other back, 0–50. 0 when balanced. */
  percent: number;
  /** -1 (CPU limits hard) … 0 (ideal) … +1 (GPU limits hard). */
  position: number;
  /** CPU score this GPU needs at this resolution/workload, vs the real one. */
  cpuNeeded: number;
  cpuScore: number;
  games: { id: string; name: string; fps: number; limitedBy: "cpu" | "gpu" | "engine" }[];
  byResolution: Record<FpsResolution, { verdict: Verdict; percent: number }>;
  psu: { recommended: number; current?: number; status: "ok" | "low" | "unknown" };
  warnings: ("ram8" | "ram16content")[];
};

const Q_CPU = 0.9;
const Q_GPU = 2.2;
const MAX_PERCENT = 50;
const TASK_CPU_NEED: Record<Workload, number> = { gaming: 1, streaming: 1.15, content: 1.25 };
const RESOLUTIONS: FpsResolution[] = ["1080p", "1440p", "4K"];

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * CPU score needed to keep this GPU fed in the median game. Games where the
 * GPU already hits the built-in frame cap say nothing about balance, so they
 * are left out.
 */
export function cpuScoreNeeded(gpu: Gpu, res: FpsResolution, task: Workload) {
  const ratios = FPS_GAMES.flatMap((g) => {
    const gpuFps = g.gpuRef[res] * (gpu.score / 100);
    return g.engineCap && gpuFps >= g.engineCap ? [] : [gpuFps / g.cpuRef];
  });
  const fallback = FPS_GAMES.map((g) => Math.min(g.gpuRef[res] * (gpu.score / 100), g.engineCap ?? Infinity) / g.cpuRef);
  return median(ratios.length ? ratios : fallback) * 100 * TASK_CPU_NEED[task];
}

function judge(q: number): { verdict: Verdict; percent: number } {
  if (q < Q_CPU) return { verdict: "cpu", percent: Math.min(Math.round((1 - q) * 100), MAX_PERCENT) };
  if (q > Q_GPU) return { verdict: "gpu", percent: Math.min(Math.round((1 - Q_GPU / q) * 100), MAX_PERCENT) };
  return { verdict: "balanced", percent: 0 };
}

function positionOf(q: number) {
  const centre = Math.sqrt(Q_CPU * Q_GPU);
  const span = Math.log((Q_GPU * 2) / centre);
  return Math.max(-1, Math.min(1, Math.log(q / centre) / span));
}

/** Minimum PSU (W), rounded up to 50 W, with headroom for spikes and ageing. */
export function recommendedPsu(cpu: Cpu, gpu: Gpu) {
  return Math.ceil(((gpu.watts + cpu.watts * 0.8 + 120) * 1.35) / 50) * 50;
}

export function analyzeBalance(input: BalanceInput): BalanceResult | null {
  const cpu = findCpu(input.cpuId);
  const gpu = findGpu(input.gpuId);
  if (!cpu || !gpu) return null;

  const at = (res: FpsResolution) => {
    const need = cpuScoreNeeded(gpu, res, input.task);
    const q = cpu.score / need;
    return { need, q, ...judge(q) };
  };
  const main = at(input.resolution);

  const games = FPS_GAMES.map((g) => {
    const e = estimateFps({ cpuId: cpu.id, gpuId: gpu.id, gameId: g.id, resolution: input.resolution, ramGb: input.ramGb })!;
    return { id: g.id, name: g.name, fps: e.byPreset.high, limitedBy: e.limitedBy };
  });

  const byResolution = Object.fromEntries(
    RESOLUTIONS.map((r) => {
      const x = at(r);
      return [r, { verdict: x.verdict, percent: x.percent }];
    })
  ) as BalanceResult["byResolution"];

  const recommended = recommendedPsu(cpu, gpu);
  const psu: BalanceResult["psu"] =
    input.psuWatts === undefined
      ? { recommended, status: "unknown" }
      : { recommended, current: input.psuWatts, status: input.psuWatts >= recommended ? "ok" : "low" };

  const warnings: BalanceResult["warnings"] = [];
  if (input.ramGb !== undefined && input.ramGb <= 8) warnings.push("ram8");
  else if (input.ramGb !== undefined && input.ramGb < 32 && input.task === "content") warnings.push("ram16content");

  return {
    verdict: main.verdict,
    percent: main.percent,
    position: positionOf(main.q),
    cpuNeeded: Math.round(main.need),
    cpuScore: cpu.score,
    games,
    byResolution,
    psu,
    warnings,
  };
}

/* ───────────── upgrades from the shop catalog ───────────── */

export type ShopProduct = { name: string; priceDzd: number };

export type Upgrade<P extends ShopProduct, H> = { product: P; hw: H; sameSocket: boolean };

/**
 * Pick shop products that fix the weak side:
 * - CPU side: processors that comfortably feed the GPU (q ≥ 1.2), same socket first, then cheapest.
 * - GPU side: cards at least 25% faster that the current CPU can still feed (q ≥ 0.9), cheapest first.
 */
export function pickUpgrades<P extends ShopProduct>(args: {
  cpuId: string;
  gpuId: string;
  resolution: FpsResolution;
  task: Workload;
  side: "cpu" | "gpu";
  products: P[];
  limit?: number;
}): Upgrade<P, Cpu | Gpu>[] {
  const cpu = findCpu(args.cpuId);
  const gpu = findGpu(args.gpuId);
  if (!cpu || !gpu) return [];
  const limit = args.limit ?? 3;

  if (args.side === "cpu") {
    const need = cpuScoreNeeded(gpu, args.resolution, args.task);
    return args.products
      .map((p) => ({ product: p, hw: matchHardware(CPUS, p.name) }))
      .filter((x): x is { product: P; hw: Cpu } => !!x.hw && x.hw.id !== cpu.id && x.hw.score / need >= 1.2)
      .map((x) => ({ ...x, sameSocket: x.hw.socket === cpu.socket }))
      .sort((a, b) => Number(b.sameSocket) - Number(a.sameSocket) || a.product.priceDzd - b.product.priceDzd)
      .slice(0, limit);
  }

  return args.products
    .map((p) => ({ product: p, hw: matchHardware(GPUS, p.name) }))
    .filter(
      (x): x is { product: P; hw: Gpu } =>
        !!x.hw &&
        x.hw.score >= gpu.score * 1.25 &&
        cpu.score / cpuScoreNeeded(x.hw, args.resolution, args.task) >= Q_CPU
    )
    .map((x) => ({ ...x, sameSocket: true }))
    .sort((a, b) => a.product.priceDzd - b.product.priceDzd)
    .slice(0, limit);
}
