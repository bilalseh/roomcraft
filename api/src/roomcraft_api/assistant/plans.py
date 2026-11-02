"""What the language model is asked to return, and how it becomes typed operations.

The model gets a flat, forgiving schema: one operation shape with optional
fields. The server then turns each one into a strict operation, and anything
incomplete is reported back rather than trusted.
"""

from typing import Literal

from pydantic import BaseModel, Field, ValidationError

from roomcraft_api.schemas.materials import FloorMaterial
from roomcraft_api.schemas.operations import (
    AddOperation,
    MaterialOperation,
    MoveOperation,
    Operation,
    RemoveOperation,
    RotateOperation,
)


class PlannedOperation(BaseModel):
    op: Literal["add", "move", "rotate", "remove", "material"]
    item_id: str | None = Field(default=None, description="Catalog id, for add.")
    placement_id: str | None = Field(
        default=None, description="Placed piece, for move, rotate, remove."
    )
    x: float | None = Field(default=None, description="Centre, metres from the west wall.")
    z: float | None = Field(default=None, description="Centre, metres from the north wall.")
    rotation: float | None = Field(default=None, description="Degrees; 0 faces south.")
    floor: FloorMaterial | None = None
    floor_color: str | None = Field(default=None, description="#rrggbb")
    wall_color: str | None = Field(default=None, description="#rrggbb")
    reason: str = Field(description="One sentence, for the person, on why this helps.")


class Plan(BaseModel):
    summary: str = Field(description="One or two sentences on what this layout does.")
    operations: list[PlannedOperation] = Field(max_length=12)


class PlanResponse(BaseModel):
    plans: list[Plan] = Field(min_length=1, max_length=3)


def to_operation(planned: PlannedOperation, new_id: str) -> Operation | None:
    """A strict operation, or None when the model left out something it needs."""
    reason = planned.reason[:200]
    try:
        match planned.op:
            case "add":
                return AddOperation(
                    op="add",
                    placement_id=new_id,
                    item_id=planned.item_id or "",
                    x=_required(planned.x),
                    z=_required(planned.z),
                    rotation=planned.rotation or 0,
                    reason=reason,
                )
            case "move":
                return MoveOperation(
                    op="move",
                    placement_id=planned.placement_id or "",
                    x=_required(planned.x),
                    z=_required(planned.z),
                    reason=reason,
                )
            case "rotate":
                return RotateOperation(
                    op="rotate",
                    placement_id=planned.placement_id or "",
                    rotation=_required(planned.rotation),
                    reason=reason,
                )
            case "remove":
                return RemoveOperation(
                    op="remove", placement_id=planned.placement_id or "", reason=reason
                )
            case "material":
                return MaterialOperation(
                    op="material",
                    floor=planned.floor,
                    floor_color=_hex(planned.floor_color),
                    wall_color=_hex(planned.wall_color),
                    reason=reason,
                )
    except (ValidationError, ValueError):
        return None


def _required(value: float | None) -> float:
    if value is None:
        raise ValueError("missing")
    return value


def _hex(color: str | None) -> str | None:
    return color.lower() if color else None
