import { describe, expect, it } from "vitest";
import { isValidDzMobile, normalizeDzPhone } from "../lib/phone";
import { localizedName, localizedRequiresBuildNote } from "../lib/format";

describe("Algerian phone validation", () => {
  it("accepts 05/06/07 mobiles with spaces, dashes and dots", () => {
    expect(isValidDzMobile("0555 12 34 56")).toBe(true);
    expect(isValidDzMobile("06-61-23-45-67")).toBe(true);
    expect(isValidDzMobile("07.70.12.34.56")).toBe(true);
  });

  it("rejects landlines, short numbers and other prefixes", () => {
    expect(isValidDzMobile("021234567")).toBe(false);
    expect(isValidDzMobile("055512345")).toBe(false);
    expect(isValidDzMobile("0855123456")).toBe(false);
    expect(isValidDzMobile("")).toBe(false);
  });

  it("strips formatting characters", () => {
    expect(normalizeDzPhone("(0555) 12-34.56")).toBe("0555123456");
  });
});

describe("localized names", () => {
  const p = { nameFr: "Carte graphique", nameAr: "بطاقة رسومية" };

  it("uses Arabic for ar and French otherwise", () => {
    expect(localizedName(p, "ar")).toBe("بطاقة رسومية");
    expect(localizedName(p, "fr")).toBe("Carte graphique");
    expect(localizedName(p, "en")).toBe("Carte graphique");
  });

  it("ignores blank build-only notes", () => {
    expect(localizedRequiresBuildNote({ requiresBuildNoteFr: "  " }, "fr")).toBeUndefined();
    expect(localizedRequiresBuildNote({ requiresBuildNoteAr: "مع التركيب" }, "ar")).toBe("مع التركيب");
  });
});
