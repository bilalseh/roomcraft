import { describe, expect, it } from "vitest";
import { demoProject } from "./demoProject";
import { loadProject } from "./localProjects";

describe("loadProject", () => {
  it("fills in finishes for projects saved before they existed", () => {
    const { materials: _materials, furniture: _furniture, ...older } = demoProject();
    localStorage.setItem("roomcraft:project:older", JSON.stringify({ ...older, id: "older" }));

    expect(loadProject("older")).toMatchObject({
      furniture: [],
      materials: { floor: "wood", floorColor: "#e0cba8", wallColor: "#f7f4ee" },
    });
  });
});
