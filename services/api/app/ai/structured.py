"""Structured generation — the LLM proposes, a Pydantic model decides.

This is the mechanism behind "the Studio produces a validated Experience-Spec,
never executable code". The model is given a JSON schema derived from a Pydantic
model and its output is parsed back through that model, so the worst a
misbehaving or prompt-injected model can do is fail validation.

Two things this deliberately does *not* do:

* It does not repair output by asking the model to try again with the error.
  A second attempt is allowed, but the schema is never loosened to accommodate a
  model that would not comply. A spec that will not validate must fall back to a
  generic activity, not to a laxer spec.
* It does not trust `additionalProperties`. Azure's strict JSON-schema mode
  requires every object to forbid extra keys, which is exactly the property that
  stops a model smuggling an ungrounded field past the type.
"""

from __future__ import annotations

import json
import logging
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

from .client import AIUnavailable, AzureClient, Usage, get_client

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class StructuredGenerationError(RuntimeError):
    """The model produced something the schema rejects.

    Carries the validation detail for the log and for a repair attempt, never
    for the user: a schema error is not something a caregiver should ever read.
    """

    def __init__(self, message: str, *, raw: str = "", attempts: int = 0) -> None:
        super().__init__(message)
        self.raw = raw
        self.attempts = attempts


def _strictify(schema: dict[str, Any]) -> dict[str, Any]:
    """Make a Pydantic JSON schema acceptable to Azure's strict structured mode.

    Every object must list all its properties as required and forbid additional
    ones. Optional fields become nullable rather than absent, which keeps the
    Pydantic model's own defaults in charge of what a missing value means.
    """
    if not isinstance(schema, dict):
        return schema

    if schema.get("type") == "object" or "properties" in schema:
        properties = schema.get("properties", {})
        schema["additionalProperties"] = False
        if properties:
            schema["required"] = list(properties.keys())
        for value in properties.values():
            _strictify(value)

    for key in ("items", "not"):
        if key in schema:
            _strictify(schema[key])

    for key in ("anyOf", "oneOf", "allOf", "prefixItems"):
        for entry in schema.get(key, []):
            _strictify(entry)

    for definition in schema.get("$defs", {}).values():
        _strictify(definition)

    return schema


def _extract_json(text: str) -> str:
    """Pull the JSON object out of a response that may be fenced or prefaced."""
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.split("```")[1]
        if stripped.startswith("json"):
            stripped = stripped[4:]
        stripped = stripped.strip()
    start = stripped.find("{")
    end = stripped.rfind("}")
    if start != -1 and end != -1 and end > start:
        return stripped[start : end + 1]
    return stripped


async def generate_structured(
    schema_model: type[T],
    *,
    system: str,
    user: str,
    client: AzureClient | None = None,
    fast: bool = False,
    temperature: float = 0.2,
    max_tokens: int = 1600,
    purpose: str = "structured",
    repair_attempts: int = 1,
) -> tuple[T, Usage]:
    """Generate one instance of `schema_model`, or raise.

    Raises `StructuredGenerationError` when the model will not produce something
    the schema accepts, and `AIUnavailable` when the model cannot be reached.
    Both are recoverable states the caller must have a deterministic answer for.
    """
    client = client or get_client()
    if not client.is_configured():
        raise AIUnavailable("Azure OpenAI is not configured.")

    schema = _strictify(schema_model.model_json_schema())
    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": schema_model.__name__,
            "schema": schema,
            "strict": False,
        },
    }

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]

    last_error: str = ""
    raw = ""
    for attempt in range(1, repair_attempts + 2):
        content, usage = await client.complete(
            messages=messages,
            fast=fast,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
            purpose=purpose,
        )
        raw = content
        try:
            parsed = json.loads(_extract_json(content))
            return schema_model.model_validate(parsed), usage
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = str(exc)
            logger.warning(
                "ai.structured rejected req=%s purpose=%s attempt=%d error=%s",
                usage.request_id,
                purpose,
                attempt,
                type(exc).__name__,
            )
            if attempt > repair_attempts:
                break
            # One repair attempt, with the validation error but not a looser
            # schema. The type is never negotiated down to meet the model.
            messages.append({"role": "assistant", "content": content})
            messages.append(
                {
                    "role": "user",
                    "content": (
                        "That did not satisfy the schema. Correct it and reply "
                        f"with JSON only.\n\nValidation error:\n{last_error}"
                    ),
                }
            )

    raise StructuredGenerationError(
        f"model output failed schema validation: {last_error}",
        raw=raw,
        attempts=repair_attempts + 1,
    )
