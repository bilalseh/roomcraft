import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useEditor } from "../state/useEditor";
import { BudgetMeter } from "./BudgetMeter";
import { CatalogPanel } from "./CatalogPanel";
import { FinishesPanel } from "./FinishesPanel";
import { RoomItemsPanel } from "./RoomItemsPanel";

type Tab = "catalog" | "room" | "finishes";

/** The catalog to add from, what is already in the room, and the room's finishes. */
export function Sidebar() {
  const count = useEditor((state) => state.history.present.furniture.length);
  const [tab, setTab] = useState<Tab>("catalog");
  const id = useId();
  const tabs: { value: Tab; label: string }[] = [
    { value: "catalog", label: "Catalog" },
    { value: "room", label: `In room (${count})` },
    { value: "finishes", label: "Finishes" },
  ];
  const buttons = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  // Arrow keys move between tabs, as in any tab list.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const step = event.key === "ArrowRight" ? 1 : tabs.length - 1;
    const index = tabs.findIndex((candidate) => candidate.value === tab);
    const next = tabs[(index + step) % tabs.length]?.value ?? tab;
    setTab(next);
    buttons.current[next]?.focus();
  };

  return (
    <div className="flex h-full flex-col">
      <BudgetMeter />
      <div
        role="tablist"
        aria-label="Sidebar"
        className="flex border-b border-stone-200"
        onKeyDown={onKeyDown}
      >
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            ref={(button) => {
              buttons.current[value] = button;
            }}
            type="button"
            role="tab"
            id={`${id}-${value}-tab`}
            aria-selected={tab === value}
            aria-controls={`${id}-${value}-panel`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => {
              setTab(value);
            }}
            className="flex-1 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-stone-600 hover:text-stone-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 aria-selected:border-teal-700 aria-selected:text-teal-900"
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-${tab}-panel`}
        aria-labelledby={`${id}-${tab}-tab`}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {tab === "catalog" && <CatalogPanel />}
        {tab === "room" && <RoomItemsPanel />}
        {tab === "finishes" && <FinishesPanel />}
      </div>
    </div>
  );
}
