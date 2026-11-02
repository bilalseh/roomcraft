import asyncio
from collections.abc import Sequence
from typing import Literal

import pytest

from roomcraft_api.assistant import service
from roomcraft_api.assistant.model import (
    AssistantBusyError,
    AssistantFailedError,
    AssistantUnavailableError,
)
from roomcraft_api.assistant.plans import Attempt, Plan, PlannedOperation, PlanResponse
from roomcraft_api.assistant.service import LayoutAssistant
from roomcraft_api.domain.catalog import load_catalog
from roomcraft_api.schemas.operations import AssistRequest, Suggestion
from tests.fixtures import SHARED, load_fixture

CATALOG = load_catalog(SHARED / "catalog" / "catalog.json")
FIXTURE = load_fixture("operations.json")
FITS = PlannedOperation(op="add", item_id="coffee-table", x=2.5, z=1.6, reason="Fits.")
OVERLAPS = PlannedOperation(op="add", item_id="coffee-table", x=2.5, z=0.8, reason="On the sofa.")
REFUSED = Plan(summary="Refused", operations=[FITS, OVERLAPS])
FIXED = Plan(summary="Fixed", operations=[FITS])


class ScriptedModel:
    """Gives each answer in turn, raising the ones that are errors. A further call fails."""

    def __init__(self, *answers: list[Plan] | Exception) -> None:
        self.answers = list(answers)
        self.earlier: list[Sequence[Attempt]] = []

    async def plan(self, request: AssistRequest, earlier: Sequence[Attempt] = ()) -> PlanResponse:
        self.earlier.append(earlier)
        answer = self.answers.pop(0)
        if isinstance(answer, Exception):
            raise answer
        return PlanResponse(plans=answer)


class SlowSecondAttempt(ScriptedModel):
    async def plan(self, request: AssistRequest, earlier: Sequence[Attempt] = ()) -> PlanResponse:
        if earlier:
            await asyncio.sleep(60)
        return await super().plan(request, earlier)


def suggest(model: ScriptedModel, options: Literal[1, 3] = 1) -> list[Suggestion]:
    request = AssistRequest(
        prompt="Add a coffee table",
        room=FIXTURE["room"],
        furniture=FIXTURE["furniture"],
        materials=FIXTURE["materials"],
        options=options,
    )
    return asyncio.run(LayoutAssistant(model, CATALOG).suggest(request))


def test_does_not_ask_again_when_nothing_was_refused() -> None:
    model = ScriptedModel([FIXED])

    [suggestion] = suggest(model)

    assert suggestion.summary == "Fixed"
    assert len(model.earlier) == 1


def test_takes_a_second_attempt_that_fixes_what_was_refused() -> None:
    model = ScriptedModel([REFUSED], [FIXED])

    [suggestion] = suggest(model)

    assert suggestion.summary == "Fixed"
    assert suggestion.rejected == []
    [attempt] = model.earlier[1]
    assert attempt.plan == REFUSED
    assert [(r.code, r.other_id) for r in attempt.refused] == [("overlaps", "sofa")]


def test_asks_only_once_more_and_keeps_the_first_answer_if_it_is_no_better() -> None:
    model = ScriptedModel([REFUSED], [Plan(summary="Worse", operations=[OVERLAPS])])

    [suggestion] = suggest(model)

    assert suggestion.summary == "Refused"
    assert len(model.earlier) == 2


def test_a_second_attempt_with_nothing_left_does_not_replace_the_first() -> None:
    model = ScriptedModel([REFUSED], [Plan(summary="Empty", operations=[])])

    [suggestion] = suggest(model)

    assert suggestion.summary == "Refused"


def test_only_refused_layouts_go_back_and_keep_their_place() -> None:
    first = [
        Plan(summary="Option A", operations=[FITS]),
        REFUSED,
        Plan(summary="Option C", operations=[FITS]),
    ]
    model = ScriptedModel(first, [FIXED])

    suggestions = suggest(model, options=3)

    assert [s.summary for s in suggestions] == ["Option A", "Fixed", "Option C"]
    assert [attempt.plan.summary for attempt in model.earlier[1]] == ["Refused"]


@pytest.mark.parametrize(
    "error",
    [
        AssistantBusyError(),
        AssistantUnavailableError(),
        AssistantFailedError(),
        ConnectionError("The network dropped"),
    ],
    ids=["busy", "unavailable", "unusable answer", "network"],
)
def test_keeps_the_first_answer_when_the_second_attempt_fails(error: Exception) -> None:
    [suggestion] = suggest(ScriptedModel([REFUSED], error))

    assert suggestion.summary == "Refused"


def test_keeps_the_first_answer_when_the_second_attempt_is_too_slow(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(service, "_ANSWER_WITHIN_SECONDS", 0.01)

    [suggestion] = suggest(SlowSecondAttempt([REFUSED], [FIXED]))

    assert suggestion.summary == "Refused"


def test_a_failed_first_attempt_is_still_an_error() -> None:
    with pytest.raises(AssistantBusyError):
        suggest(ScriptedModel(AssistantBusyError()))
