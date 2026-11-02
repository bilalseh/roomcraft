"""Snapping helpers. Mirrors `snapToWall` and `round` in web/src/domain/snap.ts."""

import math
from dataclasses import dataclass

from roomcraft_api.schemas.room import Wall

GRID = 0.1
FACING_INTO_ROOM: dict[Wall, float] = {"north": 0, "west": 90, "south": 180, "east": 270}


@dataclass(frozen=True, slots=True)
class Spot:
    x: float
    z: float
    rotation: float


def round_mm(value: float) -> float:
    """Millimetre precision, rounding halves up like JavaScript's Math.round."""
    return math.floor(value * 1000 + 0.5) / 1000


def normalize_rotation(degrees: float) -> float:
    """The nearest 15 degree step, between 0 and 345."""
    return (math.floor(degrees / 15 + 0.5) * 15) % 360


def snap_to_wall(
    room_width: float, room_depth: float, width: float, depth: float, x: float, z: float
) -> Spot:
    """Hangs an item on the wall nearest to (x, z), flush and facing into the room."""
    distances: list[tuple[Wall, float]] = [
        ("north", z),
        ("south", room_depth - z),
        ("west", x),
        ("east", room_width - x),
    ]
    wall = min(distances, key=lambda candidate: candidate[1])[0]
    rotation = FACING_INTO_ROOM[wall]
    half_w, half_d = width / 2, depth / 2
    match wall:
        case "north":
            return Spot(_along(x, half_w, room_width), half_d, rotation)
        case "south":
            return Spot(_along(x, half_w, room_width), room_depth - half_d, rotation)
        case "west":
            return Spot(half_d, _along(z, half_w, room_depth), rotation)
        case "east":
            return Spot(room_width - half_d, _along(z, half_w, room_depth), rotation)


def _along(value: float, half: float, length: float) -> float:
    snapped = math.floor(value / GRID + 0.5) * GRID
    return round_mm(min(max(snapped, half), max(half, length - half)))
