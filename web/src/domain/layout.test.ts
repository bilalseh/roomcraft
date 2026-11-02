import type { Placement, Room } from "@roomcraft/shared";
import { describe, expect, it } from "vitest";
import { catalogItem } from "./catalog";
import { defaultMaterials } from "./materials";
import {
  addItem,
  duplicateItem,
  placementProblem,
  removeItem,
  rotateItem,
  updateItem,
  type Layout,
} from "./layout";

const room: Room = {
  type: "living_room",
  width: 4,
  depth: 3,
  height: 2.5,
  openings: [],
  style: "modern",
  budget: 3000,
};

const sofa: Placement = { id: "sofa", itemId: "sofa-three-seat", x: 2, z: 0.45, rotation: 0 };
const materials = defaultMaterials(room.style);
const layout = (...furniture: Placement[]): Layout => ({ room, furniture, materials });

function item(id: string) {
  const found = catalogItem(id);
  if (!found) throw new Error(`Missing catalog item ${id}`);
  return found;
}

function expectLayout(result: ReturnType<typeof addItem>): Layout {
  if (!result.ok) throw new Error(`Expected a layout, got ${result.problem.code}`);
  return result.layout;
}

describe("addItem", () => {
  it("puts the first item in the middle of the room", () => {
    const { furniture } = expectLayout(addItem(layout(), item("coffee-table"), "t1"));

    expect(furniture).toEqual([{ id: "t1", itemId: "coffee-table", x: 2, z: 1.5, rotation: 0 }]);
  });

  it("finds the nearest free spot when the middle is taken", () => {
    const first = expectLayout(addItem(layout(), item("coffee-table"), "t1"));
    const { furniture } = expectLayout(addItem(first, item("coffee-table"), "t2"));
    const second = furniture[1];
    if (!second) throw new Error("Expected a second table");

    expect(placementProblem(first, second)).toBeNull();
  });

  it("hangs wall items on a wall", () => {
    const { furniture } = expectLayout(addItem(layout(), item("wall-art"), "art"));

    expect(furniture[0]).toMatchObject({ z: 0.02, rotation: 0 });
  });

  it("reports when the room is full", () => {
    const tiny = { ...room, width: 1.5, depth: 1.5 };

    expect(addItem({ room: tiny, furniture: [], materials }, item("bed-queen"), "bed")).toEqual({
      ok: false,
      problem: { code: "no_space" },
    });
  });
});

describe("updateItem", () => {
  it("moves an item to a free spot", () => {
    const { furniture } = expectLayout(updateItem(layout(sofa), "sofa", { z: 1.5 }));

    expect(furniture[0]).toMatchObject({ x: 2, z: 1.5 });
  });

  it("refuses a move outside the room", () => {
    expect(updateItem(layout(sofa), "sofa", { x: 3.5 })).toEqual({
      ok: false,
      problem: { code: "outside_room" },
    });
  });

  it("names the item it would overlap", () => {
    const table: Placement = { id: "table", itemId: "coffee-table", x: 2, z: 1.5, rotation: 0 };

    expect(updateItem(layout(sofa, table), "table", { z: 0.8 })).toEqual({
      ok: false,
      problem: { code: "overlaps", otherId: "sofa" },
    });
  });
});

describe("rotateItem", () => {
  it("turns in 15 degree steps and wraps around", () => {
    const centred = { ...sofa, z: 1.5 };

    expect(expectLayout(rotateItem(layout(centred), "sofa", 1)).furniture[0]?.rotation).toBe(15);
    expect(expectLayout(rotateItem(layout(centred), "sofa", -1)).furniture[0]?.rotation).toBe(345);
  });

  it("refuses a turn that would push the item through a wall", () => {
    expect(rotateItem(layout(sofa), "sofa", 6)).toEqual({
      ok: false,
      problem: { code: "outside_room" },
    });
  });

  it("keeps wall items facing into the room", () => {
    const art: Placement = { id: "art", itemId: "wall-art", x: 2, z: 0.02, rotation: 0 };

    expect(rotateItem(layout(art), "art", 1)).toEqual({
      ok: false,
      problem: { code: "fixed_rotation" },
    });
  });
});

describe("removeItem and duplicateItem", () => {
  it("removes an item", () => {
    expect(removeItem(layout(sofa), "sofa").furniture).toEqual([]);
  });

  it("places a copy next to the original", () => {
    const chair: Placement = { id: "c1", itemId: "dining-chair", x: 2, z: 1.5, rotation: 90 };
    const { furniture } = expectLayout(duplicateItem(layout(chair), "c1", "c2"));
    const copy = furniture[1];

    expect(copy).toMatchObject({ id: "c2", itemId: "dining-chair", rotation: 90 });
    expect(Math.hypot((copy?.x ?? 0) - 2, (copy?.z ?? 0) - 1.5)).toBeLessThan(0.7);
  });
});
