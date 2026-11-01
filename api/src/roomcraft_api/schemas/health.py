from typing import Literal

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    """Response of `GET /health`."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["ok"]
    version: str
