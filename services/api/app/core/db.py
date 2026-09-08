"""Async SQLAlchemy engine + session factory.

Database URL comes from settings. Neon in every environment that has it;
`sqlite+aiosqlite://` only as a local fallback so the test suite runs with no
external configuration.

Neon hands out libpq-style URLs (`postgresql://…?sslmode=require&channel_binding=require`).
asyncpg understands neither the scheme nor those query parameters, so
`normalise_database_url` rewrites the scheme and lifts TLS out of the query
string into connect_args. Doing this in one place means every caller — the app,
Alembic, the seed script — gets the same treatment.

The session factory is exposed as a FastAPI dependency via `get_session`.
Tests override this via `app.dependency_overrides`.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

# libpq accepts these; asyncpg rejects them as unknown connection kwargs.
_LIBPQ_ONLY_PARAMS = frozenset({"sslmode", "channel_binding", "options", "target_session_attrs"})

# sslmode values that mean "encrypt the connection".
_TLS_MODES = frozenset({"require", "verify-ca", "verify-full", "prefer", "allow"})


def normalise_database_url(url: str) -> tuple[str, dict[str, Any]]:
    """Return an asyncpg-compatible URL and the connect_args it needs.

    Rewrites `postgresql://` → `postgresql+asyncpg://`, strips libpq-only query
    parameters, and turns `sslmode` into an asyncpg `ssl` argument. Non-Postgres
    URLs (sqlite) pass through untouched.
    """
    if not url.startswith(("postgres://", "postgresql://", "postgresql+asyncpg://")):
        return url, {}

    parts = urlsplit(url)
    scheme = "postgresql+asyncpg"

    kept: list[tuple[str, str]] = []
    connect_args: dict[str, Any] = {}
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key.lower() == "sslmode":
            if value.lower() in _TLS_MODES and value.lower() != "disable":
                connect_args["ssl"] = True
            continue
        if key.lower() in _LIBPQ_ONLY_PARAMS:
            continue
        kept.append((key, value))

    # Neon always requires TLS; default to it when the URL did not say so.
    if "neon.tech" in (parts.hostname or ""):
        connect_args.setdefault("ssl", True)
        # A suspended Neon compute takes a few seconds to wake. Without a
        # generous timeout the first request after an idle period fails rather
        # than waits.
        connect_args.setdefault("timeout", 30)
        # Neon's pooler is pgbouncer in transaction mode, which cannot hold
        # asyncpg's server-side prepared statements.
        if "-pooler." in (parts.hostname or ""):
            connect_args.setdefault("statement_cache_size", 0)

    normalised = urlunsplit((scheme, parts.netloc, parts.path, urlencode(kept), parts.fragment))
    return normalised, connect_args


settings = get_settings()

_RAW_URL = settings.database_url or "sqlite+aiosqlite:///./dev.db"
_DATABASE_URL, _CONNECT_ARGS = normalise_database_url(_RAW_URL)

engine = create_async_engine(
    _DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=_CONNECT_ARGS,
)

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency that yields an AsyncSession per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def _import_all_orm_modules() -> None:
    """Import every domain ORM module so its tables register on Base.metadata.

    Alembic's autogenerate and dev `create_all` both need the full metadata, and
    a table whose module is never imported is silently missing from both.
    """
    import app.auth.db  # noqa: F401
    import app.escalation.db  # noqa: F401
    import app.identity.db  # noqa: F401
    import app.observation.db  # noqa: F401


async def create_all_tables() -> None:
    """Create all tables (for dev/test; production uses Alembic migrations)."""
    from app.core.models import Base

    _import_all_orm_modules()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
