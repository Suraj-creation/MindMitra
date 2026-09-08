"""One governed evidence base, four purpose-bound projections.

The tests here are the executable form of invariants 7, 12 and 14. The most
important one is `test_projections_may_omit_but_never_differ`: it is what makes
"role differences are responsibility differences, never different truths" a
property somebody can break a build with.
"""

from __future__ import annotations

import pytest

from app.behaviour import ChangeKind, ChangeSignal, ContextSignals, contextualise
from app.firewall.models import Actor, ConsentState, RequestContext
from app.firewall.projection_policy import (
    ArtefactClass,
    DerivedArtefact,
    project,
    projection_grant_for,
)
from app.firewall.roles import Action, DataCategory, EscalationLevel, Purpose, Role
from app.projection import (
    ClaimKind,
    DeliveryClass,
    RoleRequest,
    classify,
    project_all,
    project_for_role,
    shared_claims,
)

_ROLE_PURPOSE = {
    Role.PERSON: Purpose.SELF_ACCESS,
    Role.PRIMARY_CAREGIVER: Purpose.CARE_COORDINATION,
    Role.SECONDARY_CAREGIVER: Purpose.CARE_COORDINATION,
    Role.CHW: Purpose.CARE_COORDINATION,
    Role.CLINICIAN: Purpose.CLINICAL_REVIEW,
}
_ALL_ROLES = tuple(_ROLE_PURPOSE)


def _statement(kind: ChangeKind = ChangeKind.MEANINGFUL_CHANGE, ctx=None, **kw):
    signal = ChangeSignal(
        kind=kind, person_id="p1", domain="memory", z=-2.4, persistence_days=3,
        quality=0.88, **kw,
    )
    return contextualise(
        signal,
        ctx or ContextSignals(
            sleep_disrupted=True, hearing_aid_unused=True,
            sessions_considered=6, low_quality_share=0.33,
        ),
    )


def _request(role: Role, *, granted: bool = True, **ctx_kw) -> RoleRequest:
    return RoleRequest(
        actor=Actor(actor_id=f"actor:{role.value}", role=role, subject_person_id="p1"),
        context=RequestContext(
            action=Action.READ,
            purpose=_ROLE_PURPOSE[role],
            consent=ConsentState(granted=granted),
            **ctx_kw,
        ),
    )


def _requests(**kw) -> list[RoleRequest]:
    return [_request(r, **kw) for r in _ALL_ROLES]


# ══ Invariant 12 — may omit, never differ ════════════════════════════════════

def test_projections_may_omit_but_never_differ() -> None:
    """Every FACT any role sees is drawn verbatim from one shared claim set.

    This is the structural form of "one evidence base, four projections". A
    builder that reworded a claim, or invented one, fails here.
    """
    statement = _statement()
    claims = shared_claims(statement)
    by_text = {c.text for c in claims} | {c.person_text for c in claims if c.person_text}

    seen_by_claim: dict[str, set[str]] = {}
    for outcome in project_all(statement, _requests()):
        if outcome.projection is None:
            continue
        for fact in outcome.projection.output.facts:
            assert fact.content in by_text, (
                f"{outcome.role.value} asserted a fact absent from the shared "
                f"claim set: {fact.content!r}"
            )
        # Same claim id must render the same assertion for everyone.
        for claim_id in outcome.projection.claim_ids:
            seen_by_claim.setdefault(claim_id, set())
    assert seen_by_claim, "no claims were used by any role"


def test_every_projected_fact_maps_back_to_a_claim_id() -> None:
    statement = _statement()
    claims = {c.claim_id: c for c in shared_claims(statement)}
    for outcome in project_all(statement, _requests()):
        if outcome.projection is None:
            continue
        rendered = {
            claims[cid].render_for(outcome.role)
            for cid in outcome.projection.claim_ids
        }
        assert {f.content for f in outcome.projection.output.facts} == rendered


def test_roles_receive_different_completeness_from_the_same_statement() -> None:
    """Omission is the whole mechanism — if everyone got the same thing, there
    would be no reason for four builders."""
    statement = _statement()
    counts = {
        o.role: len(o.projection.output.facts)
        for o in project_all(statement, _requests())
        if o.projection
    }
    assert counts[Role.PERSON] < counts[Role.PRIMARY_CAREGIVER]
    assert counts[Role.PRIMARY_CAREGIVER] < counts[Role.CLINICIAN]


def test_clinician_receives_the_gaps_the_caregiver_does_not() -> None:
    statement = _statement()
    claims = {c.claim_id: c for c in shared_claims(statement)}
    outcomes = {o.role: o for o in project_all(statement, _requests())}

    def kinds(role: Role) -> set[ClaimKind]:
        return {claims[cid].kind for cid in outcomes[role].projection.claim_ids}

    assert ClaimKind.GAP in kinds(Role.CLINICIAN)
    assert ClaimKind.CONFOUNDER in kinds(Role.CLINICIAN)
    assert ClaimKind.GAP not in kinds(Role.PRIMARY_CAREGIVER)


# ══ The person is a participant, never a subject of surveillance ═════════════

def test_person_never_receives_a_change_claim() -> None:
    """No branch of the person builder can surface a deviation about them."""
    claims = {c.claim_id: c for c in shared_claims(_statement())}
    for kind in ChangeKind:
        statement = _statement(kind)
        outcome = project_for_role(statement, _request(Role.PERSON))
        if outcome.projection is None:
            continue
        used = {claims[cid].kind for cid in outcome.projection.claim_ids if cid in claims}
        assert used <= {ClaimKind.PARTICIPATION}, f"{kind}: person saw {used}"


def test_person_is_never_interrupted_at_any_escalation_level() -> None:
    for level in (None, EscalationLevel.L2, EscalationLevel.L4, EscalationLevel.L5):
        statement = _statement(escalation_level=level)
        outcome = project_for_role(statement, _request(Role.PERSON))
        assert not outcome.delivery.interrupts, level


def test_person_projection_offers_a_graceful_exit() -> None:
    outcome = project_for_role(_statement(), _request(Role.PERSON))
    text = " ".join(a.content for a in outcome.projection.output.actions).lower()
    assert "stop here" in text and "alright" in text


def test_person_is_told_nothing_about_a_measurement_problem() -> None:
    """Fixing the hearing aid is a caregiver task, not the person's concern."""
    outcome = project_for_role(_statement(ChangeKind.INSUFFICIENT_DATA), _request(Role.PERSON))
    assert outcome.projection is None
    assert outcome.withheld.stage == "no_content"


# ══ Invariant 7 — the Firewall over derived information ══════════════════════

def test_sensitivity_union_a_derived_artefact_inherits_its_sources_guards() -> None:
    """A caregiver digest mentioning bowel discomfort inherits CONTINENCE's
    NOT_SHARED_FAMILY_VIEW guard, without a second policy table."""
    statement = _statement(ctx=ContextSignals(constipation_reported=True, sessions_considered=6))
    assert DataCategory.CONTINENCE in _source_categories_of(statement)

    allowed = project_for_role(statement, _request(Role.PRIMARY_CAREGIVER))
    assert allowed.projection is not None

    shared_view = project_for_role(
        statement, _request(Role.PRIMARY_CAREGIVER, into_shared_family_view=True)
    )
    assert shared_view.projection is None
    assert shared_view.withheld.stage == "firewall"
    assert any("continence" in r for r in shared_view.withheld.reason_codes)


def test_chw_continence_requires_the_care_relevant_guard() -> None:
    statement = _statement(ctx=ContextSignals(constipation_reported=True, sessions_considered=6))
    denied = project_for_role(statement, _request(Role.CHW, care_relevant=False))
    assert denied.withheld.stage == "firewall"

    allowed = project_for_role(statement, _request(Role.CHW, care_relevant=True))
    assert allowed.projection is not None


def test_consent_is_re_evaluated_at_delivery_not_at_generation() -> None:
    """A projection authorised earlier is withheld once consent is revoked."""
    statement = _statement()
    revoked = project_for_role(statement, _request(Role.PRIMARY_CAREGIVER, granted=False))
    assert revoked.projection is None
    assert revoked.withheld.stage == "firewall"
    assert "consent_absent" in revoked.withheld.reason_codes


def test_projection_matrix_denies_by_default() -> None:
    assert projection_grant_for(ArtefactClass.CLINICIAN_PACKET, Role.CHW) is None
    assert projection_grant_for(ArtefactClass.EXPORT, Role.PRIMARY_CAREGIVER) is None
    assert projection_grant_for(ArtefactClass.NOTIFICATION, Role.PERSON) is None
    assert projection_grant_for(ArtefactClass.CHW_PACKET, Role.CHW) is not None


def test_admin_receives_no_derived_information() -> None:
    decision = project(
        Actor(actor_id="a", role=Role.ADMIN, subject_person_id="p1"),
        DerivedArtefact(artefact_class=ArtefactClass.REPORT, subject_person_id="p1"),
        RequestContext(action=Action.READ, purpose=Purpose.CARE_COORDINATION),
    )
    assert not decision.allowed


def test_research_extract_is_denied_and_life_story_is_a_hard_exclusion() -> None:
    actor = Actor(actor_id="r", role=Role.CLINICIAN, subject_person_id="p1")
    ctx = RequestContext(action=Action.READ, purpose=Purpose.RESEARCH)

    plain = project(
        actor,
        DerivedArtefact(artefact_class=ArtefactClass.RESEARCH_EXTRACT, subject_person_id="p1"),
        ctx,
    )
    assert not plain.allowed
    assert "research_requires_separate_consent" in plain.reason_codes

    with_life_story = project(
        actor,
        DerivedArtefact(
            artefact_class=ArtefactClass.RESEARCH_EXTRACT,
            subject_person_id="p1",
            source_categories=frozenset({DataCategory.LIFE_STORY_MEMORY}),
        ),
        ctx,
    )
    assert not with_life_story.allowed
    assert with_life_story.is_violation


def test_never_collected_category_in_a_derivation_is_a_violation() -> None:
    decision = project(
        Actor(actor_id="cg", role=Role.PRIMARY_CAREGIVER, subject_person_id="p1"),
        DerivedArtefact(
            artefact_class=ArtefactClass.REPORT,
            subject_person_id="p1",
            source_categories=frozenset({DataCategory.RAW_AV}),
        ),
        RequestContext(
            action=Action.READ, purpose=Purpose.CARE_COORDINATION,
            consent=ConsentState(granted=True),
        ),
    )
    assert not decision.allowed
    assert decision.is_violation


def test_embedded_live_position_carries_its_guard_even_if_undeclared() -> None:
    actor = Actor(actor_id="cg", role=Role.PRIMARY_CAREGIVER, subject_person_id="p1")
    artefact = DerivedArtefact(
        artefact_class=ArtefactClass.NOTIFICATION,
        subject_person_id="p1",
        embeds_live_position=True,
    )
    calm = project(
        actor, artefact,
        RequestContext(
            action=Action.READ, purpose=Purpose.SAFETY_RESPONSE,
            consent=ConsentState(granted=True),
        ),
    )
    assert not calm.allowed

    emergency = project(
        actor, artefact,
        RequestContext(
            action=Action.READ, purpose=Purpose.SAFETY_RESPONSE,
            active_escalation=EscalationLevel.L4,
            consent=ConsentState(granted=True),
        ),
    )
    assert emergency.allowed
    assert "geo_access_logged" in emergency.obligations


# ══ Invariant 14 — silence is a first-class, audited outcome ═════════════════

def test_no_change_interrupts_nobody_and_reassures_the_caregiver() -> None:
    statement = _statement(ChangeKind.NO_CHANGE)
    outcomes = {o.role: o for o in project_all(statement, _requests())}

    assert not any(o.delivery.interrupts for o in outcomes.values())
    caregiver = outcomes[Role.PRIMARY_CAREGIVER].projection
    assert caregiver is not None
    assert caregiver.headline == "Nothing needs your attention today."
    # CHW and clinician are not troubled at all.
    assert outcomes[Role.CHW].projection is None
    assert outcomes[Role.CLINICIAN].projection is None


def test_insufficient_data_produces_a_measurement_action_never_an_alert() -> None:
    statement = _statement(
        ChangeKind.INSUFFICIENT_DATA,
        ctx=ContextSignals(hearing_aid_unused=True, low_quality_share=0.8, sessions_considered=4),
    )
    outcome = project_for_role(statement, _request(Role.PRIMARY_CAREGIVER))
    assert outcome.projection is not None
    assert outcome.delivery.delivery_class is DeliveryClass.INFORMATIONAL
    assert not outcome.delivery.interrupts
    action_text = " ".join(a.content for a in outcome.projection.output.actions).lower()
    assert "hearing aid" in action_text


def test_withheld_records_the_stage_and_the_reason() -> None:
    outcome = project_for_role(_statement(), _request(Role.PRIMARY_CAREGIVER, granted=False))
    assert outcome.withheld is not None
    assert outcome.withheld.stage == "firewall"
    assert outcome.withheld.reason_codes
    assert outcome.delivery.reason_codes[0].startswith("withheld_at:")


def test_suppression_is_recorded_not_silently_dropped() -> None:
    statement = _statement()
    projection = project_for_role(statement, _request(Role.PRIMARY_CAREGIVER)).projection

    duplicate = classify(projection, change_kind=ChangeKind.MEANINGFUL_CHANGE, duplicative=True)
    assert duplicate.delivery_class is DeliveryClass.NO_NOTIFICATION
    assert duplicate.suppressed

    over_budget = classify(
        projection, change_kind=ChangeKind.MEANINGFUL_CHANGE, budget_exhausted=True
    )
    assert over_budget.delivery_class is DeliveryClass.REVIEW_WHEN_CONVENIENT
    assert over_budget.suppressed  # deferred, never dropped


# ══ Delivery classes are orthogonal to the escalation ladder ═════════════════

def test_one_l3_statement_delivers_differently_to_each_role() -> None:
    statement = _statement(escalation_level=EscalationLevel.L3)
    classes = {
        o.role: o.delivery.delivery_class
        for o in project_all(statement, _requests())
        if o.projection
    }
    assert classes[Role.PERSON] is DeliveryClass.INFORMATIONAL
    assert classes[Role.PRIMARY_CAREGIVER] is DeliveryClass.ACTION_REQUIRED
    assert classes[Role.CLINICIAN] is DeliveryClass.NO_NOTIFICATION
    assert len(set(classes.values())) > 1


@pytest.mark.parametrize(
    "level,expected",
    [(EscalationLevel.L5, DeliveryClass.EMERGENCY), (EscalationLevel.L4, DeliveryClass.URGENT)],
)
def test_l4_and_l5_always_fire_and_bypass_every_suppression(level, expected) -> None:
    statement = _statement(escalation_level=level)
    projection = project_for_role(statement, _request(Role.PRIMARY_CAREGIVER)).projection
    decision = classify(
        projection,
        change_kind=ChangeKind.MEANINGFUL_CHANGE,
        duplicative=True,
        budget_exhausted=True,
    )
    assert decision.delivery_class is expected
    assert decision.bypassed_budget
    assert not decision.suppressed


# ══ Every projection is safety-gated ═════════════════════════════════════════

def test_every_projection_carries_the_three_layer_contract() -> None:
    for kind in ChangeKind:
        for outcome in project_all(_statement(kind), _requests()):
            if outcome.projection is None:
                continue
            out = outcome.projection.output
            assert out.facts and out.actions
            for hypothesis in out.hypotheses:
                assert "not a diagnosis" in hypothesis.label.lower()


def test_a_projection_blocked_by_the_gateway_is_withheld_not_emitted(monkeypatch) -> None:
    """If a builder is ever edited into emitting a forbidden claim, the gateway
    catches it and the human sees nothing rather than the raw text."""
    from app.safety.models import CheckResult, GatewayCheck, GatewayResult

    blocked = GatewayResult(
        passed=False,
        check_results=(CheckResult(check=GatewayCheck.DIAGNOSIS, passed=False),),
        blocked_by=GatewayCheck.DIAGNOSIS,
        obligations=(),
    )
    monkeypatch.setattr("app.projection.service.safety_evaluate", lambda *a, **k: blocked)

    outcome = project_for_role(_statement(), _request(Role.PRIMARY_CAREGIVER))
    assert outcome.projection is None
    assert outcome.withheld.stage == "safety_gateway"
    assert outcome.withheld.reason_codes == ("blocked_by:diagnosis",)


# ── helper ────────────────────────────────────────────────────────────────────
def _source_categories_of(statement) -> frozenset[DataCategory]:
    from app.projection.builders import _source_categories

    return _source_categories(statement)


# ══ Secondary caregiver — informed, not operational ══════════════════════════

def test_secondary_caregiver_is_denied_a_cognitive_state_insight() -> None:
    """The remote son is not granted cognitive state, so he cannot receive an
    insight derived from it — the sensitivity union carries that through.

    This is the firewall doing exactly what it is for. The builder still runs,
    because a denial that names the category is a far better audit record than
    "nobody wrote a builder for this role".
    """
    statement = _statement()
    outcome = project_for_role(statement, _request(Role.SECONDARY_CAREGIVER))

    assert outcome.projection is None
    assert outcome.withheld.stage == "firewall"
    assert "source_category_denied:cognitive_state" in outcome.withheld.reason_codes


def test_secondary_caregiver_is_never_interrupted() -> None:
    """Their attention budget is zero: they are informed, never paged."""
    for kind in ChangeKind:
        statement = _statement(kind)
        outcome = project_for_role(statement, _request(Role.SECONDARY_CAREGIVER))
        assert outcome.delivery.interrupts is False, kind


def test_secondary_caregiver_action_is_support_never_a_care_check() -> None:
    """Built before the firewall sees it, so the content itself is assertable.

    Two people acting on one alert from two cities is worse than one, and a
    check he cannot physically carry out is anxiety rather than help.
    """
    from app.projection.builders import project_caregiver, project_secondary_caregiver

    statement = _statement()
    claims = shared_claims(statement)

    primary = project_caregiver(statement, claims)
    secondary = project_secondary_caregiver(statement, claims)
    assert primary is not None and secondary is not None

    primary_actions = {a.content for a in primary.output.actions}
    secondary_actions = {a.content for a in secondary.output.actions}
    assert len(secondary_actions) == 1
    assert secondary_actions.isdisjoint(primary_actions), (
        "a remote relative was handed the primary caregiver's care checks"
    )


def test_secondary_caregiver_sees_fewer_facts_than_the_primary() -> None:
    from app.projection.builders import project_caregiver, project_secondary_caregiver

    statement = _statement()
    claims = shared_claims(statement)
    primary = project_caregiver(statement, claims)
    secondary = project_secondary_caregiver(statement, claims)
    assert primary is not None and secondary is not None
    assert len(secondary.output.facts) < len(primary.output.facts)


def test_secondary_caregiver_is_told_nothing_when_data_is_unmeasurable() -> None:
    """A faulty microphone is not family news."""
    from app.projection.builders import project_secondary_caregiver

    statement = _statement(kind=ChangeKind.INSUFFICIENT_DATA)
    assert project_secondary_caregiver(statement, shared_claims(statement)) is None
