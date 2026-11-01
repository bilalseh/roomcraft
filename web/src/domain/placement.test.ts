import fixture from "@roomcraft/shared/fixtures/placement.json";
import schema from "@roomcraft/shared/schema/roomcraft.schema.json";
import { describe, expect, it } from "vitest";
import { demoProject } from "../project/demoProject";
import { CATALOG, CATEGORIES, catalogItem } from "./catalog";
import { footprint, halfExtents, placementProblems, type Footprint } from "./placement";

describe("placementProblems (shared fixtures)", () => {
  it.each(fixture.cases)("$name", ({ items, problems }) => {
    const { width, depth } = fixture.room;

    expect(placementProblems(width, depth, items as Footprint[])).toEqual(problems);
  });
});

describe("halfExtents", () => {
  it("swaps width and depth at a quarter turn", () => {
    const { halfX, halfZ } = halfExtents(2, 0.5, 90);

    expect(halfX).toBeCloseTo(0.25);
    expect(halfZ).toBeCloseTo(1);
  });

  it("grows the box around a diagonal item", () => {
    expect(halfExtents(1, 1, 45).halfX).toBeCloseTo(Math.SQRT1_2);
  });
});

describe("catalog", () => {
  it("uses the categories the API defines", () => {
    expect([...CATEGORIES]).toEqual(schema.$defs.Category.enum);
  });

  it("offers about 25 items, with unique ids", () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(25);
    expect(new Set(CATALOG.map((item) => item.id)).size).toBe(CATALOG.length);
  });
});

describe("demo room", () => {
  it("is furnished without overlaps and inside its walls", () => {
    const { room, furniture } = demoProject();
    const footprints = furniture.map((placement) => {
      const item = catalogItem(placement.itemId);
      if (!item) throw new Error(`Unknown catalog item ${placement.itemId}`);
      return footprint(placement, item);
    });

    expect(placementProblems(room.width, room.depth, footprints)).toEqual([]);
  });
});
