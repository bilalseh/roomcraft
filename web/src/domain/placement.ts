import type { CatalogItem, Layer, Placement } from "@roomcraft/shared";
import type { Vec2 } from "./walls";

/** An item's rectangle on the floor plan, centred at (x, z) and rotated in degrees. */
export interface Footprint {
  id: string;
  x: number;
  z: number;
  rotation: number;
  width: number;
  depth: number;
  layer: Layer;
}

export type PlacementProblemCode = "outside_room" | "overlaps";

export interface PlacementProblem {
  code: PlacementProblemCode;
  itemId: string;
  otherItemId?: string;
}

// Touching is allowed: a sofa can stand flush against a wall or another piece.
const EPSILON = 1e-6;

export function footprint(placement: Placement, item: CatalogItem): Footprint {
  const { id, x, z, rotation } = placement;
  return { id, x, z, rotation, width: item.width, depth: item.depth, layer: item.layer };
}

type Quad = [Vec2, Vec2, Vec2, Vec2];

/** Corners in plan coordinates, using three.js's rotation about the vertical axis. */
export function corners(item: Footprint): Quad {
  const angle = (item.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const halfW = item.width / 2;
  const halfD = item.depth / 2;
  const at = (lx: number, lz: number): Vec2 => [
    item.x + lx * cos + lz * sin,
    item.z - lx * sin + lz * cos,
  ];
  return [at(-halfW, -halfD), at(halfW, -halfD), at(halfW, halfD), at(-halfW, halfD)];
}

/** Half the size of the axis-aligned box around a rotated rectangle. */
export function halfExtents(width: number, depth: number, rotation: number) {
  const angle = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  return { halfX: (width * cos + depth * sin) / 2, halfZ: (width * sin + depth * cos) / 2 };
}

export function insideRoom(width: number, depth: number, item: Footprint): boolean {
  return corners(item).every(
    ([x, z]) => x >= -EPSILON && x <= width + EPSILON && z >= -EPSILON && z <= depth + EPSILON,
  );
}

/** Whether two items get in each other's way: same layer, rugs excepted, shapes overlapping. */
export function collide(a: Footprint, b: Footprint): boolean {
  if (a.layer !== b.layer || a.layer === "rug") return false;
  return overlap(corners(a), corners(b));
}

/**
 * Mirrored in api/src/roomcraft_api/domain/placement.py; both run
 * shared/fixtures/placement.json.
 */
export function placementProblems(
  width: number,
  depth: number,
  items: Footprint[],
): PlacementProblem[] {
  const problems: PlacementProblem[] = [];
  items.forEach((item, index) => {
    if (!insideRoom(width, depth, item)) problems.push({ code: "outside_room", itemId: item.id });
    for (const earlier of items.slice(0, index)) {
      if (collide(item, earlier)) {
        problems.push({ code: "overlaps", itemId: item.id, otherItemId: earlier.id });
      }
    }
  });
  return problems;
}

/** Separating axis test for two convex quadrilaterals. */
function overlap(a: Quad, b: Quad): boolean {
  for (const [p0, p1, p2, p3] of [a, b]) {
    const edges: [Vec2, Vec2][] = [
      [p0, p1],
      [p1, p2],
      [p2, p3],
      [p3, p0],
    ];
    for (const [[x1, z1], [x2, z2]] of edges) {
      const axis: Vec2 = [z1 - z2, x2 - x1];
      const [aMin, aMax] = project(a, axis);
      const [bMin, bMax] = project(b, axis);
      if (aMax <= bMin + EPSILON || bMax <= aMin + EPSILON) return false;
    }
  }
  return true;
}

function project(polygon: Vec2[], axis: Vec2): [min: number, max: number] {
  const length = Math.hypot(axis[0], axis[1]);
  const values = polygon.map(([x, z]) => (x * axis[0] + z * axis[1]) / length);
  return [Math.min(...values), Math.max(...values)];
}
