"""Typed application settings (12-factor, env-driven).

Nothing here reaches out to a network at import time; construction is cheap and
safe for tests. Secrets come from the environment, never from code.

Env files are read in increasing priority: `.env` then `.env.local`. Both are
looked for beside this service *and* at the repository root, because the Neon
and Azure credentials live in the root `.env.local` while service-specific
settings belong next to the service.

Every external capability is **optional**. A missing Azure deployment or an
absent database URL must produce a named, visible "unavailable" state that the
product can render — never an import-time crash. `Settings.capabilities()`
reports what is actually wired so the API can tell a client the truth instead
of failing at the first call.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# services/api/app/core/config.py → services/api → services → <repo root>
_SERVICE_DIR = Path(__file__).resolve().parents[2]
_REPO_ROOT = _SERVICE_DIR.parents[1]

# Later entries win in pydantic-settings, so root files load first and the
# service's own files override them.
_ENV_FILES: tuple[Path, ...] = (
    _REPO_ROOT / ".env",
    _REPO_ROOT / ".env.local",
    _SERVICE_DIR / ".env",
    _SERVICE_DIR / ".env.local",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: Literal["dev", "preview", "staging", "prod"] = "dev"
    app_name: str = "MindMitra"
    api_v1_prefix: str = "/v1"
    log_level: str = "INFO"
    # Deployment supplies its own JSON list through WEB_ORIGINS. The local
    # defaults cover Next's usual port and the alternate port used when a
    # second development server is already running.
    web_origins: tuple[str, ...] = (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3100",
        "http://127.0.0.1:3100",
    )

    # Crisis routing (deterministic; see Safety Gateway check 8).
    tele_manas_number: str = Field(default="14416")

    # ── Persistence ───────────────────────────────────────────────────────────
    # Neon in every environment that has it; sqlite only as a local fallback.
    database_url: str | None = None

    # ── Authentication ────────────────────────────────────────────────────────
    # A dev default exists so the test suite constructs without configuration.
    # Startup refuses to boot with this value when app_env is prod (see main).
    jwt_secret: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_minutes: int = 30
    jwt_refresh_ttl_days: int = 30
    # The person's surface has no session timeout at all (DESIGN.md G1/A17).
    # Their device-bound token is long-lived by design, not by oversight.
    person_device_token_ttl_days: int = 365

    # ── Azure OpenAI ──────────────────────────────────────────────────────────
    azure_openai_endpoint: str | None = None
    azure_openai_api_key: str | None = None
    azure_openai_api_version: str = "2025-04-01-preview"

    # `azure_openai_deployment` is the legacy single-deployment name already in
    # .env.local; it seeds the chat deployment when nothing more specific is set.
    azure_openai_deployment: str | None = None
    azure_openai_chat_deployment: str | None = None
    azure_openai_fast_deployment: str | None = None
    azure_openai_realtime_deployment: str | None = "gpt-realtime"
    # No embeddings deployment exists on the current resource. Left None on
    # purpose: the retrieval layer runs its lexical lane and skips the vector
    # lane rather than pretending to have semantics it does not have.
    azure_openai_embeddings_deployment: str | None = None
    azure_openai_embedding_dimensions: int = 1536

    llm_timeout_seconds: float = 30.0
    llm_max_retries: int = 2

    # ── Speech ────────────────────────────────────────────────────────────────
    # Tier-A speech is specified as Bhashini (tech-stack §13.1). No credentials
    # exist yet, so the Azure Realtime adapter is the live provider and Bhashini
    # slots in behind the same port when these are populated.
    speech_provider: Literal["azure_realtime", "bhashini", "browser"] = "azure_realtime"
    bhashini_api_key: str | None = None
    bhashini_user_id: str | None = None

    # ── Object storage ────────────────────────────────────────────────────────
    b2_application_key_id: str | None = None
    b2_application_key: str | None = None
    b2_bucket: str = "mindmitra-assets"

    # ── Derived accessors ─────────────────────────────────────────────────────
    @property
    def chat_deployment(self) -> str | None:
        return self.azure_openai_chat_deployment or self.azure_openai_deployment

    @property
    def fast_deployment(self) -> str | None:
        return self.azure_openai_fast_deployment or self.chat_deployment

    @property
    def llm_configured(self) -> bool:
        return bool(
            self.azure_openai_endpoint
            and self.azure_openai_api_key
            and self.chat_deployment
        )

    @property
    def embeddings_configured(self) -> bool:
        return bool(
            self.azure_openai_endpoint
            and self.azure_openai_api_key
            and self.azure_openai_embeddings_deployment
        )

    @property
    def realtime_configured(self) -> bool:
        return bool(
            self.azure_openai_endpoint
            and self.azure_openai_api_key
            and self.azure_openai_realtime_deployment
        )

    @property
    def is_postgres(self) -> bool:
        return bool(self.database_url and "postgres" in self.database_url)

    def capabilities(self) -> dict[str, bool]:
        """What is actually wired right now.

        Surfaced at `/health` so a client renders a truthful degraded state
        instead of discovering the gap through a 500.
        """
        return {
            "database": bool(self.database_url),
            "postgres": self.is_postgres,
            "llm": self.llm_configured,
            "embeddings": self.embeddings_configured,
            "realtime_voice": self.realtime_configured,
            "object_storage": bool(self.b2_application_key_id and self.b2_application_key),
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
