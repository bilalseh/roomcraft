from typing import Any

import pytest

from roomcraft_api.domain.room import RoomIssue, validate_room
from roomcraft_api.schemas import Room
from tests.fixtures import load_cases

CASES = load_cases("room-validation.json")


def expected_issue(issue: dict[str, Any]) -> RoomIssue:
    return RoomIssue(issue["code"], issue.get("openingId"), issue.get("otherOpeningId"))


@pytest.mark.parametrize("case", CASES, ids=[case["name"] for case in CASES])
def test_shared_room_fixture(case: dict[str, Any]) -> None:
    room = Room.model_validate(case["room"])

    assert validate_room(room) == [expected_issue(issue) for issue in case["issues"]]
