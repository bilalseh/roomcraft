from fastapi import APIRouter

from roomcraft_api import __version__
from roomcraft_api.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> HealthResponse:
    """Liveness probe. The web app also calls it on load to wake a sleeping Space."""
    return HealthResponse(status="ok", version=__version__)
