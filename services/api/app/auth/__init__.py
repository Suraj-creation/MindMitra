"""Authentication and the authorization boundary.

`app.auth.deps` is the only sanctioned way to obtain a firewall `Actor`. Nothing
else in the codebase should construct one from request data.

Public API:

    from app.auth import (
        Principal, TokenPair, MeResponse,
        current_principal, CurrentPrincipal, authorize,
        actor_for, require_role,
        SelfActor, CareActor, PersonalisationActor, ClinicalActor,
    )
"""

from __future__ import annotations

from .deps import (
    CareActor,
    ClinicalActor,
    CurrentPrincipal,
    PersonalisationActor,
    SelfActor,
    actor_for,
    authorize,
    client_fingerprint,
    current_principal,
    require_role,
)
from .models import (
    DeviceEnrolRequest,
    DeviceEnrolResponse,
    DeviceLoginRequest,
    LoginRequest,
    MeResponse,
    PersonSummary,
    Principal,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from .service import AuthError

__all__ = [
    "AuthError",
    "CareActor",
    "ClinicalActor",
    "CurrentPrincipal",
    "DeviceEnrolRequest",
    "DeviceEnrolResponse",
    "DeviceLoginRequest",
    "LoginRequest",
    "MeResponse",
    "PersonSummary",
    "PersonalisationActor",
    "Principal",
    "RefreshRequest",
    "RegisterRequest",
    "SelfActor",
    "TokenPair",
    "actor_for",
    "authorize",
    "client_fingerprint",
    "current_principal",
    "require_role",
]
