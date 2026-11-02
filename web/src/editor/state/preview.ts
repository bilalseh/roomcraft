import type { Placement } from "@roomcraft/shared";
import type { StateCreator } from "zustand";
import type { Layout } from "../../domain/layout";
import { diffLayouts } from "../../domain/operations";
import type { EditorState } from "./editorStore";

/** A proposed layout shown in place of the real one until it is accepted or discarded. */
export interface Preview {
  layout: Layout;
  added: ReadonlySet<string>;
  changed: ReadonlySet<string>;
  removed: Placement[];
}

export interface PreviewSlice {
  preview: Preview | null;
  showPreview: (layout: Layout) => void;
  /** Applies the previewed layout as one step that can be undone. */
  acceptPreview: () => void;
  discardPreview: () => void;
}

export const previewSlice: StateCreator<EditorState, [], [], PreviewSlice> = (set, get) => ({
  preview: null,

  showPreview: (layout) => {
    const { added, changed, removed } = diffLayouts(get().history.present, layout);
    set({
      preview: { layout, added: new Set(added), changed: new Set(changed), removed },
      selectedId: null,
      drag: null,
    });
  },

  acceptPreview: () => {
    const { preview, restore } = get();
    if (!preview) return;
    restore(preview.layout);
    set({ preview: null });
  },

  discardPreview: () => {
    set({ preview: null });
  },
});
