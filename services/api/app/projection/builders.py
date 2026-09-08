"""The four role projection builders — one evidence base, four purpose-bound views.

Every builder consumes the same `ContextualisedStatement` and the same claim
set derived from it by `shared_claims()`. A builder selects claims by id; it
never rewords one. That is how invariant 12 holds: two projections of the same
statement may differ in completeness, register, hypothesis and action, and are
structurally incapable of asserting contradictory facts.

No LLM. Every sentence below is templated, which keeps the whole output space
enumerable in tests. When the LLM phrasing pass lands (tech-stack.md §13.2.5)
it rewrites the *headline and action register only*, downstream of claim
selection and upstream of the Safety Gateway — it never selects evidence.

What each role does NOT get is as deliberate as what it does:

    person      participation only. No change claims, no causes, no
                confidence, no statistics — nothing that frames the moment as
                an assessment of them (DESIGN.md A3.1).
    caregiver   compression. What changed, what to check, what can wait.
                No measurement gaps, no raw telemetry.
    CHW         operational. What to check on the visit, and what is unknown.
    clinician   everything, including confounders and gaps, with no
                interpretation offered.
"""

from __future__ import annotations

from app.behaviour.models import (
    CauseUrgency,
    ChangeKind,
    ContextualisedStatement,
)
from app.firewall.projection_policy import ArtefactClass
from app.firewall.roles import DataCategory, Role
from app.safety.models import (
    ThreeLayerAction,
    ThreeLayerFact,
    ThreeLayerHypothesis,
    ThreeLayerOutput,
)

from .models import ClaimKind, EvidenceClaim, RoleProjection

BUILDER_VERSION = "projection/1"

# Reversible causes whose discussion touches a private-by-default category.
# Declaring this is what makes the Firewall's sensitivity union bite: a
# caregiver digest that mentions bowel discomfort inherits CONTINENCE's
# NOT_SHARED_FAMILY_VIEW guard automatically.
_CAUSE_CATEGORY: dict[str, DataCategory] = {
    "constipation": DataCategory.CONTINENCE,
    "routine_disruption": DataCategory.ROUTINE,
    "new_environment": DataCategory.ROUTINE,
}

_CONFIDENCE_TEXT: dict[str, str] = {
    "good": "Measurement conditions were good for these sessions.",
    "moderate": "Measurement conditions were mixed, so this evidence is moderate.",
    "low": "Measurement conditions were poor, so this evidence is weak.",
}


def shared_claims(statement: ContextualisedStatement) -> tuple[EvidenceClaim, ...]:
    """Derive the single claim set every role draws from. Pure.

    Called once per statement. Builders receive the result; none of them may
    construct an `EvidenceClaim` of their own.
    """
    claims: list[EvidenceClaim] = [
        EvidenceClaim(
            claim_id="participation",
            kind=ClaimKind.PARTICIPATION,
            text=f"She took part in {statement.domain} activities recently.",
            person_text="You spent some time on your activities recently.",
            source="system:certified_observation",
        )
    ]

    claims.append(
        EvidenceClaim(
            claim_id="change",
            kind=ClaimKind.CHANGE,
            text=statement.statement,
            source="system:certified_observation",
            confidence=0.9 if statement.measurement_confidence == "good" else 0.7,
        )
    )

    for cause in statement.reversible_causes:
        claims.append(
            EvidenceClaim(
                claim_id=f"cause:{cause.code}",
                kind=ClaimKind.CAUSE,
                text=cause.description,
                source="human:reported",
                confidence=0.8,
            )
        )

    for conf in statement.confounders:
        claims.append(
            EvidenceClaim(
                claim_id=f"confounder:{conf.code}",
                kind=ClaimKind.CONFOUNDER,
                text=conf.detail,
                source="system:measurement_quality",
            )
        )

    for i, question in enumerate(statement.open_questions):
        claims.append(
            EvidenceClaim(
                claim_id=f"gap:{i}",
                kind=ClaimKind.GAP,
                text=question,
                source="system:completeness_check",
            )
        )

    claims.append(
        EvidenceClaim(
            claim_id="confidence",
            kind=ClaimKind.CONFIDENCE,
            text=_CONFIDENCE_TEXT[statement.measurement_confidence],
            source="system:measurement_quality",
        )
    )

    return tuple(claims)


def _by_id(claims: tuple[EvidenceClaim, ...]) -> dict[str, EvidenceClaim]:
    return {c.claim_id: c for c in claims}


def _facts(
    claims: tuple[EvidenceClaim, ...], claim_ids: list[str], role: Role
) -> tuple[ThreeLayerFact, ...]:
    """Render selected claims as FACT-layer entries, verbatim from the claim."""
    index = _by_id(claims)
    return tuple(
        ThreeLayerFact(
            content=index[cid].render_for(role),
            source=index[cid].source,
            confidence=index[cid].confidence,
            verification_status="verified",
        )
        for cid in claim_ids
        if cid in index
    )


def _source_categories(statement: ContextualisedStatement) -> frozenset[DataCategory]:
    """Every raw category the statement's content draws on. Honest by construction."""
    categories = {DataCategory.COGNITIVE_STATE}
    for cause in statement.reversible_causes:
        mapped = _CAUSE_CATEGORY.get(cause.code)
        if mapped is not None:
            categories.add(mapped)
    return frozenset(categories)


# ── Person ────────────────────────────────────────────────────────────────────
def project_person(
    statement: ContextualisedStatement, claims: tuple[EvidenceClaim, ...]
) -> RoleProjection | None:
    """Continuity and a next step. Never an assessment of them.

    The person receives the participation claim and nothing else — no change
    claim, no cause, no confidence. There is no branch in this function that
    can surface a deviation, which is why the person can never be alerted
    about themselves.
    """
    claim_ids = ["participation"]
    facts = _facts(claims, claim_ids, Role.PERSON)
    if not facts:
        return None

    if statement.change_kind is ChangeKind.INSUFFICIENT_DATA:
        # Nothing to say to the person about a measurement problem. The fix is
        # a caregiver/CHW task, not their concern.
        return None

    return RoleProjection(
        person_id=statement.person_id,
        role=Role.PERSON,
        artefact_class=ArtefactClass.DERIVED_INSIGHT,
        report_type="person_support",
        escalation_level=None,  # the person is never shown an escalation level
        headline="Nice to spend time with you today.",
        output=ThreeLayerOutput(
            facts=facts,
            hypotheses=(),
            actions=(
                ThreeLayerAction(
                    content="Would you like to look at some photographs together?",
                    is_safe=True,
                    requires_human_approval=False,
                ),
                ThreeLayerAction(
                    content="Or we can stop here — that is completely alright.",
                    is_safe=True,
                    requires_human_approval=False,
                ),
            ),
            role_target=Role.PERSON,
        ),
        claim_ids=tuple(claim_ids),
        measurement_confidence=statement.measurement_confidence,
        source_categories=frozenset({DataCategory.COGNITIVE_STATE}),
        evidence_refs=statement.evidence_refs,
        builder_version=BUILDER_VERSION,
    )


# ── Caregiver ─────────────────────────────────────────────────────────────────
def project_caregiver(
    statement: ContextualisedStatement, claims: tuple[EvidenceClaim, ...]
) -> RoleProjection | None:
    """Compression: what changed, do I act, what can wait.

    Omits measurement gaps and confounder arithmetic — the caregiver needs the
    conclusion and the check, not the epistemics.
    """
    index = _by_id(claims)
    cause_ids = [c.claim_id for c in claims if c.kind is ClaimKind.CAUSE]

    if statement.change_kind is ChangeKind.NO_CHANGE:
        claim_ids = ["participation", "change"]
        headline = "Nothing needs your attention today."
        hypotheses: tuple[ThreeLayerHypothesis, ...] = ()
        actions = (
            ThreeLayerAction(
                content="Carry on with the usual routine.",
                is_safe=True,
                requires_human_approval=False,
            ),
        )
    elif statement.change_kind is ChangeKind.INSUFFICIENT_DATA:
        claim_ids = ["change", "confidence"]
        headline = "Recent sessions could not be measured reliably."
        hypotheses = (
            ThreeLayerHypothesis(
                content=(
                    "This is about the recording conditions, not about her. "
                    "Activity data is on hold until it is sorted out."
                ),
                label="This is not a diagnosis.",
            ),
        )
        actions = tuple(
            ThreeLayerAction(content=c.check_action, is_safe=True)
            for c in statement.reversible_causes
            if c.code in ("hearing_aid_unused", "glasses_unused")
        ) or (
            ThreeLayerAction(
                content="Check that the volume is up and the app is in her language.",
                is_safe=True,
            ),
        )
    else:
        claim_ids = ["change", *cause_ids, "confidence"]
        headline = "Something has changed from her usual pattern."
        hypotheses = (
            ThreeLayerHypothesis(
                content=(
                    "The things listed above are reversible and are worth checking "
                    "first. A change like this often has an everyday explanation."
                ),
                label="This is not a diagnosis.",
            ),
        )
        checks = [
            c.check_action
            for c in statement.reversible_causes
            if c.urgency in (CauseUrgency.SAME_DAY, CauseUrgency.SOON)
        ][:3]
        actions = tuple(
            ThreeLayerAction(content=text, is_safe=True) for text in checks
        ) or (
            ThreeLayerAction(
                content="Keep the routine the same and mention this at the next visit.",
                is_safe=True,
            ),
        )

    claim_ids = [cid for cid in claim_ids if cid in index]
    facts = _facts(claims, claim_ids, Role.PRIMARY_CAREGIVER)
    if not facts:
        return None

    return RoleProjection(
        person_id=statement.person_id,
        role=Role.PRIMARY_CAREGIVER,
        artefact_class=ArtefactClass.DERIVED_INSIGHT,
        report_type="caregiver_insight",
        escalation_level=statement.escalation_level,
        headline=headline,
        output=ThreeLayerOutput(
            facts=facts,
            hypotheses=hypotheses,
            actions=actions,
            role_target=Role.PRIMARY_CAREGIVER,
        ),
        claim_ids=tuple(claim_ids),
        measurement_confidence=statement.measurement_confidence,
        source_categories=_source_categories(statement),
        evidence_refs=statement.evidence_refs,
        builder_version=BUILDER_VERSION,
    )


# ── CHW ───────────────────────────────────────────────────────────────────────
def project_chw(
    statement: ContextualisedStatement, claims: tuple[EvidenceClaim, ...]
) -> RoleProjection | None:
    """Visit preparation: what to check, and what is not yet known.

    Unlike the caregiver, the CHW gets the gaps — an unanswered question is
    the point of a visit.
    """
    if statement.change_kind is ChangeKind.NO_CHANGE:
        return None  # nothing to prepare for; the household is not flagged

    index = _by_id(claims)
    cause_ids = [c.claim_id for c in claims if c.kind is ClaimKind.CAUSE]
    gap_ids = [c.claim_id for c in claims if c.kind is ClaimKind.GAP]
    claim_ids = [cid for cid in ["change", *cause_ids, "confidence", *gap_ids] if cid in index]

    facts = _facts(claims, claim_ids, Role.CHW)
    if not facts:
        return None

    checks = [c.check_action for c in statement.reversible_causes][:5]
    actions = tuple(ThreeLayerAction(content=t, is_safe=True) for t in checks) or (
        ThreeLayerAction(
            content="Confirm hearing aid and glasses use, and ask about sleep.",
            is_safe=True,
        ),
    )

    return RoleProjection(
        person_id=statement.person_id,
        role=Role.CHW,
        artefact_class=ArtefactClass.CHW_PACKET,
        report_type="chw_visit_brief",
        escalation_level=statement.escalation_level,
        headline="For the next visit — what to check.",
        output=ThreeLayerOutput(
            facts=facts,
            hypotheses=(
                ThreeLayerHypothesis(
                    content=(
                        "Reversible causes have not been ruled out. Check them before "
                        "treating this as anything else."
                    ),
                    label="This is not a diagnosis.",
                ),
            ),
            actions=actions,
            role_target=Role.CHW,
        ),
        claim_ids=tuple(claim_ids),
        measurement_confidence=statement.measurement_confidence,
        source_categories=_source_categories(statement),
        evidence_refs=statement.evidence_refs,
        builder_version=BUILDER_VERSION,
    )


# ── Clinician ─────────────────────────────────────────────────────────────────
def project_clinician(
    statement: ContextualisedStatement, claims: tuple[EvidenceClaim, ...]
) -> RoleProjection | None:
    """Longitudinal evidence: change, confidence, confounders, what is unanswered.

    The clinician receives every claim in the set. The system still offers no
    interpretation — `interpretation_withheld` is stated as an action, because
    naming the boundary is part of the evidence.
    """
    if statement.change_kind is ChangeKind.NO_CHANGE:
        return None  # nothing enters the since-last-review pack

    claim_ids = [c.claim_id for c in claims if c.kind is not ClaimKind.PARTICIPATION]
    facts = _facts(claims, claim_ids, Role.CLINICIAN)
    if not facts:
        return None

    return RoleProjection(
        person_id=statement.person_id,
        role=Role.CLINICIAN,
        artefact_class=ArtefactClass.CLINICIAN_PACKET,
        report_type="clinical_since_last_review",
        escalation_level=statement.escalation_level,
        headline="Since your last review.",
        output=ThreeLayerOutput(
            facts=facts,
            hypotheses=(
                ThreeLayerHypothesis(
                    content=(
                        "Reversible contributors listed above were reported but not "
                        "verified. No trajectory is inferred by the system."
                    ),
                    label="This is not a diagnosis.",
                ),
            ),
            actions=(
                ThreeLayerAction(
                    content=(
                        "Review alongside the caregiver and CHW notes at the next "
                        "appointment. Clinical interpretation is yours to make."
                    ),
                    is_safe=True,
                ),
            ),
            role_target=Role.CLINICIAN,
        ),
        claim_ids=tuple(claim_ids),
        measurement_confidence=statement.measurement_confidence,
        source_categories=_source_categories(statement),
        evidence_refs=statement.evidence_refs,
        builder_version=BUILDER_VERSION,
    )


# ── Secondary caregiver ───────────────────────────────────────────────────────
def project_secondary_caregiver(
    statement: ContextualisedStatement, claims: tuple[EvidenceClaim, ...]
) -> RoleProjection | None:
    """Informed, not operational.

    The son who lives in another city needs to know something changed and that
    it is being held. What he must *not* receive is the reversible-cause
    checklist: two people acting on one alert from two cities is worse than one,
    and a check he cannot physically carry out becomes anxiety rather than help.

    So his action is a real one that is genuinely his — supporting the person
    who is in the room. The three-layer contract requires an action, and the
    honest answer to "what can I do from here?" is not "nothing".

    Facts are rendered verbatim from the shared claim set, so this projection
    omits relative to the primary caregiver's and never differs from it.
    """
    index = _by_id(claims)

    if statement.change_kind is ChangeKind.NO_CHANGE:
        claim_ids = ["participation"]
        headline = "She is close to her usual pattern."
        action = "Nothing needs doing. A call when it suits you is always welcome."
    elif statement.change_kind is ChangeKind.INSUFFICIENT_DATA:
        # Nothing to say. Telling a remote relative that the microphone was
        # faulty is noise, not information.
        return None
    else:
        claim_ids = ["change", "confidence"]
        headline = "Something has changed, and it is being looked into."
        action = (
            "The family member providing daily care has been told and is "
            "checking. A call to them this evening would help."
        )

    claim_ids = [cid for cid in claim_ids if cid in index]
    facts = _facts(claims, claim_ids, Role.SECONDARY_CAREGIVER)
    if not facts:
        return None

    return RoleProjection(
        person_id=statement.person_id,
        role=Role.SECONDARY_CAREGIVER,
        artefact_class=ArtefactClass.DERIVED_INSIGHT,
        report_type="family_update",
        escalation_level=statement.escalation_level,
        headline=headline,
        output=ThreeLayerOutput(
            facts=facts,
            hypotheses=(),
            # Exactly one action, and it is support — never a care check.
            actions=(ThreeLayerAction(content=action, is_safe=True),),
            role_target=Role.SECONDARY_CAREGIVER,
        ),
        claim_ids=tuple(claim_ids),
        measurement_confidence=statement.measurement_confidence,
        source_categories=_source_categories(statement),
        evidence_refs=statement.evidence_refs,
        builder_version=BUILDER_VERSION,
    )


BUILDERS = {
    Role.PERSON: project_person,
    Role.PRIMARY_CAREGIVER: project_caregiver,
    Role.SECONDARY_CAREGIVER: project_secondary_caregiver,
    Role.CHW: project_chw,
    Role.CLINICIAN: project_clinician,
}
