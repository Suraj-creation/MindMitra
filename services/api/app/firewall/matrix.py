"""The role-scope policy matrix — declarative allow-grants, deny by default.

This is the machine-readable form of the Memory Firewall's role-scope table.
Every grant is an *explicit* permission. Anything with no matching grant is
denied. Guards are named conditions the policy evaluates against the request
context; keeping them named (not arbitrary lambdas) keeps the matrix auditable.

Design references: Blueprint §23 (Memory Firewall), Appendix E.3 (continence,
private-by-default), the L0–L5 ladder for live position.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict

from .roles import Action, DataCategory, Purpose, Role


class Guard(str, Enum):
    ACTIVE_L4_L5 = "active_l4_l5"  # live position: only during an active high escalation
    CARE_RELEVANT = "care_relevant"  # e.g. continence to a CHW only when care-relevant
    NOT_SHARED_FAMILY_VIEW = "not_shared_family_view"  # continence never in a family view


class Grant(BaseModel):
    model_config = ConfigDict(frozen=True)

    category: DataCategory
    action: Action
    role: Role
    purposes: frozenset[Purpose]
    guards: tuple[Guard, ...] = ()
    obligations: tuple[str, ...] = ()
    requires_consent: bool = True  # person self-access and system writes set this False


_R = Role
_A = Action
_P = Purpose
_C = DataCategory


# NOTE: PWM_FACT reads are governed by the fact's own `visibility` list in the
# policy layer (provenance envelope), so they are not enumerated here except for
# writes. Everything else is fully enumerated below.
MATRIX: tuple[Grant, ...] = (
    # ── Person-private notes: the person, and only the person ────────────────
    Grant(category=_C.PERSON_PRIVATE_NOTE, action=_A.READ, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.PERSON_PRIVATE_NOTE, action=_A.WRITE, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),

    # ── Life-story memories: person + primary + secondary ────────────────────
    Grant(category=_C.LIFE_STORY_MEMORY, action=_A.READ, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.LIFE_STORY_MEMORY, action=_A.WRITE, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.LIFE_STORY_MEMORY, action=_A.READ, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.ONBOARDING, _P.PERSONALISATION, _P.CARE_COORDINATION})),
    Grant(category=_C.LIFE_STORY_MEMORY, action=_A.WRITE, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.ONBOARDING, _P.PERSONALISATION})),
    Grant(category=_C.LIFE_STORY_MEMORY, action=_A.READ, role=_R.SECONDARY_CAREGIVER,
          purposes=frozenset({_P.ONBOARDING, _P.PERSONALISATION, _P.CARE_COORDINATION})),
    Grant(category=_C.LIFE_STORY_MEMORY, action=_A.WRITE, role=_R.SECONDARY_CAREGIVER,
          purposes=frozenset({_P.ONBOARDING, _P.PERSONALISATION})),

    # ── Cognitive state (baseline/θ vectors — never a single score) ──────────
    Grant(category=_C.COGNITIVE_STATE, action=_A.READ, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.COGNITIVE_STATE, action=_A.READ, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.CARE_COORDINATION})),
    Grant(category=_C.COGNITIVE_STATE, action=_A.READ, role=_R.CHW,
          purposes=frozenset({_P.CARE_COORDINATION})),
    Grant(category=_C.COGNITIVE_STATE, action=_A.READ, role=_R.CLINICIAN,
          purposes=frozenset({_P.CLINICAL_REVIEW})),
    Grant(category=_C.COGNITIVE_STATE, action=_A.WRITE, role=_R.SYSTEM,
          purposes=frozenset({_P.PERSONALISATION}), requires_consent=False),

    # ── Routine ──────────────────────────────────────────────────────────────
    Grant(category=_C.ROUTINE, action=_A.READ, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.ROUTINE, action=_A.WRITE, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.ROUTINE, action=_A.READ, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.CARE_COORDINATION})),
    Grant(category=_C.ROUTINE, action=_A.WRITE, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.CARE_COORDINATION})),
    Grant(category=_C.ROUTINE, action=_A.READ, role=_R.SECONDARY_CAREGIVER,
          purposes=frozenset({_P.CARE_COORDINATION})),
    Grant(category=_C.ROUTINE, action=_A.READ, role=_R.CHW,
          purposes=frozenset({_P.CARE_COORDINATION})),

    # ── Clinical summary ─────────────────────────────────────────────────────
    Grant(category=_C.CLINICAL_SUMMARY, action=_A.READ, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.CLINICAL_SUMMARY, action=_A.READ, role=_R.CLINICIAN,
          purposes=frozenset({_P.CLINICAL_REVIEW})),
    Grant(category=_C.CLINICAL_SUMMARY, action=_A.READ, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.CARE_COORDINATION})),
    Grant(category=_C.CLINICAL_SUMMARY, action=_A.READ, role=_R.CHW,
          purposes=frozenset({_P.CARE_COORDINATION})),

    # ── Continence: private-by-default, NEVER in a shared family view ─────────
    Grant(category=_C.CONTINENCE, action=_A.READ, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.CONTINENCE, action=_A.WRITE, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.CONTINENCE, action=_A.READ, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.CARE_COORDINATION}),
          guards=(Guard.NOT_SHARED_FAMILY_VIEW,)),
    Grant(category=_C.CONTINENCE, action=_A.WRITE, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.CARE_COORDINATION}),
          guards=(Guard.NOT_SHARED_FAMILY_VIEW,)),
    Grant(category=_C.CONTINENCE, action=_A.READ, role=_R.CHW,
          purposes=frozenset({_P.CARE_COORDINATION}),
          guards=(Guard.CARE_RELEVANT, Guard.NOT_SHARED_FAMILY_VIEW)),
    Grant(category=_C.CONTINENCE, action=_A.READ, role=_R.CLINICIAN,
          purposes=frozenset({_P.CLINICAL_REVIEW}),
          guards=(Guard.NOT_SHARED_FAMILY_VIEW,)),
    # (No SECONDARY_CAREGIVER grant: continence is excluded from the shared scope.)

    # ── Live position: person + primary, ONLY during active L4/L5, logged ────
    Grant(category=_C.LIVE_POSITION, action=_A.READ, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.LIVE_POSITION, action=_A.READ, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.SAFETY_RESPONSE}),
          guards=(Guard.ACTIVE_L4_L5,), obligations=("geo_access_logged",)),

    # ── PWM_FACT writes (reads governed by the fact's visibility list) ───────
    Grant(category=_C.PWM_FACT, action=_A.WRITE, role=_R.PERSON,
          purposes=frozenset({_P.SELF_ACCESS}), requires_consent=False),
    Grant(category=_C.PWM_FACT, action=_A.WRITE, role=_R.PRIMARY_CAREGIVER,
          purposes=frozenset({_P.ONBOARDING, _P.PERSONALISATION})),
    Grant(category=_C.PWM_FACT, action=_A.WRITE, role=_R.SECONDARY_CAREGIVER,
          purposes=frozenset({_P.ONBOARDING, _P.PERSONALISATION})),
    Grant(category=_C.PWM_FACT, action=_A.WRITE, role=_R.CHW,
          purposes=frozenset({_P.ONBOARDING, _P.CARE_COORDINATION})),
)


def grant_for(category: DataCategory, action: Action, role: Role) -> Grant | None:
    """Return the single grant matching (category, action, role), or None."""
    for g in MATRIX:
        if g.category is category and g.action is action and g.role is role:
            return g
    return None


def any_grant_for_category(category: DataCategory, action: Action) -> bool:
    """True if *some* role may perform this action on this category."""
    return any(g.category is category and g.action is action for g in MATRIX)
