// Generated from shared/schema by `pnpm schema`. Do not edit.

/**
 * A piece of furniture that can be placed, built in 3D from its `model` kind.
 */
export interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  model: ModelKind;
  layer: Layer;
  width: number;
  depth: number;
  height: number;
  /**
   * Bottom height for wall items.
   */
  elevation?: number;
  price: PriceRange;
  color: string;
  /**
   * Room types it suits.
   *
   * @minItems 1
   */
  rooms: RoomType[];
}

export type Category = "seating" | "tables" | "storage" | "beds" | "lighting" | "decor";

export type FloorMaterial = "wood" | "tile" | "carpet";

/**
 * Response of `GET /health`.
 */
export interface HealthResponse {
  status: "ok";
  version: string;
}

export type Layer = "floor" | "rug" | "wall" | "ceiling";

/**
 * The room's finishes: floor material and colour, and wall paint.
 */
export interface Materials {
  floor: FloorMaterial;
  floorColor: string;
  wallColor: string;
}

export type ModelKind =
  | "sofa"
  | "armchair"
  | "chair"
  | "office_chair"
  | "ottoman"
  | "table"
  | "desk"
  | "bed"
  | "cabinet"
  | "wardrobe"
  | "bookshelf"
  | "media_unit"
  | "floor_lamp"
  | "pendant"
  | "rug"
  | "round_rug"
  | "plant"
  | "wall_art"
  | "mirror"
  | "wall_shelf";

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
 * A catalog item placed in the room, positioned by its centre.
 */
export interface Placement {
  id: string;
  itemId: string;
  /**
   * West to east, from the room's west wall.
   */
  x: number;
  /**
   * North to south, from the room's north wall.
   */
  z: number;
  /**
   * Degrees.
   */
  rotation: number;
  color?: string | null;
}

export interface PriceRange {
  min: number;
  max: number;
}

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
