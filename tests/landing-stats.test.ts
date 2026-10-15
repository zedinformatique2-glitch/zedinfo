import { describe, it, expect } from "vitest";
import { conversionRate } from "../lib/landing-stats";

describe("conversionRate", () => {
  it("is null when the page has no views yet", () => {
    expect(conversionRate(0, 0)).toBeNull();
    expect(conversionRate(3, 0)).toBeNull();
  });

  it("gives orders per view as a percentage with one decimal", () => {
    expect(conversionRate(3, 120)).toBe(2.5);
    expect(conversionRate(1, 3)).toBe(33.3);
    expect(conversionRate(0, 50)).toBe(0);
  });

  it("caps at 100 when counters drift (orders counted, views missed)", () => {
    expect(conversionRate(5, 4)).toBe(100);
  });
});
