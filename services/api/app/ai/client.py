"""The Azure OpenAI client, in one place.

Application code never imports the Azure SDK. It calls `chat`, `structured` or
`embeddings`, which are thin, typed and mockable. Swapping provider — or adding
the Indic/open track the residency story needs — is then a change here rather
than a change everywhere.

Three properties this layer owns:

* **Availability is a value, not an exception.** `is_configured()` reports what
  is actually wired, so a surface can render an honest degraded state instead of
  discovering a missing deployment through a 500.
* **Every call is bounded.** Timeout and retry count come from settings; nothing
  waits forever on a model.
* **Logs carry the request id and model version, never the content.** The
  content is a person's memories or a caregiver's private note.
"""

from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass
from typing import Any

from openai import APIError, AsyncAzureOpenAI, APITimeoutError, RateLimitError

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


class AIUnavailable(RuntimeError):
    """The model could not be reached, or is not configured.

    Callers must handle this. Every AI-touched surface has a deterministic
    fallback, because "the AI failed" is a normal operating state in a product
    used over intermittent rural connectivity.
    """


@dataclass(frozen=True)
class Usage:
    """What a call cost, for the observability trail. Never includes content."""

    request_id: str
    model: str
    latency_ms: int
    prompt_tokens: int | None = None
    completion_tokens: int | None = None


class AzureClient:
    """A lazily-constructed Azure OpenAI client.

    Constructing this is free and never touches the network, so it is safe to
    build at import time and in tests.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._client: AsyncAzureOpenAI | None = None

    # ── Availability ──────────────────────────────────────────────────────────
    @property
    def settings(self) -> Settings:
        return self._settings

    def is_configured(self) -> bool:
        return self._settings.llm_configured

    def deployment(self, *, fast: bool = False) -> str:
        name = self._settings.fast_deployment if fast else self._settings.chat_deployment
        if not name:
            raise AIUnavailable("No Azure OpenAI chat deployment is configured.")
        return name

    # ── The underlying SDK client ─────────────────────────────────────────────
    def raw(self) -> AsyncAzureOpenAI:
        if not self.is_configured():
            raise AIUnavailable(
                "Azure OpenAI is not configured "
                "(AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, a chat deployment)."
            )
        if self._client is None:
            self._client = AsyncAzureOpenAI(
                azure_endpoint=self._settings.azure_openai_endpoint or "",
                api_key=self._settings.azure_openai_api_key,
                api_version=self._settings.azure_openai_api_version,
                timeout=self._settings.llm_timeout_seconds,
                max_retries=0,  # retries are handled here so they can be logged
            )
        return self._client

    # ── The one call path ─────────────────────────────────────────────────────
    async def complete(
        self,
        *,
        messages: list[dict[str, Any]],
        fast: bool = False,
        temperature: float = 0.2,
        max_tokens: int = 800,
        response_format: dict[str, Any] | None = None,
        purpose: str = "unspecified",
    ) -> tuple[str, Usage]:
        """One chat completion, with bounded retries.

        `purpose` is a short label that goes into the log line, so a slow or
        failing call can be traced to the capability that made it without
        recording anything the model was actually shown.
        """
        client = self.raw()
        model = self.deployment(fast=fast)
        request_id = uuid.uuid4().hex[:12]
        attempts = max(1, self._settings.llm_max_retries + 1)

        last_error: Exception | None = None
        for attempt in range(1, attempts + 1):
            started = time.monotonic()
            try:
                kwargs: dict[str, Any] = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if response_format is not None:
                    kwargs["response_format"] = response_format

                response = await client.chat.completions.create(**kwargs)
                latency_ms = int((time.monotonic() - started) * 1000)

                content = (response.choices[0].message.content or "") if response.choices else ""
                usage = Usage(
                    request_id=request_id,
                    model=getattr(response, "model", model),
                    latency_ms=latency_ms,
                    prompt_tokens=getattr(response.usage, "prompt_tokens", None)
                    if response.usage
                    else None,
                    completion_tokens=getattr(response.usage, "completion_tokens", None)
                    if response.usage
                    else None,
                )
                logger.info(
                    "ai.complete ok req=%s purpose=%s model=%s latency_ms=%d attempt=%d",
                    request_id,
                    purpose,
                    usage.model,
                    latency_ms,
                    attempt,
                )
                return content, usage

            except (APITimeoutError, RateLimitError) as exc:
                last_error = exc
                logger.warning(
                    "ai.complete retryable req=%s purpose=%s attempt=%d/%d error=%s",
                    request_id,
                    purpose,
                    attempt,
                    attempts,
                    type(exc).__name__,
                )
            except APIError as exc:
                # A 4xx from the model service is not worth retrying.
                logger.error(
                    "ai.complete failed req=%s purpose=%s error=%s",
                    request_id,
                    purpose,
                    type(exc).__name__,
                )
                raise AIUnavailable(f"model call failed: {type(exc).__name__}") from exc

        raise AIUnavailable(
            f"model call failed after {attempts} attempts: {type(last_error).__name__}"
        ) from last_error


_client: AzureClient | None = None


def get_client() -> AzureClient:
    """Process-wide client. Cheap to call; constructs nothing until used."""
    global _client
    if _client is None:
        _client = AzureClient()
    return _client
