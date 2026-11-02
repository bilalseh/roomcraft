import type { Operation } from "@roomcraft/shared";
import fixture from "@roomcraft/shared/fixtures/operations.json";
import { describe, expect, it } from "vitest";
import type { Layout } from "./layout";
import { applyOperations, diffLayouts } from "./operations";
import { roomSchema } from "./schemas";

const layout: Layout = {
  room: roomSchema.parse(fixture.room),
  furniture: fixture.furniture,
  materials: fixture.materials as Layout["materials"],
};

describe("applyOperations (shared fixtures)", () => {
  it.each(fixture.cases)("$name", (testCase) => {
    const result = applyOperations(layout, testCase.operations as Operation[]);

    expect(result.accepted).toEqual(testCase.accepted);
    expect(result.rejected.map(({ index, problem }) => ({ index, ...problem }))).toEqual(
      testCase.rejected,
    );
    expect(result.layout.furniture).toEqual(testCase.furniture);
    expect(result.layout.materials).toEqual(testCase.materials);
  });
});

describe("diffLayouts", () => {
  it("lists added, moved and removed furniture", () => {
    const sofa = { id: "sofa", itemId: "sofa-three-seat", x: 2.5, z: 0.45, rotation: 0 };
    const chair = { id: "chair", itemId: "armchair", x: 1, z: 2, rotation: 0 };
    const table = { id: "table", itemId: "coffee-table", x: 2.5, z: 1.6, rotation: 0 };

    const diff = diffLayouts(
      { ...layout, furniture: [sofa, chair] },
      { ...layout, furniture: [{ ...sofa, x: 2.6 }, table] },
    );

    expect(diff).toEqual({ added: ["table"], changed: ["sofa"], removed: [chair] });
  });
});
