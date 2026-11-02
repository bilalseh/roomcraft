// Generated from shared/schema by `pnpm schema`. Do not edit.

export interface AddOperation {
  op: "add";
  placementId: string;
  itemId: string;
  x: number;
  z: number;
  rotation: number;
  reason: string;
}

export interface AssistRequest {
  prompt: string;
  room: Room;
  /**
   * @maxItems 100
   */
  furniture: Placement[];
  materials: Materials;
  /**
   * How many alternative layouts.
   */
  options?: 1 | 3;
}

export interface AssistResponse {
  suggestions: Suggestion[];
  remainingToday: number;
}

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

export interface MaterialOperation {
  op: "material";
  floor: FloorMaterial | null;
  floorColor: string | null;
  wallColor: string | null;
  reason: string;
}

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

export interface MoveOperation {
  op: "move";
  placementId: string;
  x: number;
  z: number;
  reason: string;
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

export type Operation = AddOperation | MoveOperation | RotateOperation | RemoveOperation | MaterialOperation;

export type OperationProblemCode =
  | "invalid_operation"
  | "unknown_item"
  | "unknown_placement"
  | "outside_room"
  | "overlaps"
  | "blocks_door"
  | "over_budget"
  | "fixed_rotation";

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
 * A proposed change the server refused, and why.
 */
export interface RejectedOperation {
  op: string;
  reason: string;
  code: OperationProblemCode;
  otherId: string | null;
  openingId: string | null;
}

export interface RemoveOperation {
  op: "remove";
  placementId: string;
  reason: string;
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

export interface RotateOperation {
  op: "rotate";
  placementId: string;
  rotation: number;
  reason: string;
}

export type Style = "modern" | "scandinavian" | "industrial" | "classic";

export interface Suggestion {
  summary: string;
  operations: Operation[];
  rejected: RejectedOperation[];
}

export type Wall = "north" | "east" | "south" | "west";
