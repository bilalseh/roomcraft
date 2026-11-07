import { Box3, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { fitToBox, tintToward } from "./fitModel";

describe("fitToBox", () => {
  it("scales by the tightest dimension and stands the model centred on the floor", () => {
    const bounds = new Box3(new Vector3(-0.3, 0.1, -0.2), new Vector3(0.3, 1.1, 0.4));

    const fit = fitToBox(bounds, 0.6, 2, 0.6);

    // 0.6 wide and 1 tall fit at 1x and 2x; 0.6 deep allows exactly 1x.
    expect(fit.scale).toBeCloseTo(1);
    expect(fit.offset.x).toBeCloseTo(0);
    expect(fit.offset.y).toBeCloseTo(-0.1);
    expect(fit.offset.z).toBeCloseTo(-0.1);
  });

  it("shrinks a model that is too tall", () => {
    const bounds = new Box3(new Vector3(-0.1, 0, -0.1), new Vector3(0.1, 2, 0.1));

    expect(fitToBox(bounds, 1, 1, 1).scale).toBeCloseTo(0.5);
  });
});

describe("tintToward", () => {
  it("leaves a model in its own colour untouched", () => {
    expect(tintToward("#4d7c4f", "#4d7c4f").toArray()).toEqual([1, 1, 1]);
  });

  it("shifts each channel towards the chosen colour", () => {
    const [r, g, b] = tintToward("#7c4d4f", "#4d7c4f").toArray();

    expect(r).toBeGreaterThan(1);
    expect(g).toBeLessThan(1);
    expect(b).toBeCloseTo(1);
  });
});
