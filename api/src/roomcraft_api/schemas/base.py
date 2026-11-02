from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    """Base for models shared with the web app: snake_case in Python, camelCase on the wire,
    and no unknown fields."""

    model_config = ConfigDict(
        extra="forbid",
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
        # Responses always include defaulted fields, so their schemas mark them required.
        json_schema_serialization_defaults_required=True,
    )
