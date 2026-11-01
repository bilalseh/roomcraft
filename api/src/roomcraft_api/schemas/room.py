"""The room a project is planned in. Lengths are in metres, money in USD.

Plan coordinates: x runs west to east from 0 to `width`, z runs north to south
from 0 to `depth`. Openings on the north and south walls are positioned from the
west end of the wall; openings on the east and west walls from the north end.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

type RoomType = Literal["living_room", "bedroom", "office", "studio"]
type Style = Literal["modern", "scandinavian", "industrial", "classic"]
type Wall = Literal["north", "east", "south", "west"]
type OpeningKind = Literal["door", "window"]


class Opening(BaseModel):
    """A door or window cut into one wall."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=64)
    kind: OpeningKind
    wall: Wall
    offset: float = Field(ge=0, le=20, description="From the wall's start to the near edge.")
    width: float = Field(ge=0.3, le=6)
    height: float = Field(ge=0.3, le=4)
    sill: float = Field(ge=0, le=3, description="Height of the bottom edge; 0 for doors.")


class Room(BaseModel):
    """Room dimensions, openings, style and budget, as set in the setup wizard."""

    model_config = ConfigDict(extra="forbid")

    type: RoomType
    width: float = Field(ge=1.5, le=20, description="West to east, inside the walls.")
    depth: float = Field(ge=1.5, le=20, description="North to south, inside the walls.")
    height: float = Field(ge=2.1, le=5, description="Floor to ceiling.")
    openings: list[Opening] = Field(max_length=16)
    style: Style
    budget: float = Field(ge=100, le=1_000_000)
