import { describe, it, expect } from "vitest";
import { analyzeBalance, recommendedPsu, pickUpgrades } from "../lib/balance-engine";
import { matchHardware } from "../lib/fps-engine";
import { CPUS, GPUS, FPS_GAMES } from "../lib/fps-data";

const run = (cpuId: string, gpuId: string, resolution: "1080p" | "1440p" | "4K" = "1080p", extra = {}) => {
  const r = analyzeBalance({ cpuId, gpuId, resolution, task: "gaming", ...extra });
  if (!r) throw new Error("no result");
  return r;
};

describe("hardware data for the bottleneck tool", () => {
  it("every part has power draw, every CPU a socket", () => {
    for (const g of GPUS) expect(g.watts, g.id).toBeGreaterThan(0);
    for (const c of CPUS) {
      expect(c.watts, c.id).toBeGreaterThan(0);
      expect(c.socket, c.id).toBeTruthy();
    }
  });

  it("assigns the right sockets", () => {
    const s = (id: string) => CPUS.find((c) => c.id === id)!.socket;
    expect(s("i5-9400f")).toBe("LGA1151");
    expect(s("i5-10400f")).toBe("LGA1200");
    expect(s("i5-12400f")).toBe("LGA1700");
    expect(s("ultra-5-245k")).toBe("LGA1851");
    expect(s("r5-5600")).toBe("AM4");
    expect(s("r5-3400g")).toBe("AM4");
    expect(s("r7-7800x3d")).toBe("AM5");
    expect(s("r5-8400f")).toBe("AM5");
  });
});

describe("analyzeBalance — verdicts that match common knowledge", () => {
  it("i5-12400F + RTX 3060 is balanced at 1080p", () => {
    expect(run("i5-12400f", "rtx-3060").verdict).toBe("balanced");
  });

  it("Ryzen 5 5600 + RX 6600 is balanced at 1080p", () => {
    expect(run("r5-5600", "rx-6600").verdict).toBe("balanced");
  });

  it("an RTX 4090 is CPU-limited at 1080p even with a 7800X3D, but not at 4K", () => {
    expect(run("r7-7800x3d", "rtx-4090").verdict).toBe("cpu");
    expect(run("r7-7800x3d", "rtx-4090", "4K").verdict).not.toBe("cpu");
  });

  it("an old i3 with an RTX 4070 is clearly CPU-limited", () => {
    const r = run("i3-10100f", "rtx-4070");
    expect(r.verdict).toBe("cpu");
    expect(r.percent).toBeGreaterThanOrEqual(20);
  });

  it("a GTX 1650 with a fast CPU is GPU-limited", () => {
    const r = run("i5-12400f", "gtx-1650");
    expect(r.verdict).toBe("gpu");
    expect(r.percent).toBeGreaterThanOrEqual(20);
  });

  it("raising the resolution moves the balance towards the GPU", () => {
    const a = run("r5-3600", "rtx-4070", "1080p");
    const b = run("r5-3600", "rtx-4070", "1440p");
    const c = run("r5-3600", "rtx-4070", "4K");
    expect(a.position).toBeLessThan(b.position);
    expect(b.position).toBeLessThan(c.position);
  });

  it("streaming asks more of the CPU than plain gaming", () => {
    const g = analyzeBalance({ cpuId: "r5-3600", gpuId: "rtx-3070", resolution: "1080p", task: "gaming" })!;
    const s = analyzeBalance({ cpuId: "r5-3600", gpuId: "rtx-3070", resolution: "1080p", task: "streaming" })!;
    expect(s.position).toBeLessThan(g.position);
  });

  it("percent is 0 when balanced and never above 50", () => {
    expect(run("i5-12400f", "rtx-3060").percent).toBe(0);
    expect(run("r5-1600", "rtx-5090").percent).toBeLessThanOrEqual(50);
    expect(run("r7-9800x3d", "gtx-1050-ti").percent).toBeLessThanOrEqual(50);
  });

  it("lists every game with its FPS and what limits it", () => {
    const r = run("i5-12400f", "rtx-3060");
    expect(r.games).toHaveLength(FPS_GAMES.length);
    for (const g of r.games) {
      expect(g.fps).toBeGreaterThan(0);
      expect(["cpu", "gpu", "engine"]).toContain(g.limitedBy);
    }
  });

  it("gives a verdict for every resolution", () => {
    const r = run("i5-12400f", "rtx-3060");
    expect(Object.keys(r.byResolution).sort()).toEqual(["1080p", "1440p", "4K"]);
    expect(r.byResolution["1080p"].verdict).toBe(r.verdict);
  });

  it("returns null for unknown parts", () => {
    expect(analyzeBalance({ cpuId: "x", gpuId: "rtx-3060", resolution: "1080p", task: "gaming" })).toBeNull();
  });
});

describe("power supply", () => {
  it("recommends sensible wattages", () => {
    const cpu = (id: string) => CPUS.find((c) => c.id === id)!;
    const gpu = (id: string) => GPUS.find((g) => g.id === id)!;
    expect(recommendedPsu(cpu("i3-12100f"), gpu("gtx-1650"))).toBeLessThanOrEqual(400);
    const mid = recommendedPsu(cpu("i5-12400f"), gpu("rtx-3060"));
    expect(mid).toBeGreaterThanOrEqual(450);
    expect(mid).toBeLessThanOrEqual(600);
    expect(recommendedPsu(cpu("i9-13900k"), gpu("rtx-4090"))).toBeGreaterThanOrEqual(850);
    expect(mid % 50).toBe(0);
  });

  it("flags a power supply that is too weak", () => {
    expect(run("i9-13900k", "rtx-4090", "4K", { psuWatts: 650 }).psu.status).toBe("low");
    expect(run("i5-12400f", "rtx-3060", "1080p", { psuWatts: 650 }).psu.status).toBe("ok");
    expect(run("i5-12400f", "rtx-3060").psu.status).toBe("unknown");
  });

  it("warns about 8 GB of RAM", () => {
    expect(run("i5-12400f", "rtx-3060", "1080p", { ramGb: 8 }).warnings).toContain("ram8");
    expect(run("i5-12400f", "rtx-3060", "1080p", { ramGb: 16 }).warnings).not.toContain("ram8");
  });
});

describe("matchHardware — map shop product names to the built-in list", () => {
  it("finds the exact model inside a retail product name", () => {
    expect(matchHardware(GPUS, "MSI GeForce RTX 4060 Ventus 2X Black 8G OC")?.id).toBe("rtx-4060");
    expect(matchHardware(GPUS, "ASUS Dual GeForce RTX 4060 Ti 8GB")?.id).toBe("rtx-4060-ti");
    expect(matchHardware(GPUS, "Gigabyte RTX 3060 Gaming OC 12G")?.id).toBe("rtx-3060");
    expect(matchHardware(GPUS, "Sapphire Pulse Radeon RX 6600 XT")?.id).toBe("rx-6600-xt");
    expect(matchHardware(GPUS, "XFX Speedster RX 580 8GB")?.id).toBe("rx-580");
    expect(matchHardware(CPUS, "Processeur Intel Core i5-12400F (Box)")?.id).toBe("i5-12400f");
    expect(matchHardware(CPUS, "AMD Ryzen 5 5600X Tray")?.id).toBe("r5-5600x");
    expect(matchHardware(CPUS, "AMD RYZEN 7 7800X3D")?.id).toBe("r7-7800x3d");
  });

  it("returns null when nothing matches", () => {
    expect(matchHardware(GPUS, "Souris Logitech G102")).toBeNull();
  });
});

describe("pickUpgrades", () => {
  const shop = [
    { name: "RTX 3050 8GB", priceDzd: 40000 },
    { name: "RTX 4060 Ventus", priceDzd: 60000 },
    { name: "RTX 4070 Super", priceDzd: 120000 },
    { name: "RTX 5090", priceDzd: 600000 },
    { name: "Intel Core i5-12400F", priceDzd: 25000 },
    { name: "Intel Core i5-14600K", priceDzd: 55000 },
    { name: "AMD Ryzen 7 7800X3D", priceDzd: 90000 },
    { name: "AMD Ryzen 7 5800X3D", priceDzd: 70000 },
  ];

  it("suggests faster GPUs the current CPU can still feed, cheapest first", () => {
    const ups = pickUpgrades({ cpuId: "i5-12400f", gpuId: "gtx-1650", resolution: "1080p", task: "gaming", side: "gpu", products: shop });
    const ids = ups.map((u) => u.hw.id);
    expect(ids[0]).toBe("rtx-3050");
    expect(ids).not.toContain("rtx-5090"); // a 12400F would hold it back
  });

  it("suggests CPUs strong enough, same socket first", () => {
    const ups = pickUpgrades({ cpuId: "r5-3600", gpuId: "rtx-4070", resolution: "1080p", task: "gaming", side: "cpu", products: shop });
    expect(ups[0].hw.id).toBe("r7-5800x3d");
    expect(ups[0].sameSocket).toBe(true);
    expect(ups.map((u) => u.hw.id)).not.toContain("i5-12400f"); // not fast enough
  });
});
