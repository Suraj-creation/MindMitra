"""Prove the AI layer actually reaches Azure, and fails honestly when it cannot.

Run from services/api:  python scripts/verify_ai.py
"""

from __future__ import annotations

import asyncio
import sys

from pydantic import BaseModel, Field

from app.ai import (
    AIUnavailable,
    StructuredGenerationError,
    generate_structured,
    get_client,
    get_embedder,
    provider_for,
)
from app.ai.realtime import VoiceSessionRequest, VoiceTool, mint_session


class ActivityIdea(BaseModel):
    """A deliberately small schema, to prove the structured path round-trips."""

    title: str = Field(max_length=60)
    engine: str
    cognitive_domain: str
    minutes: int = Field(ge=1, le=30)


def rule(title: str) -> None:
    print()
    print("=" * 74)
    print(title)
    print("=" * 74)


async def main() -> int:
    client = get_client()

    rule("1. Chat completion")
    if not client.is_configured():
        print("  Azure is not configured. Nothing else here can run.")
        return 1
    try:
        text, usage = await client.complete(
            messages=[
                {
                    "role": "system",
                    "content": "Reply with exactly one short sentence, no preamble.",
                },
                {"role": "user", "content": "Name one traditional Assamese festival."},
            ],
            fast=True,
            max_tokens=60,
            purpose="verify",
        )
        print(f"  model     : {usage.model}")
        print(f"  latency   : {usage.latency_ms} ms")
        print(f"  tokens    : {usage.prompt_tokens} in / {usage.completion_tokens} out")
        print(f"  request id: {usage.request_id}")
        print(f"  reply     : {text.strip()[:120]}")
    except AIUnavailable as exc:
        print(f"  UNAVAILABLE: {exc}")
        return 1

    rule("2. Structured generation - the LLM proposes, the schema decides")
    try:
        idea, usage = await generate_structured(
            ActivityIdea,
            system=(
                "You design cognitive activities for an older adult in Assam. "
                "Reply with JSON matching the schema and nothing else."
            ),
            user=(
                "Propose one gentle photograph-matching activity. "
                "engine must be one of: matching, sequencing, selection, naming."
            ),
            purpose="verify",
            max_tokens=300,
        )
        print(f"  parsed into {type(idea).__name__}, validated by Pydantic:")
        print(f"    title           : {idea.title}")
        print(f"    engine          : {idea.engine}")
        print(f"    cognitive domain: {idea.cognitive_domain}")
        print(f"    minutes         : {idea.minutes}")
        print(f"  model: {usage.model}  latency: {usage.latency_ms} ms")
    except StructuredGenerationError as exc:
        print(f"  SCHEMA REJECTED (this is the safe outcome): {exc}")
    except AIUnavailable as exc:
        print(f"  UNAVAILABLE: {exc}")

    rule("3. Embeddings - absent on this deployment, and honest about it")
    embedder = get_embedder()
    print(f"  available : {embedder.available}")
    print(f"  dimensions: {embedder.dimensions}")
    if not embedder.available:
        try:
            await embedder.embed(["anything"])
            print("  ERROR: a null embedder returned vectors")
            return 1
        except AIUnavailable as exc:
            print(f"  refuses to guess: {exc}")

    rule("4. Realtime voice - an ephemeral session, never the API key")
    print(f"  provider: {provider_for()}")
    try:
        session = await mint_session(
            VoiceSessionRequest(
                person_id="person:purnima",
                display_name="Purnima",
                preferred_language="as",
                instructions=(
                    "You are a warm companion. Only state facts returned by your "
                    "tools. If a tool returns nothing, say you do not know."
                ),
                tools=(
                    VoiceTool(
                        name="whats_next",
                        description="What is happening next today for this person.",
                        parameters={"type": "object", "properties": {}, "required": []},
                    ),
                ),
            )
        )
        print(f"  session id : {session.session_id}")
        print(f"  model      : {session.model}")
        print(f"  voice      : {session.voice}")
        print(f"  credential : ephemeral, {len(session.client_secret)} chars, expires {session.expires_at}")
        print(f"  webrtc url : {session.webrtc_url}")
        for warning in session.warnings:
            print(f"  warning    : {warning}")
    except AIUnavailable as exc:
        print(f"  UNAVAILABLE (client falls back to browser speech): {exc}")

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
