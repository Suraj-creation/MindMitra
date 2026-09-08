"""FastAPI application entrypoint."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import __version__
from app.api.v1.router import v1_router
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create tables on startup only for a local SQLite fallback.

    Alembic owns the schema on Postgres. Running `create_all` there would race
    the migrations and, on Neon, would also block startup on waking a suspended
    compute — a failure at boot rather than a slow first request.
    """
    if settings.app_env == "dev" and not settings.is_postgres:
        from app.core.db import create_all_tables

        await create_all_tables()
    yield


app = FastAPI(
    title=settings.app_name,
    version=__version__,
    summary="Cognitive gaming & memory-assistance platform backend (SIH 2026, PS26003)",
    lifespan=lifespan,
)

# CORS for the Next.js dev client (localhost:3000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.web_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


class Health(BaseModel):
    """Liveness plus an honest capability report.

    The client renders a truthful degraded state from this rather than
    discovering a missing deployment through a failed call. `demo_mode` is what
    lets every surface label seeded data as seeded, so demo content is never
    mistaken for a real person's record.
    """

    status: str
    app: str
    env: str
    version: str
    demo_mode: bool
    capabilities: dict[str, bool]


@app.get("/health", tags=["system"], response_model=Health)
def health() -> Health:
    return Health(
        status="ok",
        app=settings.app_name,
        env=settings.app_env,
        version=__version__,
        demo_mode=settings.app_env == "dev",
        capabilities=settings.capabilities(),
    )
