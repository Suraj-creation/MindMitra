"""Companion API — the governed conversation, in text and in voice.

Three endpoints, and the fallback ladder between them is the design:

    POST /persons/{id}/companion/turn    text in, governed answer out
    POST /persons/{id}/voice/session     an ephemeral realtime credential
    POST /persons/{id}/voice/tool        a tool call, executed under the firewall

Voice degrades in this order, and every rung is a real product state rather than
an error: Azure Realtime speech-to-speech, then the browser's own speech
recognition and synthesis over the text endpoint, then text, then buttons and
pictures. For the person, voice going quiet must never surface as a message she
has to interpret (DESIGN.md E6 state 10).

`GET /persons/{id}/voice/capability` exists so the client can pick its rung
*before* trying, rather than by failing.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import AIUnavailable, mint_session, provider_for
from app.ai.realtime import VoiceSessionRequest
from app.auth.deps import CareActor
from app.core.db import get_session
from app.firewall.roles import Purpose, Role
from app.identity.service import get_person
from app.orchestrator import CompanionTurn, run_turn
from app.orchestrator.voice import (
    PERSON_TOOLS,
    build_instructions,
    execute_tool,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["companion"])

Session = Annotated[AsyncSession, Depends(get_session)]

# Voice belongs to the person's surface. A caregiver reading a summary aloud is
# a client-side concern; a caregiver opening a speech session as the person is
# not something the product offers.
_VOICE_ROLES = frozenset({Role.PERSON})


class TurnRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    speakable: bool = True


class VoiceCapability(BaseModel):
    """What voice this deployment and this person can actually have."""

    model_config = ConfigDict(frozen=True)

    provider: str
    realtime_available: bool
    language: str
    language_tier: str
    # Tier B and C have no live speech recognition. The client must show
    # picture-and-tap input rather than a microphone that will not work.
    speech_input_supported: bool
    speech_output_supported: bool
    fallback: str
    note: str


class VoiceSessionResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    provider: str
    session_id: str
    client_secret: str
    expires_at: int
    model: str
    voice: str
    webrtc_url: str
    tools: tuple[str, ...]
    warnings: tuple[str, ...] = ()


class ToolCallRequest(BaseModel):
    tool_name: str = Field(max_length=64)
    arguments: dict = Field(default_factory=dict)


class ToolCallResponse(BaseModel):
    tool_name: str
    result: dict


@router.post("/persons/{person_id}/companion/turn", response_model=CompanionTurn)
async def companion_turn(
    body: TurnRequest,
    actor: CareActor,
    session: Session,
) -> CompanionTurn:
    """One governed turn.

    This is both the text companion and the fallback for every voice path, so it
    carries the same guarantees either way: emergency and medication never reach
    a model, retrieval is firewall-scoped, and the Safety Gateway runs over the
    result.
    """
    person = await get_person(session, actor.subject_person_id)
    purpose = (
        Purpose.SELF_ACCESS if actor.role is Role.PERSON else Purpose.CARE_COORDINATION
    )

    return await run_turn(
        session,
        actor=actor,
        question=body.message,
        display_name=person.display_name if person else "",
        language=person.preferred_language if person else "en",
        purpose=purpose,
        speakable=body.speakable,
    )


@router.get(
    "/persons/{person_id}/voice/capability", response_model=VoiceCapability
)
async def voice_capability(actor: CareActor, session: Session) -> VoiceCapability:
    """What voice is possible here, so the client never offers what cannot work."""
    person = await get_person(session, actor.subject_person_id)
    tier = person.language_tier if person else "A"
    language = person.preferred_language if person else "en"

    # Voice belongs to the person's surface. Reporting "speech available" to a
    # caregiver whose session request would be refused would have them build a
    # microphone button that cannot work.
    on_person_surface = actor.role in _VOICE_ROLES
    provider = provider_for() if on_person_surface else "unavailable"
    realtime = provider == "azure_realtime"

    # Tier A: full conversation. Tier B: voice out, tap in. Tier C: recorded
    # voice packs and pictures — no live recognition at all (Blueprint §6.3).
    speech_in = realtime and tier == "A"
    speech_out = on_person_surface and tier in ("A", "B")

    if not on_person_surface:
        note = (
            "Spoken conversation is part of the person's own surface. "
            "This role reads and writes, and does not speak as them."
        )
    elif not realtime:
        note = (
            "Live voice is unavailable. The companion works by typing, and the "
            "browser's own speech can read replies aloud."
        )
    elif tier == "A":
        note = "Full spoken conversation is available in this language."
    elif tier == "B":
        note = (
            "This language has spoken replies but no speech recognition yet. "
            "Answers are read aloud; input is by tapping."
        )
    else:
        note = (
            "This language uses recorded human voice and pictures. "
            "There is no live speech recognition for it."
        )

    return VoiceCapability(
        provider=provider,
        realtime_available=realtime,
        language=language,
        language_tier=tier,
        speech_input_supported=speech_in,
        speech_output_supported=speech_out,
        fallback="none" if not on_person_surface
        else ("browser_speech" if not realtime else "text"),
        note=note,
    )


@router.post(
    "/persons/{person_id}/voice/session", response_model=VoiceSessionResponse
)
async def voice_session(actor: CareActor, session: Session) -> VoiceSessionResponse:
    """Mint an ephemeral realtime credential for the person's own surface.

    The browser receives a short-lived session secret and never the API key.
    Instructions carry orientation only; every fact the model states must come
    back through `/voice/tool`, where the firewall runs.
    """
    if actor.role not in _VOICE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A voice session belongs to the person's own surface.",
        )

    person = await get_person(session, actor.subject_person_id)
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    try:
        minted = await mint_session(
            VoiceSessionRequest(
                person_id=person.person_id,
                display_name=person.display_name,
                preferred_language=person.preferred_language,
                language_tier=person.language_tier,
                instructions=build_instructions(
                    display_name=person.display_name,
                    language=person.preferred_language,
                    language_tier=person.language_tier,
                ),
                tools=PERSON_TOOLS,
            )
        )
    except AIUnavailable as exc:
        # 503, not 500: the client's job is to drop to the next rung of the
        # ladder, and it needs to know this is availability rather than a bug.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Live voice is not available right now.",
        ) from exc

    return VoiceSessionResponse(
        provider=minted.provider,
        session_id=minted.session_id,
        client_secret=minted.client_secret,
        expires_at=minted.expires_at,
        model=minted.model,
        voice=minted.voice,
        webrtc_url=minted.webrtc_url,
        tools=tuple(tool.name for tool in PERSON_TOOLS),
        warnings=minted.warnings,
    )


@router.post("/persons/{person_id}/voice/tool", response_model=ToolCallResponse)
async def voice_tool(
    body: ToolCallRequest,
    actor: CareActor,
    session: Session,
) -> ToolCallResponse:
    """Execute one tool call the realtime model asked for.

    This is the firewall's seat in the voice loop. The model can ask for
    anything; what comes back is whatever this actor is authorised to know, and
    an unauthorised or unknown request returns "not found" rather than an error
    the person would hear as a failure.
    """
    result = await execute_tool(
        session,
        actor=actor,
        tool_name=body.tool_name,
        arguments=body.arguments,
    )
    return ToolCallResponse(tool_name=body.tool_name, result=result)
