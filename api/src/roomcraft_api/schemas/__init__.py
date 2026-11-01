"""Models shared with the web app.

`pnpm schema` exports every model in `SHARED_MODELS` to `shared/schema/` as JSON
Schema and generates the TypeScript types from it. The mode says which side of
the wire the model describes: "serialization" for responses, "validation" for
request bodies.
"""

from pydantic import BaseModel
from pydantic.json_schema import JsonSchemaMode

from roomcraft_api.schemas.health import HealthResponse
from roomcraft_api.schemas.room import Opening, Room

SHARED_MODELS: tuple[tuple[type[BaseModel], JsonSchemaMode], ...] = (
    (HealthResponse, "serialization"),
    (Room, "validation"),
)

__all__ = ["SHARED_MODELS", "HealthResponse", "Opening", "Room"]
