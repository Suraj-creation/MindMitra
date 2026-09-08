"""JWT issue and decode.

Access and refresh tokens are both HS256 JWTs carrying a `typ` claim, so a
refresh token can never be replayed as an access token. `jti` is unique per
token, which is what lets a refresh token be revoked on rotation.

Signing is delegated to PyJWT rather than hand-rolled: algorithm confusion and
`alg: none` are exactly the class of bug that turns an auth layer into an auth
bypass, and `decode` here pins `algorithms=[...]` explicitly so an attacker
cannot choose the algorithm.
"""

from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt

from app.core.config import get_settings

TokenType = Literal["access", "refresh"]

ISSUER = "mindmitra"


class TokenError(Exception):
    """Raised when a token is absent, malformed, expired or of the wrong type."""


@dataclass(frozen=True)
class TokenClaims:
    actor_id: str
    token_type: TokenType
    jti: str
    expires_at: datetime
    # "human" signs in with a password; "person_device" is a shared family
    # tablet bound to one person, which never prompts for a password.
    subject_kind: str = "human"
    bound_person_id: str | None = None


def _now() -> datetime:
    return datetime.now(UTC)


def _encode(
    *,
    actor_id: str,
    token_type: TokenType,
    ttl: timedelta,
    subject_kind: str,
    bound_person_id: str | None,
) -> tuple[str, TokenClaims]:
    settings = get_settings()
    issued = _now()
    expires = issued + ttl
    jti = uuid.uuid4().hex

    payload: dict[str, Any] = {
        "iss": ISSUER,
        "sub": actor_id,
        "typ": token_type,
        "jti": jti,
        "iat": int(issued.timestamp()),
        "exp": int(expires.timestamp()),
        "knd": subject_kind,
    }
    if bound_person_id:
        payload["bpi"] = bound_person_id

    encoded = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    claims = TokenClaims(
        actor_id=actor_id,
        token_type=token_type,
        jti=jti,
        expires_at=expires,
        subject_kind=subject_kind,
        bound_person_id=bound_person_id,
    )
    return encoded, claims


def issue_access(
    actor_id: str, *, subject_kind: str = "human", bound_person_id: str | None = None
) -> tuple[str, TokenClaims]:
    settings = get_settings()
    ttl = timedelta(minutes=settings.jwt_access_ttl_minutes)
    # The person's surface must never time out mid-interaction (DESIGN.md A17).
    if subject_kind == "person_device":
        ttl = timedelta(days=settings.person_device_token_ttl_days)
    return _encode(
        actor_id=actor_id,
        token_type="access",
        ttl=ttl,
        subject_kind=subject_kind,
        bound_person_id=bound_person_id,
    )


def issue_refresh(
    actor_id: str, *, subject_kind: str = "human", bound_person_id: str | None = None
) -> tuple[str, TokenClaims]:
    settings = get_settings()
    return _encode(
        actor_id=actor_id,
        token_type="refresh",
        ttl=timedelta(days=settings.jwt_refresh_ttl_days),
        subject_kind=subject_kind,
        bound_person_id=bound_person_id,
    )


def decode(token: str, *, expect: TokenType) -> TokenClaims:
    """Decode and validate. Raises TokenError for every failure mode."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer=ISSUER,
            options={"require": ["exp", "iat", "sub", "typ", "jti"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenError(str(exc)) from exc

    token_type = payload.get("typ")
    if token_type != expect:
        raise TokenError(f"expected a {expect} token, got {token_type!r}")

    return TokenClaims(
        actor_id=str(payload["sub"]),
        token_type=expect,
        jti=str(payload["jti"]),
        expires_at=datetime.fromtimestamp(int(payload["exp"]), tz=UTC),
        subject_kind=str(payload.get("knd", "human")),
        bound_person_id=payload.get("bpi"),
    )


def new_session_id() -> str:
    return secrets.token_urlsafe(24)
