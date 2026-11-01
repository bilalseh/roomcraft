import { describe, expect, it } from "vitest";
import { snapToFloor, snapToWall } from "./snap";

const room = { width: 4, depth: 3 };
const sofa = { width: 2, depth: 0.9 };

describe("snapToFloor", () => {
  it("snaps to the 10 cm grid away from the walls", () => {
    expect(snapToFloor(room, sofa, 0, { x: 2.04, z: 1.46 })).toEqual({ x: 2, z: 1.5 });
  });

  it("pulls an item flush against a wall within 15 cm of it", () => {
    expect(snapToFloor(room, sofa, 0, { x: 2, z: 0.55 })).toEqual({ x: 2, z: 0.45 });
    expect(snapToFloor(room, sofa, 0, { x: 2.9, z: 1.5 })).toEqual({ x: 3, z: 1.5 });
  });

  it("uses the rotated footprint, so a turned sofa sits flush with its back", () => {
    expect(snapToFloor(room, sofa, 90, { x: 0.5, z: 1.5 })).toEqual({ x: 0.45, z: 1.5 });
  });

  it("keeps the item inside the room", () => {
    expect(snapToFloor(room, sofa, 0, { x: -3, z: 9 })).toEqual({ x: 1, z: 2.55 });
  });
});

describe("snapToWall", () => {
  const art = { width: 0.9, depth: 0.04 };

  it("hangs an item on the nearest wall, facing into the room", () => {
    expect(snapToWall(room, art, { x: 2.04, z: 0.4 })).toEqual({ x: 2, z: 0.02, rotation: 0 });
    expect(snapToWall(room, art, { x: 3.7, z: 1.5 })).toEqual({ x: 3.98, z: 1.5, rotation: 270 });
    expect(snapToWall(room, art, { x: 2, z: 2.9 })).toEqual({ x: 2, z: 2.98, rotation: 180 });
    expect(snapToWall(room, art, { x: 0.1, z: 1.5 })).toEqual({ x: 0.02, z: 1.5, rotation: 90 });
  });

  it("keeps the item on the wall, clear of the corners", () => {
    expect(snapToWall(room, art, { x: 0.3, z: 0.05 })).toEqual({ x: 0.45, z: 0.02, rotation: 0 });
  });
});
