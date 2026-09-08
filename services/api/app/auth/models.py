"""Pydantic DTOs for authentication (the API contract).

`Principal` is the only thing downstream code is allowed to trust about who is
calling. It carries no role, on purpose: a role is never global, it is always
resolved against a specific person from `care_relationships`, server-side.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.firewall.roles import Role

SubjectKind = Literal["human", "person_device"]


class Principal(BaseModel):
    """An authenticated identity. Deliberately has no role and no person.

    Downstream code must call `authorize()` to obtain an `Actor`, which is the
    only value the Memory Firewall accepts. This split is what makes a forged
    `actor_id` in a request body structurally impossible to act on.
    """

    model_config = ConfigDict(frozen=True)

    actor_id: str
    subject_kind: SubjectKind = "human"
    # Set only for a person-device token: that token can act for this person and
    # no other, regardless of what the request asks for.
    bound_person_id: str | None = None
    token_id: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=1024)


class DeviceLoginRequest(BaseModel):
    """A shared family tablet presenting its enrolment secret."""

    person_id: str
    device_secret: str = Field(min_length=1, max_length=1024)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    model_config = ConfigDict(frozen=True)

    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_at: datetime


class PersonSummary(BaseModel):
    """One person this actor may act for, with the role they hold for them."""

    model_config = ConfigDict(frozen=True)

    person_id: str
    display_name: str
    role: Role
    preferred_language: str
    language_tier: str


class MeResponse(BaseModel):
    """Who am I, and whose data may I reach? The client builds navigation from this."""

    model_config = ConfigDict(frozen=True)

    actor_id: str
    display_name: str
    subject_kind: SubjectKind
    persons: tuple[PersonSummary, ...] = ()


class RegisterRequest(BaseModel):
    """Account creation. Dev/seed only — real deployment invites, not self-serves."""

    actor_id: str
    display_name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=1024)


class DeviceEnrolRequest(BaseModel):
    person_id: str
    device_label: str = Field(min_length=1, max_length=128)


class DeviceEnrolResponse(BaseModel):
    """The secret is returned exactly once and never stored in plaintext."""

    model_config = ConfigDict(frozen=True)

    device_id: str
    person_id: str
    device_label: str
    device_secret: str
