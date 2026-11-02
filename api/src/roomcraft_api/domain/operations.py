"""Applies the assistant's operations to a layout, one by one, accepting those that
leave the room valid. Mirrors web/src/domain/operations.ts; both run
shared/fixtures/operations.json."""

from dataclasses import dataclass, field

from roomcraft_api.domain.catalog import Catalog
from roomcraft_api.domain.clearance import door_swing
from roomcraft_api.domain.placement import (
    Footprint,
    collide,
    corners,
    inside_room,
    polygons_overlap,
)
from roomcraft_api.domain.snap import normalize_rotation, round_mm, snap_to_wall
from roomcraft_api.schemas.furniture import Placement
from roomcraft_api.schemas.materials import Materials
from roomcraft_api.schemas.operations import (
    AddOperation,
    MaterialOperation,
    MoveOperation,
    Operation,
    OperationProblemCode,
    RemoveOperation,
    RotateOperation,
)
from roomcraft_api.schemas.room import Room


@dataclass(frozen=True, slots=True)
class Layout:
    room: Room
    furniture: tuple[Placement, ...]
    materials: Materials


@dataclass(frozen=True, slots=True)
class Problem:
    code: OperationProblemCode
    other_id: str | None = None
    opening_id: str | None = None


@dataclass(slots=True)
class Applied:
    layout: Layout
    accepted: list[Operation] = field(default_factory=list)
    rejected: list[tuple[int, Problem]] = field(default_factory=list)


def apply_operations(layout: Layout, operations: list[Operation], catalog: Catalog) -> Applied:
    """Each accepted operation sees the layout as changed by the ones before it.
    Rotations snap to 15 degrees and wall pieces snap onto the nearest wall."""
    result = Applied(layout)
    for index, operation in enumerate(operations):
        outcome = _apply(result.layout, operation, catalog)
        if isinstance(outcome, Problem):
            result.rejected.append((index, outcome))
        else:
            result.layout, accepted = outcome
            result.accepted.append(accepted)
    return result


def layout_cost(furniture: tuple[Placement, ...], catalog: Catalog) -> float:
    """The lowest total price of the furniture, as the budget is checked against it."""
    return sum(catalog[p.item_id].price.min for p in furniture if p.item_id in catalog)


def _apply(
    layout: Layout, operation: Operation, catalog: Catalog
) -> tuple[Layout, Operation] | Problem:
    match operation:
        case MaterialOperation():
            changes = {
                key: value
                for key, value in (
                    ("floor", operation.floor),
                    ("floor_color", operation.floor_color),
                    ("wall_color", operation.wall_color),
                )
                if value is not None
            }
            materials = layout.materials.model_copy(update=changes)
            return _with(layout, materials=materials), operation
        case RemoveOperation():
            if _find(layout, operation.placement_id) is None:
                return Problem("unknown_placement")
            kept = tuple(p for p in layout.furniture if p.id != operation.placement_id)
            return _with(layout, furniture=kept), operation
        case AddOperation():
            if operation.item_id not in catalog:
                return Problem("unknown_item")
            placement = Placement(
                id=operation.placement_id,
                item_id=operation.item_id,
                x=operation.x,
                z=operation.z,
                rotation=normalize_rotation(operation.rotation),
            )
            return _place(layout, placement, operation, catalog, new=True)
        case MoveOperation():
            current = _find(layout, operation.placement_id)
            if current is None:
                return Problem("unknown_placement")
            moved = current.model_copy(update={"x": operation.x, "z": operation.z})
            return _place(layout, moved, operation, catalog, new=False)
        case RotateOperation():
            current = _find(layout, operation.placement_id)
            if current is None:
                return Problem("unknown_placement")
            if catalog[current.item_id].layer == "wall":
                return Problem("fixed_rotation")
            turned = current.model_copy(update={"rotation": normalize_rotation(operation.rotation)})
            return _place(layout, turned, operation, catalog, new=False)


def _place(
    layout: Layout, placement: Placement, operation: Operation, catalog: Catalog, *, new: bool
) -> tuple[Layout, Operation] | Problem:
    item = catalog[placement.item_id]
    room = layout.room
    if item.layer == "wall":
        spot = snap_to_wall(
            room.width, room.depth, item.width, item.depth, placement.x, placement.z
        )
        placement = placement.model_copy(
            update={"x": spot.x, "z": spot.z, "rotation": spot.rotation}
        )
    else:
        placement = placement.model_copy(
            update={"x": round_mm(placement.x), "z": round_mm(placement.z)}
        )

    candidate = _footprint(placement, catalog)
    if not inside_room(room.width, room.depth, candidate):
        return Problem("outside_room")
    for other in layout.furniture:
        if other.id != placement.id and collide(candidate, _footprint(other, catalog)):
            return Problem("overlaps", other_id=other.id)
    if item.layer == "floor":
        for door in (opening for opening in room.openings if opening.kind == "door"):
            if polygons_overlap(door_swing(room.width, room.depth, door), corners(candidate)):
                return Problem("blocks_door", opening_id=door.id)

    others = tuple(p for p in layout.furniture if p.id != placement.id)
    furniture = (*others, placement) if new else _replace(layout.furniture, placement)
    if new and layout_cost(furniture, catalog) > room.budget:
        return Problem("over_budget")
    return _with(layout, furniture=furniture), _repaired(operation, placement)


def _repaired(operation: Operation, placement: Placement) -> Operation:
    """The operation as it was applied, after snapping."""
    match operation:
        case AddOperation():
            update = {"x": placement.x, "z": placement.z, "rotation": placement.rotation}
            return operation.model_copy(update=update)
        case MoveOperation():
            return operation.model_copy(update={"x": placement.x, "z": placement.z})
        case RotateOperation():
            return operation.model_copy(update={"rotation": placement.rotation})
        case _:
            return operation


def _footprint(placement: Placement, catalog: Catalog) -> Footprint:
    item = catalog[placement.item_id]
    return Footprint(
        placement.id,
        placement.x,
        placement.z,
        placement.rotation,
        item.width,
        item.depth,
        item.layer,
    )


def _find(layout: Layout, placement_id: str) -> Placement | None:
    return next((p for p in layout.furniture if p.id == placement_id), None)


def _replace(furniture: tuple[Placement, ...], updated: Placement) -> tuple[Placement, ...]:
    return tuple(updated if p.id == updated.id else p for p in furniture)


def _with(
    layout: Layout,
    *,
    furniture: tuple[Placement, ...] | None = None,
    materials: Materials | None = None,
) -> Layout:
    return Layout(
        layout.room,
        layout.furniture if furniture is None else furniture,
        layout.materials if materials is None else materials,
    )
