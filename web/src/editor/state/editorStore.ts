import { createStore } from "zustand/vanilla";
import { catalogItem } from "../../domain/catalog";
import { record, redo, startHistory, undo, type History } from "../../domain/history";
import {
  addItem,
  duplicateItem,
  placementProblem,
  removeItem,
  rotateItem,
  updateItem,
  type Layout,
  type LayoutProblem,
  type LayoutResult,
} from "../../domain/layout";
import type { Project } from "../../domain/project";
import { round, snapToFloor, snapToWall } from "../../domain/snap";

/** An item being dragged: where it would land, and why it cannot, if it cannot. */
export interface Drag {
  id: string;
  x: number;
  z: number;
  rotation: number;
  problem: LayoutProblem | null;
}

export interface Notice {
  key: number;
  text: string;
}

export interface EditorState {
  project: Project;
  history: History<Layout>;
  selectedId: string | null;
  drag: Drag | null;
  notice: Notice | null;

  add: (itemId: string) => void;
  select: (id: string | null) => void;
  /** Drags the selected item towards a point in room coordinates, snapping as it goes. */
  dragTo: (id: string, x: number, z: number) => void;
  endDrag: () => void;
  nudgeSelected: (dx: number, dz: number) => void;
  rotateSelected: (steps: number) => void;
  duplicateSelected: () => void;
  removeSelected: () => void;
  undo: () => void;
  redo: () => void;
  dismissNotice: () => void;
}

export function createEditorStore(
  project: Project,
  newId: () => string = () => crypto.randomUUID(),
) {
  return createStore<EditorState>()((set, get) => {
    const layout = () => get().history.present;
    let noticeKey = 0;

    /** Records a successful change, or explains why it was refused. */
    const apply = (result: LayoutResult, selectedId = get().selectedId) => {
      if (result.ok) {
        set({ history: record(get().history, result.layout), selectedId, drag: null });
      } else {
        set({
          drag: null,
          notice: { key: ++noticeKey, text: explainProblem(result.problem, layout()) },
        });
      }
    };

    return {
      project,
      history: startHistory<Layout>({ room: project.room, furniture: project.furniture }),
      selectedId: null,
      drag: null,
      notice: null,

      add: (itemId) => {
        const item = catalogItem(itemId);
        if (!item) return;
        const id = newId();
        apply(addItem(layout(), item, id), id);
      },

      select: (id) => {
        set({ selectedId: id });
      },

      dragTo: (id, x, z) => {
        const placement = layout().furniture.find((candidate) => candidate.id === id);
        const item = placement && catalogItem(placement.itemId);
        if (!placement || !item) return;
        const room = layout().room;
        const target =
          item.layer === "wall"
            ? snapToWall(room, item, { x, z })
            : {
                ...snapToFloor(room, item, placement.rotation, { x, z }),
                rotation: placement.rotation,
              };
        set({
          selectedId: id,
          drag: { id, ...target, problem: placementProblem(layout(), { ...placement, ...target }) },
        });
      },

      endDrag: () => {
        const { drag } = get();
        if (!drag) return;
        if (drag.problem) {
          set({
            drag: null,
            notice: { key: ++noticeKey, text: explainProblem(drag.problem, layout()) },
          });
          return;
        }
        const { x, z, rotation } = drag;
        apply(updateItem(layout(), drag.id, { x, z, rotation }));
      },

      nudgeSelected: (dx, dz) => {
        const placement = layout().furniture.find((candidate) => candidate.id === get().selectedId);
        const item = placement && catalogItem(placement.itemId);
        if (!placement || !item) return;
        const moved = { x: placement.x + dx, z: placement.z + dz };
        const target =
          item.layer === "wall"
            ? snapToWall(layout().room, item, moved)
            : { x: round(moved.x), z: round(moved.z) };
        apply(updateItem(layout(), placement.id, target));
      },

      rotateSelected: (steps) => {
        const id = get().selectedId;
        if (id) apply(rotateItem(layout(), id, steps));
      },

      duplicateSelected: () => {
        const id = get().selectedId;
        if (!id) return;
        const copyId = newId();
        apply(duplicateItem(layout(), id, copyId), copyId);
      },

      removeSelected: () => {
        const id = get().selectedId;
        if (id) apply({ ok: true, layout: removeItem(layout(), id) }, null);
      },

      undo: () => {
        set({ history: undo(get().history), drag: null });
        keepSelectionValid();
      },

      redo: () => {
        set({ history: redo(get().history), drag: null });
        keepSelectionValid();
      },

      dismissNotice: () => {
        set({ notice: null });
      },
    };

    function keepSelectionValid() {
      const { selectedId } = get();
      if (selectedId && !layout().furniture.some((placement) => placement.id === selectedId)) {
        set({ selectedId: null });
      }
    }
  });
}

export type EditorStore = ReturnType<typeof createEditorStore>;

/** A sentence for the person, naming the furniture involved where there is one. */
export function explainProblem(problem: LayoutProblem, layout: Layout): string {
  switch (problem.code) {
    case "outside_room":
      return "That spot is outside the room.";
    case "overlaps": {
      const other = layout.furniture.find((placement) => placement.id === problem.otherId);
      const name = other ? catalogItem(other.itemId)?.name.toLowerCase() : undefined;
      return name ? `It would overlap the ${name}.` : "It would overlap another piece.";
    }
    case "no_space":
      return "There is no free space left for it.";
    case "fixed_rotation":
      return "Wall pieces always face into the room.";
    case "unknown_item":
      return "That piece is no longer in the catalog.";
  }
}
