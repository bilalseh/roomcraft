import json

from roomcraft_api.assistant.plans import PlannedOperation, to_operation
from roomcraft_api.assistant.prompt import build_contents
from roomcraft_api.domain.catalog import load_catalog
from roomcraft_api.schemas.operations import AddOperation, AssistRequest, MaterialOperation
from tests.fixtures import SHARED, load_fixture

CATALOG = load_catalog(SHARED / "catalog" / "catalog.json")
FIXTURE = load_fixture("operations.json")


def test_planned_additions_get_the_id_the_server_chose() -> None:
    planned = PlannedOperation(op="add", item_id="armchair", x=1, z=2, reason="Cosy.")

    assert to_operation(planned, "ai-1") == AddOperation(
        op="add", placement_id="ai-1", item_id="armchair", x=1, z=2, rotation=0, reason="Cosy."
    )


def test_incomplete_operations_are_dropped() -> None:
    assert to_operation(PlannedOperation(op="move", placement_id="sofa", reason="."), "x") is None
    assert to_operation(PlannedOperation(op="add", x=1, z=1, reason="."), "x") is None


def test_colours_are_normalised_and_bad_ones_dropped() -> None:
    paint = PlannedOperation(op="material", wall_color="#A3B19B", reason="Calmer.")
    assert to_operation(paint, "x") == MaterialOperation(
        op="material", wall_color="#a3b19b", reason="Calmer."
    )
    assert (
        to_operation(PlannedOperation(op="material", wall_color="green", reason="."), "x") is None
    )


def test_the_prompt_carries_the_room_furniture_and_catalog() -> None:
    request = AssistRequest.model_validate(
        {
            "prompt": "Make it feel bigger",
            "room": FIXTURE["room"],
            "furniture": FIXTURE["furniture"],
            "materials": FIXTURE["materials"],
        }
    )

    context = json.loads(build_contents(request, CATALOG))

    assert context["request"] == "Make it feel bigger"
    assert context["room"]["width"] == 5.0
    assert context["furniture"][0]["name"] == "Three-seat sofa"
    assert context["spent_at_lowest_prices"] == 699
    assert len(context["catalog"]) == len(CATALOG)
