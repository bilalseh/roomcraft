import type { ReactNode } from "react";
import { EditorContext } from "./context";
import type { EditorStore } from "./editorStore";

export function EditorProvider({ store, children }: { store: EditorStore; children: ReactNode }) {
  return <EditorContext.Provider value={store}>{children}</EditorContext.Provider>;
}
