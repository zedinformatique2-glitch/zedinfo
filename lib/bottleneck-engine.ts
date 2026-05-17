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
