"""Password hashing — scrypt from the standard library.

scrypt is memory-hard and ships with CPython, so there is no third-party
dependency in the credential path. Parameters follow the widely used
"interactive" profile: n=2^14, r=8, p=1, which costs roughly 16 MB and ~50 ms
per verification on commodity hardware.

Stored format is a single self-describing string so parameters can be raised
later without invalidating existing hashes:

    scrypt$<n>$<r>$<p>$<salt_b64>$<hash_b64>

Verification is constant-time. A malformed or unknown-scheme stored value
verifies as False rather than raising, so a corrupted row cannot become an
authentication bypass or a 500 that leaks which accounts exist.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets

_SCHEME = "scrypt"
_N = 2**14
_R = 8
_P = 1
_DKLEN = 32
_SALT_BYTES = 16

# scrypt needs maxmem >= 128 * n * r * p, plus headroom.
_MAXMEM = 128 * _N * _R * _P * 2


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64d(text: str) -> bytes:
    padding = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


def _derive(password: str, salt: bytes, *, n: int, r: int, p: int) -> bytes:
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        dklen=_DKLEN,
        maxmem=128 * n * r * p * 2,
    )


def hash_password(password: str) -> str:
    """Hash a password for storage. Never log or return the input."""
    if not password:
        raise ValueError("password must not be empty")
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = _derive(password, salt, n=_N, r=_R, p=_P)
    return f"{_SCHEME}${_N}${_R}${_P}${_b64e(salt)}${_b64e(digest)}"


def verify_password(password: str, stored: str) -> bool:
    """Constant-time verification. Returns False for anything unparseable."""
    if not password or not stored:
        return False
    try:
        scheme, n_s, r_s, p_s, salt_s, hash_s = stored.split("$")
        if scheme != _SCHEME:
            return False
        expected = _b64d(hash_s)
        candidate = _derive(password, _b64d(salt_s), n=int(n_s), r=int(r_s), p=int(p_s))
    except (ValueError, TypeError, MemoryError):
        return False
    return hmac.compare_digest(candidate, expected)


def needs_rehash(stored: str) -> bool:
    """True when a stored hash uses weaker parameters than the current profile."""
    try:
        scheme, n_s, r_s, p_s, _salt, _hash = stored.split("$")
    except ValueError:
        return True
    return scheme != _SCHEME or (int(n_s), int(r_s), int(p_s)) != (_N, _R, _P)


def generate_device_secret() -> str:
    """A high-entropy secret for a shared family device. Shown once, then hashed."""
    return secrets.token_urlsafe(32)
