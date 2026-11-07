import { BoxGeometry } from "three";
import { describe, expect, it } from "vitest";
import { projectUvs } from "./projectUvs";

type Range = [min: number, max: number];

/** The range of UVs on the face whose normal points along `axis`. */
function faceRange(geometry: BoxGeometry, axis: "x" | "y" | "z"): { u: Range; v: Range } {
  const normal = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  const us: number[] = [];
  const vs: number[] = [];
  for (let index = 0; index < normal.count; index++) {
    const value = { x: normal.getX(index), y: normal.getY(index), z: normal.getZ(index) }[axis];
    if (value > 0.9) {
      us.push(uv.getX(index));
      vs.push(uv.getY(index));
    }
  }
  return { u: [Math.min(...us), Math.max(...us)], v: [Math.min(...vs), Math.max(...vs)] };
}

describe("projectUvs", () => {
  it("lays texture coordinates out in metres on every face", () => {
    const box = projectUvs(new BoxGeometry(2, 1, 0.5));

    expect(faceRange(box, "y")).toEqual({ u: [-1, 1], v: [-0.25, 0.25] });
    expect(faceRange(box, "z")).toEqual({ u: [-1, 1], v: [-0.5, 0.5] });
    expect(faceRange(box, "x")).toEqual({ u: [-0.25, 0.25], v: [-0.5, 0.5] });
  });

  it("gives a long and a short piece the same texture scale", () => {
    const long = faceRange(projectUvs(new BoxGeometry(3, 0.1, 0.1)), "y");
    const short = faceRange(projectUvs(new BoxGeometry(1, 0.1, 0.1)), "y");

    expect(long.u[1] - long.u[0]).toBeCloseTo(3 * (short.u[1] - short.u[0]));
  });
});
