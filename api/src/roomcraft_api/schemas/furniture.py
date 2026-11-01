"""The furniture catalog and furniture placed in a room. Lengths in metres, prices in USD.

An item's width runs along its local x axis and its depth along local z, with its
front facing +z. A placement rotates the item about its centre: at 90 degrees
the front faces east, matching three.js's rotation about the y axis.
"""

from typing import Literal

from pydantic import Field, model_validator

from roomcraft_api.schemas.base import ApiModel
from roomcraft_api.schemas.room import RoomType

type Category = Literal["seating", "tables", "storage", "beds", "lighting", "decor"]

type Layer = Literal["floor", "rug", "wall", "ceiling"]
"""Where an item sits. Items only collide with items on the same layer, and rugs
never collide, so a sofa can stand on a rug and a painting can hang above it."""

type ModelKind = Literal[
    "sofa",
    "armchair",
    "chair",
    "office_chair",
    "ottoman",
    "table",
    "desk",
    "bed",
    "cabinet",
    "wardrobe",
    "bookshelf",
    "media_unit",
    "floor_lamp",
    "pendant",
    "rug",
    "round_rug",
    "plant",
    "wall_art",
    "mirror",
    "wall_shelf",
]


class PriceRange(ApiModel):
    min: float = Field(ge=0)
    max: float = Field(ge=0)

    @model_validator(mode="after")
    def _ordered(self) -> "PriceRange":
        if self.min > self.max:
            raise ValueError("min must not exceed max")
        return self


class CatalogItem(ApiModel):
    """A piece of furniture that can be placed, built in 3D from its `model` kind."""

    id: str = Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$")
    name: str = Field(min_length=1, max_length=60)
    category: Category
    model: ModelKind
    layer: Layer
    width: float = Field(gt=0, le=6)
    depth: float = Field(gt=0, le=6)
    height: float = Field(gt=0, le=4)
    elevation: float = Field(default=0, ge=0, le=4, description="Bottom height for wall items.")
    price: PriceRange
    color: str = Field(pattern=r"^#[0-9a-f]{6}$")
    rooms: list[RoomType] = Field(min_length=1, description="Room types it suits.")


class Placement(ApiModel):
    """A catalog item placed in the room, positioned by its centre."""

    id: str = Field(min_length=1, max_length=64)
    item_id: str = Field(min_length=1, max_length=64)
    x: float = Field(description="West to east, from the room's west wall.")
    z: float = Field(description="North to south, from the room's north wall.")
    rotation: float = Field(ge=0, lt=360, multiple_of=15, description="Degrees.")
    color: str | None = Field(default=None, pattern=r"^#[0-9a-f]{6}$")
