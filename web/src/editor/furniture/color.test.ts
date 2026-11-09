import { Color } from "three";
import { describe, expect, it } from "vitest";
import { accent, shade } from "./color";

const hue = (color: string) => new Color(color).getHSL({ h: 0, s: 0, l: 0 }).h;

describe("colours", () => {
  it("lightens and darkens", () => {
    expect(shade("#404040", 0.5)).not.toBe("#404040");
    expect(new Color(shade("#404040", 2)).r).toBeGreaterThan(new Color("#404040").r);
  });

  it("picks an accent across the colour wheel", () => {
    const blue = "#4a6fa5";
    expect(Math.abs(hue(accent(blue)) - ((hue(blue) + 0.5) % 1))).toBeLessThan(0.01);
  });

  it("gives grey pieces a warm accent", () => {
    expect(hue(accent("#808080"))).toBeCloseTo(0.05, 2);
  });
});
