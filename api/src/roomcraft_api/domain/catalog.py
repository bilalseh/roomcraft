"""The furniture catalog from shared/catalog/catalog.json."""

from functools import cache
from pathlib import Path

from pydantic import TypeAdapter

from roomcraft_api.schemas.furniture import CatalogItem

type Catalog = dict[str, CatalogItem]

_ITEMS = TypeAdapter(list[CatalogItem])


@cache
def load_catalog(path: Path) -> Catalog:
    items = _ITEMS.validate_json(path.read_bytes())
    return {item.id: item for item in items}
