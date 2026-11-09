import { Box3, BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { colorMapTint } from "../surfaces/surfaces";
import { prepareScan } from "./prepareScan";
import { GREY_MAP } from "./scans";

/** A two-part model: a long fabric seat on wooden feet, off the origin like many exports. */
function sofaModel() {
  const fabric = new MeshStandardMaterial({ name: "fabric" });
  const wood = new MeshStandardMaterial({ name: "wood" });
  const seat = new Mesh(new BoxGeometry(2, 0.5, 1), fabric);
  seat.position.set(0.3, 0.45, 0);
  const feet = new Mesh(new BoxGeometry(2, 0.2, 1), wood);
  feet.position.set(0.3, 0.1, 0);
  const scene = new Group();
  scene.add(seat, feet);
  return { scene, fabric, wood };
}

const sizeOf = (model: Group) => new Box3().setFromObject(model).getSize(new Vector3());

describe("prepareScan", () => {
  it("stretches the model to the catalog box, standing centred on the floor", () => {
    const { scene } = sofaModel();

    const { model } = prepareScan(scene, { tint: {} }, "#ffffff", [2.1, 0.85, 0.9]);

    const bounds = new Box3().setFromObject(model);
    expect(
      bounds
        .getSize(new Vector3())
        .toArray()
        .map((v) => v.toFixed(3)),
    ).toEqual(["2.100", "0.850", "0.900"]);
    expect(bounds.min.y).toBeCloseTo(0);
    expect(bounds.getCenter(new Vector3()).x).toBeCloseTo(0);
  });

  it("tints only the named materials, on copies, and leaves the loaded model alone", () => {
    const { scene, fabric, wood } = sofaModel();

    const { model, materials } = prepareScan(
      scene,
      { tint: { fabric: GREY_MAP } },
      "#3366aa",
      [2, 0.7, 1],
    );

    expect(materials).toHaveLength(1);
    const [seat, feet] = (model.children[0]?.children ?? []) as Mesh[];
    expect(seat?.material).toBe(materials[0]);
    expect((seat?.material as MeshStandardMaterial).color).toEqual(
      colorMapTint(new Color("#3366aa")),
    );
    expect(feet?.material).toBe(wood);
    expect(fabric.color.getHexString()).toBe("ffffff");
  });

  it("turns a model to face the room, then fits it", () => {
    const { scene } = sofaModel();

    const { model } = prepareScan(scene, { tint: {}, turns: 1 }, "#ffffff", [1, 0.7, 2]);

    // Two metres long along x at first; after a quarter turn the fit squeezes it to 1 m wide.
    expect(sizeOf(model).x).toBeCloseTo(1);
    expect(sizeOf(model).z).toBeCloseTo(2);
  });

  it("keeps decor at its own size", () => {
    const { scene } = sofaModel();

    const { model } = prepareScan(scene, { tint: {}, fit: "natural" }, "#ffffff", [1, 1, 1]);

    const size = sizeOf(model);
    expect([size.x, size.y, size.z].map((v) => v.toFixed(3))).toEqual(["2.000", "0.700", "1.000"]);
    expect(new Box3().setFromObject(model).min.y).toBeCloseTo(0);
  });
});
