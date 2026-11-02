import type { Category, Placement } from "@roomcraft/shared";
import { CATEGORIES, catalogItem } from "./catalog";

export interface PriceRange {
  min: number;
  max: number;
}

/** What the furniture costs in total, from every piece's lowest to its highest price. */
export function layoutCost(furniture: readonly Placement[]): PriceRange {
  return furniture.reduce<PriceRange>(
    (total, placement) => {
      const item = catalogItem(placement.itemId);
      return item ? { min: total.min + item.price.min, max: total.max + item.price.max } : total;
    },
    { min: 0, max: 0 },
  );
}

/** Within budget even at the highest prices, only at the lower ones, or over at any price. */
export type BudgetState = "within" | "depends" | "over";

export function budgetState(cost: PriceRange, budget: number): BudgetState {
  if (cost.max <= budget) return "within";
  return cost.min <= budget ? "depends" : "over";
}

export interface ShoppingLine {
  itemId: string;
  name: string;
  quantity: number;
  unit: PriceRange;
  total: PriceRange;
}

export interface ShoppingGroup {
  category: Category;
  lines: ShoppingLine[];
  total: PriceRange;
}

/** The furniture as a shopping list: one line per catalog item, grouped by category. */
export function shoppingList(furniture: readonly Placement[]): ShoppingGroup[] {
  const counts = new Map<string, number>();
  for (const placement of furniture) {
    counts.set(placement.itemId, (counts.get(placement.itemId) ?? 0) + 1);
  }
  return CATEGORIES.flatMap((category) => {
    const lines = [...counts].flatMap(([itemId, quantity]) => {
      const item = catalogItem(itemId);
      if (item?.category !== category) return [];
      const unit = { min: item.price.min, max: item.price.max };
      return [{ itemId, name: item.name, quantity, unit, total: times(unit, quantity) }];
    });
    if (lines.length === 0) return [];
    lines.sort((a, b) => a.name.localeCompare(b.name));
    const total = lines.reduce((sum, line) => plus(sum, line.total), { min: 0, max: 0 });
    return [{ category, lines, total }];
  });
}

const times = (range: PriceRange, quantity: number): PriceRange => ({
  min: range.min * quantity,
  max: range.max * quantity,
});

const plus = (a: PriceRange, b: PriceRange): PriceRange => ({
  min: a.min + b.min,
  max: a.max + b.max,
});

/** The shopping list as CSV (RFC 4180), with whole-dollar prices and a total row. */
export function shoppingListCsv(
  groups: ShoppingGroup[],
  categoryLabel: (c: Category) => string,
): string {
  const rows: (string | number)[][] = [
    [
      "Category",
      "Item",
      "Quantity",
      "Unit price low",
      "Unit price high",
      "Total low",
      "Total high",
    ],
  ];
  for (const group of groups) {
    for (const line of group.lines) {
      rows.push([
        categoryLabel(group.category),
        line.name,
        line.quantity,
        line.unit.min,
        line.unit.max,
        line.total.min,
        line.total.max,
      ]);
    }
  }
  const total = groups.reduce((sum, group) => plus(sum, group.total), { min: 0, max: 0 });
  rows.push(["Total", "", "", "", "", total.min, total.max]);
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n";
}

function csvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
