/**
 * Built-in hardware and game data for the FPS estimator (no AI, no network).
 *
 * Scores are relative gaming performance compiled from widely published
 * benchmark round-ups (relative-performance charts, review averages):
 * - GPU `score`: RTX 3060 12 GB = 100.
 * - CPU `score`: Ryzen 5 5600 = 100 (gaming, CPU-limited conditions).
 * Expect ±15–20% versus any single real-world run.
 */

export type Vendor = "nvidia" | "amd" | "intel";

export type Gpu = {
  id: string;
  name: string;
  vendor: Vendor;
  score: number;
  vram: number; // GB
  /** Supports DLSS (NVIDIA RTX). Others get FSR / XeSS tips. */
  dlss?: boolean;
  popular?: boolean;
  /** Typical board power under gaming load (W). Filled from GPU_WATTS. */
  watts: number;
};

export type Socket = "LGA1151" | "LGA1200" | "LGA1700" | "LGA1851" | "AM4" | "AM5";

export type Cpu = {
  id: string;
  name: string;
  vendor: "intel" | "amd";
  score: number;
  popular?: boolean;
  /** Peak package power (W). Filled from CPU_WATTS. */
  watts: number;
  socket: Socket;
};

export type Preset = "low" | "medium" | "high" | "ultra";
export type FpsResolution = "1080p" | "1440p" | "4K";

export type FpsGame = {
  id: string;
  name: string;
  img?: string;
  /** FPS an RTX 3060 delivers on the High preset with no CPU limit. */
  gpuRef: Record<FpsResolution, number>;
  /** FPS a Ryzen 5 5600 can feed (CPU limit), any resolution. */
  cpuRef: number;
  /** FPS multiplier of each preset relative to High (GPU side). */
  presets: Record<Preset, number>;
  /** Hard frame-rate cap built into the game, if any. */
  engineCap?: number;
  /** VRAM (GB) needed for High at 1080p; +1 GB at 1440p, +2 GB at 4K. */
  vramHigh: number;
  /** Game suffers with 8 GB of system RAM. */
  ramHeavy?: boolean;
  /** Competitive titles aim for 144 FPS; others for 60. */
  competitive?: boolean;
};

type RawGpu = Omit<Gpu, "watts">;
type RawCpu = Omit<Cpu, "watts" | "socket">;

const nv = (id: string, name: string, score: number, vram: number, extra: Partial<Gpu> = {}): RawGpu => ({
  id, name, vendor: "nvidia", score, vram, dlss: name.startsWith("RTX"), ...extra,
});
const amd = (id: string, name: string, score: number, vram: number, extra: Partial<Gpu> = {}): RawGpu => ({
  id, name, vendor: "amd", score, vram, ...extra,
});
const arc = (id: string, name: string, score: number, vram: number, extra: Partial<Gpu> = {}): RawGpu => ({
  id, name, vendor: "intel", score, vram, ...extra,
});

const RAW_GPUS: RawGpu[] = [
  // NVIDIA GTX
  nv("gtx-1050-ti", "GTX 1050 Ti", 33, 4),
  nv("gtx-1060-6gb", "GTX 1060 6GB", 50, 6),
  nv("gtx-1070", "GTX 1070", 64, 8),
  nv("gtx-1070-ti", "GTX 1070 Ti", 72, 8),
  nv("gtx-1080", "GTX 1080", 78, 8),
  nv("gtx-1080-ti", "GTX 1080 Ti", 108, 11),
  nv("gtx-1650", "GTX 1650", 40, 4, { popular: true }),
  nv("gtx-1650-super", "GTX 1650 Super", 52, 4),
  nv("gtx-1660", "GTX 1660", 60, 6),
  nv("gtx-1660-super", "GTX 1660 Super", 68, 6, { popular: true }),
  nv("gtx-1660-ti", "GTX 1660 Ti", 69, 6),
  // NVIDIA RTX 20
  nv("rtx-2060", "RTX 2060", 84, 6),
  nv("rtx-2060-super", "RTX 2060 Super", 96, 8),
  nv("rtx-2070", "RTX 2070", 100, 8),
  nv("rtx-2070-super", "RTX 2070 Super", 112, 8),
  nv("rtx-2080", "RTX 2080", 118, 8),
  nv("rtx-2080-super", "RTX 2080 Super", 124, 8),
  nv("rtx-2080-ti", "RTX 2080 Ti", 145, 11),
  // NVIDIA RTX 30
  nv("rtx-3050", "RTX 3050 8GB", 72, 8),
  nv("rtx-3060", "RTX 3060 12GB", 100, 12, { popular: true }),
  nv("rtx-3060-ti", "RTX 3060 Ti", 122, 8),
  nv("rtx-3070", "RTX 3070", 136, 8, { popular: true }),
  nv("rtx-3070-ti", "RTX 3070 Ti", 143, 8),
  nv("rtx-3080", "RTX 3080 10GB", 170, 10),
  nv("rtx-3080-ti", "RTX 3080 Ti", 185, 12),
  nv("rtx-3090", "RTX 3090", 190, 24),
  nv("rtx-3090-ti", "RTX 3090 Ti", 205, 24),
  // NVIDIA RTX 40
  nv("rtx-4060", "RTX 4060", 118, 8, { popular: true }),
  nv("rtx-4060-ti", "RTX 4060 Ti", 140, 8),
  nv("rtx-4070", "RTX 4070", 170, 12, { popular: true }),
  nv("rtx-4070-super", "RTX 4070 Super", 196, 12),
  nv("rtx-4070-ti", "RTX 4070 Ti", 205, 12),
  nv("rtx-4070-ti-super", "RTX 4070 Ti Super", 220, 16),
  nv("rtx-4080", "RTX 4080", 255, 16),
  nv("rtx-4080-super", "RTX 4080 Super", 260, 16),
  nv("rtx-4090", "RTX 4090", 330, 24),
  // NVIDIA RTX 50
  nv("rtx-5060", "RTX 5060", 140, 8, { popular: true }),
  nv("rtx-5060-ti", "RTX 5060 Ti", 160, 16),
  nv("rtx-5070", "RTX 5070", 210, 12, { popular: true }),
  nv("rtx-5070-ti", "RTX 5070 Ti", 255, 16),
  nv("rtx-5080", "RTX 5080", 290, 16),
  nv("rtx-5090", "RTX 5090", 400, 32),
  // AMD
  amd("rx-570", "RX 570", 45, 4),
  amd("rx-580", "RX 580 8GB", 50, 8, { popular: true }),
  amd("rx-5500-xt", "RX 5500 XT", 55, 8),
  amd("rx-5600-xt", "RX 5600 XT", 82, 6),
  amd("rx-5700", "RX 5700", 92, 8),
  amd("rx-5700-xt", "RX 5700 XT", 102, 8),
  amd("rx-6500-xt", "RX 6500 XT", 42, 4),
  amd("rx-6600", "RX 6600", 92, 8, { popular: true }),
  amd("rx-6600-xt", "RX 6600 XT", 105, 8),
  amd("rx-6650-xt", "RX 6650 XT", 110, 8),
  amd("rx-6700-xt", "RX 6700 XT", 130, 12, { popular: true }),
  amd("rx-6750-xt", "RX 6750 XT", 138, 12),
  amd("rx-6800", "RX 6800", 160, 16),
  amd("rx-6800-xt", "RX 6800 XT", 180, 16),
  amd("rx-6900-xt", "RX 6900 XT", 192, 16),
  amd("rx-6950-xt", "RX 6950 XT", 205, 16),
  amd("rx-7600", "RX 7600", 112, 8, { popular: true }),
  amd("rx-7600-xt", "RX 7600 XT", 118, 16),
  amd("rx-7700-xt", "RX 7700 XT", 160, 12),
  amd("rx-7800-xt", "RX 7800 XT", 190, 16, { popular: true }),
  amd("rx-7900-gre", "RX 7900 GRE", 205, 16),
  amd("rx-7900-xt", "RX 7900 XT", 245, 20),
  amd("rx-7900-xtx", "RX 7900 XTX", 280, 24),
  amd("rx-9060-xt", "RX 9060 XT", 150, 16),
  amd("rx-9070", "RX 9070", 245, 16),
  amd("rx-9070-xt", "RX 9070 XT", 270, 16),
  // Intel Arc
  arc("arc-a380", "Arc A380", 38, 6),
  arc("arc-a750", "Arc A750", 100, 8),
  arc("arc-a770", "Arc A770 16GB", 108, 16),
  arc("arc-b580", "Arc B580", 125, 12),
];

const intel = (id: string, name: string, score: number, popular?: boolean): RawCpu => ({
  id, name, vendor: "intel", score, popular,
});
const ryzen = (id: string, name: string, score: number, popular?: boolean): RawCpu => ({
  id, name, vendor: "amd", score, popular,
});

const RAW_CPUS: RawCpu[] = [
  // Intel 6th–9th gen
  intel("i5-6600k", "Intel Core i5-6600K", 58),
  intel("i7-6700k", "Intel Core i7-6700K", 66),
  intel("i5-7400", "Intel Core i5-7400", 55),
  intel("i7-7700k", "Intel Core i7-7700K", 72),
  intel("i5-8400", "Intel Core i5-8400", 70),
  intel("i7-8700k", "Intel Core i7-8700K", 80),
  intel("i5-9400f", "Intel Core i5-9400F", 72),
  intel("i7-9700k", "Intel Core i7-9700K", 85),
  intel("i9-9900k", "Intel Core i9-9900K", 90),
  // Intel 10th–11th gen
  intel("i3-10100f", "Intel Core i3-10100F", 72),
  intel("i5-10400f", "Intel Core i5-10400F", 78, true),
  intel("i7-10700k", "Intel Core i7-10700K", 90),
  intel("i5-11400f", "Intel Core i5-11400F", 88),
  // Intel 12th–14th gen
  intel("i3-12100f", "Intel Core i3-12100F", 92, true),
  intel("i5-12400f", "Intel Core i5-12400F", 102, true),
  intel("i5-12600k", "Intel Core i5-12600K", 115),
  intel("i7-12700k", "Intel Core i7-12700K", 122),
  intel("i9-12900k", "Intel Core i9-12900K", 127),
  intel("i5-13400f", "Intel Core i5-13400F", 108, true),
  intel("i5-13600k", "Intel Core i5-13600K", 130),
  intel("i7-13700k", "Intel Core i7-13700K", 138),
  intel("i9-13900k", "Intel Core i9-13900K", 145),
  intel("i5-14400f", "Intel Core i5-14400F", 110, true),
  intel("i5-14600k", "Intel Core i5-14600K", 133),
  intel("i7-14700k", "Intel Core i7-14700K", 142),
  intel("i9-14900k", "Intel Core i9-14900K", 148),
  // Intel Core Ultra 200S
  intel("ultra-5-245k", "Intel Core Ultra 5 245K", 120),
  intel("ultra-7-265k", "Intel Core Ultra 7 265K", 130),
  intel("ultra-9-285k", "Intel Core Ultra 9 285K", 138),
  // AMD Ryzen 1000–3000
  ryzen("r5-1600", "AMD Ryzen 5 1600", 55),
  ryzen("r5-2600", "AMD Ryzen 5 2600", 62),
  ryzen("r7-2700x", "AMD Ryzen 7 2700X", 68),
  ryzen("r5-3400g", "AMD Ryzen 5 3400G", 58),
  ryzen("r5-3600", "AMD Ryzen 5 3600", 78, true),
  ryzen("r7-3700x", "AMD Ryzen 7 3700X", 82),
  ryzen("r9-3900x", "AMD Ryzen 9 3900X", 85),
  // AMD Ryzen 5000
  ryzen("r5-5500", "AMD Ryzen 5 5500", 88),
  ryzen("r5-5600g", "AMD Ryzen 5 5600G", 86),
  ryzen("r5-5600", "AMD Ryzen 5 5600", 100, true),
  ryzen("r5-5600x", "AMD Ryzen 5 5600X", 103),
  ryzen("r7-5700g", "AMD Ryzen 7 5700G", 92),
  ryzen("r7-5700x", "AMD Ryzen 7 5700X", 106),
  ryzen("r7-5800x", "AMD Ryzen 7 5800X", 110),
  ryzen("r7-5800x3d", "AMD Ryzen 7 5800X3D", 130),
  ryzen("r9-5900x", "AMD Ryzen 9 5900X", 112),
  ryzen("r9-5950x", "AMD Ryzen 9 5950X", 113),
  // AMD Ryzen 7000 / 8000
  ryzen("r5-7500f", "AMD Ryzen 5 7500F", 125),
  ryzen("r5-7600", "AMD Ryzen 5 7600", 127, true),
  ryzen("r5-7600x", "AMD Ryzen 5 7600X", 130),
  ryzen("r7-7700", "AMD Ryzen 7 7700", 133),
  ryzen("r7-7700x", "AMD Ryzen 7 7700X", 135),
  ryzen("r7-7800x3d", "AMD Ryzen 7 7800X3D", 165, true),
  ryzen("r9-7900x", "AMD Ryzen 9 7900X", 136),
  ryzen("r9-7950x", "AMD Ryzen 9 7950X", 140),
  ryzen("r9-7950x3d", "AMD Ryzen 9 7950X3D", 162),
  ryzen("r5-8400f", "AMD Ryzen 5 8400F", 108),
  ryzen("r5-8600g", "AMD Ryzen 5 8600G", 112),
  ryzen("r7-8700g", "AMD Ryzen 7 8700G", 118),
  // AMD Ryzen 9000
  ryzen("r5-9600x", "AMD Ryzen 5 9600X", 140),
  ryzen("r7-9700x", "AMD Ryzen 7 9700X", 145),
  ryzen("r7-9800x3d", "AMD Ryzen 7 9800X3D", 185, true),
  ryzen("r9-9900x", "AMD Ryzen 9 9900X", 146),
  ryzen("r9-9950x", "AMD Ryzen 9 9950X", 150),
  ryzen("r9-9950x3d", "AMD Ryzen 9 9950X3D", 182),
];

/** Typical gaming board power (W), from manufacturer specs. */
const GPU_WATTS: Record<string, number> = {
  "gtx-1050-ti": 75, "gtx-1060-6gb": 120, "gtx-1070": 150, "gtx-1070-ti": 180, "gtx-1080": 180,
  "gtx-1080-ti": 250, "gtx-1650": 75, "gtx-1650-super": 100, "gtx-1660": 120, "gtx-1660-super": 125,
  "gtx-1660-ti": 120, "rtx-2060": 160, "rtx-2060-super": 175, "rtx-2070": 175, "rtx-2070-super": 215,
  "rtx-2080": 215, "rtx-2080-super": 250, "rtx-2080-ti": 250, "rtx-3050": 130, "rtx-3060": 170,
  "rtx-3060-ti": 200, "rtx-3070": 220, "rtx-3070-ti": 290, "rtx-3080": 320, "rtx-3080-ti": 350,
  "rtx-3090": 350, "rtx-3090-ti": 450, "rtx-4060": 115, "rtx-4060-ti": 160, "rtx-4070": 200,
  "rtx-4070-super": 220, "rtx-4070-ti": 285, "rtx-4070-ti-super": 285, "rtx-4080": 320,
  "rtx-4080-super": 320, "rtx-4090": 450, "rtx-5060": 145, "rtx-5060-ti": 180, "rtx-5070": 250,
  "rtx-5070-ti": 300, "rtx-5080": 360, "rtx-5090": 575,
  "rx-570": 150, "rx-580": 185, "rx-5500-xt": 130, "rx-5600-xt": 150, "rx-5700": 180, "rx-5700-xt": 225,
  "rx-6500-xt": 107, "rx-6600": 132, "rx-6600-xt": 160, "rx-6650-xt": 180, "rx-6700-xt": 230,
  "rx-6750-xt": 250, "rx-6800": 250, "rx-6800-xt": 300, "rx-6900-xt": 300, "rx-6950-xt": 335,
  "rx-7600": 165, "rx-7600-xt": 190, "rx-7700-xt": 245, "rx-7800-xt": 263, "rx-7900-gre": 260,
  "rx-7900-xt": 315, "rx-7900-xtx": 355, "rx-9060-xt": 160, "rx-9070": 220, "rx-9070-xt": 304,
  "arc-a380": 75, "arc-a750": 225, "arc-a770": 225, "arc-b580": 190,
};

/** Peak package power (W) — turbo limits, not the box TDP, so PSU advice stays safe. */
const CPU_WATTS: Record<string, number> = {
  "i5-6600k": 91, "i7-6700k": 91, "i5-7400": 65, "i7-7700k": 91, "i5-8400": 65, "i7-8700k": 130,
  "i5-9400f": 65, "i7-9700k": 130, "i9-9900k": 150, "i3-10100f": 65, "i5-10400f": 65, "i7-10700k": 200,
  "i5-11400f": 65, "i3-12100f": 60, "i5-12400f": 65, "i5-12600k": 150, "i7-12700k": 190,
  "i9-12900k": 240, "i5-13400f": 65, "i5-13600k": 180, "i7-13700k": 250, "i9-13900k": 250,
  "i5-14400f": 65, "i5-14600k": 180, "i7-14700k": 250, "i9-14900k": 250, "ultra-5-245k": 160,
  "ultra-7-265k": 250, "ultra-9-285k": 250,
  "r5-1600": 65, "r5-2600": 65, "r7-2700x": 105, "r5-3400g": 65, "r5-3600": 65, "r7-3700x": 88,
  "r9-3900x": 142, "r5-5500": 65, "r5-5600g": 65, "r5-5600": 76, "r5-5600x": 76, "r7-5700g": 65,
  "r7-5700x": 76, "r7-5800x": 142, "r7-5800x3d": 142, "r9-5900x": 142, "r9-5950x": 142,
  "r5-7500f": 88, "r5-7600": 88, "r5-7600x": 142, "r7-7700": 88, "r7-7700x": 142, "r7-7800x3d": 120,
  "r9-7900x": 230, "r9-7950x": 230, "r9-7950x3d": 162, "r5-8400f": 65, "r5-8600g": 88, "r7-8700g": 88,
  "r5-9600x": 88, "r7-9700x": 88, "r7-9800x3d": 162, "r9-9900x": 162, "r9-9950x": 230, "r9-9950x3d": 230,
};

function cpuSocket(id: string): Socket {
  if (id.startsWith("ultra-")) return "LGA1851";
  const intelGen = id.match(/^i\d-(\d+)/);
  if (intelGen) {
    const gen = Math.floor(Number(intelGen[1]) / 1000); // 6600 → 6, 12400 → 12
    return gen >= 12 ? "LGA1700" : gen >= 10 ? "LGA1200" : "LGA1151";
  }
  const series = Number(id.match(/^r\d-(\d)/)?.[1] ?? 0);
  return series >= 7 ? "AM5" : "AM4";
}

export const GPUS: Gpu[] = RAW_GPUS.map((g) => ({ ...g, watts: GPU_WATTS[g.id] ?? 200 }));
export const CPUS: Cpu[] = RAW_CPUS.map((c) => ({ ...c, watts: CPU_WATTS[c.id] ?? 125, socket: cpuSocket(c.id) }));

const AAA_PRESETS ={ low: 1.7, medium: 1.3, high: 1, ultra: 0.8 };

export const FPS_GAMES: FpsGame[] = [
  {
    id: "cs2", name: "Counter-Strike 2", img: "/games/cs2.jpg", competitive: true,
    gpuRef: { "1080p": 230, "1440p": 165, "4K": 95 }, cpuRef: 330,
    presets: { low: 1.35, medium: 1.15, high: 1, ultra: 0.9 }, vramHigh: 3,
  },
  {
    id: "valorant", name: "Valorant", img: "/games/valorant.jpg", competitive: true,
    gpuRef: { "1080p": 550, "1440p": 450, "4K": 260 }, cpuRef: 480,
    presets: { low: 1.3, medium: 1.15, high: 1, ultra: 0.92 }, vramHigh: 2,
  },
  {
    id: "fortnite", name: "Fortnite", img: "/games/fortnite.jpg", competitive: true,
    gpuRef: { "1080p": 100, "1440p": 72, "4K": 40 }, cpuRef: 200,
    presets: { low: 2.2, medium: 1.5, high: 1, ultra: 0.75 }, vramHigh: 6, ramHeavy: true,
  },
  {
    id: "warzone", name: "COD Warzone", img: "/games/warzone.jpg", competitive: true,
    gpuRef: { "1080p": 100, "1440p": 75, "4K": 45 }, cpuRef: 180,
    presets: { low: 1.5, medium: 1.25, high: 1, ultra: 0.85 }, vramHigh: 6, ramHeavy: true,
  },
  {
    id: "gtav", name: "GTA V", img: "/games/gtav.jpg",
    gpuRef: { "1080p": 120, "1440p": 95, "4K": 55 }, cpuRef: 170, engineCap: 187,
    presets: { low: 1.6, medium: 1.3, high: 1, ultra: 0.8 }, vramHigh: 4,
  },
  {
    id: "cyberpunk", name: "Cyberpunk 2077", img: "/games/cyberpunk.jpg",
    gpuRef: { "1080p": 70, "1440p": 47, "4K": 23 }, cpuRef: 140,
    presets: AAA_PRESETS, vramHigh: 6, ramHeavy: true,
  },
  {
    id: "eldenring", name: "Elden Ring", img: "/games/eldenring.jpg",
    gpuRef: { "1080p": 72, "1440p": 55, "4K": 33 }, cpuRef: 140, engineCap: 60,
    presets: { low: 1.8, medium: 1.35, high: 1, ultra: 0.85 }, vramHigh: 5, ramHeavy: true,
  },
  {
    id: "minecraft", name: "Minecraft", img: "/games/minecraft.jpg",
    gpuRef: { "1080p": 600, "1440p": 520, "4K": 350 }, cpuRef: 300,
    presets: { low: 1.2, medium: 1.1, high: 1, ultra: 0.9 }, vramHigh: 2,
  },
  // More games (no artwork — shown as compact chips)
  {
    id: "apex", name: "Apex Legends", competitive: true,
    gpuRef: { "1080p": 150, "1440p": 110, "4K": 62 }, cpuRef: 250, engineCap: 300,
    presets: { low: 1.5, medium: 1.25, high: 1, ultra: 0.88 }, vramHigh: 4,
  },
  {
    id: "lol", name: "League of Legends", competitive: true,
    gpuRef: { "1080p": 300, "1440p": 280, "4K": 200 }, cpuRef: 350,
    presets: { low: 1.2, medium: 1.1, high: 1, ultra: 0.95 }, vramHigh: 2,
  },
  {
    id: "pubg", name: "PUBG: Battlegrounds", competitive: true,
    gpuRef: { "1080p": 130, "1440p": 95, "4K": 55 }, cpuRef: 200,
    presets: { low: 1.6, medium: 1.3, high: 1, ultra: 0.85 }, vramHigh: 4, ramHeavy: true,
  },
  {
    id: "rocketleague", name: "Rocket League", competitive: true,
    gpuRef: { "1080p": 300, "1440p": 240, "4K": 140 }, cpuRef: 400, engineCap: 360,
    presets: { low: 1.4, medium: 1.2, high: 1, ultra: 0.9 }, vramHigh: 2,
  },
  {
    id: "fc25", name: "EA Sports FC 25",
    gpuRef: { "1080p": 140, "1440p": 110, "4K": 65 }, cpuRef: 200,
    presets: { low: 1.4, medium: 1.2, high: 1, ultra: 0.88 }, vramHigh: 4,
  },
  {
    id: "forza5", name: "Forza Horizon 5",
    gpuRef: { "1080p": 110, "1440p": 85, "4K": 55 }, cpuRef: 180,
    presets: { low: 1.6, medium: 1.3, high: 1, ultra: 0.82 }, vramHigh: 6,
  },
  {
    id: "rdr2", name: "Red Dead Redemption 2",
    gpuRef: { "1080p": 70, "1440p": 52, "4K": 30 }, cpuRef: 130,
    presets: AAA_PRESETS, vramHigh: 6, ramHeavy: true,
  },
  {
    id: "wukong", name: "Black Myth: Wukong",
    gpuRef: { "1080p": 45, "1440p": 32, "4K": 17 }, cpuRef: 130,
    presets: { low: 1.8, medium: 1.35, high: 1, ultra: 0.75 }, vramHigh: 7, ramHeavy: true,
  },
];
