"""The Memory Firewall decision function — pure, deterministic, deny-by-default.

`evaluate(actor, resource, context)` returns a `Decision` and performs NO side
effects. The caller (see `audit.enforce`) writes the audit record and raises on
deny. Keeping this pure is what makes the firewall exhaustively testable — every
row of the role-scope matrix is a unit test.

This module contains no ML and no LLM. It is one of the deterministic safety
components that, by `CLAUDE.md` §1, must live outside any model and never be
bypassable.
"""

from __future__ import annotations

from .matrix import Guard, any_grant_for_category, grant_for
from .models import Actor, Decision, Effect, RequestContext, Resource
from .roles import (
    EMERGENCY_OVERRIDE_CATEGORIES,
    NEVER_COLLECTED,
    ROLE_VISIBILITY_TOKEN,
    Action,
    DataCategory,
    EscalationLevel,
    Purpose,
    Role,
)

# Roles that, when denied, indicate an attempt to reach beyond one's scope.
_ELEVATED_ROLES: frozenset[Role] = frozenset(
    {Role.PRIMARY_CAREGIVER, Role.SECONDARY_CAREGIVER, Role.CHW, Role.CLINICIAN}
)

# Purposes under which a PWM fact may be read (identified data is never read for research).
_PWM_READ_PURPOSES: frozenset[Purpose] = frozenset(
    {
        Purpose.SELF_ACCESS,
        Purpose.ONBOARDING,
        Purpose.PERSONALISATION,
        Purpose.CARE_COORDINATION,
        Purpose.CLINICAL_REVIEW,
        Purpose.SAFETY_RESPONSE,
    }
)


def _decision(
    effect: Effect,
    resource: Resource,
    context: RequestContext,
    actor: Actor,
    *,
    reasons: tuple[str, ...],
    obligations: tuple[str, ...] = ("audit",),
    is_violation: bool = False,
) -> Decision:
    return Decision(
        effect=effect,
        category=resource.category,
        action=context.action,
        actor_role=actor.role,
        subject_person_id=resource.subject_person_id,
        reason_codes=reasons,
        obligations=obligations,
        is_violation=is_violation,
    )


def _guard_ok(guard: Guard, context: RequestContext) -> bool:
    if guard is Guard.ACTIVE_L4_L5:
        return context.active_escalation in (EscalationLevel.L4, EscalationLevel.L5)
    if guard is Guard.CARE_RELEVANT:
        return context.care_relevant
    if guard is Guard.NOT_SHARED_FAMILY_VIEW:
        return not context.into_shared_family_view
    return False  # unknown guard → fail closed


def _evaluate_pwm_read(actor: Actor, resource: Resource, context: RequestContext) -> Decision:
    """PWM fact reads are governed by the fact's own visibility list (its
    provenance envelope), intersected with purpose and consent.
    """
    role = actor.role

    # The person always reads their own facts.
    if role is Role.PERSON:
        if context.purpose is Purpose.RESEARCH:
            return _decision(Effect.DENY, resource, context, actor,
                             reasons=("research_on_identified_data",))
        return _decision(Effect.ALLOW, resource, context, actor, reasons=("granted_self",))

    token = ROLE_VISIBILITY_TOKEN.get(role)
    if token is None:  # admin / system have no visibility token
        return _decision(Effect.DENY, resource, context, actor, reasons=("role_not_permitted",))

    if token not in resource.visibility:
        reason = "scope_expansion_attempt" if role in _ELEVATED_ROLES else "not_in_visibility_scope"
        return _decision(Effect.DENY, resource, context, actor, reasons=(reason,))

    if context.purpose not in _PWM_READ_PURPOSES:
        return _decision(Effect.DENY, resource, context, actor,
                         reasons=("purpose_not_permitted",))

    if not context.consent.granted:
        return _decision(Effect.DENY, resource, context, actor, reasons=("consent_absent",))

    return _decision(Effect.ALLOW, resource, context, actor, reasons=("granted",))


def evaluate(actor: Actor, resource: Resource, context: RequestContext) -> Decision:
    """Return an ALLOW/DENY Decision for this access. Pure and side-effect-free.

    Order of checks (fail-closed at each step):
      1. never-collected categories → hard deny + violation
      2. admin has no person-data access
      3. PWM fact reads → visibility-list path
      4. matrix grant lookup (deny by default; flag scope-expansion)
      5. purpose limitation
      6. guards (escalation / care-relevance / not-shared-family-view)
      7. consent (with a narrow L5 safety-response emergency override)
    """
    category = resource.category
    action = context.action
    role = actor.role

    # 1. Categories that must never exist.
    if category in NEVER_COLLECTED:
        return _decision(
            Effect.DENY, resource, context, actor,
            reasons=("never_collected_category",),
            obligations=("audit", "violation"),
            is_violation=True,
        )

    # 2. Platform admins are not a care role and get no access to person data.
    if role is Role.ADMIN:
        return _decision(Effect.DENY, resource, context, actor,
                         reasons=("admin_no_person_data",))

    # 3. PWM fact reads use the visibility list.
    if category is DataCategory.PWM_FACT and action is Action.READ:
        return _evaluate_pwm_read(actor, resource, context)

    # 4. Matrix lookup — deny by default.
    grant = grant_for(category, action, role)
    if grant is None:
        if any_grant_for_category(category, action) and role in _ELEVATED_ROLES:
            reason = "scope_expansion_attempt"
        else:
            reason = "role_not_permitted"
        return _decision(Effect.DENY, resource, context, actor, reasons=(reason,))

    # 5. Purpose limitation.
    if context.purpose not in grant.purposes:
        return _decision(Effect.DENY, resource, context, actor,
                         reasons=("purpose_not_permitted",))

    # 6. Guards.
    for guard in grant.guards:
        if not _guard_ok(guard, context):
            return _decision(Effect.DENY, resource, context, actor,
                             reasons=(f"guard_failed:{guard.value}",))

    obligations: tuple[str, ...] = ("audit", *grant.obligations)

    # 7. Consent, with a narrow emergency override.
    if grant.requires_consent and not context.consent.granted:
        if (
            context.purpose is Purpose.SAFETY_RESPONSE
            and context.active_escalation is EscalationLevel.L5
            and category in EMERGENCY_OVERRIDE_CATEGORIES
        ):
            return _decision(
                Effect.ALLOW, resource, context, actor,
                reasons=("granted_via_emergency_override",),
                obligations=(*obligations, "emergency_override"),
            )
        return _decision(Effect.DENY, resource, context, actor, reasons=("consent_absent",))

    return _decision(Effect.ALLOW, resource, context, actor,
                     reasons=("granted",), obligations=obligations)
