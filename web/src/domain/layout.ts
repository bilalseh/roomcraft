import type { CatalogItem, Materials, Placement, Room } from "@roomcraft/shared";
import { catalogItem } from "./catalog";
import { collide, footprint, insideRoom } from "./placement";
import { GRID, snapToFloor, snapToWall } from "./snap";

/** The undoable part of a project: the room, its finishes and the furniture in it. */
export interface Layout {
  room: Room;
  furniture: Placement[];
  materials: Materials;
}

export type LayoutProblem =
  | { code: "outside_room" }
  | { code: "overlaps"; otherId: string }
  | { code: "no_space" }
  | { code: "unknown_item" }
  | { code: "fixed_rotation" };

export type LayoutResult = { ok: true; layout: Layout } | { ok: false; problem: LayoutProblem };

/** Why `placement` cannot stand where it is, ignoring any placement with the same id. */
export function placementProblem(layout: Layout, placement: Placement): LayoutProblem | null {
  const item = catalogItem(placement.itemId);
  if (!item) return { code: "unknown_item" };
  const candidate = footprint(placement, item);
  if (!insideRoom(layout.room.width, layout.room.depth, candidate)) return { code: "outside_room" };
  for (const other of layout.furniture) {
    const otherItem = catalogItem(other.itemId);
    if (other.id === placement.id || !otherItem) continue;
    if (collide(candidate, footprint(other, otherItem))) {
      return { code: "overlaps", otherId: other.id };
    }
  }
  return null;
}

/** Adds an item at the free spot closest to the middle of the room. */
export function addItem(layout: Layout, item: CatalogItem, id: string): LayoutResult {
  const center = { x: layout.room.width / 2, z: layout.room.depth / 2 };
  const placement = freeSpot(layout, { id, itemId: item.id, ...center, rotation: 0 }, item);
  if (!placement) return { ok: false, problem: { code: "no_space" } };
  return { ok: true, layout: { ...layout, furniture: [...layout.furniture, placement] } };
}

/** Moves or rotates a placed item, if it fits where it would end up. */
export function updateItem(
  layout: Layout,
  id: string,
  change: Partial<Pick<Placement, "x" | "z" | "rotation">>,
): LayoutResult {
  const current = layout.furniture.find((placement) => placement.id === id);
  if (!current) return { ok: false, problem: { code: "unknown_item" } };
  const next = { ...current, ...change };
  const problem = placementProblem(layout, next);
  if (problem) return { ok: false, problem };
  return { ok: true, layout: replace(layout, next) };
}

/** Turns an item about its centre in 15 degree steps. Wall items always face into the room. */
export function rotateItem(layout: Layout, id: string, steps: number): LayoutResult {
  const current = layout.furniture.find((placement) => placement.id === id);
  const item = current && catalogItem(current.itemId);
  if (!current || !item) return { ok: false, problem: { code: "unknown_item" } };
  if (item.layer === "wall") return { ok: false, problem: { code: "fixed_rotation" } };
  const rotation = (((current.rotation + steps * 15) % 360) + 360) % 360;
  return updateItem(layout, id, { rotation });
}

export function setMaterials(layout: Layout, change: Partial<Materials>): Layout {
  return { ...layout, materials: { ...layout.materials, ...change } };
}

/** Recolours a piece; null restores the catalog colour. */
export function setItemColor(layout: Layout, id: string, color: string | null): Layout {
  return {
    ...layout,
    furniture: layout.furniture.map((placement) => {
      if (placement.id !== id) return placement;
      const { color: _color, ...rest } = placement;
      return color === null ? rest : { ...rest, color };
    }),
  };
}

export function removeItem(layout: Layout, id: string): Layout {
  return { ...layout, furniture: layout.furniture.filter((placement) => placement.id !== id) };
}

/** Places a copy of an item at the free spot closest to the original. */
export function duplicateItem(layout: Layout, id: string, newId: string): LayoutResult {
  const original = layout.furniture.find((placement) => placement.id === id);
  const item = original && catalogItem(original.itemId);
  if (!original || !item) return { ok: false, problem: { code: "unknown_item" } };
  const copy = freeSpot(layout, { ...original, id: newId }, item);
  if (!copy) return { ok: false, problem: { code: "no_space" } };
  return { ok: true, layout: { ...layout, furniture: [...layout.furniture, copy] } };
}

/**
 * The grid position nearest to `wanted` where the item fits. Wall items search
 * along the walls; everything else searches the floor.
 */
function freeSpot(layout: Layout, wanted: Placement, item: CatalogItem): Placement | null {
  const { width, depth } = layout.room;
  const candidates: Placement[] = [];
  for (let x = GRID / 2; x < width; x += GRID) {
    for (let z = GRID / 2; z < depth; z += GRID) {
      const point = { x, z };
      const snapped =
        item.layer === "wall"
          ? snapToWall(layout.room, item, point)
          : {
              ...snapToFloor(layout.room, item, wanted.rotation, point),
              rotation: wanted.rotation,
            };
      candidates.push({ ...wanted, ...snapped });
    }
  }
  const distance = (placement: Placement) =>
    (placement.x - wanted.x) ** 2 + (placement.z - wanted.z) ** 2;
  candidates.sort((a, b) => distance(a) - distance(b));
  return candidates.find((candidate) => placementProblem(layout, candidate) === null) ?? null;
}

function replace(layout: Layout, next: Placement): Layout {
  return {
    ...layout,
    furniture: layout.furniture.map((placement) => (placement.id === next.id ? next : placement)),
  };
}
