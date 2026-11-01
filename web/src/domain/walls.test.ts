import type { Opening, Room } from "@roomcraft/shared";
import { describe, expect, it } from "vitest";
import { pointOnWall, wallBox, wallFrame, wallPieces, windowPanes } from "./walls";

const T = 0.1;

function room(openings: Opening[] = []): Room {
  return {
    type: "bedroom",
    width: 4,
    depth: 3,
    height: 2.5,
    openings,
    style: "classic",
    budget: 2000,
  };
}

const door: Opening = {
  id: "d1",
  kind: "door",
  wall: "east",
  offset: 0,
  width: 0.9,
  height: 2.1,
  sill: 0,
};
const window: Opening = {
  id: "w1",
  kind: "window",
  wall: "north",
  offset: 1,
  width: 1.2,
  height: 1.2,
  sill: 0.9,
};

describe("wallPieces", () => {
  it("builds one full-height piece per wall, with north and south covering the corners", () => {
    expect(wallPieces(room(), T)).toEqual([
      { wall: "north", start: -T, end: 4 + T, bottom: 0, top: 2.5 },
      { wall: "east", start: 0, end: 3, bottom: 0, top: 2.5 },
      { wall: "south", start: -T, end: 4 + T, bottom: 0, top: 2.5 },
      { wall: "west", start: 0, end: 3, bottom: 0, top: 2.5 },
    ]);
  });

  it("leaves a hole for a window: wall beside, below and above it", () => {
    const north = wallPieces(room([window]), T).filter((piece) => piece.wall === "north");

    expect(north).toEqual([
      { wall: "north", start: -T, end: 1, bottom: 0, top: 2.5 },
      { wall: "north", start: 1, end: 2.2, bottom: 0, top: 0.9 },
      { wall: "north", start: 1, end: 2.2, bottom: 2.1, top: 2.5 },
      { wall: "north", start: 2.2, end: 4 + T, bottom: 0, top: 2.5 },
    ]);
  });

  it("leaves a door open to the floor, with a lintel above it", () => {
    const east = wallPieces(room([door]), T).filter((piece) => piece.wall === "east");

    expect(east).toEqual([
      { wall: "east", start: 0, end: 0.9, bottom: 2.1, top: 2.5 },
      { wall: "east", start: 0.9, end: 3, bottom: 0, top: 2.5 },
    ]);
  });

  it("skips the lintel when an opening reaches the ceiling", () => {
    const tall = { ...door, height: 2.5 };

    expect(wallPieces(room([tall]), T).filter((piece) => piece.wall === "east")).toEqual([
      { wall: "east", start: 0.9, end: 3, bottom: 0, top: 2.5 },
    ]);
  });
});

describe("wallBox", () => {
  it("puts the wall's thickness outside the room", () => {
    const piece = { start: 0, end: 3, bottom: 0, top: 2.5 };

    expect(wallBox(room(), { ...piece, wall: "west" }, T)).toEqual({
      wall: "west",
      center: [-T / 2, 1.25, 1.5],
      size: [T, 2.5, 3],
    });
    expect(wallBox(room(), { ...piece, wall: "south" }, T)).toEqual({
      wall: "south",
      center: [1.5, 1.25, 3 + T / 2],
      size: [3, 2.5, T],
    });
  });
});

describe("wallFrame and pointOnWall", () => {
  it.each([
    ["north", [1, 0.5]],
    ["south", [1, 2.5]],
    ["west", [0.5, 1]],
    ["east", [3.5, 1]],
  ] as const)("measures the %s wall from its start corner, inward into the room", (wall, point) => {
    expect(pointOnWall(wallFrame(room(), wall), 1, 0.5)).toEqual(point);
  });
});

describe("windowPanes", () => {
  it("places a thin pane in each window opening", () => {
    const [pane] = windowPanes(room([door, window]), T, 0.01);

    expect(pane).toEqual({
      wall: "north",
      center: [expect.closeTo(1.6), expect.closeTo(1.5), -T / 2],
      size: [expect.closeTo(1.2), expect.closeTo(1.2), 0.01],
    });
  });
});
