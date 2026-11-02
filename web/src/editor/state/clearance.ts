import { catalogItem } from "../../domain/catalog";
import { clearanceIssues, WALKWAY, type ClearanceIssue } from "../../domain/clearance";
import type { Layout } from "../../domain/layout";
import { footprint } from "../../domain/placement";
import { formatLength, type Units } from "../../domain/units";
import { useEditor } from "./useEditor";

// Each layout is an immutable snapshot, so its warnings are worked out once.
const cache = new WeakMap<Layout, ClearanceIssue[]>();

export function layoutClearance(layout: Layout): ClearanceIssue[] {
  let issues = cache.get(layout);
  if (!issues) {
    const items = layout.furniture.flatMap((placement) => {
      const item = catalogItem(placement.itemId);
      return item ? [{ ...footprint(placement, item), category: item.category }] : [];
    });
    issues = clearanceIssues(layout.room, items);
    cache.set(layout, issues);
  }
  return issues;
}

/** Clearance warnings for the current layout; recomputed only when the layout changes. */
export function useClearanceIssues(): ClearanceIssue[] {
  return layoutClearance(useEditor((state) => state.preview?.layout ?? state.history.present));
}

export function explainClearance(issue: ClearanceIssue, layout: Layout, units: Units): string {
  const placement = layout.furniture.find((candidate) => candidate.id === issue.itemId);
  const name = (placement && catalogItem(placement.itemId)?.name) ?? "A piece";
  switch (issue.code) {
    case "door_swing_blocked":
      return `The ${name.toLowerCase()} stops a door from opening fully.`;
    case "hard_to_reach":
      return `The ${name.toLowerCase()} can only be reached through a gap narrower than ${formatLength(WALKWAY, units)}.`;
  }
}
