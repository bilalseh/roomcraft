import { describe, expect, it } from "vitest";
import { formatDimensions, formatLength, fromFeetAndInches, toFeetAndInches } from "./units";

describe("feet and inches", () => {
  it("rounds to the nearest inch", () => {
    expect(toFeetAndInches(3.45)).toEqual({ feet: 11, inches: 4 });
    expect(toFeetAndInches(0.3048)).toEqual({ feet: 1, inches: 0 });
  });

  it("carries 12 inches into a foot", () => {
    expect(toFeetAndInches(0.6)).toEqual({ feet: 2, inches: 0 });
  });

  it("converts back to metres", () => {
    expect(fromFeetAndInches({ feet: 11, inches: 4 })).toBeCloseTo(3.4544, 6);
  });
});

describe("formatLength", () => {
  it.each([
    [3.45, "metric", "3.45 m"],
    [4, "metric", "4 m"],
    [0.8, "metric", "80 cm"],
    [3.45, "imperial", "11 ft 4 in"],
    [0.3048, "imperial", "1 ft"],
    [0.2, "imperial", "8 in"],
  ] as const)("formats %d m in %s as %s", (metres, units, expected) => {
    expect(formatLength(metres, units)).toBe(expected);
  });
});

describe("formatDimensions", () => {
  it("shares the unit in metric and spells both out in imperial", () => {
    expect(formatDimensions(4.5, 3.6, "metric")).toBe("4.5 × 3.6 m");
    expect(formatDimensions(4.5, 3.6, "imperial")).toBe("14 ft 9 in × 11 ft 10 in");
  });
});
