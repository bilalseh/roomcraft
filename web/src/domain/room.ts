import type { Opening, OpeningKind, Room, RoomType, Style, Wall } from "@roomcraft/shared";

export const ROOM_TYPES = [
  "living_room",
  "bedroom",
  "office",
  "studio",
] as const satisfies readonly RoomType[];
export const STYLES = [
  "modern",
  "scandinavian",
  "industrial",
  "classic",
] as const satisfies readonly Style[];
export const WALLS = ["north", "east", "south", "west"] as const satisfies readonly Wall[];
export const OPENING_KINDS = ["door", "window"] as const satisfies readonly OpeningKind[];

export type RoomIssueCode =
  | "no_door"
  | "door_not_at_floor"
  | "opening_exceeds_wall"
  | "opening_above_ceiling"
  | "openings_overlap";

export interface RoomIssue {
  code: RoomIssueCode;
  openingId?: string;
  otherOpeningId?: string;
}

// Lengths are compared with a tolerance so that rounding (1.1 + 2.2) never breaks a fit.
const EPSILON = 1e-6;

/** The parts of a room that its layout rules depend on. */
export type RoomGeometry = Pick<Room, "width" | "depth" | "height" | "openings">;

export function wallLength(room: Pick<Room, "width" | "depth">, wall: Wall): number {
  return wall === "north" || wall === "south" ? room.width : room.depth;
}

/**
 * Cross-field rules that the schema alone cannot express. Mirrored in
 * api/src/roomcraft_api/domain/room.py; both run shared/fixtures/room-validation.json.
 */
export function validateRoom(room: RoomGeometry): RoomIssue[] {
  const issues: RoomIssue[] = [];
  if (!room.openings.some((opening) => opening.kind === "door")) {
    issues.push({ code: "no_door" });
  }
  room.openings.forEach((opening, index) => {
    const openingId = opening.id;
    if (opening.kind === "door" && opening.sill > EPSILON) {
      issues.push({ code: "door_not_at_floor", openingId });
    }
    if (opening.offset + opening.width > wallLength(room, opening.wall) + EPSILON) {
      issues.push({ code: "opening_exceeds_wall", openingId });
    }
    if (opening.sill + opening.height > room.height + EPSILON) {
      issues.push({ code: "opening_above_ceiling", openingId });
    }
    for (const earlier of room.openings.slice(0, index)) {
      if (earlier.wall === opening.wall && spansOverlap(opening, earlier)) {
        issues.push({ code: "openings_overlap", openingId, otherOpeningId: earlier.id });
      }
    }
  });
  return issues;
}

function spansOverlap(a: Opening, b: Opening): boolean {
  return a.offset < b.offset + b.width - EPSILON && b.offset < a.offset + a.width - EPSILON;
}

/**
 * Finds the first place, wall by wall, where an opening of the given width fits
 * without overlapping the others. Returns null when no wall has room for it.
 */
export function findFreeSpot(
  room: RoomGeometry,
  width: number,
  margin = 0.2,
): { wall: Wall; offset: number } | null {
  for (const wall of WALLS) {
    const length = wallLength(room, wall);
    const taken = room.openings
      .filter((opening) => opening.wall === wall)
      .map((opening) => [opening.offset, opening.offset + opening.width] as const)
      .sort((a, b) => a[0] - b[0]);
    let cursor = margin;
    for (const [start, end] of taken) {
      if (start - cursor >= width + margin - EPSILON) break;
      cursor = Math.max(cursor, end + margin);
    }
    if (cursor + width <= length - margin + EPSILON) return { wall, offset: cursor };
  }
  return null;
}
