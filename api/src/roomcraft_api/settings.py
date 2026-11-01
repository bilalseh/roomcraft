from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, read from `ROOMCRAFT_*` environment variables."""

    model_config = SettingsConfigDict(env_prefix="ROOMCRAFT_", env_file=".env", extra="ignore")

    cors_origins: list[str] = [
        "https://roomcraft-planner.web.app",
        "https://roomcraft-planner.firebaseapp.com",
    ]
    # Firebase Hosting preview channels: <project>--<channel>-<hash>.web.app
    cors_origin_regex: str | None = r"https://roomcraft-planner--[a-z0-9-]+\.web\.app"


@lru_cache
def get_settings() -> Settings:
    return Settings()
