import type { Materials, Placement, Room } from "@roomcraft/shared";
import { z } from "zod";
import { defaultMaterials } from "./materials";
import { materialsSchema, placementSchema, roomSchema } from "./schemas";

export interface Project {
  id: string;
  name: string;
  room: Room;
  furniture: Placement[];
  materials: Materials;
  createdAt: string;
  updatedAt: string;
}

export const projectSchema = z
  .strictObject({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(80),
    room: roomSchema,
    // Projects saved before furniture and finishes existed have neither.
    furniture: z.array(placementSchema).default([]),
    materials: materialsSchema.optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .transform(({ materials, ...project }) => ({
    ...project,
    materials: materials ?? defaultMaterials(project.room.style),
  })) satisfies z.ZodType<Project>;

export function createProject(id: string, name: string, room: Room, now: Date): Project {
  const timestamp = now.toISOString();
  return {
    id,
    name: name.trim(),
    room,
    furniture: [],
    materials: defaultMaterials(room.style),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
