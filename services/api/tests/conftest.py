"""Shared pytest fixtures for DB-backed tests.

Provides an in-memory aiosqlite session with every table created, plus an HTTP
client wired to that same session so the API layer can be tested end to end.

Importing the domain ORM modules registers their tables on the shared
Base.metadata (PWM + audit tables come from app.core.models).
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Register all domain ORM tables on the shared Base.metadata.
import app.auth.db  # noqa: F401
import app.escalation.db  # noqa: F401
import app.identity.db  # noqa: F401
import app.observation.db  # noqa: F401
from app.core.models import Base


@pytest_asyncio.fixture
async def db_engine():
    """One in-memory database shared by every connection in a test.

    `StaticPool` keeps a single connection alive so the API under test and the
    fixtures that seed it observe the same data — a plain in-memory URL gives
    each connection its own empty database.
    """
    from sqlalchemy.pool import StaticPool

    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncIterator[AsyncSession]:
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine) -> AsyncIterator[AsyncClient]:
    """An HTTP client against the real app, sharing the test database.

    Both `get_session` and the independent audit sink are redirected at the test
    engine, so audit rows written outside the request transaction are still
    observable by assertions.
    """
    import app.core.db as core_db
    from app.main import app

    factory = async_sessionmaker(db_engine, expire_on_commit=False)

    async def _override_session() -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    original_factory = core_db.AsyncSessionLocal
    core_db.AsyncSessionLocal = factory  # type: ignore[assignment]
    app.dependency_overrides[core_db.get_session] = _override_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http:
        yield http

    app.dependency_overrides.clear()
    core_db.AsyncSessionLocal = original_factory  # type: ignore[assignment]


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
