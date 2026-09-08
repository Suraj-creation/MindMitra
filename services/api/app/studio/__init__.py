"""Agentic Cognitive Studio.

The Studio's job is to turn a grounded `GameContext` into a validated, structured
`ExperienceSpec` — **never executable code**. An LLM proposes the spec; two
deterministic validators (grounding + safety/dignity) gate it; one of seven
pre-built engines renders it. This package holds the schema and the validators;
the LLM proposer and the renderer live elsewhere.

Public API:

    from app.studio import (
        GameContext, ExperienceSpec, ContentSource, ActivityDefinition,
        DignityConstraints, SafetyMetadata, ScaffoldingPolicy,
        EngineType, CognitiveDomain, Modality, LanguageTier, TemporalFrame,
        grounding_validator, dignity_validator, validate_spec,
        ValidationResult, PwmLookup, ResolvedFact,
    )
"""

from __future__ import annotations

from .context import GameContext
from .spec import (
    ActivityDefinition,
    ActivityItem,
    CognitiveDomain,
    ContentKind,
    ContentSource,
    DignityConstraints,
    EngineType,
    ExperienceSpec,
    LanguageTier,
    Modality,
    PrimitiveFamily,
    SafetyMetadata,
    ScaffoldingPolicy,
    TargetBand,
    TemporalFrame,
    VerificationStatus,
)
from .validators import (
    PwmLookup,
    ResolvedFact,
    ValidationResult,
    Violation,
    dignity_validator,
    grounding_validator,
    validate_spec,
)

__all__ = [
    "ActivityDefinition",
    "ActivityItem",
    "CognitiveDomain",
    "ContentKind",
    "ContentSource",
    "DignityConstraints",
    "EngineType",
    "ExperienceSpec",
    "GameContext",
    "LanguageTier",
    "Modality",
    "PrimitiveFamily",
    "PwmLookup",
    "ResolvedFact",
    "SafetyMetadata",
    "ScaffoldingPolicy",
    "TargetBand",
    "TemporalFrame",
    "ValidationResult",
    "VerificationStatus",
    "Violation",
    "dignity_validator",
    "grounding_validator",
    "validate_spec",
]
