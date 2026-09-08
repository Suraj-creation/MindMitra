"""Voice sessions — Azure Realtime speech-to-speech, behind a provider port.

The design documents specify Bhashini / AI4Bharat for Tier-A speech
(tech-stack §13.1). No Bhashini credentials exist yet and `gpt-realtime` is
deployed and working, so the Azure adapter is the live provider and Bhashini
slots in behind the same port later. That deviation is recorded rather than
quietly redefined.

**The browser never sees the API key.** The client asks this service for an
ephemeral session; the service mints one against Azure with a short-lived token
and returns only that. A key in browser code would be a key in every viewer's
devtools.

**The model is not the source of truth about the person.** Session instructions
are assembled from firewall-approved facts only, and the model is given tools to
look things up rather than a licence to remember. What it cannot retrieve, it
must say it does not know — inventing a granddaughter's visit time is the
failure mode this whole product exists to prevent.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Literal

import httpx

from app.core.config import Settings, get_settings

from .client import AIUnavailable

logger = logging.getLogger(__name__)

VoiceProvider = Literal["azure_realtime", "browser", "unavailable"]

# Azure's realtime voices. Warm and unhurried beats bright and fast for this
# population; the choice is per-person data, not a global default.
DEFAULT_VOICE = "alloy"


@dataclass(frozen=True)
class VoiceTool:
    """One bounded capability the voice model may call.

    Tools are how the companion answers "what time is Rina coming?" — by
    retrieval through the firewall, never from the model's own memory.
    """

    name: str
    description: str
    parameters: dict[str, Any]

    def to_azure(self) -> dict[str, Any]:
        return {
            "type": "function",
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }


@dataclass(frozen=True)
class VoiceSessionRequest:
    """What the companion needs to open a session for one person."""

    person_id: str
    display_name: str
    preferred_language: str = "as"
    language_tier: str = "A"
    instructions: str = ""
    tools: tuple[VoiceTool, ...] = ()
    voice: str = DEFAULT_VOICE


@dataclass(frozen=True)
class VoiceSession:
    """An ephemeral credential the browser may use, and nothing more."""

    provider: VoiceProvider
    session_id: str
    client_secret: str
    expires_at: int
    model: str
    voice: str
    webrtc_url: str
    reason: str = ""
    fallback: VoiceProvider = "browser"
    warnings: tuple[str, ...] = field(default_factory=tuple)


def provider_for(settings: Settings | None = None) -> VoiceProvider:
    """Which voice path this deployment can actually offer right now."""
    settings = settings or get_settings()
    if settings.speech_provider == "browser":
        return "browser"
    if settings.realtime_configured:
        return "azure_realtime"
    return "browser"


async def mint_session(
    request: VoiceSessionRequest, settings: Settings | None = None
) -> VoiceSession:
    """Create an ephemeral Azure Realtime session for one person.

    Raises `AIUnavailable` when realtime is not configured or Azure refuses.
    The caller must fall back to the browser path rather than surfacing an
    error: for the person, voice going quiet must degrade to buttons and
    pictures, never to an error message she has to interpret.
    """
    settings = settings or get_settings()
    if not settings.realtime_configured:
        raise AIUnavailable("No realtime deployment is configured.")

    endpoint = (settings.azure_openai_endpoint or "").rstrip("/")
    deployment = settings.azure_openai_realtime_deployment or ""
    url = f"{endpoint}/openai/realtimeapi/sessions"

    payload: dict[str, Any] = {
        "model": deployment,
        "voice": request.voice,
        "instructions": request.instructions,
        "modalities": ["audio", "text"],
        # Server-side turn detection gives natural turn-taking and barge-in
        # without the client having to guess when a pause means "your turn".
        # The silence window is generous on purpose: an older person mid-sentence
        # must not be interrupted by the system deciding she has finished.
        "turn_detection": {
            "type": "server_vad",
            "threshold": 0.5,
            "prefix_padding_ms": 300,
            "silence_duration_ms": 1200,
        },
        "input_audio_transcription": {"model": "whisper-1"},
    }
    if request.tools:
        payload["tools"] = [tool.to_azure() for tool in request.tools]
        payload["tool_choice"] = "auto"

    headers = {
        "api-key": settings.azure_openai_api_key or "",
        "Content-Type": "application/json",
    }
    params = {"api-version": settings.azure_openai_api_version}

    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            response = await http.post(url, json=payload, headers=headers, params=params)
    except httpx.HTTPError as exc:
        logger.warning("realtime session mint failed: %s", type(exc).__name__)
        raise AIUnavailable("Could not reach the voice service.") from exc

    if response.status_code >= 400:
        # Never log the body: it can echo the instructions, which carry the
        # person's own facts.
        logger.warning(
            "realtime session refused: status=%d deployment=%s",
            response.status_code,
            deployment,
        )
        raise AIUnavailable(f"Voice service refused the session ({response.status_code}).")

    body = response.json()
    secret = (body.get("client_secret") or {}).get("value", "")
    if not secret:
        raise AIUnavailable("Voice service returned no ephemeral credential.")

    warnings: list[str] = []
    if request.language_tier != "A":
        warnings.append(
            f"Tier-{request.language_tier} language: speech recognition is not "
            "supported for this language. Voice output only; use taps for input."
        )

    logger.info(
        "realtime session minted person=%s model=%s tier=%s tools=%d",
        request.person_id,
        deployment,
        request.language_tier,
        len(request.tools),
    )

    return VoiceSession(
        provider="azure_realtime",
        session_id=str(body.get("id", "")),
        client_secret=secret,
        expires_at=int((body.get("client_secret") or {}).get("expires_at", 0)),
        model=deployment,
        voice=request.voice,
        webrtc_url=f"{endpoint}/openai/realtimeapi/v1/realtime",
        warnings=tuple(warnings),
    )
