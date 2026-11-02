import type { Materials, Opening, Placement, Room } from "@roomcraft/shared";
import { z } from "zod";
import { OPENING_LIMITS, ROOM_LIMITS } from "./limits";
import { FLOOR_MATERIALS } from "./materials";
import { OPENING_KINDS, ROOM_TYPES, STYLES, WALLS } from "./room";

// Runtime validation for data from outside the app (storage, seed files). The
// `satisfies` clauses fail to compile if these drift from the generated types.

export const openingSchema = z.strictObject({
  id: z.string().min(1).max(64),
  kind: z.enum(OPENING_KINDS),
  wall: z.enum(WALLS),
  offset: z.number().min(OPENING_LIMITS.offset.min).max(OPENING_LIMITS.offset.max),
  width: z.number().min(OPENING_LIMITS.width.min).max(OPENING_LIMITS.width.max),
  height: z.number().min(OPENING_LIMITS.height.min).max(OPENING_LIMITS.height.max),
  sill: z.number().min(OPENING_LIMITS.sill.min).max(OPENING_LIMITS.sill.max),
}) satisfies z.ZodType<Opening>;

export const roomSchema = z.strictObject({
  type: z.enum(ROOM_TYPES),
  width: z.number().min(ROOM_LIMITS.width.min).max(ROOM_LIMITS.width.max),
  depth: z.number().min(ROOM_LIMITS.depth.min).max(ROOM_LIMITS.depth.max),
  height: z.number().min(ROOM_LIMITS.height.min).max(ROOM_LIMITS.height.max),
  openings: z.array(openingSchema).max(ROOM_LIMITS.openings),
  style: z.enum(STYLES),
  budget: z.number().min(ROOM_LIMITS.budget.min).max(ROOM_LIMITS.budget.max),
}) satisfies z.ZodType<Room>;

export const placementSchema = z.strictObject({
  id: z.string().min(1).max(64),
  itemId: z.string().min(1).max(64),
  x: z.number(),
  z: z.number(),
  rotation: z.number().min(0).lt(360).multipleOf(15),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/)
    .nullable()
    .exactOptional(),
}) satisfies z.ZodType<Placement>;

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/);

export const materialsSchema = z.strictObject({
  floor: z.enum(FLOOR_MATERIALS),
  floorColor: hexColor,
  wallColor: hexColor,
}) satisfies z.ZodType<Materials>;
