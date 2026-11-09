import { Box3, Color, Vector3 } from "three";

export interface Fit {
  scale: number;
  /** Where the scaled model's origin goes, so it stands centred on the floor. */
  offset: Vector3;
}

/**
 * A uniform scale that fits a model's bounds inside width × height × depth,
 * and the offset that stands it on the floor centred on the footprint.
 */
export function fitToBox(bounds: Box3, width: number, height: number, depth: number): Fit {
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const scale = Math.min(width / size.x, height / size.y, depth / size.z);
  return {
    scale,
    offset: new Vector3(-center.x * scale, -bounds.min.y * scale, -center.z * scale),
  };
}

export interface Stretch {
  scale: Vector3;
  offset: Vector3;
}

/**
 * The scale on each axis that makes a model's bounds exactly width × height × depth,
 * and the offset that stands it on the floor centred on the footprint. Real furniture
 * is close to catalog proportions, so the stretch is slight.
 */
export function stretchToBox(bounds: Box3, width: number, height: number, depth: number): Stretch {
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const scale = new Vector3(width / size.x, height / size.y, depth / size.z);
  return {
    scale,
    offset: new Vector3(-center.x * scale.x, -bounds.min.y * scale.y, -center.z * scale.z),
  };
}

/**
 * The colour to multiply a textured material by so that what was `base` becomes
 * `target`: white for the model's own colour, a ratio per channel otherwise.
 */
export function tintToward(target: string, base: string): Color {
  const to = new Color(target);
  const from = new Color(base);
  const ratio = (a: number, b: number) => Math.min(a / Math.max(b, 0.01), 3);
  return new Color(ratio(to.r, from.r), ratio(to.g, from.g), ratio(to.b, from.b));
}
