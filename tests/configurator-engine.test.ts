import { describe, expect, it } from "vitest";
import {
  checkCompatibility,
  filterCompatibleProducts,
  type ComponentSpec,
  type ConfigComponent,
} from "../lib/configurator-engine";

function part(slug: string, priceDzd: number, specs: ComponentSpec): ConfigComponent {
  return { slug, nameFr: slug, nameAr: slug, priceDzd, specs };
}

const cpuAm5 = part("ryzen-7600", 30000, { type: "cpu", socket: "AM5", tdp: 65 });
const cpuLga = part("i5-14400f", 28000, { type: "cpu", socket: "LGA1700", tdp: 65 });
const mbAm5 = part("b650", 25000, {
  type: "motherboard",
  socket: "AM5",
  ramType: "DDR5",
  ramSlots: 2,
  maxRam: 64,
  formFactor: "mATX",
  m2Slots: 1,
});
const ddr5 = part("ddr5-16", 9000, { type: "ram", ramType: "DDR5", sizeGb: 16, sticks: 1 });
const ddr4 = part("ddr4-16", 6000, { type: "ram", ramType: "DDR4", sizeGb: 16, sticks: 1 });
const gpu = part("rtx-4060", 60000, { type: "gpu", tdp: 115, lengthMm: 240 });
const caseSmall = part("mini-case", 8000, {
  type: "case",
  supportedFormFactors: ["mATX", "ITX"],
  maxGpuLengthMm: 300,
  maxCoolerHeightMm: 150,
});

describe("checkCompatibility", () => {
  it("accepts a matching build and totals the price", () => {
    const r = checkCompatibility({ cpu: cpuAm5, motherboard: mbAm5, ram: [ddr5], gpu, case: caseSmall });
    expect(r.errors).toEqual([]);
    expect(r.compatible).toBe(true);
    expect(r.totalPrice).toBe(30000 + 25000 + 9000 + 60000 + 8000);
  });

  it("flags a CPU/motherboard socket mismatch", () => {
    const r = checkCompatibility({ cpu: cpuLga, motherboard: mbAm5 });
    expect(r.compatible).toBe(false);
    expect(r.errors[0]).toMatch(/Socket incompatible/);
  });

  it("compares sockets case-insensitively", () => {
    const lower = part("x", 1, { type: "cpu", socket: " am5 " });
    expect(checkCompatibility({ cpu: lower, motherboard: mbAm5 }).compatible).toBe(true);
  });

  it("flags the wrong RAM type", () => {
    const r = checkCompatibility({ motherboard: mbAm5, ram: [ddr4] });
    expect(r.errors.some((e) => e.includes("Type de RAM"))).toBe(true);
  });

  it("flags more sticks than slots and more GB than supported", () => {
    const big = part("ddr5-64", 1, { type: "ram", ramType: "DDR5", sizeGb: 48, sticks: 2 });
    const r = checkCompatibility({ motherboard: mbAm5, ram: [big, big] });
    expect(r.errors.some((e) => e.includes("Trop de barrettes"))).toBe(true);
    expect(r.errors.some((e) => e.includes("Capacité RAM"))).toBe(true);
  });

  it("flags a motherboard that does not fit the case", () => {
    const atx = part("atx", 1, { type: "motherboard", formFactor: "ATX" });
    const r = checkCompatibility({ motherboard: atx, case: caseSmall });
    expect(r.errors.some((e) => e.includes("Format incompatible"))).toBe(true);
  });

  it("treats common spellings of the same form factor as equal", () => {
    for (const ff of ["Micro-ATX", "micro atx", "M-ATX", "MicroATX", "uATX"]) {
      const mb = part("mb", 1, { type: "motherboard", formFactor: ff });
      const r = checkCompatibility({ motherboard: mb, case: caseSmall });
      expect(r.errors, ff).toEqual([]);
    }
    const itx = part("itx", 1, { type: "motherboard", formFactor: "Mini-ITX" });
    expect(checkCompatibility({ motherboard: itx, case: caseSmall }).errors).toEqual([]);
  });

  it("filters Micro-ATX boards as compatible with an mATX case", () => {
    const mb = part("mb", 1, { type: "motherboard", formFactor: "Micro-ATX" });
    const res = filterCompatibleProducts([mb], { case: caseSmall }, "motherboard");
    expect(res[0].compatible).toBe(true);
  });

  it("flags a GPU longer than the case allows", () => {
    const long = part("long", 1, { type: "gpu", lengthMm: 340 });
    const r = checkCompatibility({ gpu: long, case: caseSmall });
    expect(r.errors.some((e) => e.includes("GPU trop long"))).toBe(true);
  });

  it("recommends a PSU with 30% headroom rounded up to 50W", () => {
    // 65 + 115 + 100 base = 280W → 364W → 400W
    const r = checkCompatibility({ cpu: cpuAm5, gpu });
    expect(r.estimatedWattage).toBe(280);
    expect(r.recommendedPsu).toBe(400);
  });

  it("flags an undersized PSU", () => {
    const psu = part("psu-350", 1, { type: "psu", wattage: 350 });
    const r = checkCompatibility({ cpu: cpuAm5, gpu, psu });
    expect(r.errors.some((e) => e.includes("Alimentation insuffisante"))).toBe(true);
  });

  it("treats missing spec data as unknown, not incompatible", () => {
    const bare = part("bare", 1, { type: "motherboard" });
    expect(checkCompatibility({ cpu: cpuAm5, motherboard: bare, ram: [ddr4] }).compatible).toBe(true);
  });

  it("checks cooler socket lists and warns on height and TDP", () => {
    const cooler = part("cooler", 1, {
      type: "cooler",
      socket: "LGA1700 LGA1200",
      heightMm: 160,
      tdpSupport: 50,
    });
    const r = checkCompatibility({ cpu: cpuAm5, case: caseSmall, cooler: [cooler] });
    expect(r.errors.some((e) => e.includes("Ventirad non compatible"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("Hauteur du ventirad"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("sous-dimensionné"))).toBe(true);
  });

  it("does not let case fans without socket data block the build", () => {
    const fan = part("fan", 1500, { type: "cooler" });
    const r = checkCompatibility({ cpu: cpuAm5, cooler: [fan, fan] });
    expect(r.compatible).toBe(true);
    expect(r.totalPrice).toBe(30000 + 3000);
  });
});

describe("filterCompatibleProducts", () => {
  it("marks CPUs that do not fit the chosen motherboard", () => {
    const out = filterCompatibleProducts([cpuAm5, cpuLga], { motherboard: mbAm5 }, "cpu");
    expect(out.map((o) => o.compatible)).toEqual([true, false]);
    expect(out[1].incompatibilityReason).toMatch(/LGA1700/);
  });

  it("marks NVMe drives when the motherboard has no M.2 slot", () => {
    const noM2 = part("old-mb", 1, { type: "motherboard", m2Slots: 0 });
    const nvme = part("nvme", 1, { type: "storage", interface: "NVMe PCIe 4.0" });
    const sata = part("sata", 1, { type: "storage", interface: "SATA" });
    const out = filterCompatibleProducts([nvme, sata], { motherboard: noM2 }, "storage");
    expect(out.map((o) => o.compatible)).toEqual([false, true]);
  });
});
