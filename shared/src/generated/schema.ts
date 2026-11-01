// Generated from shared/schema by `pnpm schema`. Do not edit.

/**
 * Response of `GET /health`.
 */
export interface HealthResponse {
  status: "ok";
  version: string;
}

/**
 * A door or window cut into one wall.
 */
export interface Opening {
  id: string;
  kind: OpeningKind;
  wall: Wall;
  /**
   * From the wall's start to the near edge.
   */
  offset: number;
  width: number;
  height: number;
  /**
   * Height of the bottom edge; 0 for doors.
   */
  sill: number;
}

export type OpeningKind = "door" | "window";

/**
 * Room dimensions, openings, style and budget, as set in the setup wizard.
 */
export interface Room {
  type: RoomType;
  /**
   * West to east, inside the walls.
   */
  width: number;
  /**
   * North to south, inside the walls.
   */
  depth: number;
  /**
   * Floor to ceiling.
   */
  height: number;
  /**
   * @maxItems 16
   */
  openings: Opening[];
  style: Style;
  budget: number;
}

export type RoomType = "living_room" | "bedroom" | "office" | "studio";

export type Style = "modern" | "scandinavian" | "industrial" | "classic";

export type Wall = "north" | "east" | "south" | "west";
