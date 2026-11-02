import { describe, expect, it } from "vitest";
import { demoProject } from "../project/demoProject";
import { projectSchema } from "./project";

describe("projectSchema", () => {
  it("fills in furniture and finishes for projects saved before they existed", () => {
    const { materials: _materials, furniture: _furniture, ...older } = demoProject();

    expect(projectSchema.parse(older)).toMatchObject({
      furniture: [],
      materials: { floor: "wood", floorColor: "#e0cba8", wallColor: "#f7f4ee" },
    });
  });

  it("rejects fields it does not know", () => {
    expect(projectSchema.safeParse({ ...demoProject(), ownerId: "someone" }).success).toBe(false);
  });
});
