import type { Layout } from "../domain/layout";
import { projectSchema, type Project } from "../domain/project";
import { database, isPermissionDenied } from "./firebase";

/** A project as stored: the project plus where its shared copy lives, if published. */
export interface StoredProject {
  project: Project;
  shareId: string | null;
}

/** Firestore fields the domain model does not carry. */
function fromDocument(id: string, data: Record<string, unknown>): StoredProject | null {
  const { ownerId: _ownerId, shareId, ...fields } = data;
  const parsed = projectSchema.safeParse({ id, ...fields });
  if (!parsed.success) return null;
  return { project: parsed.data, shareId: typeof shareId === "string" ? shareId : null };
}

export async function listProjects(ownerId: string): Promise<StoredProject[]> {
  const { collection, getDocs, query, where } = await import("firebase/firestore");
  const snapshot = await getDocs(
    query(collection(await database(), "projects"), where("ownerId", "==", ownerId)),
  );
  return snapshot.docs
    .flatMap((document) => fromDocument(document.id, document.data()) ?? [])
    .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
}

/** Null when the project does not exist, belongs to someone else, or is unreadable. */
export async function getProject(id: string): Promise<StoredProject | null> {
  const { doc, getDoc } = await import("firebase/firestore");
  try {
    const snapshot = await getDoc(doc(await database(), "projects", id));
    const data = snapshot.data();
    return data ? fromDocument(snapshot.id, data) : null;
  } catch (error) {
    if (isPermissionDenied(error)) return null;
    throw error;
  }
}

export async function createProject(project: Project, ownerId: string): Promise<void> {
  const { doc, setDoc } = await import("firebase/firestore");
  const { id, ...fields } = project;
  await setDoc(doc(await database(), "projects", id), { ...fields, ownerId });
}

export async function saveLayout(id: string, layout: Layout, updatedAt: string): Promise<void> {
  const { doc, updateDoc } = await import("firebase/firestore");
  const { room, furniture, materials } = layout;
  await updateDoc(doc(await database(), "projects", id), { room, furniture, materials, updatedAt });
}

/** Deletes a project with its versions, thumbnails and shared copy. */
export async function deleteProject(stored: StoredProject): Promise<void> {
  const { collection, doc, getDocs, writeBatch } = await import("firebase/firestore");
  const db = await database();
  const { id } = stored.project;
  const versions = await getDocs(collection(db, "projects", id, "versions"));
  const batch = writeBatch(db);
  for (const version of versions.docs) {
    batch.delete(version.ref);
    batch.delete(doc(db, "thumbnails", versionThumbnailId(id, version.id)));
  }
  batch.delete(doc(db, "thumbnails", id));
  if (stored.shareId) batch.delete(doc(db, "shares", stored.shareId));
  batch.delete(doc(db, "projects", id));
  await batch.commit();
}

export function versionThumbnailId(projectId: string, versionId: string): string {
  return `${projectId}--${versionId}`;
}
