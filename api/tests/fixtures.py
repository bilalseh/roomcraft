import json
from pathlib import Path
from typing import Any

SHARED = Path(__file__).resolve().parents[2] / "shared"


def load_fixture(name: str) -> dict[str, Any]:
    """A shared fixture file, as used by both the web and API test suites."""
    document: dict[str, Any] = json.loads((SHARED / "fixtures" / name).read_text(encoding="utf-8"))
    return document


def load_cases(name: str) -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = load_fixture(name)["cases"]
    return cases
