import type { Room } from "@roomcraft/shared";
import { wallFrame, type Vec3 } from "./walls";

/** Low enough to reach into the room through a window, high enough to look like daytime. */
const ELEVATION = (38 * Math.PI) / 180;
/** Turned off square so the light falls across the floor at an angle. */
const SLANT = (25 * Math.PI) / 180;
/** From above one corner, for rooms without a window. */
const OVERHEAD: Vec3 = [0.6, 2, 0.9];

/**
 * Which way the sun is, as a unit vector from the room towards it: outside the
 * largest window, so sunlight comes in through it.
 */
export function sunDirection(room: Room): Vec3 {
  const windows = room.openings.filter((opening) => opening.kind === "window");
  const largest = windows.reduce<(typeof windows)[number] | undefined>(
    (best, window) =>
      !best || window.width * window.height > best.width * best.height ? window : best,
    undefined,
  );
  if (!largest) return normalize(OVERHEAD);

  const { inward } = wallFrame(room, largest.wall);
  const [x, z] = [-inward[0], -inward[1]];
  const outward: [number, number] = [
    x * Math.cos(SLANT) - z * Math.sin(SLANT),
    x * Math.sin(SLANT) + z * Math.cos(SLANT),
  ];
  const level = Math.cos(ELEVATION);
  return [outward[0] * level, Math.sin(ELEVATION), outward[1] * level];
}

function normalize([x, y, z]: Vec3): Vec3 {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}
