from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# In a checkout the catalog sits in shared/; the Docker image sets ROOMCRAFT_CATALOG_PATH.
_REPOSITORY_CATALOG = Path(__file__).resolve().parents[3] / "shared" / "catalog" / "catalog.json"


class Settings(BaseSettings):
    """Runtime configuration, read from `ROOMCRAFT_*` environment variables."""

    model_config = SettingsConfigDict(env_prefix="ROOMCRAFT_", env_file=".env", extra="ignore")

    cors_origins: list[str] = [
        "https://roomcraft-planner.web.app",
        "https://roomcraft-planner.firebaseapp.com",
    ]
    # Firebase Hosting preview channels: <project>--<channel>-<hash>.web.app
    cors_origin_regex: str | None = r"https://roomcraft-planner--[a-z0-9-]+\.web\.app"

    firebase_project_id: str = "roomcraft-planner"
    catalog_path: Path = _REPOSITORY_CATALOG

    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-3.8-flash"
    # Used when the main model is over its quota.
    gemini_fallback_model: str = "gemini-3.5-flash-lite"

    # Read without the ROOMCRAFT_ prefix: Google's libraries read the same variable.
    google_application_credentials: Path | None = Field(
        default=None, validation_alias="GOOGLE_APPLICATION_CREDENTIALS"
    )

    daily_ai_requests: int = 20
    # "memory" keeps counts in the process, for local development without credentials.
    rate_limit_store: Literal["firestore", "memory"] = "firestore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
