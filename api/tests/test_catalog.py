import json

from pydantic import TypeAdapter

from roomcraft_api.schemas.furniture import CatalogItem
from tests.fixtures import SHARED

CATALOG = json.loads((SHARED / "catalog" / "catalog.json").read_text(encoding="utf-8"))


def test_catalog_matches_the_schema() -> None:
    items = TypeAdapter(list[CatalogItem]).validate_python(CATALOG)

    assert len(items) >= 25


def test_catalog_ids_are_unique() -> None:
    ids = [item["id"] for item in CATALOG]

    assert len(ids) == len(set(ids))


def test_every_category_has_items() -> None:
    categories = {item["category"] for item in CATALOG}

    assert categories == {"seating", "tables", "storage", "beds", "lighting", "decor"}
