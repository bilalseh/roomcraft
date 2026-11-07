import type { Room, Wall } from "@roomcraft/shared";
import { wallLength } from "./room";
import { pointOnWall, wallFrame, wallPieces, type Box } from "./walls";

const SKIRTING = { height: 0.08, depth: 0.015 };
const FRAME = { width: 0.06, depth: 0.02 };
const SILL = { height: 0.03, depth: 0.05 };

/**
 * Skirting boards and opening frames, as boxes standing proud of the walls'
 * inner faces: skirting along every stretch of wall that reaches the floor,
 * a frame around each door and window, and a sill under each window.
 */
export function trimBoxes(room: Room, thickness: number): Box[] {
  const boxes: Box[] = [];
  for (const piece of wallPieces(room, thickness)) {
    if (piece.bottom > 0) continue;
    const start = Math.max(piece.start, 0);
    const end = Math.min(piece.end, wallLength(room, piece.wall));
    if (end - start > 0.02) {
      boxes.push(onWall(room, piece.wall, start, end, 0, SKIRTING.height, SKIRTING.depth));
    }
  }

  for (const opening of room.openings) {
    const { wall, offset, width, sill } = opening;
    const top = sill + opening.height;
    const left = Math.max(offset - FRAME.width, 0);
    const right = Math.min(offset + width + FRAME.width, wallLength(room, wall));
    boxes.push(
      onWall(room, wall, left, offset, sill, top, FRAME.depth),
      onWall(room, wall, offset + width, right, sill, top, FRAME.depth),
      onWall(room, wall, left, right, top, top + FRAME.width, FRAME.depth),
    );
    if (opening.kind === "window") {
      boxes.push(onWall(room, wall, left, right, sill - SILL.height, sill, SILL.depth));
    }
  }
  return boxes;
}

/** A box against a wall's inner face, from `start` to `end` along it. */
function onWall(
  room: Room,
  wall: Wall,
  start: number,
  end: number,
  bottom: number,
  top: number,
  depth: number,
): Box {
  const [x, z] = pointOnWall(wallFrame(room, wall), (start + end) / 2, depth / 2);
  const length = end - start;
  const height = top - bottom;
  const runsEastWest = wall === "north" || wall === "south";
  return {
    wall,
    center: [x, (bottom + top) / 2, z],
    size: runsEastWest ? [length, height, depth] : [depth, height, length],
  };
}
