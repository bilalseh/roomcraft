import type { Opening, Room } from "@roomcraft/shared";
import { describe, expect, it } from "vitest";
import { curtains } from "./curtains";
import type { Footprint } from "./placement";

const window: Opening = {
  id: "w1",
  kind: "window",
  wall: "north",
  offset: 1.5,
  width: 1.2,
  height: 1.2,
  sill: 0.9,
};

function roomWith(...openings: Opening[]): Room {
  return {
    type: "living_room",
    width: 4,
    depth: 3,
    height: 2.5,
    openings,
    style: "modern",
    budget: 2000,
    name: "Test",
  } as Room;
}

const piece = (x: number, z: number, width: number, depth: number): Footprint => ({
  id: "p",
  x,
  z,
  rotation: 0,
  width,
  depth,
  layer: "floor",
});

describe("curtains", () => {
  it("draws back a panel on each side of a window, below the ceiling", () => {
    const { panels, rods } = curtains(roomWith(window), []);

    expect(panels).toHaveLength(2);
    expect(panels[0]).toMatchObject({ wall: "north", top: 2.25 });
    expect(panels[0]?.end).toBeCloseTo(1.58);
    expect(panels[1]?.start).toBeCloseTo(2.62);
    expect(rods).toEqual([expect.objectContaining({ wall: "north", height: 2.25 })]);
  });

  it("leaves out the panel that would hang into a bookshelf", () => {
    const bookshelf = piece(1.0, 0.175, 0.9, 0.35);

    const { panels } = curtains(roomWith(window), [bookshelf]);

    expect(panels).toHaveLength(1);
    expect(panels[0]?.start).toBeGreaterThan(2.6);
  });

  it("ignores rugs, which lie under curtains", () => {
    const rug = { ...piece(2, 0.8, 2.4, 1.6), layer: "rug" as const };
    expect(curtains(roomWith(window), [rug]).panels).toHaveLength(2);
  });

  it("stops short of the corner and of a door on the same wall", () => {
    const cornerWindow = { ...window, offset: 0.1 };
    const door: Opening = { ...window, id: "d1", kind: "door", offset: 2.8, sill: 0, height: 2 };

    const { panels: corner } = curtains(roomWith(cornerWindow), []);
    expect(corner.map((panel) => panel.start)).toEqual([0.03, expect.closeTo(1.22)]);

    const { panels } = curtains(roomWith(cornerWindow, { ...door, offset: 1.35 }), []);
    expect(panels.map((panel) => panel.start)).toEqual([0.03]);
  });

  it("keeps the rod under a low ceiling", () => {
    const tall = { ...window, height: 1.5 };
    expect(curtains(roomWith(tall), []).rods[0]?.height).toBe(2.46);
  });
});
