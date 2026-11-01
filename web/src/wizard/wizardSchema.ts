import type { Opening, RoomType, Style } from "@roomcraft/shared";
import { z } from "zod";
import { OPENING_LIMITS, ROOM_LIMITS, type Range } from "../domain/limits";
import { formatUsd } from "../domain/money";
import {
  OPENING_KINDS,
  ROOM_TYPES,
  STYLES,
  validateRoom,
  WALLS,
  wallLength,
  type RoomGeometry,
} from "../domain/room";
import { formatLength, type Units } from "../domain/units";
import { OPENING_KIND_LABELS, WALL_LABELS } from "../project/labels";

/** What the form holds while the wizard is open. Lengths are in metres. */
export interface WizardValues {
  type: RoomType | "";
  width: number;
  depth: number;
  height: number;
  openings: Opening[];
  style: Style | "";
  budget: number;
  name: string;
}

export const STEPS = [
  { id: "type", title: "Room type", question: "What kind of room are you planning?" },
  { id: "size", title: "Size", question: "How big is the room?" },
  { id: "openings", title: "Doors and windows", question: "Where are the doors and windows?" },
  { id: "style", title: "Style", question: "Which style feels like home?" },
  { id: "budget", title: "Budget", question: "What can you spend on furniture?" },
  { id: "review", title: "Review", question: "Ready to build your room?" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const STEP_FIELDS: Record<StepId, (keyof WizardValues)[]> = {
  type: ["type"],
  size: ["width", "depth", "height"],
  openings: ["openings"],
  style: ["style"],
  budget: ["budget"],
  review: ["name"],
};

export const DEFAULT_VALUES: WizardValues = {
  type: "",
  width: 4.5,
  depth: 3.6,
  height: 2.6,
  openings: [
    { id: "door-1", kind: "door", wall: "south", offset: 0.5, width: 0.9, height: 2.1, sill: 0 },
    {
      id: "window-1",
      kind: "window",
      wall: "north",
      offset: 1.5,
      width: 1.5,
      height: 1.3,
      sill: 0.9,
    },
  ],
  style: "",
  budget: 3000,
  name: "",
};

/** One schema per step, so a step is checked without waiting on answers that come later. */
export function stepSchema(step: StepId, units: Units) {
  const fields = schemaFields(units);
  switch (step) {
    case "type":
      return z.object({ type: fields.type });
    case "size":
      return z.object({ width: fields.width, depth: fields.depth, height: fields.height });
    case "openings":
      return z
        .object({
          width: fields.width,
          depth: fields.depth,
          height: fields.height,
          openings: fields.openings,
        })
        .superRefine((room, ctx) => {
          addRoomIssues(room, units, ctx);
        });
    case "style":
      return z.object({ style: fields.style });
    case "budget":
      return z.object({ budget: fields.budget });
    case "review":
      return z.object(fields).superRefine((room, ctx) => {
        addRoomIssues(room, units, ctx);
      });
  }
}

function schemaFields(units: Units) {
  const length = (what: string, range: Range) =>
    z
      .number({ error: `Enter the ${what}.` })
      .min(range.min, `The ${what} must be at least ${formatLength(range.min, units)}.`)
      .max(range.max, `The ${what} can be at most ${formatLength(range.max, units)}.`);

  const opening = z.object({
    id: z.string(),
    kind: z.enum(OPENING_KINDS),
    wall: z.enum(WALLS),
    offset: length("position", OPENING_LIMITS.offset),
    width: length("width", OPENING_LIMITS.width),
    height: length("height", OPENING_LIMITS.height),
    sill: length("sill height", OPENING_LIMITS.sill),
  });

  return {
    type: z.enum(ROOM_TYPES, { error: "Choose the kind of room." }),
    width: length("width", ROOM_LIMITS.width),
    depth: length("depth", ROOM_LIMITS.depth),
    height: length("ceiling height", ROOM_LIMITS.height),
    openings: z
      .array(opening)
      .max(ROOM_LIMITS.openings, `A room can have up to ${ROOM_LIMITS.openings} openings.`),
    style: z.enum(STYLES, { error: "Choose a style." }),
    budget: z
      .number({ error: "Enter a budget." })
      .min(
        ROOM_LIMITS.budget.min,
        `The budget must be at least ${formatUsd(ROOM_LIMITS.budget.min)}.`,
      )
      .max(
        ROOM_LIMITS.budget.max,
        `The budget can be at most ${formatUsd(ROOM_LIMITS.budget.max)}.`,
      ),
    name: z
      .string()
      .trim()
      .min(1, "Give the room a name.")
      .max(80, "Keep the name under 80 characters."),
  };
}

/** Reports the shared room rules (domain/room.ts) on the fields a person would fix. */
function addRoomIssues(room: RoomGeometry, units: Units, ctx: z.RefinementCtx) {
  const issues = validateRoom(room);
  const indexOf = (id: string | undefined) => room.openings.findIndex((o) => o.id === id);

  for (const issue of issues) {
    const index = indexOf(issue.openingId);
    const opening = room.openings[index];
    switch (issue.code) {
      case "no_door":
        ctx.addIssue({ code: "custom", path: ["openings"], message: "Add at least one door." });
        break;
      case "door_not_at_floor":
        ctx.addIssue({
          code: "custom",
          path: ["openings", index, "sill"],
          message: "A door starts at the floor.",
        });
        break;
      case "opening_exceeds_wall":
        if (opening) {
          const length = formatLength(wallLength(room, opening.wall), units);
          ctx.addIssue({
            code: "custom",
            path: ["openings", index, "offset"],
            message: `Doesn't fit: the ${WALL_LABELS[opening.wall].toLowerCase()} is ${length} long.`,
          });
        }
        break;
      case "opening_above_ceiling":
        ctx.addIssue({
          code: "custom",
          path: ["openings", index, "height"],
          message: `Reaches above the ${formatLength(room.height, units)} ceiling.`,
        });
        break;
      case "openings_overlap": {
        const other = room.openings[indexOf(issue.otherOpeningId)];
        const what = other ? OPENING_KIND_LABELS[other.kind].toLowerCase() : "opening";
        ctx.addIssue({
          code: "custom",
          path: ["openings", index, "offset"],
          message: `Overlaps the ${what} on the same wall.`,
        });
        break;
      }
    }
  }
}
