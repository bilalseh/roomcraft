import type { Opening, Room } from "@roomcraft/shared";
import { describe, expect, it } from "vitest";
import { trimBoxes } from "./trim";

const door: Opening = {
  id: "d1",
  kind: "door",
  wall: "south",
  offset: 1,
  width: 0.9,
  height: 2.1,
  sill: 0,
};
const window: Opening = {
  id: "w1",
  kind: "window",
  wall: "north",
  offset: 1.5,
  width: 1.2,
  height: 1.2,
  sill: 0.9,
};

const room: Room = {
  type: "living_room",
  width: 4,
  depth: 3,
  height: 2.5,
  openings: [door, window],
  style: "classic",
  budget: 2000,
};

const onWall = (wall: string) => trimBoxes(room, 0.1).filter((box) => box.wall === wall);

describe("trimBoxes", () => {
  it("runs skirting along the floor and stops either side of a door", () => {
    const skirting = onWall("south").filter((box) => box.size[1] === 0.08);

    const ends = skirting.map((box) =>
      [box.center[0] - box.size[0] / 2, box.center[0] + box.size[0] / 2].map((x) =>
        Number(x.toFixed(3)),
      ),
    );
    expect(ends).toEqual([
      [0, 1],
      [1.9, 4],
    ]);
  });

  it("keeps skirting inside the room, against the wall's inner face", () => {
    for (const box of trimBoxes(room, 0.1)) {
      const [x, , z] = box.center;
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(room.width);
      expect(z).toBeGreaterThan(0);
      expect(z).toBeLessThan(room.depth);
    }
  });

  it("frames a door on three sides and a window on three sides with a sill", () => {
    const frames = (wall: string) => onWall(wall).filter((box) => box.size[1] !== 0.08);

    expect(frames("south")).toHaveLength(3);
    expect(frames("north")).toHaveLength(4);
    const sill = frames("north").find((box) => box.size[2] === 0.05);
    expect(sill?.center[1]).toBeCloseTo(0.9 - 0.015);
  });

  it("runs skirting under a window, where the wall still reaches the floor", () => {
    const north = onWall("north").filter((box) => box.size[1] === 0.08);

    expect(north).toHaveLength(3);
  });
});
