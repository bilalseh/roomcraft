import type { Category } from "@roomcraft/shared";
import { useId, useState } from "react";
import { usePreferences } from "../../app/preferences";
import { CATALOG, CATEGORIES } from "../../domain/catalog";
import { formatUsd } from "../../domain/money";
import { formatDimensions } from "../../domain/units";
import { CATEGORY_LABELS } from "../../project/labels";
import { useEditor } from "../state/useEditor";

export function CatalogPanel() {
  const add = useEditor((state) => state.add);
  const roomType = useEditor((state) => state.history.present.room.type);
  const units = usePreferences((state) => state.units);
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const searchId = useId();

  const needle = query.trim().toLowerCase();
  const items = CATALOG.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      (needle === "" || item.name.toLowerCase().includes(needle)),
  ).toSorted((a, b) => Number(b.rooms.includes(roomType)) - Number(a.rooms.includes(roomType)));

  return (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor={searchId} className="sr-only">
          Search furniture
        </label>
        <input
          id={searchId}
          type="search"
          placeholder="Search furniture"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-teal-700"
        />
      </div>
      <div role="group" aria-label="Category" className="flex flex-wrap gap-1.5">
        {(["all", ...CATEGORIES] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => {
              setCategory(value);
            }}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700 aria-pressed:border-teal-700 aria-pressed:bg-teal-700 aria-pressed:text-white"
          >
            {value === "all" ? "All" : CATEGORY_LABELS[value]}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-stone-500">
                {formatDimensions(item.width, item.depth, units)} · {formatUsd(item.price.min)}–
                {formatUsd(item.price.max)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                add(item.id);
              }}
              aria-label={`Add ${item.name.toLowerCase()}`}
              className="shrink-0 rounded-md border border-stone-300 px-2.5 py-1 text-sm font-medium hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="text-sm text-stone-500">No furniture matches.</p>}
    </div>
  );
}
