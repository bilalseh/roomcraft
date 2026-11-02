import { useState } from "react";
import { usePreferences } from "../../app/preferences";
import { Dialog } from "../../components/Dialog";
import { layoutCost, shoppingList, shoppingListCsv } from "../../domain/budget";
import { formatPriceRange as priceRange } from "../../domain/money";
import { download, slug } from "../../lib/download";
import { CATEGORY_LABELS } from "../../project/labels";
import { buildPlanPdf } from "../export/planPdf";
import { useEditor, useEditorStore } from "../state/useEditor";

/** Everything in the room, grouped by category, with CSV and PDF downloads. */
export function ShoppingListDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog title="Shopping list" open={open} onClose={onClose}>
      <ShoppingList />
    </Dialog>
  );
}

function ShoppingList() {
  const store = useEditorStore();
  const furniture = useEditor((state) => state.history.present.furniture);
  const name = useEditor((state) => state.project.name);
  const units = usePreferences((state) => state.units);
  const [exporting, setExporting] = useState(false);
  const groups = shoppingList(furniture);
  const total = layoutCost(furniture);

  const downloadCsv = () => {
    const csv = shoppingListCsv(groups, (category) => CATEGORY_LABELS[category]);
    download(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${slug(name)}-shopping-list.csv`,
    );
  };

  const downloadPdf = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { history, captureThumbnail } = store.getState();
      const snapshot =
        captureThumbnail?.({ width: 1280, height: 800, type: "image/jpeg", quality: 0.9 }) ?? null;
      const doc = buildPlanPdf(jsPDF, {
        name,
        layout: history.present,
        units,
        snapshot,
        date: new Date(),
      });
      download(doc.output("blob"), `${slug(name)}-plan.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (groups.length === 0) {
    return <p className="text-sm text-stone-600">Add furniture to build a shopping list.</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full">
          <caption className="sr-only">Furniture to buy, with price ranges</caption>
          <thead>
            <tr className="text-left text-xs text-stone-500">
              <th scope="col" className="py-1 font-medium">
                Item
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                Qty
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                Total
              </th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.category}>
              <tr>
                <th scope="rowgroup" colSpan={3} className="pt-3 pb-1 text-left font-semibold">
                  {CATEGORY_LABELS[group.category]}
                </th>
              </tr>
              {group.lines.map((line) => (
                <tr key={line.itemId} className="border-t border-stone-100">
                  <td className="py-1">{line.name}</td>
                  <td className="py-1 text-right tabular-nums">{line.quantity}</td>
                  <td className="py-1 text-right tabular-nums">
                    {priceRange(line.total.min, line.total.max)}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
          <tfoot>
            <tr className="border-t-2 border-stone-300 font-semibold">
              <td className="pt-2">Total</td>
              <td />
              <td className="pt-2 text-right tabular-nums">{priceRange(total.min, total.max)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn h-10 btn-secondary" onClick={downloadCsv}>
          Download CSV
        </button>
        <button
          type="button"
          className="btn h-10 btn-primary"
          disabled={exporting}
          onClick={() => void downloadPdf()}
        >
          {exporting ? "Preparing PDF…" : "Download PDF plan"}
        </button>
      </div>
    </div>
  );
}
