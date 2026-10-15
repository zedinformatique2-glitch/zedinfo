import { describe, it, expect } from "vitest";
import { buildLandingPayload, type LandingFormState } from "../lib/landing-page-payload";

const base: LandingFormState = {
  productId: "p1",
  headline: "أقوى عرض",
  subheadline: "جودة أصلية",
  bullets: "  ميزة 1 \n\n ميزة 2\n",
  cta: "اطلب الآن",
  priceOverrideDzd: "",
  comparePriceDzd: "",
  enabled: true,
  heroImage: "  ",
  description: "",
  urgency: "",
  guarantee: "ضمان سنتين",
  scarcity: "",
  defaultLang: "ar",
  showCountdown: false,
  countdownEndsAt: "",
  showStockUrgency: true,
  primaryColor: "#0035d0",
  accentColor: "#ef4444",
};

describe("buildLandingPayload", () => {
  it("mirrors the single-language text into both FR and AR fields", () => {
    const p = buildLandingPayload(base, "promo");
    expect(p.slug).toBe("promo");
    expect(p.headlineFr).toBe("أقوى عرض");
    expect(p.headlineAr).toBe("أقوى عرض");
    expect(p.ctaFr).toBe("اطلب الآن");
    expect(p.guaranteeTextAr).toBe("ضمان سنتين");
  });

  it("splits bullets into trimmed non-empty lines", () => {
    const p = buildLandingPayload(base, "promo");
    expect(p.bulletsFr).toEqual(["ميزة 1", "ميزة 2"]);
    expect(p.bulletsAr).toEqual(["ميزة 1", "ميزة 2"]);
  });

  it("turns blank optional fields into undefined", () => {
    const p = buildLandingPayload(base, "promo");
    expect(p.heroImage).toBeUndefined();
    expect(p.descriptionFr).toBeUndefined();
    expect(p.urgencyTextAr).toBeUndefined();
    expect(p.priceOverrideDzd).toBeUndefined();
    expect(p.comparePriceDzd).toBeUndefined();
  });

  it("parses prices as numbers", () => {
    const p = buildLandingPayload({ ...base, priceOverrideDzd: "89000", comparePriceDzd: "99000" }, "promo");
    expect(p.priceOverrideDzd).toBe(89000);
    expect(p.comparePriceDzd).toBe(99000);
  });

  it("only keeps the countdown end when the countdown is on", () => {
    const off = buildLandingPayload({ ...base, countdownEndsAt: "2026-10-20T18:00" }, "promo");
    expect(off.countdownEndsAt).toBeUndefined();
    const on = buildLandingPayload({ ...base, showCountdown: true, countdownEndsAt: "2026-10-20T18:00" }, "promo");
    expect(on.countdownEndsAt).toBe(new Date("2026-10-20T18:00").getTime());
  });
});
