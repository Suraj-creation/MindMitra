# MindMitra API (`services/api`)

FastAPI modular monolith. Primary backend for the platform.

## Implemented now (flagship, fully tested)

- **`app/firewall/`** — the **Memory Firewall**: deterministic, deny-by-default authorization implementing the role × category × purpose × consent × context matrix, with an append-only audit sink. This is the enforcement of `CLAUDE.md` §1 invariant 7.
- **`app/studio/`** — the **Experience-Spec**: the structured, validated representation the Cognitive Studio produces (never executable code), plus the two deterministic validators (grounding + safety/dignity). Enforcement of invariants 8 and 9.

## Module map (see `CLAUDE.md` §5)

```
app/
  core/       config, (db, security, audit — as they land)
  firewall/   Memory Firewall authZ + audit          ← IMPLEMENTED
  studio/     Experience-Spec schema + validators     ← IMPLEMENTED
  main.py     FastAPI app (health + wiring)
  safety/ pwm/ cognition/ behaviour/ intervention/ escalation/ rag/ orchestrator/ sync/ api/   ← next
```

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
python -m pytest -q
python -m uvicorn app.main:app --reload
```
