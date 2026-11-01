import type { Room, Wall } from "@roomcraft/shared";
import type { Vector3 } from "three";

/**
 * Dollhouse view: a wall is hidden while the camera is outside it, so the room
 * stays visible from any angle. The room is centred on the world origin.
 */
export function isWallCutAway(room: Pick<Room, "width" | "depth">, wall: Wall, camera: Vector3) {
  const x = camera.x + room.width / 2;
  const z = camera.z + room.depth / 2;
  switch (wall) {
    case "north":
      return z < 0;
    case "south":
      return z > room.depth;
    case "west":
      return x < 0;
    case "east":
      return x > room.width;
  }
}

/** The wall a wall-mounted item hangs on, from the way it faces (see FACING_INTO_ROOM). */
export function wallFacing(rotation: number): Wall {
  switch (((Math.round(rotation / 90) % 4) + 4) % 4) {
    case 1:
      return "west";
    case 2:
      return "south";
    case 3:
      return "east";
    default:
      return "north";
  }
}
