import { catalogItem } from "../../domain/catalog";
import { useEditor } from "../state/useEditor";

/** Every piece in the room as a button, so furniture can be selected without a pointer. */
export function RoomItemsPanel() {
  const furniture = useEditor((state) => state.history.present.furniture);
  const selectedId = useEditor((state) => state.selectedId);
  const select = useEditor((state) => state.select);

  if (furniture.length === 0) {
    return (
      <p className="p-4 text-sm text-stone-500">
        The room is empty. Add furniture from the catalog to start.
      </p>
    );
  }

  return (
    <ul className="space-y-1 p-4">
      {furniture.map((placement) => (
        <li key={placement.id}>
          <button
            type="button"
            aria-pressed={placement.id === selectedId}
            onClick={() => {
              select(placement.id === selectedId ? null : placement.id);
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700 aria-pressed:bg-teal-50 aria-pressed:font-medium aria-pressed:text-teal-900"
          >
            {catalogItem(placement.itemId)?.name ?? "Unknown piece"}
          </button>
        </li>
      ))}
    </ul>
  );
}
