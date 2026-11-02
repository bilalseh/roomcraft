from typing import Any

import pytest
from pydantic import TypeAdapter

from roomcraft_api.domain.catalog import load_catalog
from roomcraft_api.domain.operations import Layout, apply_operations
from roomcraft_api.schemas import Materials, Placement, Room
from roomcraft_api.schemas.operations import Operation
from tests.fixtures import SHARED, load_cases, load_fixture

FIXTURE = load_fixture("operations.json")
CASES = load_cases("operations.json")
CATALOG = load_catalog(SHARED / "catalog" / "catalog.json")
OPERATIONS = TypeAdapter(list[Operation])


def dump(model: Placement | Materials | Operation) -> dict[str, Any]:
    return model.model_dump(by_alias=True, exclude_none=True)


@pytest.mark.parametrize("case", CASES, ids=[case["name"] for case in CASES])
def test_shared_operations_fixture(case: dict[str, Any]) -> None:
    layout = Layout(
        Room.model_validate(FIXTURE["room"]),
        tuple(Placement.model_validate(p) for p in FIXTURE["furniture"]),
        Materials.model_validate(FIXTURE["materials"]),
    )

    result = apply_operations(layout, OPERATIONS.validate_python(case["operations"]), CATALOG)

    expected_accepted = OPERATIONS.validate_python(case["accepted"])
    assert [dump(op) for op in result.accepted] == [dump(op) for op in expected_accepted]
    assert [
        {
            "index": index,
            "code": problem.code,
            **({"otherId": problem.other_id} if problem.other_id else {}),
            **({"openingId": problem.opening_id} if problem.opening_id else {}),
        }
        for index, problem in result.rejected
    ] == case["rejected"]
    assert [dump(p) for p in result.layout.furniture] == case["furniture"]
    assert dump(result.layout.materials) == case["materials"]
