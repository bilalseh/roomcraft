import pytest
from fastapi.testclient import TestClient


def preflight(client: TestClient, origin: str) -> str | None:
    response = client.options(
        "/health",
        headers={"Origin": origin, "Access-Control-Request-Method": "GET"},
    )
    return response.headers.get("access-control-allow-origin")


@pytest.mark.parametrize(
    "origin",
    [
        "https://roomcraft-planner.web.app",
        "https://roomcraft-planner.firebaseapp.com",
        "https://roomcraft-planner--pr-12-a1b2c3d4.web.app",
    ],
)
def test_allows_hosting_origins(client: TestClient, origin: str) -> None:
    assert preflight(client, origin) == origin


@pytest.mark.parametrize(
    "origin",
    [
        "https://evil.example",
        "http://roomcraft-planner.web.app",
        "https://other-project--pr-1-abc.web.app",
        "https://roomcraft-planner--pr-1-abc.web.app.evil.example",
        "http://localhost:5173",
    ],
)
def test_rejects_other_origins(client: TestClient, origin: str) -> None:
    assert preflight(client, origin) is None
