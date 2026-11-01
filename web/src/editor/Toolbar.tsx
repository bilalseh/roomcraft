import { usePreferences } from "../app/preferences";
import { UnitsToggle } from "../components/UnitsToggle";
import { formatUsd } from "../domain/money";
import { formatDimensions } from "../domain/units";
import { ROOM_TYPE_LABELS, STYLE_LABELS } from "../project/labels";
import { useEditor } from "./state/useEditor";

export function Toolbar({ isDemo }: { isDemo: boolean }) {
  const name = useEditor((state) => state.project.name);
  const room = useEditor((state) => state.history.present.room);
  const canUndo = useEditor((state) => state.history.past.length > 0);
  const canRedo = useEditor((state) => state.history.future.length > 0);
  const undo = useEditor((state) => state.undo);
  const redo = useEditor((state) => state.redo);
  const units = usePreferences((state) => state.units);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold">
          {name}
          {isDemo && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-900">
              Demo: changes are not saved
            </span>
          )}
        </h1>
        <p className="text-sm text-stone-600">
          {ROOM_TYPE_LABELS[room.type].label} · {formatDimensions(room.width, room.depth, units)} ·{" "}
          {STYLE_LABELS[room.style].label} · Budget {formatUsd(room.budget)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            aria-keyshortcuts="Control+Z"
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            aria-keyshortcuts="Control+Shift+Z"
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Redo
          </button>
        </div>
        <UnitsToggle />
      </div>
    </div>
  );
}
