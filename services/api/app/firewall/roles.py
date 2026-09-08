"""Vocabulary for the Memory Firewall: roles, actions, data categories, purposes.

These enums are the fixed alphabet the deterministic policy is written against.
Keeping them small and explicit is a safety property — the set of things that
*can* be asked for is closed and auditable.
"""

from __future__ import annotations

from enum import Enum


class Role(str, Enum):
    """An actor's role **relative to a specific person (the data subject)**.

    The same human may hold different roles for different persons. Roles are
    never global; they are always evaluated against a subject.
    """

    PERSON = "person"  # the data subject accessing their own data
    PRIMARY_CAREGIVER = "primary_caregiver"
    SECONDARY_CAREGIVER = "secondary_caregiver"
    CHW = "chw"  # community health worker (ASHA/ANM/CHO)
    CLINICIAN = "clinician"
    ADMIN = "admin"  # platform administration — NOT a care role, no person-data access
    SYSTEM = "system"  # internal pipelines (e.g. baseline computation)


class Action(str, Enum):
    READ = "read"
    WRITE = "write"
    SHARE = "share"  # export / surface into a cross-scope (e.g. shared family) view


class DataCategory(str, Enum):
    """Categories of person data. Visibility rules attach to categories.

    RAW_AV and FINANCIAL are *never collected*; they exist here only so the
    firewall can hard-deny and flag any request for them as a violation.
    """

    PERSON_PRIVATE_NOTE = "person_private_note"
    LIFE_STORY_MEMORY = "life_story_memory"
    PWM_FACT = "pwm_fact"  # generic Personal World Model fact; uses its own visibility list
    COGNITIVE_STATE = "cognitive_state"  # baseline/θ vectors (never a single "score")
    ROUTINE = "routine"
    CLINICAL_SUMMARY = "clinical_summary"
    CONTINENCE = "continence"  # private-by-default; never in a shared family view
    LIVE_POSITION = "live_position"  # only during active L4/L5, logged
    RAW_AV = "raw_av"  # NEVER COLLECTED
    FINANCIAL = "financial"  # NEVER COLLECTED


class Purpose(str, Enum):
    """Purpose limitation — every access declares why. A purpose not permitted
    for the (role, category) is denied even if the role could otherwise read.
    """

    SELF_ACCESS = "self_access"
    ONBOARDING = "onboarding"
    PERSONALISATION = "personalisation"
    CARE_COORDINATION = "care_coordination"
    SAFETY_RESPONSE = "safety_response"
    CLINICAL_REVIEW = "clinical_review"
    RESEARCH = "research"  # identified data via the firewall is always denied for research


class EscalationLevel(str, Enum):
    """The L0–L5 ladder. Some categories (live position) are only accessible
    during an active high escalation.
    """

    L0 = "L0"
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"
    L4 = "L4"
    L5 = "L5"


# Categories that must never exist in the system. A request implies a bug or an
# attack; the firewall denies and records a violation.
NEVER_COLLECTED: frozenset[DataCategory] = frozenset(
    {DataCategory.RAW_AV, DataCategory.FINANCIAL}
)

# The only categories an L5 safety-response may reach via emergency override when
# consent is otherwise absent (Safety Gateway check 9). Kept deliberately narrow.
EMERGENCY_OVERRIDE_CATEGORIES: frozenset[DataCategory] = frozenset(
    {DataCategory.LIVE_POSITION, DataCategory.CLINICAL_SUMMARY}
)

# Map a role to the visibility token used inside a PWM fact's provenance envelope.
ROLE_VISIBILITY_TOKEN: dict[Role, str] = {
    Role.PERSON: "person",
    Role.PRIMARY_CAREGIVER: "primary_caregiver",
    Role.SECONDARY_CAREGIVER: "secondary_caregiver",
    Role.CHW: "chw",
    Role.CLINICIAN: "clinician",
}
