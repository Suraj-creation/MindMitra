"""The AI provider layer — one place that knows about Azure OpenAI.

Application code imports from here, never from the Azure SDK. Four separated
concerns, because they fail differently and are configured differently:

    client       chat completion, bounded and logged without content
    structured   LLM proposes, a Pydantic model decides
    embeddings   behind a port; absent on this deployment, and honest about it
    realtime     ephemeral voice sessions; the browser never sees the API key

Nothing here decides what a caller may see. Every one of these takes content
that has **already** passed the Memory Firewall — the boundary is evaluated
before a model is reached, never after.

Public API:

    from app.ai import (
        AIUnavailable, AzureClient, get_client, Usage,
        generate_structured, StructuredGenerationError,
        Embedder, get_embedder,
        VoiceSession, VoiceSessionRequest, VoiceTool, mint_session, provider_for,
    )
"""

from __future__ import annotations

from .client import AIUnavailable, AzureClient, Usage, get_client
from .embeddings import AzureEmbedder, Embedder, NullEmbedder, get_embedder
from .realtime import (
    VoiceProvider,
    VoiceSession,
    VoiceSessionRequest,
    VoiceTool,
    mint_session,
    provider_for,
)
from .structured import StructuredGenerationError, generate_structured

__all__ = [
    "AIUnavailable",
    "AzureClient",
    "AzureEmbedder",
    "Embedder",
    "NullEmbedder",
    "StructuredGenerationError",
    "Usage",
    "VoiceProvider",
    "VoiceSession",
    "VoiceSessionRequest",
    "VoiceTool",
    "generate_structured",
    "get_client",
    "get_embedder",
    "mint_session",
    "provider_for",
]
