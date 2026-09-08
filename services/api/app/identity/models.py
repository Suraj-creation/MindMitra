"""Pydantic DTOs for the identity domain (API contract).

Reuses the firewall's Role / DataCategory / Purpose enums so the identity
vocabulary and the authZ vocabulary never drift apart.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.firewall.roles import DataCategory, Purpose, Role


class PersonCreate(BaseModel):
    person_id: str
    display_name: str
    preferred_language: str = "as"
    language_tier: str = "A"  # A | B | C
    cultural_context: str = "assamese_v1"


class Person(BaseModel):
    model_config = ConfigDict(frozen=True)

    person_id: str
    display_name: str
    preferred_language: str
    language_tier: str
    cultural_context: str
    self_actor_id: str
    created_at: datetime | None = None


class ActorCreate(BaseModel):
    actor_id: str
    display_name: str


class ActorAccount(BaseModel):
    model_config = ConfigDict(frozen=True)

    actor_id: str
    display_name: str
    created_at: datetime | None = None


class CareRelationshipCreate(BaseModel):
    actor_id: str
    person_id: str
    role: Role


class CareRelationship(BaseModel):
    model_config = ConfigDict(frozen=True)

    actor_id: str
    person_id: str
    role: Role
    valid_from: datetime | None = None
    valid_to: datetime | None = None


class ConsentGrantRequest(BaseModel):
    person_id: str
    grantee_role: Role
    category: DataCategory
    purpose: Purpose


class ConsentGrantView(BaseModel):
    model_config = ConfigDict(frozen=True)

    person_id: str
    grantee_role: Role
    category: DataCategory
    purpose: Purpose
    granted: bool
    granted_at: datetime | None = None
    revoked_at: datetime | None = None


class ConsentList(BaseModel):
    person_id: str
    grants: list[ConsentGrantView] = Field(default_factory=list)
