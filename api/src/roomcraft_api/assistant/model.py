"""Language models that turn a request into plans."""

from typing import Protocol

from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from roomcraft_api.assistant.plans import PlanResponse
from roomcraft_api.assistant.prompt import SYSTEM_INSTRUCTION, build_contents
from roomcraft_api.domain.catalog import Catalog
from roomcraft_api.schemas.operations import AssistRequest


class AssistantBusyError(Exception):
    """Every model is over its quota for now."""


class AssistantFailedError(Exception):
    """The model could not be reached, or answered with something unusable."""


class LayoutModel(Protocol):
    async def plan(self, request: AssistRequest) -> PlanResponse: ...


class GeminiLayoutModel:
    """Gemini, with its JSON output constrained to `PlanResponse`. When one model is over
    its quota, the next one is tried."""

    def __init__(self, api_key: str, models: tuple[str, ...], catalog: Catalog) -> None:
        self._client = genai.Client(api_key=api_key)
        self._models = models
        self._catalog = catalog
        self._config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_json_schema=PlanResponse.model_json_schema(),
            temperature=0.8,
        )

    async def plan(self, request: AssistRequest) -> PlanResponse:
        contents = build_contents(request, self._catalog)
        for model in self._models:
            try:
                response = await self._client.aio.models.generate_content(
                    model=model, contents=contents, config=self._config
                )
            except errors.APIError as error:
                if error.code == 429:
                    continue
                raise AssistantFailedError(str(error)) from error
            try:
                return PlanResponse.model_validate_json(response.text or "")
            except ValidationError as error:
                raise AssistantFailedError("Unusable answer") from error
        raise AssistantBusyError
