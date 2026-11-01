import { usePreferences } from "../../app/preferences";
import { catalogItem } from "../../domain/catalog";
import { formatUsd } from "../../domain/money";
import { formatDimensions } from "../../domain/units";
import { useEditor } from "../state/useEditor";

/** Details and actions for the selected piece. */
export function SelectionCard() {
  const placement = useEditor((state) =>
    state.history.present.furniture.find((candidate) => candidate.id === state.selectedId),
  );
  const rotate = useEditor((state) => state.rotateSelected);
  const duplicate = useEditor((state) => state.duplicateSelected);
  const remove = useEditor((state) => state.removeSelected);
  const units = usePreferences((state) => state.units);
  const item = placement && catalogItem(placement.itemId);
  if (!placement || !item) return null;

  const fixed = item.layer === "wall";
  const actions = [
    {
      label: "Rotate left",
      keys: "Shift+R",
      onClick: () => {
        rotate(-1);
      },
      disabled: fixed,
    },
    {
      label: "Rotate right",
      keys: "R",
      onClick: () => {
        rotate(1);
      },
      disabled: fixed,
    },
    { label: "Duplicate", keys: "Control+D", onClick: duplicate, disabled: false },
    { label: "Remove", keys: "Delete", onClick: remove, disabled: false },
  ];

  return (
    <section
      aria-label="Selected furniture"
      className="pointer-events-auto w-72 rounded-xl border border-stone-200 bg-white/95 p-4 shadow-lg backdrop-blur"
    >
      <h2 className="font-semibold">{item.name}</h2>
      <p className="text-sm text-stone-600">
        {formatDimensions(item.width, item.depth, units)} · {formatUsd(item.price.min)}–
        {formatUsd(item.price.max)}
        {fixed ? "" : ` · ${placement.rotation}°`}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            aria-keyshortcuts={action.keys}
            className="rounded-md border border-stone-300 px-2 py-1.5 text-sm hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-500">Drag to move it, or use the arrow keys.</p>
    </section>
  );
}
