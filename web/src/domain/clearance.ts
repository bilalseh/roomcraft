import type { Category, Opening, Room } from "@roomcraft/shared";
import { corners, polygonsOverlap, type Footprint } from "./placement";
import { pointOnWall, wallFrame, type Vec2 } from "./walls";

export type ClearanceIssueCode = "door_swing_blocked" | "hard_to_reach";

export interface ClearanceIssue {
  code: ClearanceIssueCode;
  itemId: string;
  openingId?: string;
}

export interface ClearanceItem extends Footprint {
  category: Category;
}

/** Narrowest gap a person walks through comfortably, in metres. */
export const WALKWAY = 0.8;
const CELL = 0.05;
const RADIUS = WALKWAY / 2;
// Half a cell of tolerance, so a gap of exactly 80 cm still counts as a walkway.
const CLEAR = RADIUS - CELL / 2;
/** How close a person must stand to use a piece: their centre within 70 cm of it. */
const REACH = 0.7;
const NEEDS_ACCESS: ReadonlySet<Category> = new Set(["seating", "tables", "storage", "beds"]);
const SWING_STEPS = 8;

type Cell = [column: number, row: number];
type Bounds = [x0: number, z0: number, x1: number, z1: number];

/**
 * Blocked door swings, then pieces reachable only through gaps narrower than a
 * walkway. Mirrored in api/src/roomcraft_api/domain/clearance.py; both run
 * shared/fixtures/clearance.json.
 */
export function clearanceIssues(
  room: Pick<Room, "width" | "depth" | "openings">,
  items: ClearanceItem[],
): ClearanceIssue[] {
  const obstacles = items.filter((item) => item.layer === "floor");
  const doors = room.openings.filter((opening) => opening.kind === "door");
  const issues: ClearanceIssue[] = [];
  for (const door of doors) {
    const swing = doorSwing(room, door);
    for (const item of obstacles) {
      if (polygonsOverlap(swing, corners(item))) {
        issues.push({ code: "door_swing_blocked", itemId: item.id, openingId: door.id });
      }
    }
  }
  return [...issues, ...hardToReach(room, doors, obstacles)];
}

/** The quarter circle a door sweeps, as a polygon: the hinge, then points on the arc. */
export function doorSwing(room: Pick<Room, "width" | "depth">, door: Opening): Vec2[] {
  const frame = wallFrame(room, door.wall);
  const arc = Array.from({ length: SWING_STEPS + 1 }, (_, step) => {
    const angle = ((Math.PI / 2) * step) / SWING_STEPS;
    return pointOnWall(
      frame,
      door.offset + door.width * Math.cos(angle),
      door.width * Math.sin(angle),
    );
  });
  return [pointOnWall(frame, door.offset), ...arc];
}

/** Distance from a point to the nearest edge of a footprint; zero inside it. */
export function distanceTo(item: Footprint, x: number, z: number): number {
  const angle = (item.rotation * Math.PI) / 180;
  const dx = x - item.x;
  const dz = z - item.z;
  const localX = dx * Math.cos(angle) - dz * Math.sin(angle);
  const localZ = dx * Math.sin(angle) + dz * Math.cos(angle);
  const outX = Math.max(Math.abs(localX) - item.width / 2, 0);
  const outZ = Math.max(Math.abs(localZ) - item.depth / 2, 0);
  return Math.hypot(outX, outZ);
}

function bounds(item: Footprint, margin: number): Bounds {
  const points = corners(item);
  const xs = points.map(([x]) => x);
  const zs = points.map(([, z]) => z);
  return [
    Math.min(...xs) - margin,
    Math.min(...zs) - margin,
    Math.max(...xs) + margin,
    Math.max(...zs) + margin,
  ];
}

function hardToReach(
  room: Pick<Room, "width" | "depth">,
  doors: Opening[],
  obstacles: ClearanceItem[],
): ClearanceIssue[] {
  const { width, depth } = room;
  const columns = Math.floor(width / CELL + 1e-9);
  const rows = Math.floor(depth / CELL + 1e-9);
  const near = obstacles.map((item) => [item, bounds(item, RADIUS)] as const);
  const known = new Map<number, boolean>();
  const key = ([column, row]: Cell) => column * rows + row;
  const center = ([column, row]: Cell): Vec2 => [(column + 0.5) * CELL, (row + 0.5) * CELL];

  const walkable = (cell: Cell): boolean => {
    let open = known.get(key(cell));
    if (open === undefined) {
      const [x, z] = center(cell);
      open =
        Math.min(x, width - x, z, depth - z) >= CLEAR &&
        near.every(
          ([item, [x0, z0, x1, z1]]) =>
            !(x0 <= x && x <= x1 && z0 <= z && z <= z1) || distanceTo(item, x, z) >= CLEAR,
        );
      known.set(key(cell), open);
    }
    return open;
  };

  const seeds: Cell[] = [];
  for (const door of doors) {
    const [x, z] = pointOnWall(
      wallFrame(room, door.wall),
      door.offset + door.width / 2,
      RADIUS + CELL,
    );
    const cell: Cell = [
      Math.min(Math.floor(x / CELL), columns - 1),
      Math.min(Math.floor(z / CELL), rows - 1),
    ];
    if (walkable(cell)) seeds.push(cell);
  }
  // Every door is blocked; the door issues already say so.
  if (seeds.length === 0) return [];

  const reached = new Set(seeds.map(key));
  const queue = [...seeds];
  for (let next = queue.shift(); next; next = queue.shift()) {
    const [column, row] = next;
    const neighbours: Cell[] = [
      [column + 1, row],
      [column - 1, row],
      [column, row + 1],
      [column, row - 1],
    ];
    for (const cell of neighbours) {
      const inRoom = cell[0] >= 0 && cell[0] < columns && cell[1] >= 0 && cell[1] < rows;
      if (inRoom && !reached.has(key(cell)) && walkable(cell)) {
        reached.add(key(cell));
        queue.push(cell);
      }
    }
  }

  const reachable = (item: Footprint): boolean => {
    const [x0, z0, x1, z1] = bounds(item, REACH);
    for (
      let column = Math.max(Math.floor(x0 / CELL), 0);
      column < Math.min(Math.floor(x1 / CELL) + 1, columns);
      column++
    ) {
      for (
        let row = Math.max(Math.floor(z0 / CELL), 0);
        row < Math.min(Math.floor(z1 / CELL) + 1, rows);
        row++
      ) {
        const cell: Cell = [column, row];
        if (reached.has(key(cell)) && distanceTo(item, ...center(cell)) <= REACH) return true;
      }
    }
    return false;
  };

  return obstacles
    .filter((item) => NEEDS_ACCESS.has(item.category) && !reachable(item))
    .map((item) => ({ code: "hard_to_reach", itemId: item.id }));
}
