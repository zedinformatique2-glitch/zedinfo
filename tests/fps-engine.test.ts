import { describe, it, expect } from "vitest";
import { estimateFps, searchHardware, findGpu, findCpu } from "../lib/fps-engine";
import { GPUS, CPUS, FPS_GAMES } from "../lib/fps-data";

function run(cpu: string, gpu: string, game: string, resolution: "1080p" | "1440p" | "4K", ramGb = 16) {
  const r = estimateFps({ cpuId: cpu, gpuId: gpu, gameId: game, resolution, ramGb });
  if (!r) throw new Error(`no estimate for ${cpu} ${gpu} ${game}`);
  return r;
}

describe("fps data", () => {
  it("has unique ids", () => {
    for (const list of [GPUS, CPUS, FPS_GAMES]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("covers the common cards and processors", () => {
    for (const id of ["rtx-3060", "rtx-4060", "rx-6600", "gtx-1650", "rtx-4090", "arc-b580"]) {
      expect(findGpu(id), id).toBeTruthy();
    }
    for (const id of ["i5-12400f", "r5-5600", "r7-7800x3d", "i3-12100f"]) {
      expect(findCpu(id), id).toBeTruthy();
    }
  });
});

describe("estimateFps — sanity against well-known benchmarks", () => {
  it("RTX 3060 + i5-12400F, Cyberpunk 1080p High lands around 60-80", () => {
    const r = run("i5-12400f", "rtx-3060", "cyberpunk", "1080p");
    expect(r.byPreset.high).toBeGreaterThanOrEqual(60);
    expect(r.byPreset.high).toBeLessThanOrEqual(80);
  });

  it("RTX 4090 at 4K Cyberpunk High is far above an RTX 3060", () => {
    const big = run("r7-7800x3d", "rtx-4090", "cyberpunk", "4K");
    const small = run("r7-7800x3d", "rtx-3060", "cyberpunk", "4K");
    expect(big.byPreset.high).toBeGreaterThan(small.byPreset.high * 2.5);
  });

  it("CS2 on a fast GPU is held back by a slow CPU", () => {
    const slow = run("r5-1600", "rtx-4080", "cs2", "1080p");
    const fast = run("r7-7800x3d", "rtx-4080", "cs2", "1080p");
    expect(slow.limitedBy).toBe("cpu");
    expect(fast.fps).toBeGreaterThan(slow.fps * 1.8);
  });

  it("Elden Ring never goes above its 60 FPS engine cap", () => {
    const r = run("r7-9800x3d", "rtx-5090", "eldenring", "1080p");
    expect(r.fps).toBe(60);
    expect(r.limitedBy).toBe("engine");
  });

  it("higher resolution never gives more FPS", () => {
    for (const g of FPS_GAMES) {
      const a = run("i5-13600k", "rtx-4070", g.id, "1080p").byPreset.high;
      const b = run("i5-13600k", "rtx-4070", g.id, "1440p").byPreset.high;
      const c = run("i5-13600k", "rtx-4070", g.id, "4K").byPreset.high;
      expect(a, g.id).toBeGreaterThanOrEqual(b);
      expect(b, g.id).toBeGreaterThanOrEqual(c);
    }
  });

  it("lower presets never give fewer FPS", () => {
    const r = run("r5-5600", "rx-6600", "warzone", "1440p");
    expect(r.byPreset.low).toBeGreaterThanOrEqual(r.byPreset.medium);
    expect(r.byPreset.medium).toBeGreaterThanOrEqual(r.byPreset.high);
    expect(r.byPreset.high).toBeGreaterThanOrEqual(r.byPreset.ultra);
  });

  it("8 GB of RAM costs FPS in a heavy game", () => {
    const r8 = run("i5-12400f", "rtx-4070", "warzone", "1080p", 8);
    const r16 = run("i5-12400f", "rtx-4070", "warzone", "1080p", 16);
    expect(r8.fps).toBeLessThan(r16.fps);
    expect(r8.tips.some((t) => t.key === "ram")).toBe(true);
  });

  it("a 4 GB card is penalised at 1440p in a heavy game", () => {
    const r = run("i5-12400f", "gtx-1650-super", "cyberpunk", "1440p");
    expect(r.tips.some((t) => t.key === "vram")).toBe(true);
  });

  it("recommends the highest preset that reaches the game's target", () => {
    // Competitive game: target 144. A fast PC should get a high preset.
    const fast = run("r7-7800x3d", "rtx-4070-super", "valorant", "1080p");
    expect(["high", "ultra"]).toContain(fast.preset);
    expect(fast.fps).toBe(fast.byPreset[fast.preset]);
    // Weak PC in a heavy game falls back to low.
    const weak = run("i3-10100f", "gtx-1050-ti", "cyberpunk", "1440p");
    expect(weak.preset).toBe("low");
  });

  it("suggests DLSS on RTX cards and FSR on others when GPU-bound below 60", () => {
    const nv = run("r7-7800x3d", "rtx-3050", "cyberpunk", "1440p");
    expect(nv.tips.some((t) => t.key === "upscaleDlss")).toBe(true);
    const amd = run("r7-7800x3d", "rx-6600", "cyberpunk", "4K");
    expect(amd.tips.some((t) => t.key === "upscaleFsr")).toBe(true);
  });

  it("returns whole numbers and FPS for every resolution at the recommended preset", () => {
    const r = run("r5-5600", "rx-6600", "cyberpunk", "1080p");
    expect(Number.isInteger(r.fps)).toBe(true);
    expect(Object.keys(r.byResolution).sort()).toEqual(["1080p", "1440p", "4K"]);
    expect(r.byResolution["1080p"]).toBe(r.fps);
    expect(r.byResolution["1080p"]).toBeGreaterThanOrEqual(r.byResolution["1440p"]);
    expect(r.byResolution["1440p"]).toBeGreaterThanOrEqual(r.byResolution["4K"]);
  });

  it("returns null for unknown parts or games", () => {
    expect(estimateFps({ cpuId: "nope", gpuId: "rtx-3060", gameId: "cs2", resolution: "1080p" })).toBeNull();
    expect(estimateFps({ cpuId: "r5-5600", gpuId: "rtx-3060", gameId: "nope", resolution: "1080p" })).toBeNull();
  });
});

describe("searchHardware", () => {
  it("matches loosely typed names", () => {
    expect(searchHardware(GPUS, "3060")[0].id).toBe("rtx-3060");
    expect(searchHardware(GPUS, "rtx 3060 ti")[0].id).toBe("rtx-3060-ti");
    expect(searchHardware(GPUS, "6700xt")[0].id).toBe("rx-6700-xt");
    expect(searchHardware(CPUS, "12400")[0].id).toBe("i5-12400f");
    expect(searchHardware(CPUS, "ryzen 5 5600")[0].id).toBe("r5-5600");
    expect(searchHardware(CPUS, "7800x3d")[0].id).toBe("r7-7800x3d");
  });

  it("returns popular items when the query is empty", () => {
    expect(searchHardware(GPUS, "").length).toBeGreaterThan(0);
  });
});
