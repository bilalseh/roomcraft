import { useState } from "react";
import { budgetState, layoutCost, type BudgetState } from "../../domain/budget";
import { formatPriceRange as priceRange, formatUsd } from "../../domain/money";
import { useEditor } from "../state/useEditor";
import { ShoppingListDialog } from "./ShoppingListDialog";

const COLORS: Record<BudgetState, { bar: string; text: string; label: string }> = {
  within: { bar: "bg-emerald-600", text: "text-emerald-800", label: "Within budget" },
  depends: { bar: "bg-amber-500", text: "text-amber-800", label: "Depends on the prices you pay" },
  over: { bar: "bg-red-600", text: "text-red-800", label: "Over budget" },
};

/**
 * The furniture's price range against the budget: the solid bar runs to the
 * lowest total, the lighter band on to the highest.
 */
export function BudgetMeter() {
  const furniture = useEditor((state) => state.history.present.furniture);
  const budget = useEditor((state) => state.history.present.room.budget);
  const [listOpen, setListOpen] = useState(false);
  const cost = layoutCost(furniture);
  const state = budgetState(cost, budget);
  const scale = Math.max(budget, cost.max);
  const percent = (value: number) => `${(value / scale) * 100}%`;
  const color = COLORS[state];

  return (
    <div className="space-y-2 border-b border-stone-200 p-4">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{priceRange(cost.min, cost.max)}</span>
        <span className="text-stone-500">of {formatUsd(budget)}</span>
      </div>
      <div
        role="meter"
        aria-label="Furniture cost against the budget"
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={Math.min(cost.min, budget)}
        aria-valuetext={`${priceRange(cost.min, cost.max)} of a ${formatUsd(budget)} budget. ${color.label}.`}
        className="relative h-2 overflow-hidden rounded-full bg-stone-200"
      >
        <div
          className={`absolute inset-y-0 left-0 opacity-40 ${color.bar}`}
          style={{ width: percent(cost.max) }}
        />
        <div
          className={`absolute inset-y-0 left-0 ${color.bar}`}
          style={{ width: percent(cost.min) }}
        />
        {cost.max > budget && (
          <div
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 bg-stone-900"
            style={{ left: percent(budget) }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={color.text}>{color.label}</span>
        <button
          type="button"
          onClick={() => {
            setListOpen(true);
          }}
          className="font-medium text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          Shopping list
        </button>
      </div>
      <ShoppingListDialog
        open={listOpen}
        onClose={() => {
          setListOpen(false);
        }}
      />
    </div>
  );
}
