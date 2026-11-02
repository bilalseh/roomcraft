"""Who is calling, and how many assistant requests they have left today."""

import asyncio
from datetime import UTC, datetime
from typing import Any, Protocol

import firebase_admin
from firebase_admin import auth, firestore_async
from google.cloud import firestore


class InvalidTokenError(Exception):
    pass


class RateLimitedError(Exception):
    pass


class TokenVerifier(Protocol):
    def verify(self, token: str) -> str:
        """The Firebase uid behind an ID token; raises InvalidTokenError otherwise."""
        ...


class RateLimiter(Protocol):
    async def take(self, uid: str) -> int:
        """Counts one request and returns how many are left today; raises RateLimitedError."""
        ...


class FirebaseTokenVerifier:
    """Checks Firebase ID tokens, guest accounts included, against Google's public keys."""

    def __init__(self, app: firebase_admin.App) -> None:
        self._app = app

    def verify(self, token: str) -> str:
        try:
            claims: dict[str, Any] = auth.verify_id_token(token, app=self._app)
        except (ValueError, auth.InvalidIdTokenError, auth.ExpiredIdTokenError) as error:
            raise InvalidTokenError from error
        return str(claims["uid"])


def _today() -> str:
    return datetime.now(UTC).date().isoformat()


class MemoryRateLimiter:
    """Counts in this process only: for tests and local development."""

    def __init__(self, limit: int) -> None:
        self._limit = limit
        self._counts: dict[tuple[str, str], int] = {}
        self._lock = asyncio.Lock()

    async def take(self, uid: str) -> int:
        async with self._lock:
            key = (uid, _today())
            used = self._counts.get(key, 0)
            if used >= self._limit:
                raise RateLimitedError
            self._counts[key] = used + 1
            return self._limit - used - 1


class FirestoreRateLimiter:
    """Counts in Firestore, so limits survive the container sleeping and restarting.
    Clients cannot read or write these documents: the security rules deny them."""

    def __init__(self, app: firebase_admin.App, limit: int) -> None:
        self._db = firestore_async.client(app)
        self._limit = limit

    async def take(self, uid: str) -> int:
        day = _today()
        document = self._db.collection("rate_limits").document(f"{uid}_{day}")
        limit = self._limit

        @firestore.async_transactional
        async def count(transaction: firestore.AsyncTransaction) -> int:
            snapshot = await document.get(transaction=transaction)
            used = int(snapshot.get("count")) if snapshot.exists else 0
            if used >= limit:
                raise RateLimitedError
            transaction.set(document, {"uid": uid, "day": day, "count": used + 1})
            return limit - used - 1

        remaining: int = await count(self._db.transaction())
        return remaining
