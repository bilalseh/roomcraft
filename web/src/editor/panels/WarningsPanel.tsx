import { useState } from "react";
import { usePreferences } from "../../app/preferences";
import { explainClearance, useClearanceIssues } from "../state/clearance";
import { useEditor } from "../state/useEditor";

/** Clearance warnings: a count that opens into a list; each warning selects its piece. */
export function WarningsPanel() {
  const issues = useClearanceIssues();
  const layout = useEditor((state) => state.history.present);
  const select = useEditor((state) => state.select);
  const units = usePreferences((state) => state.units);
  const [open, setOpen] = useState(false);
  if (issues.length === 0) return null;

  const count = `${issues.length} layout ${issues.length === 1 ? "warning" : "warnings"}`;
  return (
    <section aria-label="Layout warnings" className="pointer-events-auto max-w-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
        }}
        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-700"
      >
        {count}
      </button>
      {open && (
        <ul className="mt-2 space-y-1 rounded-lg border border-amber-200 bg-white/95 p-2 shadow-lg">
          {issues.map((issue) => (
            <li key={`${issue.code}-${issue.itemId}-${issue.openingId ?? ""}`}>
              <button
                type="button"
                onClick={() => {
                  select(issue.itemId);
                }}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm text-stone-700 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-700"
              >
                {explainClearance(issue, layout, units)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
