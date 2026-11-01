import json
from pathlib import Path
from typing import Any

FIXTURES = Path(__file__).resolve().parents[2] / "shared" / "fixtures"


def load_cases(name: str) -> list[dict[str, Any]]:
    """Cases from a shared fixture file, as used by both the web and API test suites."""
    document = json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    cases: list[dict[str, Any]] = document["cases"]
    return cases
