import type { CatalogItem, Operation, OperationProblemCode, Placement } from "@roomcraft/shared";
import { layoutCost } from "./budget";
import { catalogItem } from "./catalog";
import { doorSwing } from "./clearance";
import { setMaterials, type Layout } from "./layout";
import { collide, corners, footprint, insideRoom, polygonsOverlap } from "./placement";
import { normalizeRotation, round, snapToWall } from "./snap";

export interface OperationProblem {
  code: OperationProblemCode;
  otherId?: string;
  openingId?: string;
}

export interface AppliedOperations {
  layout: Layout;
  /** The operations as applied, after snapping. */
  accepted: Operation[];
  rejected: { index: number; problem: OperationProblem }[];
}

type Outcome = { layout: Layout; operation: Operation } | OperationProblem;

/**
 * Applies the assistant's operations in order; each sees the layout left by the
 * ones before it. Mirrored in api/src/roomcraft_api/domain/operations.py; both
 * run shared/fixtures/operations.json.
 */
export function applyOperations(layout: Layout, operations: Operation[]): AppliedOperations {
  const result: AppliedOperations = { layout, accepted: [], rejected: [] };
  operations.forEach((operation, index) => {
    const outcome = applyOne(result.layout, operation);
    if ("code" in outcome) {
      result.rejected.push({ index, problem: outcome });
    } else {
      result.layout = outcome.layout;
      result.accepted.push(outcome.operation);
    }
  });
  return result;
}

function applyOne(layout: Layout, operation: Operation): Outcome {
  const find = (id: string) => layout.furniture.find((placement) => placement.id === id);
  switch (operation.op) {
    case "material": {
      const { floor, floorColor, wallColor } = operation;
      return {
        layout: setMaterials(layout, {
          ...(floor ? { floor } : {}),
          ...(floorColor ? { floorColor } : {}),
          ...(wallColor ? { wallColor } : {}),
        }),
        operation,
      };
    }
    case "remove":
      if (!find(operation.placementId)) return { code: "unknown_placement" };
      return {
        layout: {
          ...layout,
          furniture: layout.furniture.filter((placement) => placement.id !== operation.placementId),
        },
        operation,
      };
    case "add": {
      const item = catalogItem(operation.itemId);
      if (!item) return { code: "unknown_item" };
      const placement: Placement = {
        id: operation.placementId,
        itemId: operation.itemId,
        x: operation.x,
        z: operation.z,
        rotation: normalizeRotation(operation.rotation),
      };
      return place(layout, placement, item, operation, true);
    }
    case "move": {
      const current = find(operation.placementId);
      const item = current && catalogItem(current.itemId);
      if (!current || !item) return { code: "unknown_placement" };
      return place(layout, { ...current, x: operation.x, z: operation.z }, item, operation, false);
    }
    case "rotate": {
      const current = find(operation.placementId);
      const item = current && catalogItem(current.itemId);
      if (!current || !item) return { code: "unknown_placement" };
      if (item.layer === "wall") return { code: "fixed_rotation" };
      const turned = { ...current, rotation: normalizeRotation(operation.rotation) };
      return place(layout, turned, item, operation, false);
    }
  }
}

function place(
  layout: Layout,
  wanted: Placement,
  item: CatalogItem,
  operation: Operation,
  isNew: boolean,
): Outcome {
  const { room } = layout;
  const placement =
    item.layer === "wall"
      ? { ...wanted, ...snapToWall(room, item, wanted) }
      : { ...wanted, x: round(wanted.x), z: round(wanted.z) };

  const candidate = footprint(placement, item);
  if (!insideRoom(room.width, room.depth, candidate)) return { code: "outside_room" };
  for (const other of layout.furniture) {
    const otherItem = catalogItem(other.itemId);
    if (other.id === placement.id || !otherItem) continue;
    if (collide(candidate, footprint(other, otherItem))) {
      return { code: "overlaps", otherId: other.id };
    }
  }
  if (item.layer === "floor") {
    for (const door of room.openings.filter((opening) => opening.kind === "door")) {
      if (polygonsOverlap(doorSwing(room, door), corners(candidate))) {
        return { code: "blocks_door", openingId: door.id };
      }
    }
  }

  const others = layout.furniture.filter((existing) => existing.id !== placement.id);
  const furniture = isNew
    ? [...others, placement]
    : layout.furniture.map((existing) => (existing.id === placement.id ? placement : existing));
  if (isNew && layoutCost(furniture).min > room.budget) return { code: "over_budget" };
  return { layout: { ...layout, furniture }, operation: repaired(operation, placement) };
}

function repaired(operation: Operation, placement: Placement): Operation {
  switch (operation.op) {
    case "add":
      return { ...operation, x: placement.x, z: placement.z, rotation: placement.rotation };
    case "move":
      return { ...operation, x: placement.x, z: placement.z };
    case "rotate":
      return { ...operation, rotation: placement.rotation };
    default:
      return operation;
  }
}

/** What a change does to the furniture: ids added, moved or turned, and pieces removed. */
export function diffLayouts(before: Layout, after: Layout) {
  const previous = new Map(before.furniture.map((placement) => [placement.id, placement]));
  const kept = new Set(after.furniture.map((placement) => placement.id));
  const added: string[] = [];
  const changed: string[] = [];
  for (const placement of after.furniture) {
    const old = previous.get(placement.id);
    if (!old) added.push(placement.id);
    else if (
      old.x !== placement.x ||
      old.z !== placement.z ||
      old.rotation !== placement.rotation
    ) {
      changed.push(placement.id);
    }
  }
  const removed = before.furniture.filter((placement) => !kept.has(placement.id));
  return { added, changed, removed };
}
