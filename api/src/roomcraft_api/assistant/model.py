"""Language models that turn a request into plans."""

import logging
from typing import Protocol

from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from roomcraft_api.assistant.plans import PlanResponse
from roomcraft_api.assistant.prompt import SYSTEM_INSTRUCTION, build_contents
from roomcraft_api.domain.catalog import Catalog
from roomcraft_api.schemas.operations import AssistRequest

logger = logging.getLogger(__name__)

# Over quota or retired. Server errors also move on to the next model.
_TRY_NEXT_MODEL = frozenset({404, 429})


class AssistantBusyError(Exception):
    """No model can answer for now: over quota, overloaded or retired."""


class AssistantUnavailableError(Exception):
    """The model service refused the request, which points at the setup, not the wording."""


class AssistantFailedError(Exception):
    """The model answered with something unusable."""


class LayoutModel(Protocol):
    async def plan(self, request: AssistRequest) -> PlanResponse: ...


class GeminiLayoutModel:
    """Gemini, with its JSON output constrained to `PlanResponse`. When one model cannot
    answer for now, the next one is tried."""

    def __init__(self, api_key: str, models: tuple[str, ...], catalog: Catalog) -> None:
        self._client = genai.Client(api_key=api_key)
        self._models = models
        self._catalog = catalog
        self._config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_json_schema=PlanResponse.model_json_schema(),
        )

    async def plan(self, request: AssistRequest) -> PlanResponse:
        contents = build_contents(request, self._catalog)
        for model in self._models:
            try:
                response = await self._client.aio.models.generate_content(
                    model=model, contents=contents, config=self._config
                )
            except errors.APIError as error:
                logger.warning(
                    "Gemini %s refused: %s %s: %s", model, error.code, error.status, error.message
                )
                if error.code in _TRY_NEXT_MODEL or error.code >= 500:
                    continue
                raise AssistantUnavailableError from error
            try:
                return PlanResponse.model_validate_json(response.text or "")
            except ValidationError as error:
                logger.warning(
                    "Gemini %s gave an unusable answer (%s): %s",
                    model,
                    _finish_reason(response),
                    error.errors(include_url=False, include_input=False),
                )
                raise AssistantFailedError from error
        raise AssistantBusyError


def _finish_reason(response: types.GenerateContentResponse) -> str:
    candidates = response.candidates or []
    return str(candidates[0].finish_reason) if candidates else "no candidates"
