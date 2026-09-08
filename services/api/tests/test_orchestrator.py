"""The orchestrator's boundary conditions.

These tests assert the three properties that make an LLM safe to put in front of
this population:

1. Emergency and medication never reach a model.
2. Retrieval is scoped by the Memory Firewall before any data is loaded.
3. An answer with nothing to ground it is refused, not filled in.

None of these calls a language model. The graph's generation node is exercised
in `test_orchestrator_live.py`, which is skipped without Azure configured — the
safety properties must hold with or without a model available.
"""

from __future__ import annotations

import pytest

from app.firewall.models import Actor, ConsentState, RequestContext
from app.firewall.roles import Action, Purpose, Role
from app.orchestrator import (
    Intent,
    classify_intent,
    deterministic_response,
    is_deterministic,
    run_turn,
)
from app.rag import KnowledgeLayer, permitted_layers
from app.rag.fusion import assertable, assess_completeness, detect_conflicts, fuse
from app.rag.models import (
    Lane,
    RetrievedFact,
    SourceAuthority,
)
from app.rag.planner import plan

# ══ 1. Emergency and medication never reach a model ══════════════════════════

@pytest.mark.parametrize(
    "utterance",
    [
        "Help me, I have fallen and I cannot get up",
        "I fell in the kitchen",
        "call an ambulance",
        "my chest hurts",
        "there is pain in my chest",
        "I can't breathe properly",
        "I am lost, I don't know where I am",
    ],
)
def test_an_emergency_is_intercepted_before_the_graph(utterance: str) -> None:
    intent = classify_intent(utterance)
    assert intent is Intent.EMERGENCY, utterance
    assert is_deterministic(intent)
    assert deterministic_response(intent, utterance, display_name="Aitâ")


@pytest.mark.parametrize(
    "utterance",
    [
        "Should I take another tablet?",
        "can I skip my dose today",
        "what is the dosage of my medicine",
        "should I double the dose",
        "I want to stop taking it",
    ],
)
def test_medication_is_intercepted_before_the_graph(utterance: str) -> None:
    intent = classify_intent(utterance)
    assert intent is Intent.MEDICATION, utterance
    assert is_deterministic(intent)

    response = deterministic_response(intent, utterance, display_name="Aitâ")
    assert response is not None
    lowered = response.lower()
    assert "not able to give advice about medicines" in lowered
    # It must not name a dose, a frequency or a drug under any circumstance.
    assert not any(token in lowered for token in ("mg", "twice", "tablets a day"))


def test_a_symptom_plus_a_medication_question_routes_to_the_emergency_path() -> None:
    """Whichever way it is phrased, help beats a refusal to discuss doses."""
    intent = classify_intent("my chest hurts, should I take another tablet")
    assert intent is Intent.EMERGENCY


def test_self_harm_routes_to_a_named_crisis_service() -> None:
    intent = classify_intent("I want to end my life")
    assert intent is Intent.EMERGENCY

    response = deterministic_response(intent, "I want to end my life", display_name="Aitâ")
    assert response is not None
    assert "14416" in response, "the crisis line must be named, not implied"


@pytest.mark.parametrize(
    ("utterance", "expected"),
    [
        ("Who is Rina?", Intent.PERSON_LOOKUP),
        ("What day is it today?", Intent.ORIENTATION),
        ("Tell me about Bihu", Intent.REMINISCENCE),
        ("what do I usually do in the morning", Intent.ROUTINE),
        ("let's play something", Intent.ACTIVITY),
        ("since last review what changed", Intent.CLINICAL),
    ],
)
def test_ordinary_intents_are_allowed_into_the_graph(
    utterance: str, expected: Intent
) -> None:
    intent = classify_intent(utterance)
    assert intent is expected
    assert not is_deterministic(intent)
    assert deterministic_response(intent, utterance, display_name="Aitâ") is None


# ══ 2. The planner never guesses at medication ═══════════════════════════════

def test_a_medication_question_never_plans_a_semantic_lane() -> None:
    """A guessed dose is the worst output this product could emit.

    Even if the pre-check somehow let one through, the retrieval plan for a
    medication question is structured-only: clinician-authored records or
    nothing.
    """
    retrieval_plan = plan("when do I take the blue tablet", vector_available=True)
    assert retrieval_plan.lanes == (Lane.STRUCTURED,)
    assert Lane.VECTOR not in retrieval_plan.lanes
    assert Lane.LEXICAL not in retrieval_plan.lanes


def test_a_relationship_question_uses_the_graph_not_similarity() -> None:
    retrieval_plan = plan("who is Rina", vector_available=True)
    assert Lane.GRAPH in retrieval_plan.lanes
    assert Lane.VECTOR not in retrieval_plan.lanes


def test_the_vector_lane_is_not_planned_without_an_embedder() -> None:
    with_vectors = plan("tell me about Bihu", vector_available=True)
    without = plan("tell me about Bihu", vector_available=False)
    assert Lane.VECTOR in with_vectors.lanes
    assert Lane.VECTOR not in without.lanes
    assert "no embeddings deployment" in without.reason


# ══ 3. The firewall scopes retrieval before any lane runs ════════════════════

def _actor(role: Role) -> Actor:
    return Actor(actor_id=f"actor:{role.value}", role=role, subject_person_id="p1")


def _context(purpose: Purpose, granted: bool = True) -> RequestContext:
    return RequestContext(
        action=Action.READ, purpose=purpose, consent=ConsentState(granted=granted)
    )


def test_the_research_layer_is_denied_to_everyone_but_a_clinician() -> None:
    """K6 is a hard rule, not a matrix row a consent grant could open."""
    requested = (KnowledgeLayer.K6_RESEARCH,)

    for role in (Role.PERSON, Role.PRIMARY_CAREGIVER, Role.CHW):
        allowed, denied = permitted_layers(
            _actor(role), _context(Purpose.CARE_COORDINATION), requested
        )
        assert allowed == (), role
        assert KnowledgeLayer.K6_RESEARCH in denied, role


def test_a_layer_without_consent_is_denied_and_never_queried() -> None:
    allowed, denied = permitted_layers(
        _actor(Role.PRIMARY_CAREGIVER),
        _context(Purpose.CARE_COORDINATION, granted=False),
        (KnowledgeLayer.K3_CAREGIVER,),
    )
    assert allowed == ()
    assert denied == (KnowledgeLayer.K3_CAREGIVER,)


def test_completeness_never_names_a_denied_layer() -> None:
    """Listing what is hidden is itself a disclosure (DESIGN.md B2 rule 3)."""
    gaps = assess_completeness(
        (),
        planned_layers=(KnowledgeLayer.K2_PERSON, KnowledgeLayer.K6_RESEARCH),
        denied_layers=(KnowledgeLayer.K6_RESEARCH,),
    )
    joined = " ".join(gaps).lower()
    assert "research" not in joined
    assert "person" in joined or "own world" in joined


# ══ 4. Conflicts are surfaced, never resolved silently ═══════════════════════

def _fact(
    fact_id: str,
    text: str,
    *,
    source: str,
    authority: SourceAuthority,
    predicate: str = "TAKES_MEDICATION",
    verified: bool = True,
) -> RetrievedFact:
    return RetrievedFact(
        fact_id=fact_id,
        layer=KnowledgeLayer.K2_PERSON,
        lane=Lane.GRAPH,
        text=text,
        source_type=source,
        authority=authority,
        verification_status="verified" if verified else "reported",
        relevance=0.8,
        payload={"predicate": predicate},
    )


def test_two_sources_that_disagree_produce_a_conflict_and_both_are_kept() -> None:
    clinician = _fact(
        "f1", "one tablet in the morning", source="clinician",
        authority=SourceAuthority.CLINICIAN,
    )
    caregiver = _fact(
        "f2", "two tablets in the morning", source="caregiver",
        authority=SourceAuthority.CAREGIVER,
    )

    conflicts = detect_conflicts((clinician, caregiver))
    assert len(conflicts) == 1
    conflict = conflicts[0]
    assert conflict.higher.source_type == "clinician"
    assert conflict.lower.source_type == "caregiver"
    assert conflict.resolvable is True
    assert conflict.describe() == "These accounts differ."


def test_a_contested_fact_is_excluded_from_grounding() -> None:
    """An unresolved disagreement must not be spoken as fact (§9.4)."""
    clinician = _fact(
        "f1", "one tablet in the morning", source="clinician",
        authority=SourceAuthority.CLINICIAN,
    )
    caregiver = _fact(
        "f2", "two tablets in the morning", source="caregiver",
        authority=SourceAuthority.CAREGIVER,
    )
    unrelated = _fact(
        "f3", "Rina is her granddaughter", source="caregiver",
        authority=SourceAuthority.CAREGIVER, predicate="RELATED_TO",
    )

    facts = (clinician, caregiver, unrelated)
    conflicts = detect_conflicts(facts)
    usable = assertable(facts, conflicts)

    ids = {f.fact_id for f in usable}
    assert ids == {"f3"}, "both sides of the conflict must be excluded"


def test_equal_authority_disagreement_asserts_neither() -> None:
    a = _fact("f1", "she walks at six", source="caregiver", authority=SourceAuthority.CAREGIVER)
    b = _fact("f2", "she walks at seven", source="caregiver", authority=SourceAuthority.CAREGIVER)

    conflicts = detect_conflicts((a, b))
    assert len(conflicts) == 1
    assert conflicts[0].equal_authority is True
    assert conflicts[0].resolvable is False
    assert assertable((a, b), conflicts) == ()


# ══ 5. Authority outranks similarity ═════════════════════════════════════════

def test_a_more_authoritative_fact_outranks_a_more_relevant_one() -> None:
    """The question is what is true about this person, not what reads closest."""
    authoritative = RetrievedFact(
        fact_id="f1", layer=KnowledgeLayer.K2_PERSON, lane=Lane.GRAPH,
        text="Rina is her granddaughter", source_type="person",
        authority=SourceAuthority.PERSON, verification_status="verified",
        relevance=0.5,
    )
    merely_similar = RetrievedFact(
        fact_id="f2", layer=KnowledgeLayer.K1_MEDICAL, lane=Lane.LEXICAL,
        text="Granddaughters often provide care", source_type="llm",
        authority=SourceAuthority.LLM, verification_status="unverified",
        relevance=1.0,
    )

    fused = fuse([[merely_similar], [authoritative]])
    assert fused[0].fact_id == "f1"


def test_layers_are_never_merged_by_dedupe() -> None:
    """The same sentence in a guideline and in a caregiver note is two facts."""
    same_text = "Sleep has been disrupted."
    guideline = RetrievedFact(
        fact_id="g1", layer=KnowledgeLayer.K1_MEDICAL, lane=Lane.LEXICAL,
        text=same_text, source_type="system", authority=SourceAuthority.SYSTEM,
    )
    note = RetrievedFact(
        fact_id="c1", layer=KnowledgeLayer.K3_CAREGIVER, lane=Lane.LEXICAL,
        text=same_text, source_type="caregiver", authority=SourceAuthority.CAREGIVER,
    )

    fused = fuse([[guideline], [note]])
    assert len({f.layer for f in fused}) == 2


# ══ 6. Unverified facts are hedged in the wording itself ═════════════════════

def test_an_unverified_fact_is_hedged_not_badged() -> None:
    """The hedge lives in the copy, not in metadata (DESIGN.md D2.2)."""
    reported = RetrievedFact(
        fact_id="f1", layer=KnowledgeLayer.K2_PERSON, lane=Lane.GRAPH,
        text="Rina is visiting on Tuesday", source_type="caregiver",
        source_actor="Anu", authority=SourceAuthority.CAREGIVER,
        verification_status="reported",
    )
    assert reported.may_be_asserted_plainly is False
    assert reported.hedge().startswith("Anu reported that")


def test_a_verified_fact_from_a_verifying_source_is_stated_plainly() -> None:
    verified = RetrievedFact(
        fact_id="f1", layer=KnowledgeLayer.K2_PERSON, lane=Lane.GRAPH,
        text="Rina is her granddaughter", source_type="person",
        authority=SourceAuthority.PERSON, verification_status="verified",
    )
    assert verified.may_be_asserted_plainly is True
    assert verified.hedge() == verified.text


def test_a_model_inference_can_never_be_asserted_plainly() -> None:
    """Ranks 5-8 propose; only 1-4 verify. No automated promotion path (§9.4)."""
    for authority in (
        SourceAuthority.SYSTEM,
        SourceAuthority.BEHAVIOURAL,
        SourceAuthority.MODEL,
        SourceAuthority.LLM,
    ):
        fact = RetrievedFact(
            fact_id="f1", layer=KnowledgeLayer.K2_PERSON, lane=Lane.GRAPH,
            text="she seems tired", source_type="model",
            authority=authority, verification_status="verified",
        )
        assert fact.may_be_asserted_plainly is False, authority
        assert authority.may_verify is False, authority


# ══ 7. A turn with nothing to ground it refuses rather than fills in ═════════

@pytest.mark.asyncio
async def test_a_question_with_no_retrievable_facts_falls_back_safely(
    db_session,
) -> None:
    """No PWM data exists for this person, so there is nothing to answer with.

    The answer must offer a next step — DESIGN.md C1.2 forbids a dead end — and
    must not contain an invented detail.
    """
    from app.identity.models import PersonCreate
    from app.identity.service import create_person, link_care

    await create_person(
        db_session, PersonCreate(person_id="p1", display_name="Aitâ")
    )
    await link_care(
        db_session, actor_id="actor:anu", person_id="p1", role=Role.PRIMARY_CAREGIVER
    )
    await db_session.commit()

    turn = await run_turn(
        db_session,
        actor=_actor(Role.PRIMARY_CAREGIVER),
        question="Who is Rina?",
        display_name="Aitâ",
    )

    assert turn.path == "fallback"
    assert turn.sources == ()
    assert "Rina" not in turn.answer, "the fallback must not echo an unknown name as fact"
    # Never a dead end.
    assert "?" in turn.answer


@pytest.mark.asyncio
async def test_an_emergency_turn_never_touches_retrieval_or_a_model(db_session) -> None:
    turn = await run_turn(
        db_session,
        actor=_actor(Role.PERSON),
        question="help me I have fallen",
        display_name="Aitâ",
    )
    assert turn.path == "deterministic"
    assert turn.intent == Intent.EMERGENCY.value
    assert turn.lanes_run == (), "no lane may run on the emergency path"
    assert turn.model is None, "no model may be consulted on the emergency path"


@pytest.mark.asyncio
async def test_a_medication_turn_never_touches_retrieval_or_a_model(db_session) -> None:
    turn = await run_turn(
        db_session,
        actor=_actor(Role.PERSON),
        question="should I take another tablet",
        display_name="Aitâ",
    )
    assert turn.path == "deterministic"
    assert turn.lanes_run == ()
    assert turn.model is None


# ══ 8. Grounding: an unknown name returns nothing, not somebody else ═════════

@pytest.mark.asyncio
async def test_a_named_lookup_returns_only_matching_facts(db_session) -> None:
    """Asking about someone unknown must retrieve nothing.

    This was a real leak. A general graph sweep returned every visible node, so
    "who is Deepak?" came back carrying an unrelated granddaughter as
    provenance — the wrong person's name attached to an answer about a man who
    is not in the record.
    """
    from app.rag.lanes import graph_lane

    await _seed_one_person_fact(db_session)

    matched = await graph_lane(
        db_session,
        person_id="p1",
        visibility_token="primary_caregiver",
        entities=("Rina",),
    )
    assert [f.text for f in matched], "the named person should be found"
    assert any("Rina" in f.text for f in matched)

    unmatched = await graph_lane(
        db_session,
        person_id="p1",
        visibility_token="primary_caregiver",
        entities=("Deepak",),
    )
    assert unmatched == [], "an unknown name must retrieve nothing at all"


@pytest.mark.asyncio
async def test_an_unnamed_question_still_gets_the_general_sweep(db_session) -> None:
    """Orientation legitimately wants whatever is on record."""
    from app.rag.lanes import graph_lane

    await _seed_one_person_fact(db_session)
    swept = await graph_lane(
        db_session, person_id="p1", visibility_token="primary_caregiver", entities=()
    )
    assert swept, "with no entity named, the sweep is the right behaviour"


def test_an_answer_naming_someone_unretrieved_is_rejected() -> None:
    """The prompt is not the control; this is.

    Told to use only the given facts, a model will still sometimes answer from
    its own knowledge. A fabricated festival description is tolerable; a
    fabricated relative is not.
    """
    from app.orchestrator.graph import _ungrounded_entities

    facts = (
        RetrievedFact(
            fact_id="f1", layer=KnowledgeLayer.K2_PERSON, lane=Lane.GRAPH,
            text="Rina (granddaughter)", source_type="caregiver",
            authority=SourceAuthority.CAREGIVER, verification_status="verified",
        ),
    )

    # Invented a relative who appears in no fact and was never asked about.
    assert _ungrounded_entities(
        "Your son Amit called yesterday.", facts, "What is happening today?"
    ) == {"Amit"}

    # A name drawn from a real fact is fine.
    assert _ungrounded_entities("Rina is your granddaughter.", facts, "Who is Rina?") == set()

    # A name the question introduced is fine: refusing has to be sayable.
    assert _ungrounded_entities(
        "I do not know who Deepak is. Shall we look at photographs?",
        facts,
        "Who is Deepak?",
    ) == set()


async def _seed_one_person_fact(session) -> None:
    """Purnima with exactly one visible PWM fact: Rina, her granddaughter."""
    from datetime import date

    from app.identity.models import PersonCreate
    from app.identity.service import create_person
    from app.pwm.models import ProvenanceEnvelope, PWMNode, VerificationStatus
    from app.pwm.service import create_node

    await create_person(session, PersonCreate(person_id="p1", display_name="Aitâ"))
    await create_node(
        session,
        PWMNode(
            node_id="node:rina",
            person_id="p1",
            node_type="person",
            temporal_partition="present",
            label="Rina (granddaughter)",
            provenance=ProvenanceEnvelope(
                fact_id="f_rina",
                subject="p1",
                predicate="RELATED_TO",
                object="person:rina",
                value={"kinship_type": "granddaughter"},
                source={"type": "caregiver", "actor": "actor:anu"},
                created_at=__import__("datetime").datetime.now(
                    __import__("datetime").UTC
                ),
                valid_from=date(2026, 7, 2),
                confidence="high",
                verification_status=VerificationStatus.VERIFIED,
                visibility=("person", "primary_caregiver"),
                clinical_relevance=False,
                audit_ref="test",
            ),
        ),
    )
    await session.commit()


def test_the_persons_own_name_is_grounded_by_definition() -> None:
    """The prompt supplies her name so the companion can address her.

    Flagging it as a fabrication because it appears in a greeting rather than in
    a retrieved fact rejected every correct answer the system produced. A
    multi-part name grounds each of its parts.
    """
    from app.orchestrator.graph import _ungrounded_entities

    facts = (
        RetrievedFact(
            fact_id="f1", layer=KnowledgeLayer.K2_PERSON, lane=Lane.GRAPH,
            text="Rina (granddaughter)", source_type="caregiver",
            authority=SourceAuthority.CAREGIVER, verification_status="verified",
        ),
    )
    assert _ungrounded_entities(
        "Rina is Purnima Devi's granddaughter.",
        facts,
        "Who is Rina?",
        "Purnima Devi",
    ) == set()

    # With no display name supplied, the same answer is correctly suspicious.
    assert _ungrounded_entities(
        "Rina is Purnima Devi's granddaughter.", facts, "Who is Rina?", ""
    ) == {"Purnima", "Devi"}
