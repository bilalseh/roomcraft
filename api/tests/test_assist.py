from typing import Any

import pytest
from fastapi.testclient import TestClient

from roomcraft_api.assistant.model import AssistantFailedError
from roomcraft_api.assistant.plans import Plan, PlannedOperation, PlanResponse
from roomcraft_api.assistant.service import LayoutAssistant
from roomcraft_api.dependencies import layout_assistant, rate_limiter, token_verifier
from roomcraft_api.domain.catalog import load_catalog
from roomcraft_api.main import create_app
from roomcraft_api.schemas.operations import AssistRequest
from roomcraft_api.security import InvalidTokenError, MemoryRateLimiter
from roomcraft_api.settings import Settings
from tests.fixtures import SHARED, load_fixture

CATALOG = load_catalog(SHARED / "catalog" / "catalog.json")
FIXTURE = load_fixture("operations.json")
AUTH = {"Authorization": "Bearer token-for-alex"}


class FakeVerifier:
    def verify(self, token: str) -> str:
        if token != "token-for-alex":
            raise InvalidTokenError
        return "alex"


class FakeModel:
    def __init__(self, plans: list[Plan] | None = None, fail: bool = False) -> None:
        self.plans = plans or []
        self.fail = fail
        self.requests: list[AssistRequest] = []

    async def plan(self, request: AssistRequest) -> PlanResponse:
        self.requests.append(request)
        if self.fail:
            raise AssistantFailedError
        return PlanResponse(plans=self.plans)


def planned(**fields: Any) -> PlannedOperation:
    return PlannedOperation(reason="It helps.", **fields)


def make_client(model: FakeModel | None, limit: int = 20) -> TestClient:
    app = create_app(Settings(_env_file=None))
    app.dependency_overrides[token_verifier] = FakeVerifier
    # One limiter for the client's lifetime, as the real dependency is cached.
    limiter = MemoryRateLimiter(limit)
    app.dependency_overrides[rate_limiter] = lambda: limiter
    app.dependency_overrides[layout_assistant] = lambda: (
        LayoutAssistant(model, CATALOG) if model else None
    )
    return TestClient(app)


def body(**overrides: Any) -> dict[str, Any]:
    return {
        "prompt": "Add a coffee table",
        "room": FIXTURE["room"],
        "furniture": FIXTURE["furniture"],
        "materials": FIXTURE["materials"],
        **overrides,
    }


def test_needs_a_firebase_id_token() -> None:
    client = make_client(FakeModel())

    assert client.post("/v1/assist", json=body()).status_code == 401
    bad = client.post("/v1/assist", json=body(), headers={"Authorization": "Bearer nope"})
    assert bad.status_code == 401


def test_returns_validated_operations_and_explains_refusals() -> None:
    plan = Plan(
        summary="A coffee table in front of the sofa.",
        operations=[
            planned(op="add", item_id="coffee-table", x=2.5, z=1.6),
            planned(op="add", item_id="coffee-table", x=2.5, z=0.8),
            planned(op="move", placement_id="sofa"),
        ],
    )
    client = make_client(FakeModel([plan]))

    response = client.post("/v1/assist", json=body(), headers=AUTH)

    assert response.status_code == 200
    [suggestion] = response.json()["suggestions"]
    assert suggestion["summary"] == "A coffee table in front of the sofa."
    [added] = suggestion["operations"]
    assert added["op"] == "add"
    assert added["placementId"].startswith("ai-")
    assert (added["itemId"], added["x"], added["z"]) == ("coffee-table", 2.5, 1.6)
    assert [(r["op"], r["code"], r.get("otherId")) for r in suggestion["rejected"]] == [
        ("move", "invalid_operation", None),
        ("add", "overlaps", "sofa"),
    ]
    assert response.json()["remainingToday"] == 19


def test_offers_three_layouts_when_asked() -> None:
    plans = [Plan(summary=f"Option {n}", operations=[]) for n in range(3)]
    client = make_client(FakeModel(plans))

    response = client.post("/v1/assist", json=body(options=3), headers=AUTH)

    assert [s["summary"] for s in response.json()["suggestions"]] == [
        "Option 0",
        "Option 1",
        "Option 2",
    ]


def test_limits_requests_per_person_per_day() -> None:
    client = make_client(FakeModel([Plan(summary="Nothing", operations=[])]), limit=2)

    statuses = [client.post("/v1/assist", json=body(), headers=AUTH).status_code for _ in range(3)]

    assert statuses == [200, 200, 429]


@pytest.mark.parametrize(
    ("model", "status"),
    [(None, 503), (FakeModel(fail=True), 502)],
    ids=["not configured", "unusable answer"],
)
def test_reports_when_the_assistant_cannot_help(model: FakeModel | None, status: int) -> None:
    client = make_client(model)

    response = client.post("/v1/assist", json=body(), headers=AUTH)

    assert response.status_code == status
    assert response.json()["detail"]


def test_rejects_malformed_requests_before_calling_the_model() -> None:
    model = FakeModel()
    client = make_client(model)

    response = client.post("/v1/assist", json=body(prompt=""), headers=AUTH)

    assert response.status_code == 422
    assert model.requests == []


def test_allows_the_web_app_to_send_its_token() -> None:
    client = make_client(FakeModel())

    response = client.options(
        "/v1/assist",
        headers={
            "Origin": "https://roomcraft-planner.web.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )

    assert response.headers["access-control-allow-origin"] == "https://roomcraft-planner.web.app"
