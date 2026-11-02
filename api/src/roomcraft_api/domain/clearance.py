"""Clearance warnings: blocked door swings and pieces only reachable through narrow
gaps. Mirrors web/src/domain/clearance.ts; both run shared/fixtures/clearance.json."""

import math
from collections import deque
from dataclasses import dataclass
from typing import Literal

from roomcraft_api.domain.placement import Footprint, Point, corners, polygons_overlap
from roomcraft_api.domain.walls import wall_frame
from roomcraft_api.schemas.furniture import Category
from roomcraft_api.schemas.room import Opening

type ClearanceIssueCode = Literal["door_swing_blocked", "hard_to_reach"]
type Cell = tuple[int, int]

WALKWAY = 0.8
"""Narrowest gap a person walks through comfortably, in metres."""
CELL = 0.05
RADIUS = WALKWAY / 2
CLEAR = RADIUS - CELL / 2
"""Half a cell of tolerance, so a gap of exactly 80 cm still counts as a walkway."""
REACH = 0.7
"""How close a person must stand to use a piece: their centre within 70 cm of it."""
NEEDS_ACCESS: frozenset[Category] = frozenset({"seating", "tables", "storage", "beds"})
SWING_STEPS = 8


@dataclass(frozen=True, slots=True)
class ClearanceItem:
    footprint: Footprint
    category: Category


@dataclass(frozen=True, slots=True)
class ClearanceIssue:
    code: ClearanceIssueCode
    item_id: str
    opening_id: str | None = None


def clearance_issues(
    width: float, depth: float, openings: list[Opening], items: list[ClearanceItem]
) -> list[ClearanceIssue]:
    obstacles = [item for item in items if item.footprint.layer == "floor"]
    doors = [opening for opening in openings if opening.kind == "door"]
    issues: list[ClearanceIssue] = []
    for door in doors:
        swing = door_swing(width, depth, door)
        for item in obstacles:
            if polygons_overlap(swing, corners(item.footprint)):
                issues.append(ClearanceIssue("door_swing_blocked", item.footprint.id, door.id))
    issues.extend(_hard_to_reach(width, depth, doors, obstacles))
    return issues


def door_swing(width: float, depth: float, door: Opening) -> list[Point]:
    """The quarter circle a door sweeps, as a polygon: the hinge, then points on the arc."""
    frame = wall_frame(width, depth, door.wall)
    arc = [
        frame.point(
            door.offset + door.width * math.cos(math.pi / 2 * step / SWING_STEPS),
            door.width * math.sin(math.pi / 2 * step / SWING_STEPS),
        )
        for step in range(SWING_STEPS + 1)
    ]
    return [frame.point(door.offset), *arc]


def distance_to(footprint: Footprint, x: float, z: float) -> float:
    """Distance from a point to the nearest edge of a footprint; zero inside it."""
    angle = math.radians(footprint.rotation)
    dx, dz = x - footprint.x, z - footprint.z
    local_x = dx * math.cos(angle) - dz * math.sin(angle)
    local_z = dx * math.sin(angle) + dz * math.cos(angle)
    out_x = max(abs(local_x) - footprint.width / 2, 0)
    out_z = max(abs(local_z) - footprint.depth / 2, 0)
    return math.hypot(out_x, out_z)


def _bounds(footprint: Footprint, margin: float) -> tuple[float, float, float, float]:
    xs, zs = zip(*corners(footprint), strict=True)
    return min(xs) - margin, min(zs) - margin, max(xs) + margin, max(zs) + margin


def _hard_to_reach(
    width: float, depth: float, doors: list[Opening], obstacles: list[ClearanceItem]
) -> list[ClearanceIssue]:
    columns, rows = int(width / CELL + 1e-9), int(depth / CELL + 1e-9)
    near = [(item.footprint, _bounds(item.footprint, RADIUS)) for item in obstacles]
    known: dict[Cell, bool] = {}

    def center(cell: Cell) -> Point:
        return ((cell[0] + 0.5) * CELL, (cell[1] + 0.5) * CELL)

    def walkable(cell: Cell) -> bool:
        if cell not in known:
            x, z = center(cell)
            known[cell] = min(x, width - x, z, depth - z) >= CLEAR and all(
                distance_to(footprint, x, z) >= CLEAR
                for footprint, (x0, z0, x1, z1) in near
                if x0 <= x <= x1 and z0 <= z <= z1
            )
        return known[cell]

    seeds: list[Cell] = []
    for door in doors:
        x, z = wall_frame(width, depth, door.wall).point(
            door.offset + door.width / 2, RADIUS + CELL
        )
        cell = (min(int(x / CELL), columns - 1), min(int(z / CELL), rows - 1))
        if walkable(cell):
            seeds.append(cell)
    if not seeds:
        # Every door is blocked; the door issues already say so.
        return []

    reached = set(seeds)
    queue = deque(seeds)
    while queue:
        column, row = queue.popleft()
        for cell in ((column + 1, row), (column - 1, row), (column, row + 1), (column, row - 1)):
            in_room = 0 <= cell[0] < columns and 0 <= cell[1] < rows
            if in_room and cell not in reached and walkable(cell):
                reached.add(cell)
                queue.append(cell)

    def reachable(footprint: Footprint) -> bool:
        x0, z0, x1, z1 = _bounds(footprint, REACH)
        return any(
            (column, row) in reached and distance_to(footprint, *center((column, row))) <= REACH
            for column in range(max(int(x0 / CELL), 0), min(int(x1 / CELL) + 1, columns))
            for row in range(max(int(z0 / CELL), 0), min(int(z1 / CELL) + 1, rows))
        )

    return [
        ClearanceIssue("hard_to_reach", item.footprint.id)
        for item in obstacles
        if item.category in NEEDS_ACCESS and not reachable(item.footprint)
    ]
