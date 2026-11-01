import schema from "@roomcraft/shared/schema/roomcraft.schema.json";

// Bounds come from the API's JSON Schema, so the wizard and the API agree on them.
const room = schema.$defs.Room.properties;
const opening = schema.$defs.Opening.properties;

export interface Range {
  min: number;
  max: number;
}

export const ROOM_LIMITS = {
  width: { min: room.width.minimum, max: room.width.maximum },
  depth: { min: room.depth.minimum, max: room.depth.maximum },
  height: { min: room.height.minimum, max: room.height.maximum },
  budget: { min: room.budget.minimum, max: room.budget.maximum },
  openings: room.openings.maxItems,
} satisfies Record<string, Range | number>;

export const OPENING_LIMITS = {
  offset: { min: opening.offset.minimum, max: opening.offset.maximum },
  width: { min: opening.width.minimum, max: opening.width.maximum },
  height: { min: opening.height.minimum, max: opening.height.maximum },
  sill: { min: opening.sill.minimum, max: opening.sill.maximum },
} satisfies Record<string, Range>;
