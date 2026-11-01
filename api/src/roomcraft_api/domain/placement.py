"""Where furniture may stand. Mirrors web/src/domain/placement.ts; both run
shared/fixtures/placement.json."""

import math
from dataclasses import dataclass
from typing import Literal

from roomcraft_api.schemas.furniture import Layer

type Point = tuple[float, float]
type PlacementProblemCode = Literal["outside_room", "overlaps"]

# Touching is allowed: a sofa can stand flush against a wall or another piece.
EPSILON = 1e-6


@dataclass(frozen=True, slots=True)
class Footprint:
    """An item's rectangle on the floor plan, centred at (x, z) and rotated in degrees."""

    id: str
    x: float
    z: float
    rotation: float
    width: float
    depth: float
    layer: Layer


@dataclass(frozen=True, slots=True)
class PlacementProblem:
    code: PlacementProblemCode
    item_id: str
    other_item_id: str | None = None


def corners(item: Footprint) -> list[Point]:
    """Corners in plan coordinates, using three.js's rotation about the vertical axis."""
    angle = math.radians(item.rotation)
    cos, sin = math.cos(angle), math.sin(angle)
    half_w, half_d = item.width / 2, item.depth / 2
    local = [(-half_w, -half_d), (half_w, -half_d), (half_w, half_d), (-half_w, half_d)]
    return [(item.x + lx * cos + lz * sin, item.z - lx * sin + lz * cos) for lx, lz in local]


def inside_room(width: float, depth: float, item: Footprint) -> bool:
    return all(
        -EPSILON <= x <= width + EPSILON and -EPSILON <= z <= depth + EPSILON
        for x, z in corners(item)
    )


def collide(a: Footprint, b: Footprint) -> bool:
    """Whether two items get in each other's way: same layer, rugs excepted, shapes overlapping."""
    if a.layer != b.layer or a.layer == "rug":
        return False
    return _overlap(corners(a), corners(b))


def placement_problems(
    width: float, depth: float, items: list[Footprint]
) -> list[PlacementProblem]:
    problems: list[PlacementProblem] = []
    for index, item in enumerate(items):
        if not inside_room(width, depth, item):
            problems.append(PlacementProblem("outside_room", item.id))
        for earlier in items[:index]:
            if collide(item, earlier):
                problems.append(PlacementProblem("overlaps", item.id, earlier.id))
    return problems


def _overlap(a: list[Point], b: list[Point]) -> bool:
    """Separating axis test for two convex quadrilaterals."""
    for polygon in (a, b):
        for i in range(len(polygon)):
            (x1, z1), (x2, z2) = polygon[i], polygon[(i + 1) % len(polygon)]
            axis = (z1 - z2, x2 - x1)
            a_min, a_max = _project(a, axis)
            b_min, b_max = _project(b, axis)
            if a_max <= b_min + EPSILON or b_max <= a_min + EPSILON:
                return False
    return True


def _project(polygon: list[Point], axis: Point) -> tuple[float, float]:
    length = math.hypot(*axis)
    values = [(x * axis[0] + z * axis[1]) / length for x, z in polygon]
    return min(values), max(values)
