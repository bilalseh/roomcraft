import type { jsPDF } from "jspdf";
import { budgetState, layoutCost, shoppingList } from "../../domain/budget";
import type { Layout } from "../../domain/layout";
import { formatPriceRange as priceRange, formatUsd } from "../../domain/money";
import { formatDimensions, type Units } from "../../domain/units";
import { CATEGORY_LABELS, ROOM_TYPE_LABELS, STYLE_LABELS } from "../../project/labels";
import { drawFloorPlan } from "./floorPlan";

export interface PlanPdfInput {
  name: string;
  layout: Layout;
  units: Units;
  /** A JPEG data URL of the 3D view, or null to leave it out. */
  snapshot: string | null;
  date: Date;
}

const PAGE = { width: 297, height: 210, margin: 14 };
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });
export const BUDGET_SENTENCES = {
  within: "Within budget, even at the highest prices.",
  depends: "Within budget at the lower prices; over at the highest.",
  over: "Over budget, even at the lowest prices.",
} as const;

/**
 * Two landscape A4 pages: the floor plan with measurements and a 3D snapshot,
 * then the shopping list against the budget. jsPDF is passed in so its 300 KB
 * load only when someone exports.
 */
export function buildPlanPdf(JsPdf: typeof jsPDF, input: PlanPdfInput): jsPDF {
  const { name, layout, units, snapshot, date } = input;
  const { room } = layout;
  const doc = new JsPdf({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setProperties({ title: `${name} · Roomcraft`, creator: "Roomcraft" });
  const { margin } = PAGE;
  const cost = layoutCost(layout.furniture);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#1c1917");
  doc.text(name, margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#57534e");
  doc.text(
    [
      ROOM_TYPE_LABELS[room.type].label,
      formatDimensions(room.width, room.depth, units),
      STYLE_LABELS[room.style].label,
      dateFormat.format(date),
    ].join("  ·  "),
    margin,
    25,
  );

  drawFloorPlan(doc, layout, units, { x: margin, y: 32, width: 176, height: 164 });

  const side = { x: 198, width: PAGE.width - margin - 198 };
  let y = 34;
  if (snapshot) {
    const height = side.width * (10 / 16);
    doc.addImage(snapshot, "JPEG", side.x, y, side.width, height);
    y += height + 10;
  }
  doc.setFontSize(11);
  doc.setTextColor("#1c1917");
  doc.setFont("helvetica", "bold");
  doc.text("Budget", side.x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    [
      `Furniture: ${priceRange(cost.min, cost.max)}`,
      `Budget: ${formatUsd(room.budget)}`,
      BUDGET_SENTENCES[budgetState(cost, room.budget)],
      "The shopping list is on the next page.",
    ],
    side.x,
    y + 7,
    { maxWidth: side.width, lineHeightFactor: 1.5 },
  );

  addShoppingList(doc, layout, room.budget);
  return doc;
}

function addShoppingList(doc: jsPDF, layout: Layout, budget: number) {
  const { margin } = PAGE;
  const right = PAGE.width - margin;
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor("#1c1917");
  doc.text("Shopping list", margin, 18);

  let y = 30;
  const row = (cells: [string, string, string, string], bold = false) => {
    if (y > PAGE.height - margin) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(cells[0], margin, y);
    doc.text(cells[1], 180, y, { align: "right" });
    doc.text(cells[2], 235, y, { align: "right" });
    doc.text(cells[3], right, y, { align: "right" });
    y += 6.5;
  };

  doc.setFontSize(9);
  doc.setTextColor("#57534e");
  row(["Item", "Quantity", "Price each", "Total"], true);
  doc.setTextColor("#1c1917");
  for (const group of shoppingList(layout.furniture)) {
    y += 2;
    row(
      [CATEGORY_LABELS[group.category], "", "", priceRange(group.total.min, group.total.max)],
      true,
    );
    for (const line of group.lines) {
      row([
        line.name,
        String(line.quantity),
        priceRange(line.unit.min, line.unit.max),
        priceRange(line.total.min, line.total.max),
      ]);
    }
  }
  const cost = layoutCost(layout.furniture);
  y += 4;
  row(["Total", "", "", priceRange(cost.min, cost.max)], true);
  row(["Budget", "", "", formatUsd(budget)]);
  doc.setTextColor("#57534e");
  row([BUDGET_SENTENCES[budgetState(cost, budget)], "", "", ""]);
}
