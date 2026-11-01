import type { Placement, Room } from "@roomcraft/shared";
import { z } from "zod";
import { placementSchema, roomSchema } from "./schemas";

export interface Project {
  id: string;
  name: string;
  room: Room;
  furniture: Placement[];
  createdAt: string;
  updatedAt: string;
}

export const projectSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  room: roomSchema,
  // Projects saved before furniture existed have none.
  furniture: z.array(placementSchema).default([]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}) satisfies z.ZodType<Project>;

export function createProject(id: string, name: string, room: Room, now: Date): Project {
  const timestamp = now.toISOString();
  return { id, name: name.trim(), room, furniture: [], createdAt: timestamp, updatedAt: timestamp };
}
