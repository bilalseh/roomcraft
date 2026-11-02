"""Shared services, built once per process. Tests replace them with fakes."""

from functools import lru_cache
from typing import Annotated

import firebase_admin
from fastapi import Depends, Header, HTTPException, status
from starlette.concurrency import run_in_threadpool

from roomcraft_api.assistant.model import GeminiLayoutModel
from roomcraft_api.assistant.service import LayoutAssistant
from roomcraft_api.domain.catalog import load_catalog
from roomcraft_api.security import (
    FirebaseTokenVerifier,
    FirestoreRateLimiter,
    InvalidTokenError,
    MemoryRateLimiter,
    RateLimiter,
    TokenVerifier,
)
from roomcraft_api.settings import get_settings


@lru_cache
def firebase_app() -> firebase_admin.App:
    # Credentials come from GOOGLE_APPLICATION_CREDENTIALS. Checking ID tokens needs
    # only the project id; Firestore needs the service account.
    options = {"projectId": get_settings().firebase_project_id}
    return firebase_admin.initialize_app(options=options, name="roomcraft")


@lru_cache
def token_verifier() -> TokenVerifier:
    return FirebaseTokenVerifier(firebase_app())


@lru_cache
def rate_limiter() -> RateLimiter | None:
    """None when Firestore counts are wanted but no service account is configured."""
    settings = get_settings()
    if settings.rate_limit_store == "memory":
        return MemoryRateLimiter(settings.daily_ai_requests)
    if settings.google_application_credentials is None:
        return None
    return FirestoreRateLimiter(firebase_app(), settings.daily_ai_requests)


@lru_cache
def layout_assistant() -> LayoutAssistant | None:
    """None until a Gemini API key is configured."""
    settings = get_settings()
    if settings.gemini_api_key is None:
        return None
    catalog = load_catalog(settings.catalog_path)
    model = GeminiLayoutModel(
        settings.gemini_api_key.get_secret_value(),
        (settings.gemini_model, settings.gemini_fallback_model),
        catalog,
    )
    return LayoutAssistant(model, catalog)


async def current_uid(
    verifier: Annotated[TokenVerifier, Depends(token_verifier)],
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    """The signed-in person's Firebase uid, from `Authorization: Bearer <ID token>`."""
    scheme, _, token = (authorization or "").partition(" ")
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Sign in to use the assistant.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if scheme.lower() != "bearer" or not token:
        raise unauthorized
    try:
        return await run_in_threadpool(verifier.verify, token)
    except InvalidTokenError as error:
        raise unauthorized from error
