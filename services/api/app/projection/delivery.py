"""The delivery policy — deciding whether a human is interrupted at all.

Artefact #11. Pure, deterministic, no LLM (tech-stack.md §22.1.3).

Two ladders, deliberately separate: `EscalationLevel` says what the evidence
*means*; `DeliveryClass` says how it *reaches a human*. The same L3 statement is
`ACTION_REQUIRED` for a caregiver, `INFORMATIONAL` for a CHW and
`NO_NOTIFICATION` for a clinician. Collapsing the two is what turns a careful
system into an alert firehose.

The job of this module is to *reduce* interruption. A good week produces almost
no notifications, and that is success rather than silence — so every
suppression is recorded on the decision (`suppressed=True`) and is auditable.
A suppression policy without a suppression audit is a missed-alarm generator.
"""

from __future__ import annotations

from app.behaviour.models import ChangeKind
from app.firewall.roles import EscalationLevel, Role

from .models import DeliveryClass, DeliveryDecision, RoleProjection

# What a role receives when there is something worth knowing but nothing to do
# right now. This is the resting state of the whole system.
_PULL_CLASS: dict[Role, DeliveryClass] = {
    Role.PERSON: DeliveryClass.INFORMATIONAL,
    Role.PRIMARY_CAREGIVER: DeliveryClass.REVIEW_WHEN_CONVENIENT,
    Role.SECONDARY_CAREGIVER: DeliveryClass.REVIEW_WHEN_CONVENIENT,
    Role.CHW: DeliveryClass.INFORMATIONAL,
    Role.CLINICIAN: DeliveryClass.NO_NOTIFICATION,
}

# Steady-state interruption budgets (Blueprint §21.3). The person's zero is not
# a budget that can be exhausted — it is a structural rule enforced below.
WEEKLY_ACTION_BUDGET: dict[Role, int] = {
    Role.PERSON: 0,
    Role.PRIMARY_CAREGIVER: 1,
    Role.SECONDARY_CAREGIVER: 0,
    Role.CHW: 5,
    Role.CLINICIAN: 0,
}


def classify(
    projection: RoleProjection,
    *,
    change_kind: ChangeKind,
    duplicative: bool = False,
    budget_exhausted: bool = False,
) -> DeliveryDecision:
    """Decide how this projection reaches this role. Pure.

    Order matters and is fail-safe in the direction of *not* interrupting,
    except for the two classes that must always fire:

      1. L5 -> EMERGENCY, L4 -> URGENT. Never suppressible, never budgeted.
      2. The person is never notified about themselves, at any level.
      3. NO_CHANGE / INSUFFICIENT_DATA never interrupt anyone.
      4. Nothing actionable for this role -> its pull class.
      5. Duplicative inside the novelty window -> NO_NOTIFICATION, suppressed.
      6. Budget exhausted -> deferred to REVIEW_WHEN_CONVENIENT, never dropped.
      7. Otherwise ACTION_REQUIRED.
    """
    role = projection.role
    level = projection.escalation_level

    # 1. Deterministic safety rules. These bypass everything below.
    if level is EscalationLevel.L5:
        return DeliveryDecision(
            role=role,
            delivery_class=DeliveryClass.EMERGENCY,
            reason_codes=("l5_safety_rule",),
            bypassed_budget=True,
        )
    if level is EscalationLevel.L4:
        return DeliveryDecision(
            role=role,
            delivery_class=DeliveryClass.URGENT,
            reason_codes=("l4_same_day",),
            bypassed_budget=True,
        )

    # 2. The person is never alerted about themselves. Their projection is
    #    rendered in-session; it is never a push. (Emergency and safe-return
    #    cards are a separate deterministic path and do not come through here.)
    if role is Role.PERSON:
        return DeliveryDecision(
            role=role,
            delivery_class=DeliveryClass.INFORMATIONAL,
            reason_codes=("person_never_notified_about_self",),
        )

    # 3. Nothing happened, or nothing could be measured. Both are successful
    #    outcomes that must not cost anyone their attention.
    if change_kind is ChangeKind.NO_CHANGE:
        return DeliveryDecision(
            role=role,
            delivery_class=DeliveryClass.INFORMATIONAL,
            reason_codes=("no_change",),
        )
    if change_kind is ChangeKind.INSUFFICIENT_DATA:
        # A measurement action, never a cognitive signal. Informational at most.
        return DeliveryDecision(
            role=role,
            delivery_class=DeliveryClass.INFORMATIONAL,
            reason_codes=("insufficient_data_measurement_action",),
        )

    pull_class = _PULL_CLASS.get(role, DeliveryClass.NO_NOTIFICATION)

    # 4. Actionability is a property of the projection: does it carry an action
    #    that needs a human to do something?
    actionable = any(a.requires_human_approval for a in projection.output.actions)
    if not actionable:
        return DeliveryDecision(
            role=role,
            delivery_class=pull_class,
            reason_codes=("not_actionable_for_role",),
        )

    # 5. Already told them this recently.
    if duplicative:
        return DeliveryDecision(
            role=role,
            delivery_class=DeliveryClass.NO_NOTIFICATION,
            reason_codes=("duplicative_within_novelty_window",),
            suppressed=True,
        )

    # 6. Deferred, never dropped — it still reaches them in the next digest.
    if budget_exhausted:
        return DeliveryDecision(
            role=role,
            delivery_class=DeliveryClass.REVIEW_WHEN_CONVENIENT,
            reason_codes=("attention_budget_exhausted",),
            suppressed=True,
        )

    if WEEKLY_ACTION_BUDGET.get(role, 0) == 0:
        # Roles with no interruption budget receive it on pull.
        return DeliveryDecision(
            role=role,
            delivery_class=pull_class,
            reason_codes=("role_has_no_interruption_budget",),
        )

    return DeliveryDecision(
        role=role,
        delivery_class=DeliveryClass.ACTION_REQUIRED,
        reason_codes=("actionable_and_novel",),
    )
