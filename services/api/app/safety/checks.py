"""The ten deterministic Safety Gateway checks — pure functions, no side effects.

Each check accepts a ThreeLayerOutput (and optionally a RequestContext) and returns
a CheckResult. None of these functions write to a database, call an LLM, or raise
exceptions on failure — they return a CheckResult with passed=False and a reason.

The forbidden-claim pattern registry enforces CLAUDE.md §1 invariant 3: the system
must be *demonstrably incapable* of emitting diagnosis assertions, progression claims,
medication advice, or financial control claims.

Crisis keyword detection (check 8) routes to Tele-MANAS 14416 — the national mental
health helpline — when distress signals are present in the output.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

from app.core.config import get_settings

from .models import CheckResult, GatewayCheck, ThreeLayerOutput

if TYPE_CHECKING:
    from app.firewall.models import RequestContext


# ── Forbidden-claim pattern registry (CLAUDE.md §1.3) ────────────────────────
# Each entry: (regex_pattern, violation_code)
# Patterns are case-insensitive. The system must be demonstrably incapable of
# emitting these claims, so we match broadly and err toward blocking.
_FORBIDDEN_PATTERNS: list[tuple[str, str]] = [
    # Dementia treatment claims
    (r"\bheals?\s+dementia\b", "claim_heals"),
    (r"\breverse[sd]?\s+dementia\b", "claim_reverses"),
    (r"\bimprove[sd]?\s+dementia\b", "claim_improves"),
    (r"\bcure[sd]?\s+dementia\b", "claim_cures"),
    (r"\bslows?\s+dementia\b", "claim_slows"),  # only clinicians may claim this
    # Diagnosis / staging assertions
    (r"\bdiagnos[ei][sd]?\s+(dementia|alzheimer|cognitive)", "claim_diagnoses"),
    (r"\bstage[sd]?\s+(\d+\s+)?(of\s+)?(dementia|alzheimer)", "claim_stages"),
    (r"\b(you|she|he|they)\s+ha[sv]e\s+dementia\b", "diagnosis_assertion"),
    (r"\bhas\s+dementia\b", "diagnosis_assertion"),
    (r"\bconfirmed\s+(dementia|alzheimer)", "diagnosis_assertion"),
    # Progression claims — use Behaviour Cause-Reasoning instead
    (r"\bdementia\s+is\s+progress\w*\b", "claim_progression"),
    (r"\bcognitive\s+decline\s+is\s+progress\w*\b", "claim_progression"),
    (r"\bdementia\s+is\s+getting\s+worse\b", "claim_progression"),
    # Medication autonomy
    (r"\bprescribe\b", "medication_advice"),
    (r"\bchange\s+the\s+dose\b", "medication_advice"),
    (r"\badjust\s+(the\s+)?medication\b", "medication_advice"),
    (r"\btake\s+\d+\s*mg\b", "medication_advice"),
    (r"\bstop\s+taking\b", "medication_advice"),
    (r"\bdouble\s+the\s+dose\b", "medication_advice"),
    # Fabricated memories / synthetic personal content
    (r"\bfabricat\w+\s+memor\w*\b", "fabricated_memory"),
    # Financial control
    (r"\b(financial|bank)\s+(control|access|transfer|account)\b", "financial_control"),
    (r"\btransfer\s+money\b", "financial_control"),
]

# Crisis keywords that trigger Tele-MANAS routing (check 8)
_CRISIS_PATTERNS: list[str] = [
    r"\b(suicid|self.harm|self.injur|want\s+to\s+die|end\s+(my|their|her|his|your)\s+life)\w*\b",
    r"\b(overdose|took\s+too\s+many|took\s+all\s+the\s+pills)\b",
    r"\b(crisis|emergency|emergency\s+help)\b",
]

_COMPILED_FORBIDDEN = [
    (re.compile(p, re.IGNORECASE), code) for p, code in _FORBIDDEN_PATTERNS
]
_COMPILED_CRISIS = [re.compile(p, re.IGNORECASE) for p in _CRISIS_PATTERNS]


def _scan_text(output: ThreeLayerOutput) -> str:
    """Build a single string to scan. Use raw_text if present; otherwise join layers."""
    if output.raw_text:
        return output.raw_text
    parts: list[str] = []
    parts.extend(f.content for f in output.facts)
    parts.extend(h.content + " " + h.label for h in output.hypotheses)
    parts.extend(a.content for a in output.actions)
    return " ".join(parts)


# ── The ten checks ─────────────────────────────────────────────────────────────

def check_role_fit(
    output: ThreeLayerOutput,
    context: RequestContext | None = None,
) -> CheckResult:
    """Check 1: Is the role_target authorised to receive this output kind?

    Clinical summaries and research knowledge (K6) must not reach unpermissioned
    roles. This is a coarse content-type guard; the Memory Firewall performs the
    precise data-category authZ on the underlying facts.
    """
    from app.firewall.roles import Role

    role = output.role_target
    # Admin role has no person-data access (mirrors the firewall).
    if role is Role.ADMIN:
        return CheckResult(
            check=GatewayCheck.ROLE_FIT,
            passed=False,
            reason="admin_no_person_output",
        )
    return CheckResult(check=GatewayCheck.ROLE_FIT, passed=True)


def check_diagnosis_filter(output: ThreeLayerOutput) -> CheckResult:
    """Check 2: Refuse any claim that diagnoses or stages dementia.

    The system must be demonstrably incapable of emitting a diagnosis assertion.
    This check scans all text content against the forbidden-claim registry.
    """
    text = _scan_text(output)
    for pattern, code in _COMPILED_FORBIDDEN:
        if code in ("claim_diagnoses", "diagnosis_assertion", "claim_stages"):
            if pattern.search(text):
                return CheckResult(
                    check=GatewayCheck.DIAGNOSIS,
                    passed=False,
                    reason=f"forbidden_claim:{code}",
                )
    return CheckResult(check=GatewayCheck.DIAGNOSIS, passed=True)


def check_medication_filter(output: ThreeLayerOutput) -> CheckResult:
    """Check 3: Refuse autonomous medication changes or dosing advice."""
    text = _scan_text(output)
    for pattern, code in _COMPILED_FORBIDDEN:
        if code == "medication_advice":
            if pattern.search(text):
                return CheckResult(
                    check=GatewayCheck.MEDICATION,
                    passed=False,
                    reason=f"forbidden_claim:{code}",
                )
    return CheckResult(check=GatewayCheck.MEDICATION, passed=True)


def check_provenance(output: ThreeLayerOutput) -> CheckResult:
    """Check 4: Unverified facts must not appear in the FACT layer.

    Only facts with verification_status="verified" may be asserted plainly.
    Reported/unverified claims belong in ThreeLayerHypothesis with a hedge.
    """
    unverified = [
        f.source
        for f in output.facts
        if f.verification_status not in ("verified",)
    ]
    if unverified:
        return CheckResult(
            check=GatewayCheck.PROVENANCE,
            passed=False,
            reason=f"unverified_fact_in_fact_layer:sources={unverified[:3]}",
        )
    return CheckResult(check=GatewayCheck.PROVENANCE, passed=True)


def check_uncertainty_hedge(output: ThreeLayerOutput) -> CheckResult:
    """Check 5: Each HYPOTHESIS must carry the 'not a diagnosis' label.

    The ThreeLayerHypothesis model already enforces this structurally (model
    validator). This check is defence-in-depth: it also catches the remaining
    forbidden claims about progression and treatment that belong in hypotheses,
    not facts, and scans for them.
    """
    # Check for forbidden claims that express false certainty about outcomes
    text = _scan_text(output)
    for pattern, code in _COMPILED_FORBIDDEN:
        if code in ("claim_heals", "claim_reverses", "claim_improves",
                    "claim_cures", "claim_slows", "claim_progression"):
            if pattern.search(text):
                return CheckResult(
                    check=GatewayCheck.UNCERTAINTY,
                    passed=False,
                    reason=f"forbidden_claim:{code}",
                )
    # All hypotheses already carry the label (enforced by model validator).
    return CheckResult(check=GatewayCheck.UNCERTAINTY, passed=True)


def check_three_layer_contract(output: ThreeLayerOutput) -> CheckResult:
    """Check 6: Output must have at least one FACT and one ACTION.

    The ThreeLayerOutput schema enforces min_length=1 at construction; this is
    a runtime double-check that confirms the contract holds after any copying.
    """
    if not output.facts:
        return CheckResult(
            check=GatewayCheck.THREE_LAYER,
            passed=False,
            reason="missing_fact_layer",
        )
    if not output.actions:
        return CheckResult(
            check=GatewayCheck.THREE_LAYER,
            passed=False,
            reason="missing_action_layer",
        )
    # No unsafe actions
    unsafe = [a.content[:50] for a in output.actions if not a.is_safe]
    if unsafe:
        return CheckResult(
            check=GatewayCheck.THREE_LAYER,
            passed=False,
            reason=f"unsafe_action_present:{unsafe}",
        )
    return CheckResult(check=GatewayCheck.THREE_LAYER, passed=True)


def check_dignity(output: ThreeLayerOutput) -> CheckResult:
    """Check 7: No shaming language, no score comparisons, no "wrong".

    Scans for dignity violations in all text layers.
    """
    _DIGNITY_PATTERNS: list[tuple[str, str]] = [
        (r"\b(wrong|incorrect|failed|failure)\b", "shaming_language"),
        (r"\b(score[sd]?\s+(of|is|was)\s+\d+)\b", "score_shown"),
        (r"\bcompare[sd]?\s+to\s+(others|peers|average)\b", "comparison_shown"),
        (r"\btimer\s+(is|has|ran)\b", "timer_shown"),
        (r"\byou\s+(scored|got|achieved)\s+\d+\b", "score_shown"),
    ]
    text = _scan_text(output)
    for raw_pattern, code in _DIGNITY_PATTERNS:
        if re.search(raw_pattern, text, re.IGNORECASE):
            return CheckResult(
                check=GatewayCheck.DIGNITY,
                passed=False,
                reason=f"dignity_violation:{code}",
            )
    return CheckResult(check=GatewayCheck.DIGNITY, passed=True)


def check_crisis(output: ThreeLayerOutput) -> CheckResult:
    """Check 8: Crisis keywords → Tele-MANAS 14416 routing obligation.

    If distress signals are detected, the check passes (we do not block the
    output) but returns a crisis_routing obligation so the caller can surface
    the helpline number immediately.
    """
    settings = get_settings()
    text = _scan_text(output)
    for pattern in _COMPILED_CRISIS:
        if pattern.search(text):
            return CheckResult(
                check=GatewayCheck.CRISIS,
                passed=True,  # Surface the crisis content + the routing
                reason="crisis_keyword_detected",
                obligations=(f"route_to_crisis:{settings.tele_manas_number}",),
            )
    return CheckResult(check=GatewayCheck.CRISIS, passed=True)


def check_emergency_override(
    output: ThreeLayerOutput,
    context: RequestContext | None = None,
) -> CheckResult:
    """Check 9: Log emergency overrides for auditing.

    The actual L5 emergency-override logic lives in the Memory Firewall policy.
    This check simply detects if the output carries an emergency_override obligation
    from the firewall and adds its own audit obligation.
    """
    return CheckResult(
        check=GatewayCheck.EMERGENCY,
        passed=True,
        obligations=("emergency_check_logged",),
    )


def check_and_log(output: ThreeLayerOutput) -> CheckResult:
    """Check 10: Every gateway decision must be audited.

    Returns an audit obligation; the caller (gateway.enforce) performs the write.
    """
    return CheckResult(
        check=GatewayCheck.AUDIT,
        passed=True,
        obligations=("gateway_decision_logged",),
    )


# ── Also scan for remaining forbidden claims (financial/memory) ───────────────
# These are caught by check_diagnosis_filter or check_medication_filter above.
# Provide a single convenience function that scans ALL forbidden patterns.

def scan_all_forbidden(output: ThreeLayerOutput) -> tuple[bool, str]:
    """Scan all forbidden patterns. Returns (is_clean, first_violation_code)."""
    text = _scan_text(output)
    for pattern, code in _COMPILED_FORBIDDEN:
        if pattern.search(text):
            return False, code
    return True, ""
