import { useContext } from "react";
import { useStore } from "zustand";
import { EditorContext } from "./context";
import type { EditorState, EditorStore } from "./editorStore";

export function useEditorStore(): EditorStore {
  const store = useContext(EditorContext);
  if (!store) throw new Error("useEditorStore must be used inside an EditorProvider");
  return store;
}

/** Subscribes to one slice of editor state; components re-render only when it changes. */
export function useEditor<T>(selector: (state: EditorState) => T): T {
  return useStore(useEditorStore(), selector);
}
