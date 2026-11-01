"""Cross-field room rules. Mirrors web/src/domain/room.ts; both run
shared/fixtures/room-validation.json."""

from dataclasses import dataclass
from typing import Literal

from roomcraft_api.schemas.room import Opening, Room, Wall

type RoomIssueCode = Literal[
    "no_door",
    "door_not_at_floor",
    "opening_exceeds_wall",
    "opening_above_ceiling",
    "openings_overlap",
]

# Lengths are compared with a tolerance so that rounding (1.1 + 2.2) never breaks a fit.
EPSILON = 1e-6


@dataclass(frozen=True, slots=True)
class RoomIssue:
    code: RoomIssueCode
    opening_id: str | None = None
    other_opening_id: str | None = None


def wall_length(room: Room, wall: Wall) -> float:
    return room.width if wall in ("north", "south") else room.depth


def validate_room(room: Room) -> list[RoomIssue]:
    issues: list[RoomIssue] = []
    if not any(opening.kind == "door" for opening in room.openings):
        issues.append(RoomIssue("no_door"))
    for index, opening in enumerate(room.openings):
        if opening.kind == "door" and opening.sill > EPSILON:
            issues.append(RoomIssue("door_not_at_floor", opening.id))
        if opening.offset + opening.width > wall_length(room, opening.wall) + EPSILON:
            issues.append(RoomIssue("opening_exceeds_wall", opening.id))
        if opening.sill + opening.height > room.height + EPSILON:
            issues.append(RoomIssue("opening_above_ceiling", opening.id))
        for earlier in room.openings[:index]:
            if earlier.wall == opening.wall and _spans_overlap(opening, earlier):
                issues.append(RoomIssue("openings_overlap", opening.id, earlier.id))
    return issues


def _spans_overlap(a: Opening, b: Opening) -> bool:
    return a.offset < b.offset + b.width - EPSILON and b.offset < a.offset + a.width - EPSILON
