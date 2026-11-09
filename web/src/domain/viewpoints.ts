import type { Room } from "@roomcraft/shared";
import { corners, polygonsOverlap, type Footprint } from "./placement";
import type { Vec2 } from "./walls";

/** Where to stand on the floor plan, and the turn about the vertical axis to face the room. */
export interface Viewpoint {
  x: number;
  z: number;
  yaw: number;
}

/** From a corner, how far in to start looking for room to stand, and the step and space needed. */
const FIRST_STEP = 0.45;
const STEP = 0.1;
const ROOM_TO_STAND = 0.4;
/** Pieces lower than this are below a standing person's eyes, so they do not block the view. */
const BLOCKS_VIEW = 1.2;

/** A piece on the floor plan, with its height. */
export type TallFootprint = Footprint & { height: number };

/**
 * A spot near each corner (north-west, north-east, south-east, south-west) facing
 * the middle of the room, the way rooms are photographed. Each moves towards the
 * middle until it is clear of anything taller than the eye: a camera at eye height
 * can stand over a chair, not in a bookshelf.
 */
export function cornerViewpoints(
  room: Pick<Room, "width" | "depth">,
  pieces: readonly TallFootprint[],
): Viewpoint[] {
  const obstacles = pieces
    .filter((piece) => piece.layer === "floor" && piece.height > BLOCKS_VIEW)
    .map(corners);
  const middle: Vec2 = [room.width / 2, room.depth / 2];
  const starts: Vec2[] = [
    [0, 0],
    [room.width, 0],
    [room.width, room.depth],
    [0, room.depth],
  ];

  return starts.map(([cx, cz]) => {
    const distance = Math.hypot(middle[0] - cx, middle[1] - cz);
    const [dx, dz] = [(middle[0] - cx) / distance, (middle[1] - cz) / distance];
    let along = FIRST_STEP;
    const at = (): Vec2 => [cx + dx * along, cz + dz * along];
    while (along + STEP < distance && blocked(at(), obstacles)) along += STEP;
    const [x, z] = at();
    // A camera looks down -z; turn it to face the middle.
    return { x, z, yaw: Math.atan2(-dx, -dz) };
  });
}

function blocked([x, z]: Vec2, obstacles: readonly Vec2[][]): boolean {
  const half = ROOM_TO_STAND / 2;
  const spot: Vec2[] = [
    [x - half, z - half],
    [x + half, z - half],
    [x + half, z + half],
    [x - half, z + half],
  ];
  return obstacles.some((obstacle) => polygonsOverlap(spot, obstacle));
}
