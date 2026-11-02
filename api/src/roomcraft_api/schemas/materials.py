from typing import Literal

from pydantic import Field

from roomcraft_api.schemas.base import ApiModel

type FloorMaterial = Literal["wood", "tile", "carpet"]

_HEX = r"^#[0-9a-f]{6}$"


class Materials(ApiModel):
    """The room's finishes: floor material and colour, and wall paint."""

    floor: FloorMaterial
    floor_color: str = Field(pattern=_HEX)
    wall_color: str = Field(pattern=_HEX)
