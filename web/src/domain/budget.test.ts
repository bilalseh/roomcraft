import type { Placement } from "@roomcraft/shared";
import { describe, expect, it } from "vitest";
import { budgetState, layoutCost, shoppingList, shoppingListCsv } from "./budget";

const placed = (id: string, itemId: string): Placement => ({ id, itemId, x: 1, z: 1, rotation: 0 });

const furniture = [
  placed("a", "dining-chair"),
  placed("b", "dining-chair"),
  placed("c", "dining-table"),
  placed("d", "sofa-three-seat"),
];

describe("layoutCost", () => {
  it("adds up the lowest and highest prices", () => {
    // Chairs 59–149 each, table 299–799, sofa 699–1299.
    expect(layoutCost(furniture)).toEqual({ min: 1116, max: 2396 });
  });

  it("ignores pieces that are no longer in the catalog", () => {
    expect(layoutCost([placed("x", "throne")])).toEqual({ min: 0, max: 0 });
  });
});

describe("budgetState", () => {
  it.each([
    [{ min: 800, max: 1000 }, "within"],
    [{ min: 800, max: 1200 }, "depends"],
    [{ min: 1100, max: 1200 }, "over"],
  ] as const)("is %j against a $1,000 budget: %s", (cost, state) => {
    expect(budgetState(cost, 1000)).toBe(state);
  });
});

describe("shoppingList", () => {
  it("groups by category in catalog order, one line per item with its quantity", () => {
    expect(shoppingList(furniture)).toEqual([
      {
        category: "seating",
        lines: [
          {
            itemId: "dining-chair",
            name: "Dining chair",
            quantity: 2,
            unit: { min: 59, max: 149 },
            total: { min: 118, max: 298 },
          },
          {
            itemId: "sofa-three-seat",
            name: "Three-seat sofa",
            quantity: 1,
            unit: { min: 699, max: 1299 },
            total: { min: 699, max: 1299 },
          },
        ],
        total: { min: 817, max: 1597 },
      },
      {
        category: "tables",
        lines: [
          {
            itemId: "dining-table",
            name: "Dining table for four",
            quantity: 1,
            unit: { min: 299, max: 799 },
            total: { min: 299, max: 799 },
          },
        ],
        total: { min: 299, max: 799 },
      },
    ]);
  });
});

describe("shoppingListCsv", () => {
  it("writes a header, one row per line and a total, quoting where needed", () => {
    const csv = shoppingListCsv(shoppingList(furniture), (category) =>
      category === "tables" ? 'Tables, "dining"' : "Seating",
    );

    expect(csv.split("\r\n")).toEqual([
      "Category,Item,Quantity,Unit price low,Unit price high,Total low,Total high",
      "Seating,Dining chair,2,59,149,118,298",
      "Seating,Three-seat sofa,1,699,1299,699,1299",
      '"Tables, ""dining""",Dining table for four,1,299,799,299,799',
      "Total,,,,,1116,2396",
      "",
    ]);
  });
});
