"""Changes the layout assistant proposes, and the request and response of
`POST /v1/assist`. Every operation carries a one-sentence reason for the person."""

from typing import Annotated, Literal

from pydantic import Field

from roomcraft_api.schemas.base import ApiModel
from roomcraft_api.schemas.furniture import Placement
from roomcraft_api.schemas.materials import FloorMaterial, Materials
from roomcraft_api.schemas.room import Room

_HEX = r"^#[0-9a-f]{6}$"
_Reason = Annotated[str, Field(max_length=200)]


class AddOperation(ApiModel):
    op: Literal["add"]
    placement_id: str = Field(min_length=1, max_length=64)
    item_id: str = Field(min_length=1, max_length=64)
    x: float
    z: float
    rotation: float = 0
    reason: _Reason


class MoveOperation(ApiModel):
    op: Literal["move"]
    placement_id: str = Field(min_length=1, max_length=64)
    x: float
    z: float
    reason: _Reason


class RotateOperation(ApiModel):
    op: Literal["rotate"]
    placement_id: str = Field(min_length=1, max_length=64)
    rotation: float
    reason: _Reason


class RemoveOperation(ApiModel):
    op: Literal["remove"]
    placement_id: str = Field(min_length=1, max_length=64)
    reason: _Reason


class MaterialOperation(ApiModel):
    op: Literal["material"]
    floor: FloorMaterial | None = None
    floor_color: str | None = Field(default=None, pattern=_HEX)
    wall_color: str | None = Field(default=None, pattern=_HEX)
    reason: _Reason


type Operation = Annotated[
    AddOperation | MoveOperation | RotateOperation | RemoveOperation | MaterialOperation,
    Field(discriminator="op"),
]

type OperationProblemCode = Literal[
    "invalid_operation",
    "unknown_item",
    "unknown_placement",
    "outside_room",
    "overlaps",
    "blocks_door",
    "over_budget",
    "fixed_rotation",
]


class RejectedOperation(ApiModel):
    """A proposed change the server refused, and why."""

    op: str
    reason: str
    code: OperationProblemCode
    other_id: str | None = None
    opening_id: str | None = None


class Suggestion(ApiModel):
    summary: str
    operations: list[Operation]
    rejected: list[RejectedOperation]


class AssistRequest(ApiModel):
    prompt: str = Field(min_length=1, max_length=500)
    room: Room
    furniture: list[Placement] = Field(max_length=100)
    materials: Materials
    options: Literal[1, 3] = Field(default=1, description="How many alternative layouts.")


class AssistResponse(ApiModel):
    suggestions: list[Suggestion]
    remaining_today: int
