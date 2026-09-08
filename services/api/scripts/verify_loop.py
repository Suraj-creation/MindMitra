"""End-to-end verification of the governed loop against the live database.

Runs the chain the product is actually about:

    seed a care network with real consent
      -> persist a real observation history
      -> measurement-quality gate
      -> personal baseline
      -> deterministic alert ladder
      -> contextualised statement
      -> four role projections, each authorised separately
      -> refusals audited

and prints what each role received, what was withheld from whom, and why.

Run it with the API up:  python scripts/verify_loop.py
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
PERSON = "person:purnima"
PASSWORD = "mindmitra-demo"

ACCOUNTS = {
    "Anu (primary caregiver)": "anu@demo.mindmitra.in",
    "Meena (CHW)": "meena@demo.mindmitra.in",
    "Dr Barua (clinician)": "barua@demo.mindmitra.in",
    "Bikash (secondary, remote)": "bikash@demo.mindmitra.in",
}


def call(
    method: str, path: str, *, token: str | None = None, body: dict | None = None
) -> tuple[int, dict | str]:
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, method=method)
    request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            raw = response.read().decode()
            return response.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            return exc.code, json.loads(raw)
        except json.JSONDecodeError:
            return exc.code, raw


def rule(title: str) -> None:
    print()
    print("=" * 74)
    print(title)
    print("=" * 74)


def show_projections(tokens: dict[str, str], query: str) -> None:
    for label, token in tokens.items():
        status, body = call("GET", query, token=token)
        print()
        print(f"  --- {label} ---")
        if status != 200:
            print(f"      HTTP {status}: {body}")
            continue
        view = body["view"]
        print(f"      role       : {view['role']}")
        print(
            f"      delivery   : {view['delivery_class']}"
            f"  (interrupts: {view['interrupts']}, suppressed: {view['suppressed']})"
        )
        if view["headline"] is None:
            print(f"      WITHHELD at: {view['withheld_at']}")
            print(f"      because    : {', '.join(view['withheld_reasons'])}")
            continue
        print(f"      headline   : {view['headline']}")
        for fact in view["facts"]:
            print(f"      FACT       : {fact}")
        if view["hypothesis"]:
            print(f"      HYPOTHESIS : {view['hypothesis']}")
        for action in view["actions"]:
            print(f"      ACTION     : {action}")
        print(f"      claim ids  : {', '.join(view['claim_ids']) or '(none)'}")


def main() -> int:
    rule("0. Capabilities actually wired")
    _, health = call("GET", "/health")
    print(f"  environment    : {health['env']}  (demo_mode={health['demo_mode']})")
    for name, on in health["capabilities"].items():
        print(f"  {name:<15}: {'yes' if on else 'NO'}")

    rule("1. Seed the care network, with the consent a real onboarding leaves")
    status, seed = call("POST", "/v1/demo/seed")
    if status != 200:
        print(f"  seed failed: {status} {seed}")
        return 1
    for role, actor in seed["actors"].items():
        print(f"  {role:<20}: {actor}")

    rule("2. Persist a real observation history, then run the ladder")
    status, injected = call("POST", "/v1/demo/inject-decline", body={"days": 4})
    if status != 200:
        print(f"  inject failed: {status} {injected}")
        return 1
    alert = injected["alert"] or {}
    print(f"  baseline points : {injected['baseline_points']} quality-gated observations")
    print(f"  latest deviation: z = {alert.get('z', 0):.2f}")
    print(f"  persistence     : {alert.get('persistence_days')} consecutive days")
    print(f"  escalation      : {alert.get('level')}  (deterministic, no LLM)")

    tokens: dict[str, str] = {}
    rule("3. Sign in as each member of the care network")
    for label, email in ACCOUNTS.items():
        status, body = call(
            "POST", "/v1/auth/login", body={"email": email, "password": PASSWORD}
        )
        if status != 200:
            print(f"  {label:<28}: FAILED {status} {body}")
            return 1
        tokens[label] = body["access_token"]
        print(f"  {label:<28}: signed in")

    rule("4. One statement, four projections - each authorised on its own")
    show_projections(tokens, f"/v1/persons/{PERSON}/projections/me?sleep_disrupted=true")

    rule("4b. Sensitivity union - one private category taints the whole artefact")
    print("  Same evidence, but the caregiver also reported constipation. CONTINENCE")
    print("  is private by default and nobody consented to it, so the derived")
    print("  artefact inherits that restriction and is withheld from every role.")
    show_projections(
        tokens, f"/v1/persons/{PERSON}/projections/me?constipation_reported=true"
    )

    rule("5. The refusals - what the boundary actually stops")
    anu = tokens["Anu (primary caregiver)"]
    meena = tokens["Meena (CHW)"]

    status, _ = call("GET", f"/v1/persons/{PERSON}/projections/me")
    print(f"  no token at all                        -> HTTP {status}  (expect 401)")

    status, _ = call("GET", "/v1/persons/person:nobody/projections/me", token=anu)
    print(f"  caregiver reaching an unrelated person -> HTTP {status}  (expect 404)")

    status, body = call(
        "POST",
        "/v1/pwm/read",
        token=meena,
        body={"person_id": PERSON, "fact_id": "f_rina", "purpose": "personalisation"},
    )
    allowed = body.get("allowed") if isinstance(body, dict) else None
    reasons = ", ".join(body.get("reason_codes", [])) if isinstance(body, dict) else ""
    print(f"  CHW reading a family life-story fact   -> allowed={allowed}  ({reasons})")

    status, body = call(
        "POST",
        "/v1/pwm/read",
        token=anu,
        body={"person_id": PERSON, "fact_id": "f_rina", "purpose": "research"},
    )
    allowed = body.get("allowed") if isinstance(body, dict) else None
    reasons = ", ".join(body.get("reason_codes", [])) if isinstance(body, dict) else ""
    print(f"  caregiver reading it for research      -> allowed={allowed}  ({reasons})")

    rule("6. The measurement refusal - bad data is never a cognitive signal")
    status, body = call(
        "POST",
        f"/v1/persons/{PERSON}/observations",
        token=anu,
        body={
            "domain": "memory",
            "value": 0.31,
            "signals": {"audibility": 0.05, "language_match": False},
        },
    )
    print(f"  quality q      : {body['q']:.2f}")
    print(f"  gate           : {body['gate']}")
    print(f"  dominant issue : {body['dominant_issue']}")
    print(f"  message        : {body['message']}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
