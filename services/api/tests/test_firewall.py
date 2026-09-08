"""Memory Firewall — exhaustive deterministic authZ tests.

These encode the role-scope matrix. They are safety-critical: a regression here
is a safeguarding failure, so the suite is deliberately thorough.
"""

from __future__ import annotations

import pytest

from app.firewall import (
    Action,
    Actor,
    ConsentState,
    DataCategory,
    EscalationLevel,
    FirewallDenied,
    InMemoryAuditSink,
    Purpose,
    RequestContext,
    Resource,
    Role,
    enforce,
    evaluate,
)

PERSON_ID = "person:001"


def actor(role: Role) -> Actor:
    return Actor(actor_id=f"actor:{role.value}", role=role, subject_person_id=PERSON_ID)


def resource(category: DataCategory, **kw) -> Resource:
    return Resource(category=category, subject_person_id=PERSON_ID, **kw)


def ctx(
    action: Action,
    purpose: Purpose,
    *,
    consent: bool = False,
    escalation: EscalationLevel = EscalationLevel.L0,
    care_relevant: bool = False,
    shared_family: bool = False,
) -> RequestContext:
    return RequestContext(
        action=action,
        purpose=purpose,
        active_escalation=escalation,
        care_relevant=care_relevant,
        consent=ConsentState(granted=consent),
        into_shared_family_view=shared_family,
    )


# ── Person self-access ────────────────────────────────────────────────────────
def test_person_reads_own_private_note_allowed():
    d = evaluate(
        actor(Role.PERSON),
        resource(DataCategory.PERSON_PRIVATE_NOTE),
        ctx(Action.READ, Purpose.SELF_ACCESS),
    )
    assert d.allowed
    assert d.reason_codes == ("granted",)


# ── Scope-expansion is caught and named ──────────────────────────────────────
def test_caregiver_reading_person_private_note_denied_as_scope_expansion():
    d = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        resource(DataCategory.PERSON_PRIVATE_NOTE),
        ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True),
    )
    assert not d.allowed
    assert "scope_expansion_attempt" in d.reason_codes


def test_secondary_caregiver_reading_continence_denied():
    # Continence is private-by-default and excluded from the shared/secondary scope.
    d = evaluate(
        actor(Role.SECONDARY_CAREGIVER),
        resource(DataCategory.CONTINENCE),
        ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True),
    )
    assert not d.allowed
    assert "scope_expansion_attempt" in d.reason_codes


# ── Life story: primary/secondary permitted with consent + purpose ───────────
def test_primary_reads_life_story_with_consent_allowed():
    d = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        resource(DataCategory.LIFE_STORY_MEMORY),
        ctx(Action.READ, Purpose.PERSONALISATION, consent=True),
    )
    assert d.allowed


def test_life_story_wrong_purpose_denied():
    d = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        resource(DataCategory.LIFE_STORY_MEMORY),
        ctx(Action.READ, Purpose.SAFETY_RESPONSE, consent=True),
    )
    assert not d.allowed
    assert "purpose_not_permitted" in d.reason_codes


def test_life_story_without_consent_denied():
    d = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        resource(DataCategory.LIFE_STORY_MEMORY),
        ctx(Action.READ, Purpose.PERSONALISATION, consent=False),
    )
    assert not d.allowed
    assert "consent_absent" in d.reason_codes


# ── Live position: only during active L4/L5, with emergency override ──────────
def test_live_position_denied_at_low_escalation():
    d = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        resource(DataCategory.LIVE_POSITION),
        ctx(Action.READ, Purpose.SAFETY_RESPONSE, consent=True, escalation=EscalationLevel.L2),
    )
    assert not d.allowed
    assert any(r.startswith("guard_failed:active_l4_l5") for r in d.reason_codes)


def test_live_position_allowed_at_l5_via_emergency_override_without_consent():
    d = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        resource(DataCategory.LIVE_POSITION),
        ctx(Action.READ, Purpose.SAFETY_RESPONSE, consent=False, escalation=EscalationLevel.L5),
    )
    assert d.allowed
    assert "granted_via_emergency_override" in d.reason_codes
    assert "emergency_override" in d.obligations
    assert "geo_access_logged" in d.obligations  # the grant's own obligation is preserved


# ── Never-collected categories: hard deny + violation ────────────────────────
@pytest.mark.parametrize("category", [DataCategory.RAW_AV, DataCategory.FINANCIAL])
def test_never_collected_categories_hard_denied_as_violation(category):
    d = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        resource(category),
        ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True),
    )
    assert not d.allowed
    assert d.is_violation
    assert "never_collected_category" in d.reason_codes


# ── Clinical summary ──────────────────────────────────────────────────────────
def test_clinician_reads_clinical_summary_allowed():
    d = evaluate(
        actor(Role.CLINICIAN),
        resource(DataCategory.CLINICAL_SUMMARY),
        ctx(Action.READ, Purpose.CLINICAL_REVIEW, consent=True),
    )
    assert d.allowed


# ── Continence guards (CHW: care-relevant + not shared family view) ──────────
def test_chw_continence_requires_care_relevant():
    denied = evaluate(
        actor(Role.CHW),
        resource(DataCategory.CONTINENCE),
        ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True, care_relevant=False),
    )
    assert not denied.allowed
    assert any(r.startswith("guard_failed:care_relevant") for r in denied.reason_codes)

    allowed = evaluate(
        actor(Role.CHW),
        resource(DataCategory.CONTINENCE),
        ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True, care_relevant=True),
    )
    assert allowed.allowed


def test_continence_never_in_shared_family_view():
    d = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        resource(DataCategory.CONTINENCE),
        ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True, shared_family=True),
    )
    assert not d.allowed
    assert any(r.startswith("guard_failed:not_shared_family_view") for r in d.reason_codes)


# ── Admin & system ────────────────────────────────────────────────────────────
def test_admin_has_no_person_data_access():
    d = evaluate(
        actor(Role.ADMIN),
        resource(DataCategory.CLINICAL_SUMMARY),
        ctx(Action.READ, Purpose.CLINICAL_REVIEW, consent=True),
    )
    assert not d.allowed
    assert "admin_no_person_data" in d.reason_codes


def test_system_writes_cognitive_state_without_consent():
    d = evaluate(
        actor(Role.SYSTEM),
        resource(DataCategory.COGNITIVE_STATE),
        ctx(Action.WRITE, Purpose.PERSONALISATION, consent=False),
    )
    assert d.allowed


# ── PWM fact reads governed by the fact's own visibility list ────────────────
def test_pwm_fact_read_respects_visibility_list():
    res_in = resource(DataCategory.PWM_FACT, visibility=("person", "primary_caregiver"))
    allowed = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        res_in,
        ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True),
    )
    assert allowed.allowed

    res_out = resource(DataCategory.PWM_FACT, visibility=("person",))
    denied = evaluate(
        actor(Role.PRIMARY_CAREGIVER),
        res_out,
        ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True),
    )
    assert not denied.allowed
    assert "scope_expansion_attempt" in denied.reason_codes


def test_pwm_fact_person_reads_own():
    d = evaluate(
        actor(Role.PERSON),
        resource(DataCategory.PWM_FACT, visibility=()),
        ctx(Action.READ, Purpose.SELF_ACCESS),
    )
    assert d.allowed


def test_pwm_fact_research_purpose_on_identified_data_denied():
    d = evaluate(
        actor(Role.PERSON),
        resource(DataCategory.PWM_FACT, visibility=("person",)),
        ctx(Action.READ, Purpose.RESEARCH),
    )
    assert not d.allowed
    assert "research_on_identified_data" in d.reason_codes


# ── enforce(): audits everything, raises on deny ─────────────────────────────
def test_enforce_audits_allow_and_raises_on_deny():
    sink = InMemoryAuditSink()

    ok = enforce(
        actor(Role.PERSON),
        resource(DataCategory.PERSON_PRIVATE_NOTE),
        ctx(Action.READ, Purpose.SELF_ACCESS),
        sink,
    )
    assert ok.allowed
    assert len(sink.records) == 1
    assert sink.records[0].effect == "allow"

    with pytest.raises(FirewallDenied):
        enforce(
            actor(Role.SECONDARY_CAREGIVER),
            resource(DataCategory.PERSON_PRIVATE_NOTE),
            ctx(Action.READ, Purpose.CARE_COORDINATION, consent=True),
            sink,
        )
    # Deny is audited too.
    assert len(sink.records) == 2
    assert sink.records[1].effect == "deny"
    assert "scope_expansion_attempt" in sink.records[1].reason_codes
