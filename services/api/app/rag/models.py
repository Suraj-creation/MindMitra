"""Retrieval value objects — labelled evidence, never anonymous chunks.

The load-bearing type is `RetrievedFact`. Everything a lane returns is one of
these, and each carries its knowledge layer, its source, its verification status
and its temporal validity all the way into the answer. That is what makes an
answer "a set of sourced claims, not a paragraph" (tech-stack §15).

Two things deliberately absent:

* There is no bare `text: str` chunk type. A fragment without provenance cannot
  be turned into a grounded statement, so it is never allowed to exist.
* There is no similarity score on its own. Ranking combines source authority
  with relevance, because in this product a caregiver's confirmed observation
  outranks a semantically closer sentence from a guideline.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.firewall.roles import DataCategory


class KnowledgeLayer(str, Enum):
    """The six layers, kept labelled end to end (tech-stack §15).

    They are never merged. A clinical guideline and a granddaughter's birthday
    are both "retrieved text" and must never be treated as the same kind of
    thing — that conflation is how a system ends up asserting medical advice in
    a reminiscence conversation.
    """

    K1_MEDICAL = "K1_medical"          # guidelines, evidence-tagged
    K2_PERSON = "K2_person"            # life story, memories, PWM facts
    K3_CAREGIVER = "K3_caregiver"      # caregiver-authored observations
    K4_CULTURAL = "K4_cultural"        # NER cultural ontology
    K5_TEMPORAL = "K5_temporal"        # event history
    K6_RESEARCH = "K6_research"        # clinician surface only


# Which raw data category each layer draws on, so the firewall can scope a
# retrieval in the same vocabulary it uses everywhere else.
LAYER_CATEGORY: dict[KnowledgeLayer, DataCategory] = {
    KnowledgeLayer.K1_MEDICAL: DataCategory.CLINICAL_SUMMARY,
    KnowledgeLayer.K2_PERSON: DataCategory.LIFE_STORY_MEMORY,
    KnowledgeLayer.K3_CAREGIVER: DataCategory.ROUTINE,
    KnowledgeLayer.K4_CULTURAL: DataCategory.PWM_FACT,
    KnowledgeLayer.K5_TEMPORAL: DataCategory.ROUTINE,
    KnowledgeLayer.K6_RESEARCH: DataCategory.CLINICAL_SUMMARY,
}


class Lane(str, Enum):
    """How something was retrieved. Different knowledge needs different lanes."""

    GRAPH = "graph"            # PWM nodes and edges, kinship traversal
    TEMPORAL = "temporal"      # events by time window
    STRUCTURED = "structured"  # routine, care plan, observations
    LEXICAL = "lexical"        # Postgres full-text + trigram
    VECTOR = "vector"          # pgvector, when an embedder exists


class SourceAuthority(int, Enum):
    """The fixed ranking that resolves contradictions (CLAUDE.md invariant 6).

    Lower is more authoritative. Ranks 1-4 may verify a fact; ranks 5-8 may only
    propose one. There is no automated path from 7 or 8 to `verified`.
    """

    PERSON = 1          # the person's own statement about their own life
    CLINICIAN = 2
    CAREGIVER = 3
    CHW = 4
    SYSTEM = 5          # structured system data
    BEHAVIOURAL = 6     # repeated behavioural observation
    MODEL = 7           # model inference
    LLM = 8             # LLM hypothesis

    @property
    def may_verify(self) -> bool:
        return self.value <= SourceAuthority.CHW.value


_SOURCE_TYPE_TO_AUTHORITY: dict[str, SourceAuthority] = {
    "person": SourceAuthority.PERSON,
    "self": SourceAuthority.PERSON,
    "clinician": SourceAuthority.CLINICIAN,
    "caregiver": SourceAuthority.CAREGIVER,
    "primary_caregiver": SourceAuthority.CAREGIVER,
    "secondary_caregiver": SourceAuthority.CAREGIVER,
    "chw": SourceAuthority.CHW,
    "system": SourceAuthority.SYSTEM,
    "observation": SourceAuthority.BEHAVIOURAL,
    "model": SourceAuthority.MODEL,
    "llm": SourceAuthority.LLM,
}


def authority_for(source_type: str) -> SourceAuthority:
    """Map a provenance source type to its rank. Unknown sources rank lowest."""
    return _SOURCE_TYPE_TO_AUTHORITY.get(source_type.lower(), SourceAuthority.LLM)


class RetrievedFact(BaseModel):
    """One retrieved assertion, with everything needed to use it safely."""

    model_config = ConfigDict(frozen=True)

    fact_id: str
    layer: KnowledgeLayer
    lane: Lane
    text: str

    # Provenance travels into the answer, always.
    source_type: str = "system"
    source_actor: str | None = None
    authority: SourceAuthority = SourceAuthority.SYSTEM
    verification_status: str = "unverified"
    confidence: str = "moderate"

    # Temporal validity. A fact whose valid_to has passed is not current, and a
    # medication superseded last month must never be spoken as today's dose.
    valid_from: date | None = None
    valid_to: date | None = None
    observed_at: datetime | None = None

    relevance: float = Field(default=0.0, ge=0.0, le=1.0)
    payload: dict = Field(default_factory=dict)

    @property
    def is_verified(self) -> bool:
        return self.verification_status == "verified"

    @property
    def may_be_asserted_plainly(self) -> bool:
        """Only a verified fact from a verifying source is stated flat.

        Everything else is hedged in the copy itself, not marked with a badge
        the reader has to notice (DESIGN.md D2.2).
        """
        return self.is_verified and self.authority.may_verify

    def hedge(self) -> str:
        """The fact, worded at the confidence it has actually earned."""
        if self.may_be_asserted_plainly:
            return self.text
        if self.source_actor and self.authority is SourceAuthority.CAREGIVER:
            return f"{self.source_actor} reported that {self.text[0].lower()}{self.text[1:]}"
        return f"This may be: {self.text}"


class Conflict(BaseModel):
    """Two facts that disagree. Never silently resolved."""

    model_config = ConfigDict(frozen=True)

    subject: str
    higher: RetrievedFact
    lower: RetrievedFact
    equal_authority: bool = False

    @property
    def resolvable(self) -> bool:
        """A clear authority difference means one side leads — but both are kept."""
        return not self.equal_authority

    def describe(self) -> str:
        return "These accounts differ."


class RetrievalPlan(BaseModel):
    """Which lanes to run, and why. Emitted for the observability trail."""

    model_config = ConfigDict(frozen=True)

    lanes: tuple[Lane, ...]
    layers: tuple[KnowledgeLayer, ...]
    reason: str
    entities: tuple[str, ...] = ()
    time_window_days: int | None = None


class RetrievalResult(BaseModel):
    """What retrieval produced, including what it could not find.

    `gaps` is content, not an omission: "we hold no information about sleep in
    this period" is frequently the most useful thing the answer can say.
    """

    model_config = ConfigDict(frozen=True)

    plan: RetrievalPlan
    facts: tuple[RetrievedFact, ...] = ()
    conflicts: tuple[Conflict, ...] = ()
    gaps: tuple[str, ...] = ()
    denied_layers: tuple[KnowledgeLayer, ...] = ()

    @property
    def is_empty(self) -> bool:
        return not self.facts

    def by_layer(self, layer: KnowledgeLayer) -> tuple[RetrievedFact, ...]:
        return tuple(f for f in self.facts if f.layer is layer)
