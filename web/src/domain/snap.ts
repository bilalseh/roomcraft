import type { Room, Wall } from "@roomcraft/shared";
import { halfExtents } from "./placement";

/** Positions snap to a 10 cm grid, and to a wall when an edge comes within 15 cm of it. */
export const GRID = 0.1;
export const WALL_SNAP = 0.15;

interface Size {
  width: number;
  depth: number;
}

interface Point {
  x: number;
  z: number;
}
type RoomSize = Pick<Room, "width" | "depth">;

/** Rotation that turns an item's front (local +z) away from the wall, into the room. */
export const FACING_INTO_ROOM: Record<Wall, number> = { north: 0, west: 90, south: 180, east: 270 };

/** Snaps a floor or ceiling item: flush to a nearby wall, otherwise to the grid, and inside the room. */
export function snapToFloor(room: RoomSize, size: Size, rotation: number, desired: Point): Point {
  const { halfX, halfZ } = halfExtents(size.width, size.depth, rotation);
  return { x: snapAxis(desired.x, halfX, room.width), z: snapAxis(desired.z, halfZ, room.depth) };
}

/** Hangs a wall item on the wall nearest to the desired point, flush and facing into the room. */
export function snapToWall(
  room: RoomSize,
  size: Size,
  desired: Point,
): Point & { rotation: number } {
  const distances: [Wall, number][] = [
    ["north", desired.z],
    ["south", room.depth - desired.z],
    ["west", desired.x],
    ["east", room.width - desired.x],
  ];
  const [wall] = distances.reduce((best, candidate) => (candidate[1] < best[1] ? candidate : best));
  const rotation = FACING_INTO_ROOM[wall];
  const halfW = size.width / 2;
  const halfD = size.depth / 2;
  switch (wall) {
    case "north":
      return { x: alongWall(desired.x, halfW, room.width), z: halfD, rotation };
    case "south":
      return { x: alongWall(desired.x, halfW, room.width), z: room.depth - halfD, rotation };
    case "west":
      return { x: halfD, z: alongWall(desired.z, halfW, room.depth), rotation };
    case "east":
      return { x: room.width - halfD, z: alongWall(desired.z, halfW, room.depth), rotation };
  }
}

function snapAxis(value: number, half: number, length: number): number {
  if (Math.abs(value - half) <= WALL_SNAP) return round(half);
  if (Math.abs(length - half - value) <= WALL_SNAP) return round(length - half);
  return alongWall(value, half, length);
}

function alongWall(value: number, half: number, length: number): number {
  const snapped = Math.round(value / GRID) * GRID;
  return round(Math.min(Math.max(snapped, half), Math.max(half, length - half)));
}

/** The nearest 15 degree step, between 0 and 345. */
export function normalizeRotation(degrees: number): number {
  return (((Math.round(degrees / 15) * 15) % 360) + 360) % 360;
}

/** Millimetre precision keeps grid arithmetic (0.1 + 0.2) out of stored positions. */
export function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
