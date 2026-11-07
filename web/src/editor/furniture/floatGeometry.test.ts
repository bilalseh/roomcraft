import { BufferAttribute, BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import { floatGeometry } from "./floatGeometry";

describe("floatGeometry", () => {
  it("turns quantized attributes into the floats they stand for", () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Int16Array([32767, 0, -32767]), 3, true),
    );
    geometry.setAttribute("uv", new BufferAttribute(new Float32Array([0.25, 0.75]), 2));

    const result = floatGeometry(geometry);

    const position = result.getAttribute("position");
    expect(position.array).toBeInstanceOf(Float32Array);
    expect(position.normalized).toBe(false);
    expect(Array.from(position.array)).toEqual([1, 0, -1]);
    expect(Array.from(result.getAttribute("uv").array)).toEqual([0.25, 0.75]);
  });

  it("converts each geometry once", () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Int8Array([127, 0, 0]), 3, true));

    expect(floatGeometry(geometry)).toBe(floatGeometry(geometry));
  });
});
