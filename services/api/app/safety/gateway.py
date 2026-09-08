"""Safety Gateway — runs all 10 checks in order, stops at first block.

`evaluate()` is pure (no side effects). `enforce()` adds auditing and raises
SafetyBlocked when the output is blocked. Both follow the same pattern as the
Memory Firewall's evaluate/enforce split.

The gateway is un-bypassable: all user-facing outputs must pass through it before
emission. An output that cannot be decomposed into the three-layer contract or
that contains a forbidden claim is blocked, never emitted raw.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from .checks import (
    check_and_log,
    check_crisis,
    check_diagnosis_filter,
    check_dignity,
    check_emergency_override,
    check_medication_filter,
    check_provenance,
    check_role_fit,
    check_three_layer_contract,
    check_uncertainty_hedge,
    scan_all_forbidden,
)
from .models import CheckResult, GatewayCheck, GatewayResult, ThreeLayerOutput

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from app.firewall.models import RequestContext


class SafetyBlocked(Exception):
    """Raised by enforce() when the Safety Gateway blocks an output."""

    def __init__(self, result: GatewayResult) -> None:
        self.result = result
        super().__init__(
            f"safety gateway blocked: check={result.blocked_by} "
            f"obligations={result.obligations}"
        )


# Checks that BLOCK the output if they fail (fail-closed subset).
# check_crisis and check_emergency_override and check_and_log never block.
_BLOCKING_CHECKS = frozenset(
    {
        GatewayCheck.ROLE_FIT,
        GatewayCheck.DIAGNOSIS,
        GatewayCheck.MEDICATION,
        GatewayCheck.PROVENANCE,
        GatewayCheck.UNCERTAINTY,
        GatewayCheck.THREE_LAYER,
        GatewayCheck.DIGNITY,
    }
)


def evaluate(
    output: ThreeLayerOutput,
    context: RequestContext | None = None,
) -> GatewayResult:
    """Run all 10 checks in order. Stop at first blocking failure. Pure.

    Non-blocking checks (crisis, emergency, audit) always run; they add
    obligations but never cause a block.
    """
    # Step 0: scan ALL forbidden patterns in one pass to catch anything the
    # individual checks might miss (defence-in-depth, e.g. financial/memory).
    is_clean, violation_code = scan_all_forbidden(output)

    results: list[CheckResult] = []
    all_obligations: list[str] = []
    crisis_number: str | None = None
    blocked_by: GatewayCheck | None = None

    def _run(check_result: CheckResult) -> bool:
        """Accumulate result. Return True if we should stop (blocking failure)."""
        results.append(check_result)
        all_obligations.extend(check_result.obligations)
        if not check_result.passed and check_result.check in _BLOCKING_CHECKS:
            return True
        return False

    # 1. Role fit
    if _run(check_role_fit(output, context)):
        blocked_by = GatewayCheck.ROLE_FIT
        return _build_result(False, results, blocked_by, None, all_obligations)

    # 2. Diagnosis filter (also catches the all-pattern scan result)
    diag_result = check_diagnosis_filter(output)
    if not diag_result.passed or (not is_clean and violation_code in (
        "claim_diagnoses", "diagnosis_assertion", "claim_stages"
    )):
        results.append(CheckResult(
            check=GatewayCheck.DIAGNOSIS,
            passed=False,
            reason=diag_result.reason or f"forbidden_claim:{violation_code}",
        ))
        blocked_by = GatewayCheck.DIAGNOSIS
        return _build_result(False, results, blocked_by, None, all_obligations)
    results.append(diag_result)

    # 3. Medication filter
    med_result = check_medication_filter(output)
    if not med_result.passed or (not is_clean and violation_code == "medication_advice"):
        results.append(CheckResult(
            check=GatewayCheck.MEDICATION,
            passed=False,
            reason=med_result.reason or f"forbidden_claim:{violation_code}",
        ))
        blocked_by = GatewayCheck.MEDICATION
        return _build_result(False, results, blocked_by, None, all_obligations)
    results.append(med_result)

    # 4. Provenance
    if _run(check_provenance(output)):
        blocked_by = GatewayCheck.PROVENANCE
        return _build_result(False, results, blocked_by, None, all_obligations)

    # 5. Uncertainty / forbidden-claim sweep (heals/reverses/improves/progression)
    unc_result = check_uncertainty_hedge(output)
    if not unc_result.passed or (not is_clean and violation_code in (
        "claim_heals", "claim_reverses", "claim_improves",
        "claim_cures", "claim_slows", "claim_progression",
        "fabricated_memory", "financial_control",
    )):
        results.append(CheckResult(
            check=GatewayCheck.UNCERTAINTY,
            passed=False,
            reason=unc_result.reason or f"forbidden_claim:{violation_code}",
        ))
        blocked_by = GatewayCheck.UNCERTAINTY
        return _build_result(False, results, blocked_by, None, all_obligations)
    results.append(unc_result)

    # 6. Three-layer contract
    if _run(check_three_layer_contract(output)):
        blocked_by = GatewayCheck.THREE_LAYER
        return _build_result(False, results, blocked_by, None, all_obligations)

    # 7. Dignity
    if _run(check_dignity(output)):
        blocked_by = GatewayCheck.DIGNITY
        return _build_result(False, results, blocked_by, None, all_obligations)

    # 8. Crisis (non-blocking; extracts crisis_number from obligations)
    crisis_result = check_crisis(output)
    results.append(crisis_result)
    all_obligations.extend(crisis_result.obligations)
    for ob in crisis_result.obligations:
        if ob.startswith("route_to_crisis:"):
            crisis_number = ob.split(":", 1)[1]

    # 9. Emergency override (non-blocking)
    results.append(check_emergency_override(output, context))

    # 10. Audit obligation (non-blocking)
    audit_result = check_and_log(output)
    results.append(audit_result)
    all_obligations.extend(audit_result.obligations)

    return _build_result(True, results, None, crisis_number, all_obligations)


def _build_result(
    passed: bool,
    results: list[CheckResult],
    blocked_by: GatewayCheck | None,
    crisis_number: str | None,
    obligations: list[str],
) -> GatewayResult:
    return GatewayResult(
        passed=passed,
        check_results=tuple(results),
        blocked_by=blocked_by,
        crisis_number=crisis_number,
        obligations=tuple(dict.fromkeys(obligations)),  # deduplicate, preserve order
    )


def enforce(
    output: ThreeLayerOutput,
    context: RequestContext | None = None,
    sink: object | None = None,
) -> GatewayResult:
    """evaluate + optional audit write + raise SafetyBlocked on block.

    The sink (AuditSink) is optional here to keep the gateway usable without
    a live database connection (e.g. in unit tests). Production callers should
    always pass a sink.
    """
    result = evaluate(output, context)

    if sink is not None:
        # The sink's record() signature differs from the firewall's; the gateway
        # writes a simplified audit record. Production wires this to the
        # append-only audit_log table.
        #
        # `hasattr` rather than try/except AttributeError: the old form also
        # swallowed an AttributeError raised *inside* a working sink, so a
        # broken audit writer produced zero safety-audit rows and no signal at
        # all. A sink that genuinely lacks the method is a configuration
        # mistake, so it is logged rather than passed over in silence.
        recorder = getattr(sink, "record_gateway", None)
        if recorder is None:
            logger.warning(
                "safety gateway audit skipped: %s has no record_gateway()",
                type(sink).__name__,
            )
        else:
            recorder(result, output)

    if result.should_block:
        raise SafetyBlocked(result)

    return result
