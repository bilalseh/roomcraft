import type { Operation, RejectedOperation } from "@roomcraft/shared";
import { catalogItem } from "../../domain/catalog";
import type { Layout } from "../../domain/layout";

/** Names for placed pieces, including ones the same suggestion adds. */
export function pieceNames(layout: Layout, operations: Operation[]): Map<string, string> {
  const names = new Map<string, string>();
  for (const placement of layout.furniture) {
    names.set(placement.id, catalogItem(placement.itemId)?.name.toLowerCase() ?? "piece");
  }
  for (const operation of operations) {
    if (operation.op === "add") {
      names.set(
        operation.placementId,
        catalogItem(operation.itemId)?.name.toLowerCase() ?? "piece",
      );
    }
  }
  return names;
}

/** "Add a coffee table", "Move the sofa", "Repaint the walls". */
export function describeOperation(operation: Operation, names: Map<string, string>): string {
  switch (operation.op) {
    case "add":
      return `Add ${withArticle(catalogItem(operation.itemId)?.name.toLowerCase() ?? "a piece")}`;
    case "move":
      return `Move the ${names.get(operation.placementId) ?? "piece"}`;
    case "rotate":
      return `Turn the ${names.get(operation.placementId) ?? "piece"}`;
    case "remove":
      return `Remove the ${names.get(operation.placementId) ?? "piece"}`;
    case "material": {
      const parts = [
        operation.floor
          ? `lay a ${operation.floor} floor`
          : operation.floorColor
            ? "recolour the floor"
            : null,
        operation.wallColor ? "repaint the walls" : null,
      ].filter((part) => part !== null);
      const text = parts.join(" and ") || "change the finishes";
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
  }
}

/** Why the server left a proposed change out. */
export function explainRejection(rejected: RejectedOperation, names: Map<string, string>): string {
  switch (rejected.code) {
    case "invalid_operation":
      return "The suggestion was incomplete.";
    case "unknown_item":
      return "That piece is not in the catalog.";
    case "unknown_placement":
      return "That piece is not in the room.";
    case "outside_room":
      return "It would not fit inside the room.";
    case "overlaps":
      return `It would overlap the ${(rejected.otherId && names.get(rejected.otherId)) ?? "furniture"}.`;
    case "blocks_door":
      return "It would stop a door from opening.";
    case "over_budget":
      return "It would go over the budget.";
    case "fixed_rotation":
      return "Wall pieces always face into the room.";
  }
}

function withArticle(name: string): string {
  return /^[aeiou]/.test(name) ? `an ${name}` : `a ${name}`;
}
