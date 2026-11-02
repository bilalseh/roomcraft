"""Versioned product endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from roomcraft_api.assistant.model import (
    AssistantBusyError,
    AssistantFailedError,
    AssistantUnavailableError,
)
from roomcraft_api.assistant.service import LayoutAssistant
from roomcraft_api.dependencies import current_uid, layout_assistant, rate_limiter
from roomcraft_api.schemas.operations import AssistRequest, AssistResponse
from roomcraft_api.security import RateLimitedError, RateLimiter
from roomcraft_api.settings import get_settings

router = APIRouter(prefix="/v1", tags=["assistant"])

_ERRORS: dict[int | str, dict[str, Any]] = {
    status.HTTP_401_UNAUTHORIZED: {"description": "Missing or invalid Firebase ID token."},
    status.HTTP_429_TOO_MANY_REQUESTS: {"description": "Daily assistant requests used up."},
    status.HTTP_502_BAD_GATEWAY: {"description": "The model's answer was unusable."},
    status.HTTP_503_SERVICE_UNAVAILABLE: {
        "description": "Not configured, refused by the model service, or the model is busy."
    },
}


@router.post("/assist", responses=_ERRORS)
async def assist(
    request: AssistRequest,
    uid: Annotated[str, Depends(current_uid)],
    limiter: Annotated[RateLimiter | None, Depends(rate_limiter)],
    assistant: Annotated[LayoutAssistant | None, Depends(layout_assistant)],
) -> AssistResponse:
    """Suggests changes to the room. Every operation returned has been checked against
    the room's walls, doors, furniture and budget; refused ones say why. Plans with refused
    operations get one more attempt, so those requests take longer."""
    if assistant is None or limiter is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "The assistant is not set up yet.")
    try:
        remaining = await limiter.take(uid)
    except RateLimitedError as error:
        limit = get_settings().daily_ai_requests
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"You have used today's {limit} assistant requests. They reset at midnight UTC.",
        ) from error
    try:
        suggestions = await assistant.suggest(request)
    except AssistantBusyError as error:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "The assistant is busy. Try again in a minute."
        ) from error
    except AssistantUnavailableError as error:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "The assistant is unavailable right now. Please try again later.",
        ) from error
    except AssistantFailedError as error:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "The assistant could not come up with a usable answer. Try rephrasing the request.",
        ) from error
    return AssistResponse(suggestions=suggestions, remaining_today=remaining)
