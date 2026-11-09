import {
  Box3,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from "three";
import { colorMapTint } from "../surfaces/surfaces";
import { fitToBox, stretchToBox, tintToward } from "./fitModel";
import { floatGeometry } from "./floatGeometry";
import { GREY_MAP, type Scan } from "./scans";

export interface PreparedScan {
  model: Group;
  /** Materials made for this copy, to dispose of with it; geometry and textures stay shared. */
  materials: Material[];
}

/**
 * A copy of a loaded model, in the piece's colour, turned to face +z and fitted to
 * width × height × depth with its base on the floor. Geometry becomes plain floats:
 * the photo's path tracer cannot merge quantized meshes.
 */
export function prepareScan(
  scene: Object3D,
  scan: Pick<Scan, "tint" | "turns" | "fit">,
  color: string,
  [width, height, depth]: readonly [number, number, number],
): PreparedScan {
  const copy = scene.clone(true);
  copy.rotation.y = ((scan.turns ?? 0) * Math.PI) / 2;
  const model = new Group();
  model.add(copy);

  const tinted = new Map<Material, Material>();
  copy.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry = floatGeometry(object.geometry as BufferGeometry);
    object.castShadow = true;
    object.receiveShadow = true;
    const material: unknown = object.material;
    if (!(material instanceof MeshStandardMaterial)) return;
    const from = scan.tint[material.name];
    if (from === undefined) return;
    let copied = tinted.get(material);
    if (!copied) {
      copied = material.clone();
      (copied as MeshStandardMaterial).color.multiply(tintFor(color, from));
      tinted.set(material, copied);
    }
    object.material = copied;
  });

  model.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(model);
  const fit = scan.fit ?? "stretch";
  if (fit === "stretch") {
    const { scale, offset } = stretchToBox(bounds, width, height, depth);
    model.scale.copy(scale);
    model.position.copy(offset);
  } else if (fit === "natural") {
    const center = bounds.getCenter(new Vector3());
    model.position.set(-center.x, -bounds.min.y, -center.z);
  } else {
    const { scale, offset } = fitToBox(bounds, width * fit.spread, height, depth * fit.spread);
    model.scale.setScalar(scale);
    model.position.copy(offset);
  }
  return { model, materials: [...tinted.values()] };
}

function tintFor(color: string, from: string): Color {
  return from === GREY_MAP ? colorMapTint(new Color(color)) : tintToward(color, from);
}
