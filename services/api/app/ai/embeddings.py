"""Embeddings behind a port, so their absence is a capability gap, not a crash.

The Azure resource this project uses has chat and realtime deployments but **no
embeddings deployment**. Rather than pretend otherwise, the retrieval layer asks
this module whether a vector lane is available and runs its lexical lane when it
is not. Adding `AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT` lights the vector lane up
with no other change.

`NullEmbedder` is not a stub that returns zeros — a zero vector would make every
similarity identical and silently produce nonsense rankings. It reports itself
unavailable and refuses to embed.
"""

from __future__ import annotations

import logging
from typing import Protocol, runtime_checkable

from .client import AIUnavailable, AzureClient, get_client

logger = logging.getLogger(__name__)


@runtime_checkable
class Embedder(Protocol):
    """Turns text into vectors, or says it cannot."""

    @property
    def available(self) -> bool: ...

    @property
    def dimensions(self) -> int: ...

    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class NullEmbedder:
    """No embeddings deployment. Reports unavailable and refuses to guess."""

    @property
    def available(self) -> bool:
        return False

    @property
    def dimensions(self) -> int:
        return 0

    async def embed(self, texts: list[str]) -> list[list[float]]:
        raise AIUnavailable(
            "No embeddings deployment is configured. The retrieval layer should "
            "run its lexical lane instead of calling this."
        )


class AzureEmbedder:
    """Azure OpenAI embeddings."""

    def __init__(self, client: AzureClient | None = None) -> None:
        self._client = client or get_client()

    @property
    def available(self) -> bool:
        return self._client.settings.embeddings_configured

    @property
    def dimensions(self) -> int:
        return self._client.settings.azure_openai_embedding_dimensions

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not self.available:
            raise AIUnavailable("No embeddings deployment is configured.")
        if not texts:
            return []

        deployment = self._client.settings.azure_openai_embeddings_deployment or ""
        response = await self._client.raw().embeddings.create(
            model=deployment, input=texts
        )
        # Preserve input order explicitly; the API returns an index per item.
        ordered = sorted(response.data, key=lambda d: d.index)
        return [list(item.embedding) for item in ordered]


def get_embedder(client: AzureClient | None = None) -> Embedder:
    """The embedder this deployment actually has."""
    candidate = AzureEmbedder(client)
    if candidate.available:
        return candidate
    logger.info(
        "embeddings unavailable: retrieval will use its lexical lane only"
    )
    return NullEmbedder()
