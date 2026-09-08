"""Authentication endpoints.

Three sign-in shapes, because the four surfaces do not share one:

* Caregivers, CHWs and clinicians sign in with email and password.
* The person signs in by tapping her own photograph on a shared family device.
  She never types a password (DESIGN.md B3.2), and her token does not expire
  mid-interaction (A17: no time limits anywhere in the product).
* A device is enrolled once, by an authenticated caregiver, and the enrolment
  secret is shown exactly once.

Every failure returns the same neutral message. The endpoint must not be usable
to discover which accounts exist.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service
from app.auth.deps import CurrentPrincipal, authorize, client_fingerprint
from app.auth.models import (
    DeviceEnrolRequest,
    DeviceEnrolResponse,
    DeviceLoginRequest,
    LoginRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.core.config import get_settings
from app.core.db import get_session
from app.firewall.roles import Purpose, Role

router = APIRouter(prefix="/auth", tags=["auth"])

Session = Annotated[AsyncSession, Depends(get_session)]

_UNAUTHORIZED = status.HTTP_401_UNAUTHORIZED


@router.post("/register", response_model=MeResponse, status_code=201)
async def register(data: RegisterRequest, session: Session) -> MeResponse:
    """Create an account with a password.

    Self-service registration is a development and seeding affordance. A real
    deployment invites care-network members rather than letting anyone claim an
    actor id, so this refuses to run outside dev.
    """
    if get_settings().app_env != "dev":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accounts are created by invitation.",
        )
    try:
        principal = await service.register(session, data)
    except service.AuthError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return await service.describe_me(session, principal)


@router.post("/login", response_model=TokenPair)
async def login(data: LoginRequest, session: Session) -> TokenPair:
    try:
        return await service.login(session, email=data.email, password=data.password)
    except service.AuthError as exc:
        raise HTTPException(
            status_code=_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@router.post("/device-login", response_model=TokenPair)
async def device_login(data: DeviceLoginRequest, session: Session) -> TokenPair:
    """Sign in a shared family device on the person's behalf."""
    try:
        return await service.login_device(
            session, person_id=data.person_id, device_secret=data.device_secret
        )
    except service.AuthError as exc:
        raise HTTPException(
            status_code=_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, session: Session) -> TokenPair:
    try:
        return await service.refresh(session, data.refresh_token)
    except service.AuthError as exc:
        raise HTTPException(
            status_code=_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@router.post("/logout", status_code=204)
async def logout(data: RefreshRequest, session: Session) -> None:
    """Revoke the whole refresh family. Never an error, even for a bad token."""
    await service.logout(session, data.refresh_token)


@router.get("/me", response_model=MeResponse)
async def me(principal: CurrentPrincipal, session: Session) -> MeResponse:
    """Who am I, and whose data may I reach?

    The client builds its navigation from this rather than from a static menu,
    so an unauthorised surface is absent rather than greyed out (DESIGN.md B2).
    """
    return await service.describe_me(session, principal)


@router.post("/devices", response_model=DeviceEnrolResponse, status_code=201)
async def enrol_device(
    data: DeviceEnrolRequest,
    principal: CurrentPrincipal,
    session: Session,
    request: Request,
) -> DeviceEnrolResponse:
    """Enrol a shared family device for a person.

    Only a caregiver with an active relationship to that person may do this, and
    the enrolment is audited: putting a new device into someone's home widens
    who can reach their surface, which is a scope change.
    """
    actor = await authorize(session, principal, data.person_id, purpose=Purpose.ONBOARDING)
    if actor.role not in {Role.PRIMARY_CAREGIVER, Role.SECONDARY_CAREGIVER, Role.CHW}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a caregiver or health worker can set up a device.",
        )
    _ = client_fingerprint(request)
    try:
        return await service.enrol_device(
            session,
            person_id=data.person_id,
            device_label=data.device_label,
            enrolled_by=principal.actor_id,
        )
    except service.AuthError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
