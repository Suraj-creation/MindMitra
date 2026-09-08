"""Clinical Change Context Engine — reversible causes before interpretation.

The tests that matter here are the ones about what the engine *cannot* do:
it cannot produce progression language, and it cannot describe a change without
first offering the checkable explanations for it.
"""

from __future__ import annotations

import pytest

from app.behaviour import (
    CauseUrgency,
    ChangeKind,
    ChangeSignal,
    ContextSignals,
    ContextualisedStatement,
    contextualise,
)
from app.firewall.roles import EscalationLevel


def _signal(kind: ChangeKind = ChangeKind.MEANINGFUL_CHANGE, **kw) -> ChangeSignal:
    base = dict(person_id="p1", domain="memory", z=-2.4, persistence_days=3, quality=0.88)
    base.update(kw)
    return ChangeSignal(kind=kind, **base)


# ── The forbidden-claim guarantee (invariant 3) ───────────────────────────────

@pytest.mark.parametrize(
    "text",
    [
        "Her dementia is progressing.",
        "Cognitive function is deteriorating.",
        "She is getting worse at names.",
        "This is worsening month on month.",
        "She has dementia.",
        "She is at stage 4.",
        "Her memory is declining.",
    ],
)
def test_statement_rejects_progression_language(text: str) -> None:
    """A ContextualisedStatement carrying a trajectory claim cannot be built."""
    with pytest.raises(ValueError, match="trajectory"):
        ContextualisedStatement(
            person_id="p1",
            domain="memory",
            change_kind=ChangeKind.MEANINGFUL_CHANGE,
            escalation_level=None,
            statement=text,
        )


def test_progression_language_is_rejected_anywhere_not_just_the_statement() -> None:
    """The guard covers causes, confounders and open questions too."""
    from app.behaviour.models import Confounder

    with pytest.raises(ValueError, match="trajectory"):
        ContextualisedStatement(
            person_id="p1",
            domain="memory",
            change_kind=ChangeKind.MEANINGFUL_CHANGE,
            escalation_level=None,
            statement="Sessions sat below her own usual range.",
            confounders=(Confounder(code="x", detail="Consistent with progression."),),
        )


def test_engine_output_never_contains_progression_language() -> None:
    """Exercise every branch of the engine; none of them can emit a trajectory.

    The model validator would raise, so reaching the end of this loop is the
    assertion.
    """
    flags = [
        "infection_signs", "altered_arousal", "dehydration_signs", "sleep_disrupted",
        "pain_reported", "constipation_reported", "hearing_aid_unused",
        "glasses_unused", "routine_disrupted", "bereavement_or_stress",
        "new_environment",
    ]
    for kind in ChangeKind:
        for flag in flags:
            st = contextualise(_signal(kind), ContextSignals(**{flag: True}))
            assert st.interpretation_withheld is True
        contextualise(_signal(kind), ContextSignals(onset_hours=6.0, infection_signs=True))
        contextualise(_signal(kind), ContextSignals(new_medication_within_days=3))


# ── Reversible causes come first, in urgency order ────────────────────────────

def test_same_day_causes_are_ordered_before_everything_else() -> None:
    st = contextualise(
        _signal(),
        ContextSignals(
            routine_disrupted=True,      # routine
            sleep_disrupted=True,        # soon
            infection_signs=True,        # same day
        ),
    )
    urgencies = [c.urgency for c in st.reversible_causes]
    assert urgencies == sorted(
        urgencies,
        key=lambda u: [CauseUrgency.SAME_DAY, CauseUrgency.SOON, CauseUrgency.ROUTINE].index(u),
    )
    assert st.reversible_causes[0].urgency is CauseUrgency.SAME_DAY


def test_every_cause_carries_a_concrete_check_action() -> None:
    """A cause a human cannot act on is not useful. All of them must be."""
    st = contextualise(
        _signal(),
        ContextSignals(
            infection_signs=True, sleep_disrupted=True, pain_reported=True,
            hearing_aid_unused=True, glasses_unused=True, routine_disrupted=True,
            new_environment=True, bereavement_or_stress=True,
            constipation_reported=True, dehydration_signs=True,
            new_medication_within_days=2,
        ),
    )
    assert st.reversible_causes
    for cause in st.reversible_causes:
        assert cause.check_action.strip(), cause.code


def test_recent_onset_is_surfaced_when_a_checkable_cause_exists() -> None:
    st = contextualise(_signal(), ContextSignals(onset_hours=8.0, infection_signs=True))
    assert st.reversible_causes[0].code == "recent_onset"
    assert st.escalation_level is EscalationLevel.L4  # needs a human today


def test_recent_onset_alone_does_not_manufacture_a_cause() -> None:
    """Onset is context, not evidence. With nothing checkable, nothing is claimed."""
    st = contextualise(_signal(), ContextSignals(onset_hours=8.0))
    assert st.reversible_causes == ()
    assert st.escalation_level is None


def test_medication_cause_never_advises_a_dose_change() -> None:
    st = contextualise(_signal(), ContextSignals(new_medication_within_days=3))
    action = st.reversible_causes[0].check_action.lower()
    assert "do not change any dose" in action


# ── Terminal outcomes are first-class (invariant 14) ──────────────────────────

def test_no_change_and_insufficient_data_are_terminal() -> None:
    assert ChangeSignal(kind=ChangeKind.NO_CHANGE, person_id="p", domain="d").is_terminal
    assert ChangeSignal(kind=ChangeKind.INSUFFICIENT_DATA, person_id="p", domain="d").is_terminal
    assert not ChangeSignal(kind=ChangeKind.MEANINGFUL_CHANGE, person_id="p", domain="d").is_terminal


def test_insufficient_data_statement_blames_measurement_not_the_person() -> None:
    st = contextualise(_signal(ChangeKind.INSUFFICIENT_DATA))
    assert "not a result about her" in st.statement


def test_no_change_statement_is_calm() -> None:
    st = contextualise(_signal(ChangeKind.NO_CHANGE))
    assert "within her own usual range" in st.statement


# ── Measurement confidence and confounders ────────────────────────────────────

@pytest.mark.parametrize(
    "ctx,expected",
    [
        (ContextSignals(sessions_considered=8), "good"),
        (ContextSignals(sessions_considered=8, low_quality_share=0.3), "moderate"),
        (ContextSignals(sessions_considered=8, low_quality_share=0.6), "low"),
        (ContextSignals(sessions_considered=2), "moderate"),
        (ContextSignals(sessions_considered=2, language_mismatch_share=0.3), "low"),
    ],
)
def test_measurement_confidence(ctx: ContextSignals, expected: str) -> None:
    assert contextualise(_signal(), ctx).measurement_confidence == expected


def test_language_mismatch_is_a_measurement_note_not_an_ability_note() -> None:
    st = contextualise(_signal(), ContextSignals(language_mismatch_share=0.5, sessions_considered=4))
    detail = next(c.detail for c in st.confounders if c.code == "language_mismatch")
    assert "not her ability" in detail


def test_engine_never_raises_or_lowers_a_supplied_escalation_level() -> None:
    st = contextualise(
        _signal(escalation_level=EscalationLevel.L2),
        ContextSignals(infection_signs=True, onset_hours=4.0),
    )
    assert st.escalation_level is EscalationLevel.L2


# ── Open questions: stating missingness is part of the evidence ───────────────

def test_absence_of_any_reported_cause_is_stated_explicitly() -> None:
    st = contextualise(_signal(), ContextSignals(sessions_considered=5, onset_hours=10.0))
    assert any("No reversible cause" in q for q in st.open_questions)
