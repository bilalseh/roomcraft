import { useEffect } from "react";
import { GRID } from "../../domain/snap";
import type { EditorStore } from "./editorStore";

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/**
 * Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo, Ctrl/Cmd+D duplicate,
 * R and Shift+R rotate, arrows move (Shift for 50 cm), Delete removes, Escape deselects.
 */
export function useEditorShortcuts(store: EditorStore) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const state = store.getState();
      const key = event.key.toLowerCase();
      const command = event.ctrlKey || event.metaKey;

      if (command && key === "z") {
        if (event.shiftKey) state.redo();
        else state.undo();
      } else if (command && key === "y") {
        state.redo();
      } else if (command && key === "d" && state.selectedId) {
        state.duplicateSelected();
      } else if (!command && state.selectedId) {
        const arrow = ARROWS[event.key];
        const step = event.shiftKey ? GRID * 5 : GRID;
        if (arrow) state.nudgeSelected(arrow[0] * step, arrow[1] * step);
        else if (key === "r") state.rotateSelected(event.shiftKey ? -1 : 1);
        else if (key === "delete" || key === "backspace") state.removeSelected();
        else if (key === "escape") state.select(null);
        else return;
      } else {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [store]);
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}
