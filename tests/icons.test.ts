import path from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_FONT_HREF, ICON_NAMES, safeIcon } from "../lib/icons";
import { iconNamesInSource, publicIconUsage } from "./icon-usage";

describe("icon font subset", () => {
  it("includes every icon the public site writes in code", () => {
    const usage = publicIconUsage(path.resolve(__dirname, ".."));
    const known = new Set(ICON_NAMES);
    const missing = [...usage].filter(([name]) => !known.has(name)).map(([n, files]) => `${n} (${files.join(", ")})`);
    expect(missing, "add these to CODE_ICONS in lib/icons.ts").toEqual([]);
    expect(usage.size).toBeGreaterThan(50);
  });

  it("asks Google for a sorted, duplicate-free list", () => {
    expect([...ICON_NAMES]).toEqual([...new Set(ICON_NAMES)].sort());
    expect(ICON_FONT_HREF).toContain(`icon_names=${ICON_NAMES.join(",")}`);
  });

  it("falls back to 'category' for unknown data icons", () => {
    expect(safeIcon("monitor")).toBe("monitor");
    expect(safeIcon("not_an_icon")).toBe("category");
    expect(safeIcon("")).toBe("category");
    expect(safeIcon(undefined)).toBe("category");
  });
});

describe("iconNamesInSource", () => {
  it("reads the forms the site uses", () => {
    const src = `
      <Icon name="close" />
      <Icon name={open ? "expand_less" : "expand_more"} filled />
      <Icon name={kind === "loaded" ? "link" : "history"} />
      { href: "/shop", icon: "storefront" }
      <Badge icon="verified" />
      <span className="material-symbols-outlined text-sm">delete</span>
      <span className="material-symbols-outlined">{copied ? "check" : "share"}</span>
      const SLOT_ICONS: Record<string, string> = { cpu: "developer_board", psu: "bolt" };
      <Label>{t("phone")}</Label>
    `;
    expect(iconNamesInSource(src).sort()).toEqual(
      ["bolt", "check", "close", "delete", "developer_board", "expand_less", "expand_more",
        "history", "link", "share", "storefront", "verified"].sort(),
    );
  });
});
