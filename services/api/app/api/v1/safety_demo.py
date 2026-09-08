"""Safety Gateway demo endpoint.

POST /v1/safety/check — run a text/output through the Safety Gateway 10 checks
and return the structured gate result. This surface is for demonstration only;
it is NOT a general-purpose LLM output validation API.

Demo usage:
    POST /v1/safety/check  {"text": "she has dementia", "role_target": "caregiver"}
    → {"passed": false, "blocked_by": "DIAGNOSIS", ...}

    POST /v1/safety/check  {"text": "dementia is progressing", "role_target": "person"}
    → {"passed": false, "blocked_by": "UNCERTAINTY", ...}
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.firewall.roles import Role
from app.safety import (
    GatewayResult,
    ThreeLayerAction,
    ThreeLayerFact,
    ThreeLayerOutput,
    evaluate,
)

router = APIRouter(prefix="/safety", tags=["safety"])


class SafetyCheckRequest(BaseModel):
    text: str
    role_target: Role = Role.PRIMARY_CAREGIVER


class CheckResultOut(BaseModel):
    check: str
    passed: bool
    reason: str
    obligations: list[str]


class SafetyCheckResponse(BaseModel):
    passed: bool
    blocked_by: str | None
    crisis_number: str | None
    obligations: list[str]
    check_results: list[CheckResultOut]
    explanation: str


@router.post("/check", response_model=SafetyCheckResponse)
def check_output(req: SafetyCheckRequest) -> SafetyCheckResponse:
    """Run the Safety Gateway 10 checks against a raw text string.

    Constructs a minimal ThreeLayerOutput (one fact + one action) with the
    provided text as raw_text, then runs all 10 checks. If any blocking check
    fails, passed=False and blocked_by names the check.

    This is the demo endpoint for: "app refuses to say 'she has dementia'."
    """
    output = ThreeLayerOutput(
        facts=(ThreeLayerFact(content=req.text, source="demo_input", confidence=1.0),),
        actions=(ThreeLayerAction(content="consult a clinician", is_safe=True),),
        role_target=req.role_target,
        raw_text=req.text,  # The gateway scans this for forbidden patterns
    )

    result: GatewayResult = evaluate(output)

    if result.passed:
        explanation = "All 10 Safety Gateway checks passed. Output is safe to emit."
    else:
        explanation = (
            f"Safety Gateway blocked this output at check '{result.blocked_by}'. "
            "This output cannot be emitted. The system is demonstrably incapable "
            "of producing this content for users."
        )

    return SafetyCheckResponse(
        passed=result.passed,
        blocked_by=result.blocked_by.value if result.blocked_by else None,
        crisis_number=result.crisis_number,
        obligations=list(result.obligations),
        check_results=[
            CheckResultOut(
                check=cr.check.value,
                passed=cr.passed,
                reason=cr.reason,
                obligations=list(cr.obligations),
            )
            for cr in result.check_results
        ],
        explanation=explanation,
    )
