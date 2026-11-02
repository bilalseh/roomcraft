import { z } from "zod";
import type { Layout } from "../domain/layout";
import { materialsSchema, placementSchema, roomSchema } from "../domain/schemas";
import { database, isPermissionDenied } from "./firebase";

/** A published, read-only copy of a project at one moment. */
export interface SharedPlan {
  id: string;
  name: string;
  publishedAt: string;
  layout: Layout;
}

const shareSchema = z.object({
  name: z.string().min(1).max(80),
  publishedAt: z.iso.datetime(),
  room: roomSchema,
  furniture: z.array(placementSchema),
  materials: materialsSchema,
});

/**
 * Publishes the layout as a shared plan, or updates the one already published.
 * Returns the share id, which is also recorded on the project.
 */
export async function publishShare(input: {
  projectId: string;
  ownerId: string;
  name: string;
  layout: Layout;
  shareId: string | null;
}): Promise<string> {
  const { collection, doc, writeBatch } = await import("firebase/firestore");
  const db = await database();
  const share = input.shareId ? doc(db, "shares", input.shareId) : doc(collection(db, "shares"));
  const { room, furniture, materials } = input.layout;
  const batch = writeBatch(db);
  batch.set(share, {
    ownerId: input.ownerId,
    projectId: input.projectId,
    name: input.name,
    room,
    furniture,
    materials,
    publishedAt: new Date().toISOString(),
  });
  batch.update(doc(db, "projects", input.projectId), { shareId: share.id });
  await batch.commit();
  return share.id;
}

export async function revokeShare(projectId: string, shareId: string): Promise<void> {
  const { deleteField, doc, writeBatch } = await import("firebase/firestore");
  const db = await database();
  const batch = writeBatch(db);
  batch.delete(doc(db, "shares", shareId));
  batch.update(doc(db, "projects", projectId), { shareId: deleteField() });
  await batch.commit();
}

/** Null when the link is wrong or the owner stopped sharing. */
export async function getShare(id: string): Promise<SharedPlan | null> {
  const { doc, getDoc } = await import("firebase/firestore");
  try {
    const snapshot = await getDoc(doc(await database(), "shares", id));
    const parsed = shareSchema.safeParse(snapshot.data());
    if (!parsed.success) return null;
    const { name, publishedAt, room, furniture, materials } = parsed.data;
    return { id, name, publishedAt, layout: { room, furniture, materials } };
  } catch (error) {
    if (isPermissionDenied(error)) return null;
    throw error;
  }
}
