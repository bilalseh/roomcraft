import { useEffect } from "react";
import { saveProject } from "../../project/localProjects";
import type { EditorStore } from "./editorStore";

const DELAY_MS = 400;

/** Saves the project shortly after each change, and right away when the editor closes. */
export function useAutosave(store: EditorStore, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const save = () => {
      clearTimeout(timer);
      timer = undefined;
      const { project, history } = store.getState();
      saveProject({ ...project, ...history.present, updatedAt: new Date().toISOString() });
    };

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.history.present === previous.history.present) return;
      clearTimeout(timer);
      timer = setTimeout(save, DELAY_MS);
    });

    return () => {
      unsubscribe();
      if (timer !== undefined) save();
    };
  }, [store, enabled]);
}
