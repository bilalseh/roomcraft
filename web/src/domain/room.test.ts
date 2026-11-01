import type { Opening, Room } from "@roomcraft/shared";
import fixtures from "@roomcraft/shared/fixtures/room-validation.json";
import schema from "@roomcraft/shared/schema/roomcraft.schema.json";
import { describe, expect, it } from "vitest";
import { findFreeSpot, OPENING_KINDS, ROOM_TYPES, STYLES, validateRoom, WALLS } from "./room";
import { roomSchema } from "./schemas";

describe("validateRoom (shared fixtures)", () => {
  it.each(fixtures.cases)("$name", ({ room, issues }) => {
    expect(validateRoom(roomSchema.parse(room))).toEqual(issues);
  });
});

describe("enumerations", () => {
  it("match the API schema", () => {
    expect([...ROOM_TYPES]).toEqual(schema.$defs.RoomType.enum);
    expect([...STYLES]).toEqual(schema.$defs.Style.enum);
    expect([...WALLS]).toEqual(schema.$defs.Wall.enum);
    expect([...OPENING_KINDS]).toEqual(schema.$defs.OpeningKind.enum);
  });
});

describe("findFreeSpot", () => {
  const window = (wall: Opening["wall"], offset: number, width: number): Opening => ({
    id: `${wall}-${offset}`,
    kind: "window",
    wall,
    offset,
    width,
    height: 1.2,
    sill: 0.9,
  });
  const room = (openings: Opening[]): Room => ({
    type: "office",
    width: 4,
    depth: 3,
    height: 2.5,
    openings,
    style: "modern",
    budget: 2000,
  });

  it("starts near the north-west corner of an empty room", () => {
    expect(findFreeSpot(room([]), 1)).toEqual({ wall: "north", offset: 0.2 });
  });

  it("uses the first gap that is wide enough", () => {
    const openings = [window("north", 0.2, 1), window("north", 2.6, 1)];

    expect(findFreeSpot(room(openings), 1)).toEqual({ wall: "north", offset: 1.4 });
  });

  it("moves on to the next wall when a wall is full", () => {
    expect(findFreeSpot(room([window("north", 0.2, 3.6)]), 1)).toEqual({
      wall: "east",
      offset: 0.2,
    });
  });

  it("returns null when no wall is long enough", () => {
    expect(findFreeSpot(room([]), 5)).toBeNull();
  });
});
