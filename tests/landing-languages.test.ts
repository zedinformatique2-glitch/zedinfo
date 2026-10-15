import { describe, it, expect } from "vitest";
import { hasSeparateLanguages } from "../lib/landing-stats";

describe("hasSeparateLanguages", () => {
  it("is false when the editor mirrored one text into FR and AR", () => {
    expect(
      hasSeparateLanguages({
        headlineFr: "عرض خاص",
        headlineAr: "عرض خاص",
        subheadlineFr: "",
        subheadlineAr: "",
        ctaFr: "اطلب الآن",
        ctaAr: "اطلب الآن",
        bulletsFr: ["أ"],
        bulletsAr: ["أ"],
      })
    ).toBe(false);
  });

  it("is true when any text differs between FR and AR", () => {
    expect(hasSeparateLanguages({ headlineFr: "Offre", headlineAr: "عرض" })).toBe(true);
    expect(
      hasSeparateLanguages({ headlineFr: "x", headlineAr: "x", bulletsFr: ["Livraison"], bulletsAr: ["توصيل"] })
    ).toBe(true);
  });

  it("ignores a language that is simply missing", () => {
    expect(hasSeparateLanguages({ headlineFr: "Offre" })).toBe(false);
  });
});
