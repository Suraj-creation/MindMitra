"""The projection pipeline — one statement in, one governed outcome per role.

This is the second half of the spine described in tech-stack.md §13.2. It runs
artefacts #9, #10 and #11 in order, and every stage can terminate:

    ContextualisedStatement
      -> shared_claims()                       one claim set, all roles
      -> builder(role)               none    -> Withheld(no_content)
      -> Firewall.project()          deny    -> Withheld(firewall)     + audit
      -> Safety Gateway (10 checks)  block   -> Withheld(safety_gateway) + audit
      -> delivery.classify()                 -> DeliveryDecision
      -> ProjectionOutcome

Two ordering decisions are load-bearing:

**The builder runs before the Firewall.** It has to: a projection's sensitivity
is the union of the categories it actually drew on, which is not known until it
is built. A denied projection is discarded here and never leaves this function,
so building it costs nothing but a few objects.

**The Firewall runs at delivery, not at generation** (§19.1.2 rule 2). Consent
can be revoked between the two. Callers therefore pass live consent per request
rather than a decision made earlier and cached.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field

from app.behaviour.models import ContextualisedStatement
from app.firewall.models import Actor, ConsentState, RequestContext
from app.firewall.projection_policy import DerivedArtefact, project
from app.firewall.roles import DataCategory
from app.safety.gateway import evaluate as safety_evaluate

from .builders import BUILDERS, shared_claims
from .delivery import classify
from .models import ProjectionOutcome, Withheld


@dataclass(frozen=True)
class RoleRequest:
    """One role asking for its view, with the consent state as it stands now."""

    actor: Actor
    context: RequestContext
    consent_by_category: Mapping[DataCategory, ConsentState] = field(
        default_factory=dict
    )
    duplicative: bool = False
    budget_exhausted: bool = False


def project_for_role(
    statement: ContextualisedStatement,
    request: RoleRequest,
    claims: tuple | None = None,
) -> ProjectionOutcome:
    """Run the projection half of the pipeline for exactly one role.

    Returns a `ProjectionOutcome` carrying either a projection or a `Withheld`,
    plus the delivery decision. Never raises for a policy outcome — a denial is
    data, because "why was I not told?" has to be answerable.
    """
    role = request.actor.role
    claims = claims if claims is not None else shared_claims(statement)

    def _withheld(stage: str, reasons: tuple[str, ...]) -> ProjectionOutcome:
        from .models import DeliveryClass, DeliveryDecision

        return ProjectionOutcome(
            role=role,
            withheld=Withheld(
                person_id=statement.person_id,
                role=role,
                stage=stage,
                reason_codes=reasons,
            ),
            delivery=DeliveryDecision(
                role=role,
                delivery_class=DeliveryClass.NO_NOTIFICATION,
                reason_codes=(f"withheld_at:{stage}", *reasons),
            ),
        )

    # 1. Build. A builder returning None means this role has nothing to be told
    #    — a first-class outcome, not a failure.
    builder = BUILDERS.get(role)
    if builder is None:
        return _withheld("no_content", ("no_builder_for_role",))

    projection = builder(statement, claims)
    if projection is None:
        return _withheld("no_content", ("nothing_to_report_for_role",))

    # 2. Memory Firewall over the derived artefact, with the sensitivity union.
    artefact = DerivedArtefact(
        artefact_class=projection.artefact_class,
        subject_person_id=projection.person_id,
        source_categories=projection.source_categories,
        report_type=projection.report_type,
        evidence_refs=projection.evidence_refs,
    )
    decision = project(
        request.actor, artefact, request.context, request.consent_by_category
    )
    if not decision.allowed:
        return _withheld("firewall", decision.reason_codes)

    # 3. Safety Gateway. Defence in depth over templated text: the builders
    #    cannot currently emit a forbidden claim, and this makes sure they
    #    still cannot after somebody edits a template.
    verdict = safety_evaluate(projection.output, request.context)
    if not verdict.passed:
        return _withheld(
            "safety_gateway",
            (f"blocked_by:{verdict.blocked_by.value if verdict.blocked_by else '?'}",),
        )

    # 4. Delivery.
    delivery = classify(
        projection,
        change_kind=statement.change_kind,
        duplicative=request.duplicative,
        budget_exhausted=request.budget_exhausted,
    )

    return ProjectionOutcome(role=role, projection=projection, delivery=delivery)


def project_all(
    statement: ContextualisedStatement, requests: Sequence[RoleRequest]
) -> list[ProjectionOutcome]:
    """Project one statement for every requesting role.

    The claim set is derived once and shared, which is what guarantees the four
    outcomes cannot contradict each other.
    """
    claims = shared_claims(statement)
    return [project_for_role(statement, r, claims) for r in requests]
