"""Alembic migration environment.

Supports both offline (SQL script generation) and online (live DB) modes.

The database URL comes from the application settings rather than straight from
`os.environ`, so migrations and the running app always target the same database.
Reading `DATABASE_URL` directly used to mean Alembic silently fell back to
SQLite while the app talked to Neon — the two would drift without any error.

`normalise_database_url` handles Neon's libpq-style URLs, which asyncpg cannot
parse as given.
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings
from app.core.db import _import_all_orm_modules, normalise_database_url

# Import Base and every domain ORM module so Alembic sees the full metadata.
from app.core.models import Base  # noqa: F401

_import_all_orm_modules()

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

_settings = get_settings()
_RAW_URL = _settings.database_url or "sqlite+aiosqlite:///./dev.db"
_DATABASE_URL, _CONNECT_ARGS = normalise_database_url(_RAW_URL)
config.set_main_option("sqlalchemy.url", _DATABASE_URL)


def run_migrations_offline() -> None:
    context.configure(
        url=_DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    section = config.get_section(config.config_ini_section, {}) or {}
    connectable = async_engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=_CONNECT_ARGS,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
