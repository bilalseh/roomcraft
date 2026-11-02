"""Wall frames in plan coordinates. Mirrors `wallFrame` in web/src/domain/walls.ts."""

from dataclasses import dataclass

from roomcraft_api.schemas.room import Wall

type Point = tuple[float, float]


@dataclass(frozen=True, slots=True)
class WallFrame:
    """Where a wall starts, which way it runs, and which way is inside the room."""

    origin: Point
    along: Point
    inward: Point

    def point(self, along: float, into: float = 0) -> Point:
        """A point `along` metres down the wall and `into` metres into the room."""
        return (
            self.origin[0] + self.along[0] * along + self.inward[0] * into,
            self.origin[1] + self.along[1] * along + self.inward[1] * into,
        )


def wall_frame(width: float, depth: float, wall: Wall) -> WallFrame:
    match wall:
        case "north":
            return WallFrame((0, 0), (1, 0), (0, 1))
        case "south":
            return WallFrame((0, depth), (1, 0), (0, -1))
        case "west":
            return WallFrame((0, 0), (0, 1), (1, 0))
        case "east":
            return WallFrame((width, 0), (0, 1), (-1, 0))
