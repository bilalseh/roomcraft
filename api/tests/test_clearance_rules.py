from typing import Any

import pytest

from roomcraft_api.domain.clearance import ClearanceIssue, ClearanceItem, clearance_issues
from roomcraft_api.domain.placement import Footprint
from roomcraft_api.schemas import Opening
from tests.fixtures import load_cases

CASES = load_cases("clearance.json")


def item(data: dict[str, Any]) -> ClearanceItem:
    fields = {key: value for key, value in data.items() if key != "category"}
    return ClearanceItem(Footprint(**fields), data["category"])


def expected_issue(issue: dict[str, Any]) -> ClearanceIssue:
    return ClearanceIssue(issue["code"], issue["itemId"], issue.get("openingId"))


@pytest.mark.parametrize("case", CASES, ids=[case["name"] for case in CASES])
def test_shared_clearance_fixture(case: dict[str, Any]) -> None:
    room = case["room"]
    openings = [Opening.model_validate(opening) for opening in room["openings"]]

    issues = clearance_issues(
        room["width"], room["depth"], openings, [item(data) for data in case["items"]]
    )

    assert issues == [expected_issue(issue) for issue in case["issues"]]
