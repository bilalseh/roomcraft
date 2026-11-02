import asyncio
import logging
from types import SimpleNamespace
from typing import Any

import pytest
from google import genai
from google.genai import errors

from roomcraft_api.assistant.model import (
    AssistantBusyError,
    AssistantFailedError,
    AssistantUnavailableError,
    GeminiLayoutModel,
)
from roomcraft_api.domain.catalog import load_catalog
from roomcraft_api.schemas.operations import AssistRequest
from tests.fixtures import SHARED, load_fixture

CATALOG = load_catalog(SHARED / "catalog" / "catalog.json")
FIXTURE = load_fixture("operations.json")
ANSWER = '{"plans": [{"summary": "Cosier.", "operations": []}]}'


def refused(code: int, status: str, message: str) -> errors.APIError:
    return errors.APIError(code, {"error": {"code": code, "status": status, "message": message}})


class FakeModels:
    """Answers each call with the next outcome: an error to raise, or the model's text."""

    def __init__(self, outcomes: list[errors.APIError | str | None]) -> None:
        self.outcomes = outcomes
        self.called: list[str] = []

    async def generate_content(self, *, model: str, **_: Any) -> SimpleNamespace:
        self.called.append(model)
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, errors.APIError):
            raise outcome
        return SimpleNamespace(
            text=outcome, candidates=[SimpleNamespace(finish_reason="MAX_TOKENS")]
        )


def run(monkeypatch: pytest.MonkeyPatch, fake: FakeModels) -> str:
    client = SimpleNamespace(aio=SimpleNamespace(models=fake))
    monkeypatch.setattr(genai, "Client", lambda **_: client)
    model = GeminiLayoutModel("key", ("primary", "fallback"), CATALOG)
    request = AssistRequest.model_validate(
        {
            "prompt": "Make it cosier",
            "room": FIXTURE["room"],
            "furniture": FIXTURE["furniture"],
            "materials": FIXTURE["materials"],
        }
    )
    return asyncio.run(model.plan(request)).plans[0].summary


@pytest.mark.parametrize(
    "error",
    [
        refused(429, "RESOURCE_EXHAUSTED", "Over quota"),
        refused(503, "UNAVAILABLE", "Overloaded"),
        refused(404, "NOT_FOUND", "Retired"),
    ],
    ids=["over quota", "overloaded", "retired"],
)
def test_tries_the_next_model_when_one_cannot_answer(
    monkeypatch: pytest.MonkeyPatch, error: errors.APIError
) -> None:
    fake = FakeModels([error, ANSWER])

    assert run(monkeypatch, fake) == "Cosier."
    assert fake.called == ["primary", "fallback"]


def test_is_busy_when_no_model_can_answer(monkeypatch: pytest.MonkeyPatch) -> None:
    over_quota = refused(429, "RESOURCE_EXHAUSTED", "Over quota")

    with pytest.raises(AssistantBusyError):
        run(monkeypatch, FakeModels([over_quota, over_quota]))


def test_a_refused_request_stops_and_logs_why(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    fake = FakeModels([refused(400, "INVALID_ARGUMENT", "API key not valid")])

    with caplog.at_level(logging.WARNING), pytest.raises(AssistantUnavailableError):
        run(monkeypatch, fake)

    assert fake.called == ["primary"]
    assert "400 INVALID_ARGUMENT: API key not valid" in caplog.text


@pytest.mark.parametrize("text", ['{"plans": []}', '{"plans": [', None], ids=str)
def test_an_unusable_answer_fails_and_logs_why(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture, text: str | None
) -> None:
    with caplog.at_level(logging.WARNING), pytest.raises(AssistantFailedError):
        run(monkeypatch, FakeModels([text]))

    assert "unusable answer (MAX_TOKENS)" in caplog.text
