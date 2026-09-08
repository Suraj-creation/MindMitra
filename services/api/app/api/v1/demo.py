"""Demo seed — builds a reproducible Memory-Firewall scenario.

Creates:
  * Purnima Devi (person)
  * Anu (primary caregiver, granddaughter) — consented for PWM_FACT/personalisation
  * Bikash (secondary caregiver) — NOT in the fact's visibility scope
  * Meena (CHW)
  * A verified PWM fact: "Rina is Purnima's granddaughter"
    (visibility: person + primary_caregiver only)

The seed is destructive-then-recreate for the demo ids, so it can be re-run to
reset the scenario (e.g. after revoking consent on the Firewall demo page).
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service as auth
from app.auth.models import RegisterRequest
from app.auth.service import AuthError, register
from app.cognition.mq import ObservationSignals
from app.core.config import get_settings
from app.core.db import get_session
from app.core.models import PWMNode as PWMNodeORM
from app.escalation.db import AlertORM
from app.escalation.models import Alert, CaregiverCard
from app.escalation.service import build_caregiver_card, evaluate_person
from app.firewall.roles import DataCategory, Purpose, Role
from app.identity import service as identity
from app.identity.db import (
    ActorAccountORM,
    CareRelationshipORM,
    ConsentGrantORM,
    PersonORM,
)
from app.identity.models import ActorCreate, PersonCreate
from app.observation.db import ObservationORM
from app.observation.service import record_observation
from app.pwm.models import ProvenanceEnvelope, PWMNode, VerificationStatus
from app.pwm.service import create_node

router = APIRouter(prefix="/demo", tags=["demo"])

Session = Annotated[AsyncSession, Depends(get_session)]

PERSON_ID = "person:purnima"
ANU = "actor:anu"
BIKASH = "actor:bikash"
MEENA = "actor:meena"
FACT_ID = "f_rina"
NODE_ID = "node:rina"

DOCTOR = "actor:barua"

_DEMO_ACTORS = [ANU, BIKASH, MEENA, DOCTOR, f"{PERSON_ID}:self"]

# Sign-in details for the seeded care network. These exist so the four surfaces
# can actually be signed into during a demo. They are dev-only by construction:
# both endpoints in this module refuse to run outside APP_ENV=dev.
DEMO_PASSWORD = "mindmitra-demo"
# Development-only setup value for the seeded tablet. This is accepted only
# after this module's dev-only seed endpoint creates its corresponding grant.
DEMO_DEVICE_SECRET = "mindmitra-demo-device"
DEMO_DEVICE_LABEL = "Purnima demo tablet"
_DEMO_CREDENTIALS = [
    (ANU, "Anu (granddaughter)", "anu@demo.mindmitra.in"),
    (BIKASH, "Bikash (son, remote)", "bikash@demo.mindmitra.in"),
    (MEENA, "Meena (ASHA / CHW)", "meena@demo.mindmitra.in"),
    (DOCTOR, "Dr Barua (clinician)", "barua@demo.mindmitra.in"),
]


# The consent set a real onboarding would produce. Each row is one deliberate
# decision by the person about one category, for one role, for one purpose.
_DEMO_CONSENT: tuple[tuple[Role, DataCategory, Purpose], ...] = (
    # Anu, the granddaughter who provides daily care.
    (Role.PRIMARY_CAREGIVER, DataCategory.PWM_FACT, Purpose.PERSONALISATION),
    (Role.PRIMARY_CAREGIVER, DataCategory.COGNITIVE_STATE, Purpose.CARE_COORDINATION),
    (Role.PRIMARY_CAREGIVER, DataCategory.ROUTINE, Purpose.CARE_COORDINATION),
    # Meena, the ASHA worker preparing a visit.
    (Role.CHW, DataCategory.COGNITIVE_STATE, Purpose.CARE_COORDINATION),
    (Role.CHW, DataCategory.ROUTINE, Purpose.CARE_COORDINATION),
    # Dr Barua, reviewing since the last consultation.
    (Role.CLINICIAN, DataCategory.COGNITIVE_STATE, Purpose.CLINICAL_REVIEW),
    (Role.CLINICIAN, DataCategory.CLINICAL_SUMMARY, Purpose.CLINICAL_REVIEW),
    # Bikash, the son living in another city, is told nothing beyond routine.
    (Role.SECONDARY_CAREGIVER, DataCategory.ROUTINE, Purpose.CARE_COORDINATION),
)


def _require_dev_env() -> None:
    """Demo seeding is destructive and unauthenticated. It runs in dev only.

    Both endpoints here delete and rebuild a person's history. That is exactly
    what a demo needs and exactly what must never be reachable in a deployment
    holding real people's records.
    """
    if get_settings().app_env != "dev":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found.",
        )


class SeedScenario(BaseModel):
    label: str
    actor_id: str
    purpose: str
    expected: str


class SeedResponse(BaseModel):
    person_id: str
    fact_id: str
    actors: dict[str, str]
    scenarios: list[SeedScenario]
    message: str


@router.post("/seed", response_model=SeedResponse)
async def seed(session: Session) -> SeedResponse:
    """Reset and rebuild the demo firewall scenario."""
    _require_dev_env()
    # 1. Clear existing demo rows (idempotent reset).
    await session.execute(delete(PersonORM).where(PersonORM.person_id == PERSON_ID))
    await session.execute(
        delete(ActorAccountORM).where(ActorAccountORM.actor_id.in_(_DEMO_ACTORS))
    )
    await session.execute(
        delete(CareRelationshipORM).where(CareRelationshipORM.person_id == PERSON_ID)
    )
    await session.execute(
        delete(ConsentGrantORM).where(ConsentGrantORM.person_id == PERSON_ID)
    )
    await session.execute(delete(PWMNodeORM).where(PWMNodeORM.person_id == PERSON_ID))
    await session.flush()

    # 2. Person + self account/relationship.
    await identity.create_person(
        session,
        PersonCreate(
            person_id=PERSON_ID,
            display_name="Purnima Devi",
            preferred_language="as",
            language_tier="A",
            cultural_context="assamese_v1",
        ),
    )

    # 3. Caregiver / CHW accounts + relationships.
    await identity.create_actor(session, ActorCreate(actor_id=ANU, display_name="Anu (granddaughter)"))
    await identity.create_actor(session, ActorCreate(actor_id=BIKASH, display_name="Bikash (son, remote)"))
    await identity.create_actor(session, ActorCreate(actor_id=MEENA, display_name="Meena (ASHA / CHW)"))

    await identity.link_care(session, actor_id=ANU, person_id=PERSON_ID, role=Role.PRIMARY_CAREGIVER)
    await identity.link_care(session, actor_id=BIKASH, person_id=PERSON_ID, role=Role.SECONDARY_CAREGIVER)
    await identity.link_care(session, actor_id=MEENA, person_id=PERSON_ID, role=Role.CHW)
    await identity.create_actor(
        session, ActorCreate(actor_id=DOCTOR, display_name="Dr Barua (clinician)")
    )
    await identity.link_care(
        session, actor_id=DOCTOR, person_id=PERSON_ID, role=Role.CLINICIAN
    )

    # A reproducible device grant lets the dedicated demo tablet enter the
    # person surface without copying a real enrolment secret into the demo.
    await auth.enrol_device(
        session,
        person_id=PERSON_ID,
        device_label=DEMO_DEVICE_LABEL,
        enrolled_by=ANU,
        device_secret=DEMO_DEVICE_SECRET,
    )

    # 3c. Sign-in credentials, so each surface can actually be entered.
    for actor_id, display_name, email in _DEMO_CREDENTIALS:
        try:
            await register(
                session,
                RegisterRequest(
                    actor_id=actor_id,
                    display_name=display_name,
                    email=email,
                    password=DEMO_PASSWORD,
                ),
            )
        except AuthError:
            pass  # already registered; the seed is re-runnable

    # 4. Consent, as a real onboarding conversation would leave it.
    #
    #    Deny-by-default means nothing is shared until Purnima says so, so the
    #    seed has to make the grants explicitly. Note what is deliberately NOT
    #    granted: Bikash, the remote son, gets no cognitive state; the CHW gets
    #    no life story; nobody gets continence. Those omissions are the point.
    for grantee_role, category, purpose in _DEMO_CONSENT:
        await identity.grant_consent(
            session,
            person_id=PERSON_ID,
            grantee_role=grantee_role,
            category=category,
            purpose=purpose,
        )

    # 5. A verified PWM fact — Rina is Purnima's granddaughter.
    #    Visibility: person + primary caregiver ONLY (Bikash the secondary is excluded).
    provenance = ProvenanceEnvelope(
        fact_id=FACT_ID,
        subject=PERSON_ID,
        predicate="RELATED_TO",
        object="person:rina",
        value={"kinship_type": "granddaughter", "ontology": "assamese_v1"},
        source={"type": "caregiver", "actor": ANU, "channel": "onboarding"},
        created_at=datetime.now(UTC),
        valid_from=date(2026, 7, 2),
        last_verified=date(2026, 8, 20),
        confidence="high",
        verification_status=VerificationStatus.VERIFIED,
        visibility=("person", "primary_caregiver"),
        clinical_relevance=False,
        audit_ref="seed",
    )
    await create_node(
        session,
        PWMNode(
            node_id=NODE_ID,
            person_id=PERSON_ID,
            node_type="person",
            temporal_partition="present",
            label="Rina (granddaughter)",
            provenance=provenance,
        ),
    )

    scenarios = [
        SeedScenario(label="Anu (primary) · personalisation", actor_id=ANU,
                     purpose="personalisation", expected="ALLOW"),
        SeedScenario(label="Bikash (secondary) · personalisation", actor_id=BIKASH,
                     purpose="personalisation", expected="DENY — not in visibility scope"),
        SeedScenario(label="Anu (primary) · research", actor_id=ANU,
                     purpose="research", expected="DENY — research purpose not permitted"),
        SeedScenario(label="Purnima (self)", actor_id=f"{PERSON_ID}:self",
                     purpose="self_access", expected="ALLOW"),
        SeedScenario(label="Meena (CHW) · personalisation", actor_id=MEENA,
                     purpose="personalisation", expected="DENY — CHW not in visibility scope"),
    ]

    return SeedResponse(
        person_id=PERSON_ID,
        fact_id=FACT_ID,
        actors={
            "self": f"{PERSON_ID}:self",
            "primary_caregiver": ANU,
            "secondary_caregiver": BIKASH,
            "chw": MEENA,
            "clinician": DOCTOR,
        },
        scenarios=scenarios,
        message=(
            "Demo scenario seeded. Every account signs in with the password "
            f"'{DEMO_PASSWORD}' at <actor>@demo.mindmitra.in."
        ),
    )


# ── Observation → baseline → alert → caregiver card ──────────────────────────
DOMAIN = "memory"
_GOOD_SIGNALS = ObservationSignals(
    audibility=0.95, visibility=0.95, language_match=True, fatigue_factor=0.9,
    was_assisted=False, device_ok=True, subject_confirmed=True,
)
_BASELINE_CYCLE = (0.74, 0.78, 0.82, 0.86)  # median 0.80, MAD ~0.04


class InjectDeclineRequest(BaseModel):
    days: int = 3  # consecutive recent days below baseline


class InjectDeclineResponse(BaseModel):
    person_id: str
    days: int
    baseline_points: int
    alert: Alert | None
    card: CaregiverCard
    message: str


async def _ensure_person(session: AsyncSession) -> None:
    if await identity.get_person(session, PERSON_ID) is None:
        await identity.create_person(
            session,
            PersonCreate(person_id=PERSON_ID, display_name="Purnima Devi"),
        )


@router.post("/inject-decline", response_model=InjectDeclineResponse)
async def inject_decline(session: Session, body: InjectDeclineRequest | None = None) -> InjectDeclineResponse:
    """Seed a real observation history (baseline + N days below it), run the
    escalation pipeline, and return the Safety-Gateway-validated caregiver card.

    This makes the caregiver card non-synthetic: the FACT comes from persisted
    observations, the level from the deterministic alert-eligibility function,
    and the card text passes the Safety Gateway.
    """
    _require_dev_env()
    days = max(1, min(10, body.days if body else 3))
    now = datetime.now(UTC)

    await _ensure_person(session)

    # Reset this person's observation history + alerts.
    await session.execute(delete(ObservationORM).where(ObservationORM.person_id == PERSON_ID))
    await session.execute(delete(AlertORM).where(AlertORM.person_id == PERSON_ID))
    await session.flush()

    # 24-day baseline (days -31..-8), well past the 14-day cold-start window.
    for i in range(24):
        await record_observation(
            session, person_id=PERSON_ID, domain=DOMAIN,
            value=_BASELINE_CYCLE[i % len(_BASELINE_CYCLE)],
            signals=_GOOD_SIGNALS, observed_at=now - timedelta(days=31 - i),
        )

    # `days` recent observations declining to ~0.64 (latest z ~ -2.3 → L3).
    hi, lo = 0.69, 0.64
    for j in range(days):
        frac = j / max(1, days - 1)
        value = hi - (hi - lo) * frac if days > 1 else lo
        await record_observation(
            session, person_id=PERSON_ID, domain=DOMAIN, value=round(value, 3),
            signals=_GOOD_SIGNALS, observed_at=now - timedelta(days=days - 1 - j),
        )

    alert = await evaluate_person(session, PERSON_ID, domain=DOMAIN, now=now)
    card = await build_caregiver_card(session, PERSON_ID, domain=DOMAIN, now=now)

    if alert:
        msg = f"{days} days of below-baseline sessions -> {alert.level} caregiver card."
    else:
        msg = f"{days} day(s) injected -> below the alert threshold; card shows 'within pattern'."

    return InjectDeclineResponse(
        person_id=PERSON_ID,
        days=days,
        baseline_points=24,
        alert=alert,
        card=card,
        message=msg,
    )
