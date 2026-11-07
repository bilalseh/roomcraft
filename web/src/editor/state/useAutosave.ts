import { useEffect } from "react";
import { saveLayout } from "../../data/projects";
import { saveThumbnail } from "../../data/thumbnails";
import type { EditorStore } from "./editorStore";

const SAVE_DELAY_MS = 800;
const RETRY_DELAY_MS = 5000;
/** Thumbnails are about 30 KB, so they are refreshed now and then, not on every save. */
const THUMBNAIL_EVERY_MS = 60_000;
const FIRST_THUMBNAIL_MS = 2500;

/**
 * Saves the layout to Firestore shortly after each change, retries after a
 * failure, refreshes the project's thumbnail now and then, and saves anything
 * pending when the editor closes.
 */
export function useAutosave(store: EditorStore) {
  useEffect(() => {
    const { project, ownerId } = store.getState();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;
    let lastThumbnail = 0;

    const refreshThumbnail = () => {
      const image = store.getState().captureThumbnail?.();
      if (!image || !ownerId) return;
      lastThumbnail = Date.now();
      saveThumbnail(project.id, ownerId, image).catch(() => {
        lastThumbnail = 0;
      });
    };

    const save = async () => {
      timer = undefined;
      pending = false;
      const { history, setSave } = store.getState();
      setSave({ state: "saving", savedAt: store.getState().save.savedAt });
      try {
        await saveLayout(project.id, history.present, new Date().toISOString());
        setSave({ state: "saved", savedAt: Date.now() });
        if (Date.now() - lastThumbnail > THUMBNAIL_EVERY_MS) refreshThumbnail();
      } catch {
        setSave({ state: "error", savedAt: store.getState().save.savedAt });
        schedule(RETRY_DELAY_MS);
      }
    };

    const schedule = (delay: number) => {
      pending = true;
      clearTimeout(timer);
      timer = setTimeout(() => void save(), delay);
    };

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.history.present === previous.history.present) return;
      // A change waiting to be written is not saved yet, so the indicator must not say it is.
      if (state.save.state === "saved") state.setSave({ ...state.save, state: "saving" });
      schedule(SAVE_DELAY_MS);
    });
    const firstThumbnail = setTimeout(refreshThumbnail, FIRST_THUMBNAIL_MS);

    return () => {
      unsubscribe();
      clearTimeout(firstThumbnail);
      clearTimeout(timer);
      if (pending) void save();
    };
  }, [store]);
}
