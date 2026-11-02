import { database, isPermissionDenied } from "./firebase";

// Small WebP images live in their own documents, apart from the room data, so
// opening a project never downloads them. Firebase Storage needs a paid plan.

export async function saveThumbnail(id: string, ownerId: string, image: string): Promise<void> {
  const { doc, setDoc } = await import("firebase/firestore");
  await setDoc(doc(await database(), "thumbnails", id), {
    ownerId,
    image,
    updatedAt: new Date().toISOString(),
  });
}

export async function getThumbnail(id: string): Promise<string | null> {
  const { doc, getDoc } = await import("firebase/firestore");
  try {
    const snapshot = await getDoc(doc(await database(), "thumbnails", id));
    const image: unknown = snapshot.data()?.image;
    return typeof image === "string" ? image : null;
  } catch (error) {
    if (isPermissionDenied(error)) return null;
    throw error;
  }
}
