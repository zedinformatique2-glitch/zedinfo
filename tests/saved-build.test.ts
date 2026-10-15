import { describe, expect, it } from "vitest";
import type { ConfigSelection, ComponentSpec } from "../lib/configurator-engine";
import {
  selectionToItems,
  itemsToSelection,
  isValidShareCode,
  type CatalogProduct,
} from "../lib/saved-build";

function product(id: string, priceDzd: number, stock: number, specs: ComponentSpec): CatalogProduct {
  return { _id: id, slug: id, nameFr: id, nameAr: id, priceDzd, stock, specs };
}

const cpu = product("cpu1", 30000, 5, { type: "cpu", socket: "AM5" });
const ram = product("ram1", 9000, 10, { type: "ram", ramType: "DDR5" });
const ssd = product("ssd1", 12000, 3, { type: "storage", capacity: "1TB" });
const gpuGone = product("gpu1", 90000, 0, { type: "gpu" });

const catalog = new Map([cpu, ram, ssd, gpuGone].map((p) => [p._id, p]));

describe("selectionToItems", () => {
  it("lists one item per part, repeating multi-slot parts for each unit", () => {
    const sel: ConfigSelection = {
      cpu: { _id: "cpu1", slug: "cpu1", nameFr: "", nameAr: "", priceDzd: 1, specs: { type: "cpu" } },
      ram: [
        { _id: "ram1", slug: "ram1", nameFr: "", nameAr: "", priceDzd: 1, specs: { type: "ram" } },
        { _id: "ram1", slug: "ram1", nameFr: "", nameAr: "", priceDzd: 1, specs: { type: "ram" } },
      ],
    };
    expect(selectionToItems(sel)).toEqual([
      { slot: "cpu", productId: "cpu1" },
      { slot: "ram", productId: "ram1" },
      { slot: "ram", productId: "ram1" },
    ]);
  });

  it("skips parts without a product id", () => {
    const sel: ConfigSelection = {
      cpu: { slug: "x", nameFr: "", nameAr: "", priceDzd: 1, specs: { type: "cpu" } },
    };
    expect(selectionToItems(sel)).toEqual([]);
  });
});

describe("itemsToSelection", () => {
  it("rebuilds the selection with current catalog prices and quantities", () => {
    const { selection, skipped } = itemsToSelection(
      [
        { slot: "cpu", productId: "cpu1" },
        { slot: "ram", productId: "ram1" },
        { slot: "ram", productId: "ram1" },
        { slot: "storage", productId: "ssd1" },
      ],
      catalog
    );
    expect(skipped).toBe(0);
    expect(selection.cpu?.priceDzd).toBe(30000);
    expect(selection.ram?.map((r) => r._id)).toEqual(["ram1", "ram1"]);
    expect(selection.storage?.[0]._id).toBe("ssd1");
  });

  it("skips parts that are out of stock or no longer in the catalog, and counts them", () => {
    const { selection, skipped } = itemsToSelection(
      [
        { slot: "cpu", productId: "cpu1" },
        { slot: "gpu", productId: "gpu1" },
        { slot: "case", productId: "deleted" },
      ],
      catalog
    );
    expect(selection.gpu).toBeUndefined();
    expect(selection.case).toBeUndefined();
    expect(skipped).toBe(2);
  });

  it("does not add more units than are in stock", () => {
    const { selection, skipped } = itemsToSelection(
      Array.from({ length: 5 }, () => ({ slot: "storage", productId: "ssd1" })),
      catalog
    );
    expect(selection.storage).toHaveLength(3);
    expect(skipped).toBe(2);
  });

  it("ignores unknown slots and keeps only the first part of a single slot", () => {
    const cpu2 = product("cpu2", 40000, 2, { type: "cpu" });
    const cat = new Map([...catalog, ["cpu2", cpu2]]);
    const { selection, skipped } = itemsToSelection(
      [
        { slot: "cpu", productId: "cpu1" },
        { slot: "cpu", productId: "cpu2" },
        { slot: "toaster", productId: "cpu1" },
      ],
      cat
    );
    expect(selection.cpu?._id).toBe("cpu1");
    expect(skipped).toBe(2);
  });
});

describe("isValidShareCode", () => {
  it("accepts the 8-character codes the site generates", () => {
    expect(isValidShareCode("AB12CD34")).toBe(true);
    expect(isValidShareCode("ab12cd34")).toBe(true);
  });
  it("rejects empty, too long or odd codes", () => {
    expect(isValidShareCode("")).toBe(false);
    expect(isValidShareCode("A".repeat(17))).toBe(false);
    expect(isValidShareCode("AB-12/../")).toBe(false);
  });
});
