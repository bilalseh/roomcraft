import { catalogItem } from "../../domain/catalog";
import type { Layout, LayoutProblem } from "../../domain/layout";

/** A sentence for the person, naming the furniture involved where there is one. */
export function explainProblem(problem: LayoutProblem, layout: Layout): string {
  switch (problem.code) {
    case "outside_room":
      return "That spot is outside the room.";
    case "overlaps": {
      const other = layout.furniture.find((placement) => placement.id === problem.otherId);
      const name = other ? catalogItem(other.itemId)?.name.toLowerCase() : undefined;
      return name ? `It would overlap the ${name}.` : "It would overlap another piece.";
    }
    case "no_space":
      return "There is no free space left for it.";
    case "fixed_rotation":
      return "Wall pieces always face into the room.";
    case "unknown_item":
      return "That piece is no longer in the catalog.";
  }
}
