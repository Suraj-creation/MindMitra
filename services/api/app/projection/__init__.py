"""Role projection — one governed evidence base, four purpose-bound views.

Artefacts #9-#11 of the Evidence & Projection Pipeline (tech-stack.md §13.2).
This is the module that makes MindMitra one system rather than four products:
a single `ContextualisedStatement` is projected separately for each authorised
role, and every projection is authorised, safety-gated and audited on its own.

Role differences are responsibility differences, never different truths. Every
FACT any role sees is an `EvidenceClaim` drawn verbatim from one shared claim
set, so a projection may omit — it can never differ.

No LLM anywhere in this package. Builders template; the delivery classifier is
arithmetic.

Public API:

    from app.projection import (
        shared_claims, project_person, project_caregiver, project_chw,
        project_clinician, BUILDERS,
        classify, WEEKLY_ACTION_BUDGET,
        RoleRequest, project_for_role, project_all,
        RoleProjection, Withheld, DeliveryClass, DeliveryDecision,
        ProjectionOutcome, EvidenceClaim, ClaimKind,
    )
"""

from __future__ import annotations

from .builders import (
    BUILDER_VERSION,
    BUILDERS,
    project_caregiver,
    project_chw,
    project_clinician,
    project_person,
    project_secondary_caregiver,
    shared_claims,
)
from .delivery import WEEKLY_ACTION_BUDGET, classify
from .models import (
    BUDGET_BYPASSING,
    INTERRUPTING,
    ClaimKind,
    DeliveryClass,
    DeliveryDecision,
    EvidenceClaim,
    ProjectionOutcome,
    RoleProjection,
    Withheld,
)
from .service import RoleRequest, project_all, project_for_role

__all__ = [
    "BUDGET_BYPASSING",
    "BUILDERS",
    "BUILDER_VERSION",
    "INTERRUPTING",
    "WEEKLY_ACTION_BUDGET",
    "ClaimKind",
    "DeliveryClass",
    "DeliveryDecision",
    "EvidenceClaim",
    "ProjectionOutcome",
    "RoleProjection",
    "RoleRequest",
    "Withheld",
    "classify",
    "project_all",
    "project_caregiver",
    "project_chw",
    "project_clinician",
    "project_for_role",
    "project_person",
    "project_secondary_caregiver",
    "shared_claims",
]
