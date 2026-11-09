import { describe, expect, it } from "vitest";
import { cornerViewpoints, type TallFootprint } from "./viewpoints";

const room = { width: 4, depth: 3 };

describe("corner viewpoints", () => {
  it("stands near each corner, facing the middle of the room", () => {
    const [northWest, northEast, southEast] = cornerViewpoints(room, []);

    expect(northWest?.x).toBeCloseTo(0.45 * 0.8);
    expect(northWest?.z).toBeCloseTo(0.45 * 0.6);
    // A camera looks down -z, so facing south-east (+x, +z) is a turn of more than 90°.
    expect(northWest?.yaw).toBeCloseTo(Math.atan2(-0.8, -0.6));
    expect(northEast?.x).toBeCloseTo(4 - 0.36);
    expect(southEast?.z).toBeCloseTo(3 - 0.27);
  });

  it("steps out of a tall piece standing in the corner, but stands over a low one", () => {
    const plant: TallFootprint = {
      id: "p",
      x: 0.45,
      z: 0.45,
      rotation: 0,
      width: 0.85,
      depth: 0.85,
      layer: "floor",
      height: 1.4,
    };

    const [spot] = cornerViewpoints(room, [plant]);

    // Clear of the plant's east side (0.875), with room to stand (0.2 either side).
    expect(spot?.x).toBeGreaterThan(1.07);
    expect(cornerViewpoints(room, [{ ...plant, height: 0.9 }])[0]?.x).toBeCloseTo(0.36);
  });
});
