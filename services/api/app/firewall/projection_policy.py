"""The Memory Firewall's second decision surface — authZ over *derived* information.

`policy.evaluate()` answers: *may this role read this raw data category?*
That is necessary and insufficient. What a caregiver, CHW or clinician actually
receives is never raw data — it is an insight, a report, a notification or a
packet **derived from** data. Authorising the inputs and leaving the outputs
ungoverned is the hole this module closes (invariant 7, tech-stack.md §19.1).

Same shape as the raw-data policy: pure function, deny by default, returns a
`Decision`, and the caller writes the audit row.

The load-bearing rule is **sensitivity union**: a derived artefact carries the
union of its sources' categories, and can never be more visible than its
least-visible input. This module does not restate the role-scope matrix to
achieve that — it *re-runs* `evaluate()` once per source category. There is
therefore exactly one place where "who may see continence data" is written
down, and a derived artefact that touches continence automatically inherits
`NOT_SHARED_FAMILY_VIEW` and every other guard, with no second table to drift.
"""

from __future__ import annotations

from collections.abc import Mapping
from enum import Enum

from pydantic import BaseModel, ConfigDict

from .models import Actor, ConsentState, Decision, Effect, RequestContext, Resource
from .policy import evaluate
from .roles import Action, DataCategory, Purpose, Role


class ArtefactClass(str, Enum):
    """Classes of derived information. Distinct from raw `DataCategory`."""

    DERIVED_INSIGHT = "derived_insight"
    REPORT = "report"
    NOTIFICATION = "notification"
    LIVE_ACCESS = "live_access"
    HISTORICAL_ACCESS = "historical_access"
    EXPORT = "export"
    CHW_PACKET = "chw_packet"
    CLINICIAN_PACKET = "clinician_packet"
    RESEARCH_EXTRACT = "research_extract"


class DerivedArtefact(BaseModel):
    """What is about to be shown to somebody, and what it was derived from.

    `source_categories` is the honest declaration of every raw category that
    contributed. A builder that omits a category it actually used defeats the
    sensitivity union, so builders construct this from their evidence set
    rather than by hand.
    """

    model_config = ConfigDict(frozen=True)

    artefact_class: ArtefactClass
    subject_person_id: str
    source_categories: frozenset[DataCategory] = frozenset()
    report_type: str | None = None
    evidence_refs: tuple[str, ...] = ()
    embeds_live_position: bool = False


class ProjectionGrant(BaseModel):
    """An explicit permission for (artefact class, role). Anything else denies."""

    model_config = ConfigDict(frozen=True)

    artefact_class: ArtefactClass
    role: Role
    purposes: frozenset[Purpose]


_R = Role
_P = Purpose
_A = ArtefactClass


# Deny by default. Every row below is a deliberate grant.
#
# Note what is absent as much as what is present:
#   * the PERSON receives insights and reports about their own life, but there
#     is no NOTIFICATION grant — the person is never alerted about themselves
#     (DESIGN.md A3.1, attention budget "person: 0 alerts about themselves");
#   * no role has an EXPORT or RESEARCH_EXTRACT grant here. Both are handled by
#     separate explicit consent outside this matrix (see §19.1.3).
PROJECTION_MATRIX: tuple[ProjectionGrant, ...] = (
    # ── Person: their own life, in their own terms ──────────────────────────
    ProjectionGrant(artefact_class=_A.DERIVED_INSIGHT, role=_R.PERSON,
                    purposes=frozenset({_P.SELF_ACCESS, _P.PERSONALISATION})),
    ProjectionGrant(artefact_class=_A.REPORT, role=_R.PERSON,
                    purposes=frozenset({_P.SELF_ACCESS})),
    ProjectionGrant(artefact_class=_A.HISTORICAL_ACCESS, role=_R.PERSON,
                    purposes=frozenset({_P.SELF_ACCESS})),
    ProjectionGrant(artefact_class=_A.LIVE_ACCESS, role=_R.PERSON,
                    purposes=frozenset({_P.SELF_ACCESS, _P.SAFETY_RESPONSE})),

    # ── Primary caregiver: compression + action ─────────────────────────────
    ProjectionGrant(artefact_class=_A.DERIVED_INSIGHT, role=_R.PRIMARY_CAREGIVER,
                    purposes=frozenset({_P.CARE_COORDINATION})),
    ProjectionGrant(artefact_class=_A.REPORT, role=_R.PRIMARY_CAREGIVER,
                    purposes=frozenset({_P.CARE_COORDINATION})),
    ProjectionGrant(artefact_class=_A.NOTIFICATION, role=_R.PRIMARY_CAREGIVER,
                    purposes=frozenset({_P.CARE_COORDINATION, _P.SAFETY_RESPONSE})),
    ProjectionGrant(artefact_class=_A.HISTORICAL_ACCESS, role=_R.PRIMARY_CAREGIVER,
                    purposes=frozenset({_P.CARE_COORDINATION})),
    ProjectionGrant(artefact_class=_A.LIVE_ACCESS, role=_R.PRIMARY_CAREGIVER,
                    purposes=frozenset({_P.SAFETY_RESPONSE})),

    # ── Secondary caregiver: informed, not operational ──────────────────────
    ProjectionGrant(artefact_class=_A.DERIVED_INSIGHT, role=_R.SECONDARY_CAREGIVER,
                    purposes=frozenset({_P.CARE_COORDINATION})),
    ProjectionGrant(artefact_class=_A.REPORT, role=_R.SECONDARY_CAREGIVER,
                    purposes=frozenset({_P.CARE_COORDINATION})),

    # ── CHW: visit preparation ──────────────────────────────────────────────
    ProjectionGrant(artefact_class=_A.CHW_PACKET, role=_R.CHW,
                    purposes=frozenset({_P.CARE_COORDINATION})),
    ProjectionGrant(artefact_class=_A.DERIVED_INSIGHT, role=_R.CHW,
                    purposes=frozenset({_P.CARE_COORDINATION})),
    ProjectionGrant(artefact_class=_A.REPORT, role=_R.CHW,
                    purposes=frozenset({_P.CARE_COORDINATION})),
    ProjectionGrant(artefact_class=_A.NOTIFICATION, role=_R.CHW,
                    purposes=frozenset({_P.CARE_COORDINATION, _P.SAFETY_RESPONSE})),

    # ── Clinician: longitudinal evidence ────────────────────────────────────
    ProjectionGrant(artefact_class=_A.CLINICIAN_PACKET, role=_R.CLINICIAN,
                    purposes=frozenset({_P.CLINICAL_REVIEW})),
    ProjectionGrant(artefact_class=_A.DERIVED_INSIGHT, role=_R.CLINICIAN,
                    purposes=frozenset({_P.CLINICAL_REVIEW})),
    ProjectionGrant(artefact_class=_A.REPORT, role=_R.CLINICIAN,
                    purposes=frozenset({_P.CLINICAL_REVIEW})),
    ProjectionGrant(artefact_class=_A.HISTORICAL_ACCESS, role=_R.CLINICIAN,
                    purposes=frozenset({_P.CLINICAL_REVIEW})),
    ProjectionGrant(artefact_class=_A.NOTIFICATION, role=_R.CLINICIAN,
                    purposes=frozenset({_P.SAFETY_RESPONSE})),
)

# Life-story content is excluded from every research export unconditionally —
# a hard exclusion, not a consent flag (§19.1.3).
RESEARCH_EXCLUDED_CATEGORIES: frozenset[DataCategory] = frozenset(
    {DataCategory.LIFE_STORY_MEMORY, DataCategory.PERSON_PRIVATE_NOTE}
)


def projection_grant_for(
    artefact_class: ArtefactClass, role: Role
) -> ProjectionGrant | None:
    for g in PROJECTION_MATRIX:
        if g.artefact_class is artefact_class and g.role is role:
            return g
    return None


def _decision(
    effect: Effect,
    artefact: DerivedArtefact,
    context: RequestContext,
    actor: Actor,
    *,
    reasons: tuple[str, ...],
    obligations: tuple[str, ...] = ("audit",),
    is_violation: bool = False,
) -> Decision:
    """Build a Decision. `category` carries the artefact class so one audit
    schema serves both firewall surfaces."""
    return Decision(
        effect=effect,
        category=DataCategory.CLINICAL_SUMMARY,  # placeholder; see reason codes
        action=context.action,
        actor_role=actor.role,
        subject_person_id=artefact.subject_person_id,
        reason_codes=(f"artefact:{artefact.artefact_class.value}", *reasons),
        obligations=obligations,
        is_violation=is_violation,
    )


def project(
    actor: Actor,
    artefact: DerivedArtefact,
    context: RequestContext,
    consent_by_category: Mapping[DataCategory, ConsentState] | None = None,
) -> Decision:
    """Return an ALLOW/DENY Decision for showing this derived artefact. Pure.

    Order of checks (fail-closed at each step):
      1. research extracts — separately consented, life-story hard-excluded
      2. artefact-class grant for this role (deny by default)
      3. purpose limitation on the artefact class
      4. **sensitivity union** — `evaluate()` must ALLOW every source category
         for this role/purpose/context. The least-visible input wins.
      5. live position embedded in a derivation carries its own guard with it

    `consent_by_category` supplies per-category consent for step 4; a category
    not listed falls back to `context.consent`. This matters because a caregiver
    may hold consent for routine data and not for clinical summaries, and a
    digest touching both must be denied on the stricter one.
    """
    consent_by_category = consent_by_category or {}
    role = actor.role

    # 1. Research is the strictest case and never rides on a care grant.
    if artefact.artefact_class is ArtefactClass.RESEARCH_EXTRACT:
        leaked = artefact.source_categories & RESEARCH_EXCLUDED_CATEGORIES
        if leaked:
            return _decision(
                Effect.DENY, artefact, context, actor,
                reasons=(f"research_excluded_category:{sorted(c.value for c in leaked)}",),
                obligations=("audit", "violation"),
                is_violation=True,
            )
        return _decision(
            Effect.DENY, artefact, context, actor,
            reasons=("research_requires_separate_consent",),
        )

    # 2. Artefact-class grant. Deny by default.
    grant = projection_grant_for(artefact.artefact_class, role)
    if grant is None:
        return _decision(
            Effect.DENY, artefact, context, actor,
            reasons=("artefact_class_not_permitted_for_role",),
        )

    # 3. Purpose limitation on the artefact class itself.
    if context.purpose not in grant.purposes:
        return _decision(
            Effect.DENY, artefact, context, actor,
            reasons=("purpose_not_permitted_for_artefact",),
        )

    # 4. Sensitivity union — the least-visible input decides.
    obligations: list[str] = ["audit"]
    for category in sorted(artefact.source_categories, key=lambda c: c.value):
        source_resource = Resource(
            category=category,
            subject_person_id=artefact.subject_person_id,
        )
        source_context = context.model_copy(
            update={
                "action": Action.READ,
                "consent": consent_by_category.get(category, context.consent),
            }
        )
        source_decision = evaluate(actor, source_resource, source_context)
        if not source_decision.allowed:
            return _decision(
                Effect.DENY, artefact, context, actor,
                reasons=(
                    f"source_category_denied:{category.value}",
                    *source_decision.reason_codes,
                ),
                obligations=("audit", *source_decision.obligations[1:]),
                is_violation=source_decision.is_violation,
            )
        # Obligations travel with the derivation (e.g. geo_access_logged).
        obligations.extend(o for o in source_decision.obligations if o != "audit")

    # 5. An embedded live position carries LIVE_POSITION's guard even when the
    #    builder forgot to declare the category.
    if (
        artefact.embeds_live_position
        and DataCategory.LIVE_POSITION not in artefact.source_categories
    ):
        live_decision = evaluate(
            actor,
            Resource(
                category=DataCategory.LIVE_POSITION,
                subject_person_id=artefact.subject_person_id,
            ),
            context.model_copy(update={"action": Action.READ}),
        )
        if not live_decision.allowed:
            return _decision(
                Effect.DENY, artefact, context, actor,
                reasons=("embedded_live_position_denied", *live_decision.reason_codes),
            )
        obligations.extend(o for o in live_decision.obligations if o != "audit")

    return _decision(
        Effect.ALLOW, artefact, context, actor,
        reasons=("granted",),
        obligations=tuple(dict.fromkeys(obligations)),
    )
