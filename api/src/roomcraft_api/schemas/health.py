from typing import Literal

from roomcraft_api.schemas.base import ApiModel


class HealthResponse(ApiModel):
    """Response of `GET /health`."""

    status: Literal["ok"]
    version: str
