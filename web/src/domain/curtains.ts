import type { Room, Wall } from "@roomcraft/shared";
import { corners, polygonsOverlap, type Footprint } from "./placement";
import { wallLength } from "./room";
import { pointOnWall, wallFrame, type Vec2 } from "./walls";

/** A gathered curtain hanging from the rod to the floor, `start` to `end` metres along its wall. */
export interface CurtainPanel {
  wall: Wall;
  start: number;
  end: number;
  top: number;
}

export interface CurtainRod {
  wall: Wall;
  start: number;
  end: number;
  height: number;
}

export interface Curtains {
  panels: CurtainPanel[];
  rods: CurtainRod[];
}

/** How wide a drawn-back panel is, and how far it covers the window's edge. */
const PANEL = { width: 0.32, overlap: 0.08 };
/** The rod above the window, below the ceiling, and its curtains' reach into the room. */
const ROD = { above: 0.15, belowCeiling: 0.04, reach: 0.14 };
/** Nearest a panel comes to a corner, and the narrowest one worth hanging. */
const CORNER = 0.03;
const NARROWEST = 0.15;

/**
 * Floor-length curtains drawn back on both sides of each window. A panel is left
 * out where it would hang into a piece of furniture, a wall piece or a door.
 */
export function curtains(room: Room, pieces: readonly Footprint[]): Curtains {
  const obstacles = pieces.filter((piece) => piece.layer === "floor" || piece.layer === "wall");
  const doors = room.openings.filter((opening) => opening.kind === "door");
  const result: Curtains = { panels: [], rods: [] };

  for (const window of room.openings.filter((opening) => opening.kind === "window")) {
    const { wall, offset, width } = window;
    const length = wallLength(room, wall);
    const top = Math.min(window.sill + window.height + ROD.above, room.height - ROD.belowCeiling);
    const sides = [
      [offset + PANEL.overlap - PANEL.width, offset + PANEL.overlap],
      [offset + width - PANEL.overlap, offset + width - PANEL.overlap + PANEL.width],
    ].map(([start = 0, end = 0]) => [Math.max(start, CORNER), Math.min(end, length - CORNER)]);

    const free = sides.filter(([start = 0, end = 0]) => {
      if (end - start < NARROWEST) return false;
      const blockedByDoor = doors.some(
        (door) => door.wall === wall && start < door.offset + door.width && end > door.offset,
      );
      const area = panelArea(room, wall, start, end);
      return !blockedByDoor && !obstacles.some((piece) => polygonsOverlap(area, corners(piece)));
    });
    if (free.length === 0) continue;

    for (const [start = 0, end = 0] of free) result.panels.push({ wall, start, end, top });
    const first = sides[0]?.[0] ?? offset;
    const last = sides[1]?.[1] ?? offset + width;
    result.rods.push({ wall, start: first, end: last, height: top });
  }
  return result;
}

/** The strip of floor a panel hangs over, as a plan polygon. */
function panelArea(room: Room, wall: Wall, start: number, end: number): Vec2[] {
  const frame = wallFrame(room, wall);
  return [
    pointOnWall(frame, start, 0),
    pointOnWall(frame, end, 0),
    pointOnWall(frame, end, ROD.reach),
    pointOnWall(frame, start, ROD.reach),
  ];
}

/** How far into the room the curtains hang, for drawing them. */
export const CURTAIN_REACH = ROD.reach;
