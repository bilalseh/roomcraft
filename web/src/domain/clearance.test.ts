import type { Opening } from "@roomcraft/shared";
import fixture from "@roomcraft/shared/fixtures/clearance.json";
import { describe, expect, it } from "vitest";
import { demoProject } from "../project/demoProject";
import { catalogItem } from "./catalog";
import { clearanceIssues, type ClearanceItem } from "./clearance";
import { footprint } from "./placement";

describe("clearanceIssues (shared fixtures)", () => {
  it.each(fixture.cases)("$name", ({ room, items, issues }) => {
    const openings = room.openings as Opening[];

    expect(clearanceIssues({ ...room, openings }, items as ClearanceItem[])).toEqual(issues);
  });
});

describe("demo room", () => {
  it("has clear walkways and an unobstructed door", () => {
    const { room, furniture } = demoProject();
    const items = furniture.flatMap((placement) => {
      const item = catalogItem(placement.itemId);
      return item ? [{ ...footprint(placement, item), category: item.category }] : [];
    });

    expect(clearanceIssues(room, items)).toEqual([]);
  });
});
