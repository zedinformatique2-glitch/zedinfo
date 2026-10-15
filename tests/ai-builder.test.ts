import { describe, expect, it } from "vitest";
import {
  searchParts,
  resolveBuild,
  reviewBuild,
  reviewProducts,
  catalogOverview,
  type CatalogProduct,
} from "../lib/ai-builder";

function p(
  slug: string,
  priceDzd: number,
  specs: Record<string, unknown> | undefined,
  stock = 5,
  nameFr = slug
): CatalogProduct {
  return { _id: `id-${slug}`, slug, nameFr, nameAr: slug, brand: "X", priceDzd, stock, specs: specs as any };
}

const catalog: CatalogProduct[] = [
  p("ryzen-7600", 30000, { type: "cpu", socket: "AM5", tdp: 65 }),
  p("ryzen-9700x", 55000, { type: "cpu", socket: "AM5", tdp: 65 }),
  p("i5-14400f", 28000, { type: "cpu", socket: "LGA1700", tdp: 65 }),
  p("ryzen-old", 9000, { type: "cpu", socket: "AM4", tdp: 65 }, 0),
  p("b650", 25000, { type: "motherboard", socket: "AM5", ramType: "DDR5", ramSlots: 2, maxRam: 64, formFactor: "mATX", m2Slots: 1 }),
  p("b760", 22000, { type: "motherboard", socket: "LGA1700", ramType: "DDR4", ramSlots: 2, maxRam: 64, formFactor: "mATX", m2Slots: 1 }),
  p("ddr5-16", 9000, { type: "ram", ramType: "DDR5", sizeGb: 16, sticks: 1 }),
  p("ddr4-16", 6000, { type: "ram", ramType: "DDR4", sizeGb: 16, sticks: 1 }),
  p("rtx-4060", 60000, { type: "gpu", tdp: 115, lengthMm: 240 }, 2),
  p("nvme-1tb", 9000, { type: "storage", interface: "NVMe" }),
  p("psu-650", 9000, { type: "psu", wattage: 650 }),
  p("mini-case", 8000, { type: "case", supportedFormFactors: ["mATX", "ITX"], maxGpuLengthMm: 300, maxCoolerHeightMm: 160 }),
  p("monitor-24", 25000, undefined, 3, "Ecran Gaming 24 pouces 165Hz"),
  p("config-5600g", 102000, { type: "PC Gaming" }),
  p("config-8400f", 179500, { type: "PC Gaming" }),
  p("config-old", 90000, { type: "PC Gaming" }, 0),
];

describe("catalogOverview", () => {
  it("summarises in-stock categories with counts and price ranges", () => {
    const o = catalogOverview(catalog);
    expect(o).toContain("cpu: 3 in stock, 28000–55000 DZD");
    expect(o).toContain("PC Gaming: 2 in stock, 102000–179500 DZD");
    expect(o).toContain("other: 1 in stock, 25000–25000 DZD");
    expect(o).not.toContain("90000");
  });
});

describe("searchParts by category", () => {
  it("matches non-slot categories case-insensitively", () => {
    const res = searchParts(catalog, { type: "pc gaming", maxPriceDzd: 200000 });
    expect(res.map((r) => r.slug)).toEqual(["config-8400f", "config-5600g"]);
  });
});

describe("reviewProducts", () => {
  it("accepts in-stock products with quantities and totals them", () => {
    const r = reviewProducts([{ slug: "config-8400f", qty: 1 }, { slug: "monitor-24", qty: 2 }], catalog);
    expect(r.ok).toBe(true);
    expect(r.totalDzd).toBe(179500 + 50000);
    expect(r.items).toEqual([{ slug: "config-8400f", qty: 1 }, { slug: "monitor-24", qty: 2 }]);
  });

  it("rejects unknown, out-of-stock and over-stock items", () => {
    const r = reviewProducts(
      [{ slug: "nope", qty: 1 }, { slug: "config-old", qty: 1 }, { slug: "rtx-4060", qty: 3 }],
      catalog
    );
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([
      '"nope" is not in the catalog',
      '"config-old" is out of stock',
      '"rtx-4060": only 2 in stock',
    ]);
  });
});

describe("searchParts", () => {
  it("returns only in-stock parts of the requested type, most expensive first", () => {
    const res = searchParts(catalog, { type: "cpu" });
    expect(res.map((r) => r.slug)).toEqual(["ryzen-9700x", "ryzen-7600", "i5-14400f"]);
  });

  it("filters by price range and socket", () => {
    const res = searchParts(catalog, { type: "cpu", socket: "am5", maxPriceDzd: 40000 });
    expect(res.map((r) => r.slug)).toEqual(["ryzen-7600"]);
  });

  it("filters by ram type", () => {
    const res = searchParts(catalog, { type: "ram", ramType: "DDR5" });
    expect(res.map((r) => r.slug)).toEqual(["ddr5-16"]);
  });

  it("finds non-PC products such as monitors by text query", () => {
    const res = searchParts(catalog, { query: "ecran 165hz" });
    expect(res.map((r) => r.slug)).toEqual(["monitor-24"]);
  });

  it("respects the limit and exposes price, stock and specs", () => {
    const res = searchParts(catalog, { type: "cpu", limit: 1 });
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ slug: "ryzen-9700x", priceDzd: 55000, stock: 5, specs: { socket: "AM5" } });
  });
});

describe("resolveBuild", () => {
  it("maps slugs to components and reports unknown or out-of-stock slugs", () => {
    const { selection, problems } = resolveBuild(
      { cpu: "ryzen-old", motherboard: "b650", ram: ["ddr5-16", "ddr5-16"], gpu: "nope" },
      catalog
    );
    expect(selection.motherboard?.slug).toBe("b650");
    expect(selection.ram).toHaveLength(2);
    expect(selection.cpu).toBeUndefined();
    expect(problems).toEqual([
      'cpu: "ryzen-old" is out of stock',
      'gpu: "nope" is not in the catalog',
    ]);
  });

  it("refuses a product placed in the wrong slot", () => {
    const { problems } = resolveBuild({ gpu: "ryzen-7600" }, catalog);
    expect(problems).toEqual(['gpu: "ryzen-7600" is a cpu, not a gpu']);
  });
});

describe("reviewBuild", () => {
  const full = {
    cpu: "ryzen-7600",
    motherboard: "b650",
    ram: ["ddr5-16", "ddr5-16"],
    gpu: "rtx-4060",
    storage: "nvme-1tb",
    psu: "psu-650",
    case: "mini-case",
  };

  it("accepts a complete compatible build and totals it", () => {
    const r = reviewBuild(full, catalog);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.totalDzd).toBe(30000 + 25000 + 18000 + 60000 + 9000 + 9000 + 8000);
    expect(r.missingSlots).toEqual([]);
    expect(r.lowStock).toEqual(["rtx-4060"]);
  });

  it("rejects an incompatible build with the engine's errors", () => {
    const r = reviewBuild({ ...full, cpu: "i5-14400f" }, catalog);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/Socket/);
  });

  it("rejects a build missing an essential part", () => {
    const { psu: _psu, ...noPsu } = full;
    const r = reviewBuild(noPsu, catalog);
    expect(r.ok).toBe(false);
    expect(r.missingSlots).toEqual(["psu"]);
  });

  it("rejects more copies of a part than are in stock", () => {
    const r = reviewBuild({ ...full, gpu: ["rtx-4060"], ram: ["ddr5-16", "ddr5-16"] }, [
      ...catalog.filter((x) => x.slug !== "ddr5-16"),
      p("ddr5-16", 9000, { type: "ram", ramType: "DDR5", sizeGb: 16, sticks: 1 }, 1),
    ]);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('ram: "ddr5-16" ×2 but only 1 in stock');
  });

  it("rejects a build with unknown slugs", () => {
    const r = reviewBuild({ ...full, gpu: "nope" }, catalog);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('gpu: "nope" is not in the catalog');
  });
});
