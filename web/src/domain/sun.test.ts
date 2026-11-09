import type { Opening, Room } from "@roomcraft/shared";
import { describe, expect, it } from "vitest";
import { sunDirection } from "./sun";

const opening = (wall: Opening["wall"], width: number): Opening => ({
  id: `${wall}${String(width)}`,
  kind: "window",
  wall,
  offset: 0.5,
  width,
  height: 1.2,
  sill: 0.9,
});

const room = (openings: Opening[]) =>
  ({ width: 4, depth: 3, height: 2.5, openings }) as unknown as Room;

describe("sun direction", () => {
  it("shines in through the largest window, from above and to one side", () => {
    const [x, y, z] = sunDirection(room([opening("east", 0.8), opening("north", 1.6)]));

    expect(Math.hypot(x, y, z)).toBeCloseTo(1);
    // North of the room is -z: the sun is outside the north wall, looking in.
    expect(z).toBeLessThan(-0.6);
    expect(Math.abs(x)).toBeGreaterThan(0.2);
    expect(y).toBeCloseTo(Math.sin((38 * Math.PI) / 180));
  });

  it("stands above a corner when there is no window", () => {
    const [x, y, z] = sunDirection(room([]));
    expect(y).toBeGreaterThan(x);
    expect(y).toBeGreaterThan(z);
  });
});
