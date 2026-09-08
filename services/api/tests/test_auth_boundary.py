"""The authorization boundary — written before the endpoints were converted.

These are the tests that would have caught the original defect: the Memory
Firewall was correct, and it was being handed an identity the caller had simply
asserted in a request body. Each case here is an attack the product must fail
closed on.

The recurring assertion is **404, not 403**. A 403 tells an attacker that the
person exists and that they merely lack permission, which is itself a
disclosure. The destination does not exist for them.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from app.auth import passwords, service, tokens
from app.auth.db import RefreshSessionORM
from app.auth.models import RegisterRequest
from app.core.models import AuditLog
from app.firewall.roles import Role
from app.identity.models import PersonCreate
from app.identity.service import create_person, link_care

pytestmark = pytest.mark.asyncio


# ── Fixtures: a small care network ───────────────────────────────────────────
async def _build_network(session):
    """Aitâ and Kamala, each with their own daughter. Two households, no overlap."""
    await create_person(
        session, PersonCreate(person_id="person:aita", display_name="Aitâ")
    )
    await create_person(
        session, PersonCreate(person_id="person:kamala", display_name="Kamala")
    )

    await service.register(
        session,
        RegisterRequest(
            actor_id="actor:anu",
            display_name="Anu",
            email="anu@example.com",
            password="correct-horse-battery",
        ),
    )
    await service.register(
        session,
        RegisterRequest(
            actor_id="actor:bina",
            display_name="Bina",
            email="bina@example.com",
            password="another-good-passphrase",
        ),
    )
    await service.register(
        session,
        RegisterRequest(
            actor_id="actor:ban",
            display_name="Ban",
            email="ban@example.com",
            password="health-worker-passphrase",
        ),
    )

    await link_care(
        session, actor_id="actor:anu", person_id="person:aita", role=Role.PRIMARY_CAREGIVER
    )
    await link_care(
        session, actor_id="actor:bina", person_id="person:kamala", role=Role.PRIMARY_CAREGIVER
    )
    await link_care(session, actor_id="actor:ban", person_id="person:aita", role=Role.CHW)
    await session.commit()


async def _login(client, email: str, password: str) -> str:
    response = await client.post(
        "/v1/auth/login", json={"email": email, "password": password}
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ── Authentication is required at all ────────────────────────────────────────
async def test_person_endpoint_rejects_an_anonymous_caller(client, db_session):
    await _build_network(db_session)
    response = await client.get("/v1/persons/person:aita/projections/me")
    assert response.status_code == 401


async def test_a_garbage_token_is_rejected(client, db_session):
    await _build_network(db_session)
    response = await client.get(
        "/v1/persons/person:aita/projections/me", headers=_auth("not-a-real-token")
    )
    assert response.status_code == 401


async def test_a_refresh_token_cannot_be_replayed_as_an_access_token(client, db_session):
    """The `typ` claim is what stops a long-lived refresh token being a session."""
    await _build_network(db_session)
    login = await client.post(
        "/v1/auth/login",
        json={"email": "anu@example.com", "password": "correct-horse-battery"},
    )
    refresh_token = login.json()["refresh_token"]

    response = await client.get(
        "/v1/persons/person:aita/projections/me", headers=_auth(refresh_token)
    )
    assert response.status_code == 401


# ── Cross-person access ──────────────────────────────────────────────────────
async def test_a_caregiver_cannot_reach_a_person_they_do_not_care_for(client, db_session):
    """Anu cares for Aitâ. Kamala's record must not exist for her."""
    await _build_network(db_session)
    token = await _login(client, "anu@example.com", "correct-horse-battery")

    response = await client.get(
        "/v1/persons/person:kamala/projections/me", headers=_auth(token)
    )
    assert response.status_code == 404, "a 403 would confirm Kamala exists"


async def test_a_caregiver_can_reach_their_own_person(client, db_session):
    await _build_network(db_session)
    token = await _login(client, "anu@example.com", "correct-horse-battery")

    response = await client.get(
        "/v1/persons/person:aita/projections/me", headers=_auth(token)
    )
    assert response.status_code == 200, response.text


async def test_a_refused_attempt_is_audited_and_survives_the_rejection(client, db_session):
    """The refusal is the record the safeguarding queue exists to read.

    It must be written in its own transaction, because the request it belongs to
    is about to be rolled back.
    """
    await _build_network(db_session)
    token = await _login(client, "anu@example.com", "correct-horse-battery")

    await client.get("/v1/persons/person:kamala/projections/me", headers=_auth(token))

    rows = (
        await db_session.execute(
            select(AuditLog).where(AuditLog.event_type == "authorization_refused")
        )
    ).scalars().all()
    assert len(rows) == 1
    row = rows[0]
    assert row.actor_id == "actor:anu"
    assert row.subject_person_id == "person:kamala"
    assert row.effect == "deny"
    assert row.is_violation is True
    assert "no_care_relationship" in row.reason_codes


# ── Forged identity in the request body ──────────────────────────────────────
async def test_pwm_read_ignores_any_actor_id_supplied_by_the_caller(client, db_session):
    """The old endpoint took `actor_id` as a body field. It must not any more.

    Bina cares for Kamala. Claiming to be Anu must not grant her Aitâ's facts.
    """
    await _build_network(db_session)
    token = await _login(client, "bina@example.com", "another-good-passphrase")

    response = await client.post(
        "/v1/pwm/read",
        headers=_auth(token),
        json={
            "actor_id": "actor:anu",  # a lie; must be ignored entirely
            "person_id": "person:aita",
            "fact_id": "f_rina",
            "purpose": "personalisation",
        },
    )
    assert response.status_code == 404


# ── Person-device tokens are clamped to one person ───────────────────────────
async def test_a_device_token_cannot_act_for_another_person(client, db_session):
    await _build_network(db_session)
    caregiver = await _login(client, "anu@example.com", "correct-horse-battery")

    enrol = await client.post(
        "/v1/auth/devices",
        headers=_auth(caregiver),
        json={"person_id": "person:aita", "device_label": "Living room tablet"},
    )
    assert enrol.status_code == 201, enrol.text
    secret = enrol.json()["device_secret"]

    device_login = await client.post(
        "/v1/auth/device-login",
        json={"person_id": "person:aita", "device_secret": secret},
    )
    assert device_login.status_code == 200, device_login.text
    device_token = device_login.json()["access_token"]

    own = await client.get(
        "/v1/persons/person:aita/projections/me", headers=_auth(device_token)
    )
    assert own.status_code == 200

    other = await client.get(
        "/v1/persons/person:kamala/projections/me", headers=_auth(device_token)
    )
    assert other.status_code == 404


async def test_only_a_caregiver_can_enrol_a_device(client, db_session):
    """A CHW may enrol; a stranger to the household may not reach the person at all."""
    await _build_network(db_session)
    bina = await _login(client, "bina@example.com", "another-good-passphrase")

    response = await client.post(
        "/v1/auth/devices",
        headers=_auth(bina),
        json={"person_id": "person:aita", "device_label": "Smuggled tablet"},
    )
    assert response.status_code == 404


# ── Relationship expiry ──────────────────────────────────────────────────────
async def test_an_expired_relationship_grants_nothing(client, db_session):
    """A caregiver whose relationship has ended is a stranger again."""
    await _build_network(db_session)
    token = await _login(client, "anu@example.com", "correct-horse-battery")

    from app.identity.db import CareRelationshipORM

    relationship = (
        await db_session.execute(
            select(CareRelationshipORM).where(
                CareRelationshipORM.actor_id == "actor:anu",
                CareRelationshipORM.person_id == "person:aita",
            )
        )
    ).scalars().one()
    relationship.valid_to = datetime.now(UTC) - timedelta(days=1)
    await db_session.commit()

    response = await client.get(
        "/v1/persons/person:aita/projections/me", headers=_auth(token)
    )
    assert response.status_code == 404


# ── Login does not leak which accounts exist ─────────────────────────────────
async def test_unknown_email_and_wrong_password_are_indistinguishable(client, db_session):
    await _build_network(db_session)

    unknown = await client.post(
        "/v1/auth/login", json={"email": "nobody@example.com", "password": "whatever"}
    )
    wrong = await client.post(
        "/v1/auth/login", json={"email": "anu@example.com", "password": "wrong"}
    )

    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json()["detail"] == wrong.json()["detail"]


# ── Refresh rotation and theft detection ─────────────────────────────────────
async def test_refresh_rotates_and_the_old_token_stops_working(client, db_session):
    await _build_network(db_session)
    login = await client.post(
        "/v1/auth/login",
        json={"email": "anu@example.com", "password": "correct-horse-battery"},
    )
    first = login.json()["refresh_token"]

    rotated = await client.post("/v1/auth/refresh", json={"refresh_token": first})
    assert rotated.status_code == 200
    assert rotated.json()["refresh_token"] != first

    replay = await client.post("/v1/auth/refresh", json={"refresh_token": first})
    assert replay.status_code == 401


async def test_replaying_a_rotated_token_revokes_the_whole_family(client, db_session):
    """One replay is treated as theft, not as a retry."""
    await _build_network(db_session)
    login = await client.post(
        "/v1/auth/login",
        json={"email": "anu@example.com", "password": "correct-horse-battery"},
    )
    first = login.json()["refresh_token"]

    rotated = await client.post("/v1/auth/refresh", json={"refresh_token": first})
    second = rotated.json()["refresh_token"]

    await client.post("/v1/auth/refresh", json={"refresh_token": first})  # the replay

    # The legitimate holder's current token is now dead too — the family is burnt.
    after = await client.post("/v1/auth/refresh", json={"refresh_token": second})
    assert after.status_code == 401

    rows = (await db_session.execute(select(RefreshSessionORM))).scalars().all()
    assert all(row.revoked for row in rows)
    assert any(row.revoked_reason == "reuse_detected" for row in rows)


# ── /auth/me drives navigation ───────────────────────────────────────────────
async def test_me_lists_only_persons_the_actor_actually_cares_for(client, db_session):
    await _build_network(db_session)
    token = await _login(client, "anu@example.com", "correct-horse-battery")

    response = await client.get("/v1/auth/me", headers=_auth(token))
    assert response.status_code == 200
    body = response.json()
    assert [p["person_id"] for p in body["persons"]] == ["person:aita"]
    assert body["persons"][0]["role"] == "primary_caregiver"


async def test_me_on_a_device_token_is_clamped_to_the_bound_person(client, db_session):
    await _build_network(db_session)
    # Give the person's own actor a second relationship it must not surface.
    await link_care(
        session=db_session,
        actor_id="person:aita:self",
        person_id="person:kamala",
        role=Role.SECONDARY_CAREGIVER,
    )
    await db_session.commit()

    caregiver = await _login(client, "anu@example.com", "correct-horse-battery")
    enrol = await client.post(
        "/v1/auth/devices",
        headers=_auth(caregiver),
        json={"person_id": "person:aita", "device_label": "Tablet"},
    )
    secret = enrol.json()["device_secret"]
    device_login = await client.post(
        "/v1/auth/device-login",
        json={"person_id": "person:aita", "device_secret": secret},
    )
    device_token = device_login.json()["access_token"]

    response = await client.get("/v1/auth/me", headers=_auth(device_token))
    assert [p["person_id"] for p in response.json()["persons"]] == ["person:aita"]


# ── Password hashing ─────────────────────────────────────────────────────────
def test_password_hashing_round_trips_and_rejects_the_wrong_password():
    stored = passwords.hash_password("a real passphrase")
    assert passwords.verify_password("a real passphrase", stored)
    assert not passwords.verify_password("a real passphras", stored)
    assert not passwords.verify_password("", stored)


def test_a_corrupted_hash_verifies_false_rather_than_raising():
    """A damaged row must fail closed, not 500 and not authenticate."""
    assert not passwords.verify_password("anything", "not-a-hash")
    assert not passwords.verify_password("anything", "scrypt$bad$bad$bad$bad$bad")
    assert not passwords.verify_password("anything", "")


def test_two_hashes_of_the_same_password_differ():
    """Distinct salts, so a stolen table does not reveal shared passwords."""
    assert passwords.hash_password("same") != passwords.hash_password("same")


def test_token_type_confusion_is_impossible():
    access, _ = tokens.issue_access("actor:x")
    refresh, _ = tokens.issue_refresh("actor:x")

    assert tokens.decode(access, expect="access").actor_id == "actor:x"
    assert tokens.decode(refresh, expect="refresh").actor_id == "actor:x"

    with pytest.raises(tokens.TokenError):
        tokens.decode(refresh, expect="access")
    with pytest.raises(tokens.TokenError):
        tokens.decode(access, expect="refresh")


def test_an_unsigned_token_is_rejected():
    """The `alg: none` attack, explicitly."""
    import base64
    import json

    def _seg(data: dict) -> str:
        raw = json.dumps(data).encode()
        return base64.urlsafe_b64encode(raw).decode().rstrip("=")

    forged = (
        _seg({"alg": "none", "typ": "JWT"})
        + "."
        + _seg(
            {
                "iss": tokens.ISSUER,
                "sub": "actor:attacker",
                "typ": "access",
                "jti": "x",
                "iat": 0,
                "exp": 9999999999,
            }
        )
        + "."
    )
    with pytest.raises(tokens.TokenError):
        tokens.decode(forged, expect="access")
