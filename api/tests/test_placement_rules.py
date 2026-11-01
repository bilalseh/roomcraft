from typing import Any

import pytest

from roomcraft_api.domain.placement import Footprint, PlacementProblem, placement_problems
from tests.fixtures import load_cases, load_fixture

ROOM = load_fixture("placement.json")["room"]
CASES = load_cases("placement.json")


def expected_problem(problem: dict[str, Any]) -> PlacementProblem:
    return PlacementProblem(problem["code"], problem["itemId"], problem.get("otherItemId"))


@pytest.mark.parametrize("case", CASES, ids=[case["name"] for case in CASES])
def test_shared_placement_fixture(case: dict[str, Any]) -> None:
    items = [Footprint(**item) for item in case["items"]]

    problems = placement_problems(ROOM["width"], ROOM["depth"], items)

    assert problems == [expected_problem(problem) for problem in case["problems"]]
