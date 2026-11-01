import type { Room, Wall } from "@roomcraft/shared";
import { WALLS, wallLength } from "./room";

export type Vec2 = [x: number, z: number];
export type Vec3 = [x: number, y: number, z: number];

/** Wall thickness in metres, outside the room's inner dimensions. */
export const WALL_THICKNESS = 0.12;

/** A wall in plan coordinates: where it starts, which way it runs, and which way is inside. */
export interface WallFrame {
  origin: Vec2;
  along: Vec2;
  inward: Vec2;
}

export function wallFrame(room: Pick<Room, "width" | "depth">, wall: Wall): WallFrame {
  switch (wall) {
    case "north":
      return { origin: [0, 0], along: [1, 0], inward: [0, 1] };
    case "south":
      return { origin: [0, room.depth], along: [1, 0], inward: [0, -1] };
    case "west":
      return { origin: [0, 0], along: [0, 1], inward: [1, 0] };
    case "east":
      return { origin: [room.width, 0], along: [0, 1], inward: [-1, 0] };
  }
}

/** A point `along` metres down the wall and `into` metres into the room. */
export function pointOnWall(frame: WallFrame, along: number, into = 0): Vec2 {
  return [
    frame.origin[0] + frame.along[0] * along + frame.inward[0] * into,
    frame.origin[1] + frame.along[1] * along + frame.inward[1] * into,
  ];
}

/** A solid piece of wall, positioned along the wall from its start corner. */
export interface WallPiece {
  wall: Wall;
  start: number;
  end: number;
  bottom: number;
  top: number;
}

/** An axis-aligned box in room coordinates: x east, y up, z south, origin at the north-west corner. */
export interface Box {
  wall: Wall;
  center: Vec3;
  size: Vec3;
}

/**
 * Splits each wall into solid pieces around its openings: full-height pieces
 * between openings, plus the wall below each window and above each opening.
 * North and south walls extend over the corners so the walls close.
 */
export function wallPieces(room: Room, thickness: number): WallPiece[] {
  return WALLS.flatMap((wall) => {
    const length = wallLength(room, wall);
    const runsOverCorners = wall === "north" || wall === "south";
    const from = runsOverCorners ? -thickness : 0;
    const to = runsOverCorners ? length + thickness : length;
    const openings = room.openings
      .filter((opening) => opening.wall === wall)
      .sort((a, b) => a.offset - b.offset);

    const pieces: WallPiece[] = [];
    const add = (start: number, end: number, bottom: number, top: number) => {
      if (end > start && top > bottom) pieces.push({ wall, start, end, bottom, top });
    };
    let cursor = from;
    for (const opening of openings) {
      const start = Math.max(opening.offset, cursor);
      const end = Math.min(opening.offset + opening.width, to);
      add(cursor, start, 0, room.height);
      add(start, end, 0, opening.sill);
      add(start, end, opening.sill + opening.height, room.height);
      cursor = Math.max(cursor, end);
    }
    add(cursor, to, 0, room.height);
    return pieces;
  });
}

/** Places a span along a wall as a box; the wall's thickness sits outside the room. */
export function wallBox(
  room: Pick<Room, "width" | "depth">,
  piece: WallPiece,
  thickness: number,
): Box {
  const along = (piece.start + piece.end) / 2;
  const length = piece.end - piece.start;
  const y = (piece.bottom + piece.top) / 2;
  const height = piece.top - piece.bottom;
  switch (piece.wall) {
    case "north":
      return {
        wall: "north",
        center: [along, y, -thickness / 2],
        size: [length, height, thickness],
      };
    case "south":
      return {
        wall: "south",
        center: [along, y, room.depth + thickness / 2],
        size: [length, height, thickness],
      };
    case "west":
      return {
        wall: "west",
        center: [-thickness / 2, y, along],
        size: [thickness, height, length],
      };
    case "east":
      return {
        wall: "east",
        center: [room.width + thickness / 2, y, along],
        size: [thickness, height, length],
      };
  }
}

export function wallBoxes(room: Room, thickness: number): Box[] {
  return wallPieces(room, thickness).map((piece) => wallBox(room, piece, thickness));
}

/** Glass panes, one per window, centred in the wall's thickness. */
export function windowPanes(room: Room, thickness: number, glass = 0.01): Box[] {
  return room.openings
    .filter((opening) => opening.kind === "window")
    .map((opening) => {
      const pane = wallBox(
        room,
        {
          wall: opening.wall,
          start: opening.offset,
          end: opening.offset + opening.width,
          bottom: opening.sill,
          top: opening.sill + opening.height,
        },
        thickness,
      );
      const size: Vec3 =
        opening.wall === "north" || opening.wall === "south"
          ? [pane.size[0], pane.size[1], glass]
          : [glass, pane.size[1], pane.size[2]];
      return { ...pane, size };
    });
}
