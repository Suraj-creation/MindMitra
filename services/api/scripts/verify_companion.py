"""Prove the governed companion works end to end against Neon and Azure.

Runs the paths that matter:

    emergency and medication  -> deterministic, no model, no retrieval
    "who is Rina?"            -> graph lane -> grounded answer with provenance
    an unknown name           -> refusal, not invention
    a voice tool call         -> firewall-scoped, per role
    a CHW asking the same     -> denied, because life story is not theirs

Run with the API up:  python scripts/verify_companion.py
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

# The companion replies in the person's own language, so stdout must be UTF-8.
# The Windows console defaults to cp1252 and would raise on Assamese script.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8000"
PERSON = "person:purnima"
PASSWORD = "mindmitra-demo"


def call(method: str, path: str, *, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, method=method)
    request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
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


def login(email: str) -> str:
    status, body = call(
        "POST", "/v1/auth/login", body={"email": email, "password": PASSWORD}
    )
    if status != 200:
        raise SystemExit(f"login failed for {email}: {status} {body}")
    return body["access_token"]


def show_turn(label: str, token: str, message: str) -> dict:
    status, body = call(
        "POST",
        f"/v1/persons/{PERSON}/companion/turn",
        token=token,
        body={"message": message},
    )
    print()
    print(f'  {label}: "{message}"')
    if status != 200:
        print(f"      HTTP {status}: {body}")
        return {}
    print(f"      intent    : {body['intent']}   path: {body['path']}")
    if body.get("lanes_run"):
        print(f"      lanes     : {', '.join(body['lanes_run'])}")
    if body.get("model"):
        print(f"      model     : {body['model']}  ({body.get('latency_ms')} ms)")
    print(f"      answer    : {body['answer']}")
    for source in body.get("sources", []):
        mark = "verified" if source["verified"] else "UNCONFIRMED"
        print(f"      source    : [{mark}] {source['source_type']} -> {source['text']}")
    for gap in body.get("gaps", []):
        print(f"      not known : {gap}")
    if not body.get("safety_passed", True):
        print(f"      BLOCKED BY: {body.get('blocked_by')}")
    return body


def main() -> int:
    rule("0. Seed a person with a real world model")
    status, _ = call("POST", "/v1/demo/seed")
    if status != 200:
        print(f"  seed failed: {status}")
        return 1
    call("POST", "/v1/demo/inject-decline", body={"days": 4})
    print("  Purnima Devi seeded, with Rina as a verified granddaughter fact")

    person_token = None
    anu = login("anu@demo.mindmitra.in")
    meena = login("meena@demo.mindmitra.in")
    print("  signed in as Anu (primary caregiver) and Meena (CHW)")

    rule("1. Emergency and medication: no model, no retrieval")
    show_turn("caregiver", anu, "Help me, she has fallen and cannot get up")
    show_turn("caregiver", anu, "Should she take another tablet?")
    show_turn("caregiver", anu, "My chest hurts, should I take another tablet")

    rule("2. A grounded question: the graph lane answers with provenance")
    show_turn("caregiver", anu, "Who is Rina?")

    rule("3. An unknown name: refusal, never invention")
    show_turn("caregiver", anu, "Who is Deepak?")

    rule("4. Orientation and reminiscence")
    show_turn("caregiver", anu, "What is happening today?")
    show_turn("caregiver", anu, "Tell me about Bihu")

    rule("5. The same question, a different role")
    print("  Meena is a CHW. The Rina fact's visibility is person +")
    print("  primary_caregiver only, so the graph lane never loads it for her.")
    show_turn("chw", meena, "Who is Rina?")

    rule("6. Voice capability, and the fallback rung it implies")
    for label, token in (("caregiver", anu), ("chw", meena)):
        status, body = call(
            "GET", f"/v1/persons/{PERSON}/voice/capability", token=token
        )
        print(f"  {label}: HTTP {status}")
        if status == 200:
            print(f"      provider  : {body['provider']}")
            print(f"      speech in : {body['speech_input_supported']}")
            print(f"      speech out: {body['speech_output_supported']}")
            print(f"      fallback  : {body['fallback']}")
            print(f"      note      : {body['note']}")

    rule("7. A voice session belongs to the person's own surface")
    status, body = call("POST", f"/v1/persons/{PERSON}/voice/session", token=anu)
    print(f"  caregiver requesting a voice session -> HTTP {status}  (expect 403)")

    rule("8. A voice tool call is firewall-scoped")
    for label, token in (("caregiver", anu), ("chw", meena)):
        status, body = call(
            "POST",
            f"/v1/persons/{PERSON}/voice/tool",
            token=token,
            body={"tool_name": "who_is", "arguments": {"name": "Rina"}},
        )
        result = body.get("result", {}) if status == 200 else {}
        print(f"  {label:<10} who_is('Rina') -> found={result.get('found')}")
        for fact in result.get("facts", []):
            plainly = "plainly" if fact["may_state_plainly"] else "hedged"
            print(f"      [{plainly}] {fact['statement']}")

    rule("9. A tool the model invented returns not-found, never an error")
    status, body = call(
        "POST",
        f"/v1/persons/{PERSON}/voice/tool",
        token=anu,
        body={"tool_name": "read_medical_record", "arguments": {}},
    )
    print(f"  HTTP {status}  result: {body.get('result')}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
