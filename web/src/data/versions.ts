import { z } from "zod";
import type { Layout } from "../domain/layout";
import { materialsSchema, placementSchema, roomSchema } from "../domain/schemas";
import { database } from "./firebase";

/** A named snapshot of a project's layout that can be restored later. */
export interface Version {
  id: string;
  name: string;
  createdAt: string;
  layout: Layout;
}

const versionSchema = z.object({
  name: z.string().min(1).max(80),
  createdAt: z.iso.datetime(),
  room: roomSchema,
  furniture: z.array(placementSchema),
  materials: materialsSchema,
});

export async function listVersions(projectId: string): Promise<Version[]> {
  const { collection, getDocs } = await import("firebase/firestore");
  const snapshot = await getDocs(collection(await database(), "projects", projectId, "versions"));
  return snapshot.docs
    .flatMap((document) => {
      const parsed = versionSchema.safeParse(document.data());
      if (!parsed.success) return [];
      const { name, createdAt, room, furniture, materials } = parsed.data;
      return [{ id: document.id, name, createdAt, layout: { room, furniture, materials } }];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Saves a version and returns its id. */
export async function createVersion(
  projectId: string,
  name: string,
  layout: Layout,
): Promise<string> {
  const { addDoc, collection } = await import("firebase/firestore");
  const { room, furniture, materials } = layout;
  const reference = await addDoc(collection(await database(), "projects", projectId, "versions"), {
    name,
    createdAt: new Date().toISOString(),
    room,
    furniture,
    materials,
  });
  return reference.id;
}
