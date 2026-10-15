import { describe, it, expect } from "vitest";
import { formatCountdown } from "../lib/countdown";

const H = 3600000;
const M = 60000;

describe("formatCountdown", () => {
  it("returns null once the deadline has passed", () => {
    expect(formatCountdown(0, "j")).toBeNull();
    expect(formatCountdown(-5000, "j")).toBeNull();
  });

  it("shows hh:mm:ss under a day", () => {
    expect(formatCountdown(2 * H + 5 * M + 9000, "j")).toBe("02:05:09");
  });

  it("splits out days instead of showing hours above 24", () => {
    expect(formatCountdown(72 * H + 14 * M + 3000, "j")).toBe("3j 00:14:03");
    expect(formatCountdown(25 * H, "ي")).toBe("1ي 01:00:00");
  });

  it("rounds partial seconds down", () => {
    expect(formatCountdown(1500, "d")).toBe("00:00:01");
  });
});
