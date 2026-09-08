"""GameContext — the Studio's GAME_INPUT.

Assembled by the orchestrator *after* the Memory Firewall has scoped access, so
`verified_entities` are already in-scope and verified. The grounding validator
still re-checks the produced spec against the PWM source of truth independently
(defence in depth): the context tells the compiler what it *may* use; the
validator confirms what the compiler *did* use.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from .spec import CognitiveDomain, LanguageTier, Modality, TemporalFrame


class GameContext(BaseModel):
    model_config = ConfigDict(frozen=True)

    person_id: str

    cognitive_goal: tuple[CognitiveDomain, ...] = Field(min_length=1)
    functional_goal: str | None = None

    # Scope the compiler must stay within.
    allowed_memory_scope: tuple[str, ...] = ()
    allowed_media_scope: tuple[str, ...] = ()
    verified_entities: tuple[str, ...] = ()  # PWM fact ids, verified + in-scope
    verified_relationships: tuple[str, ...] = ()

    temporal_context: TemporalFrame = TemporalFrame.PRESENT

    # Uncertainty-aware capability estimates θ per domain (0..1), not a single score.
    capability_state: dict[CognitiveDomain, float] = Field(default_factory=dict)

    preferred_language: str
    language_tier: LanguageTier
    cultural_context: str

    sensory_constraints: tuple[str, ...] = ()
    desired_duration_seconds: int = Field(default=840, gt=0, le=3600)
    target_difficulty: float = Field(default=0.8, gt=0.0, lt=1.0)
    modality_hint: Modality = Modality.MIXED

    safety_constraints: tuple[str, ...] = ()
