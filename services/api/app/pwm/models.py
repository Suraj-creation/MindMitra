"""Pydantic schemas for the Personal World Model (API-facing).

These are the domain value objects used by the Studio grounding validator and
the API layer. The SQLAlchemy ORM tables live in app.core.models; the lookup
implementation lives in app.pwm.lookup.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    REPORTED = "reported"
    UNVERIFIED = "unverified"


class ProvenanceEnvelope(BaseModel):
    """The provenance envelope carried on every PWM fact.

    This is the JSONB blob stored in pwm_nodes.provenance and pwm_edges.provenance.
    It is also the structure required by the Studio grounding validator via
    app.studio.validators.ResolvedFact.
    """

    model_config = ConfigDict(frozen=True)

    fact_id: str
    subject: str
    predicate: str
    object: str
    value: dict[str, Any] = {}
    source: dict[str, str] = {}  # type, actor, channel
    created_at: datetime
    valid_from: date
    valid_to: date | None = None
    last_verified: date | None = None
    confidence: Literal["high", "medium", "low"] = "medium"
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED
    visibility: tuple[str, ...] = ()
    clinical_relevance: bool = False
    audit_ref: str | None = None


class PWMNode(BaseModel):
    """A node in the Personal World Model graph (API representation)."""

    model_config = ConfigDict(frozen=True)

    node_id: str
    person_id: str
    node_type: str  # person | place | event | object | cultural
    temporal_partition: Literal["past", "present", "future"]
    label: str
    provenance: ProvenanceEnvelope


class PWMEdge(BaseModel):
    """A typed relationship edge between two PWM nodes (API representation)."""

    model_config = ConfigDict(frozen=True)

    edge_id: str
    subject_node_id: str
    predicate: str
    object_node_id: str
    provenance: ProvenanceEnvelope
