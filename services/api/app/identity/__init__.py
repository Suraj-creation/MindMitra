"""Identity domain — persons, actor accounts, care relationships, consent.

Provides the `resolve_role` / `resolve_consent` bridge that connects persisted
identity data to the deterministic Memory Firewall.
"""

from __future__ import annotations

from .models import (
    ActorAccount,
    ActorCreate,
    CareRelationship,
    CareRelationshipCreate,
    ConsentGrantRequest,
    ConsentGrantView,
    Person,
    PersonCreate,
)
from .service import (
    create_actor,
    create_person,
    get_person,
    grant_consent,
    link_care,
    list_consent,
    resolve_consent,
    resolve_role,
    revoke_consent,
)

__all__ = [
    "ActorAccount",
    "ActorCreate",
    "CareRelationship",
    "CareRelationshipCreate",
    "ConsentGrantRequest",
    "ConsentGrantView",
    "Person",
    "PersonCreate",
    "create_actor",
    "create_person",
    "get_person",
    "grant_consent",
    "link_care",
    "list_consent",
    "resolve_consent",
    "resolve_role",
    "revoke_consent",
]
