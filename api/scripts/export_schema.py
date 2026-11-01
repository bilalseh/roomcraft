"""Write the JSON Schema of every shared model to shared/schema/.

Run it through `pnpm schema`, which also regenerates the TypeScript types.
"""

import json
from pathlib import Path

from pydantic.json_schema import GenerateJsonSchema, models_json_schema

from roomcraft_api.schemas import SHARED_MODELS

OUTPUT = Path(__file__).resolve().parents[2] / "shared" / "schema" / "roomcraft.schema.json"


class SharedSchemaGenerator(GenerateJsonSchema):
    # Field titles would make the TypeScript generator emit one alias per field.
    def field_title_should_be_set(self, schema: object) -> bool:
        return False


def build_schema() -> dict[str, object]:
    _, schema = models_json_schema(
        SHARED_MODELS,
        title="Roomcraft shared schema",
        schema_generator=SharedSchemaGenerator,
    )
    return {"$schema": GenerateJsonSchema.schema_dialect, **schema}


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(build_schema(), indent=2) + "\n"
    OUTPUT.write_text(text, encoding="utf-8", newline="\n")
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
