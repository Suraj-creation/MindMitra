# MindMitra

Cognitive gaming & memory-assistance platform for elderly people living with dementia in the North Eastern Region — SIH 2026, PS26003 (MDoNER).

> **This is not a games app.** It is a shared intelligence layer between the person, the family, the community health worker, and the clinician. See `CLAUDE.md` for the operating manual and `tech-stack.md` for the full architecture.

## Governing rule

> AI detects, retrieves, summarises, personalises, prioritises and assists. Clinicians diagnose, prescribe and decide. The person and family retain agency.

## Monorepo layout

```
apps/web        Next.js — first-class production web (build now)
apps/mobile     Expo + React Native (future)
services/api    FastAPI modular monolith — primary backend
services/worker Background jobs
packages/*      Shared TypeScript domain, api-client, experience-runtime, tokens
research/       Separated, governed experimentation
```

## Quick start — backend (services/api)

The backend is the first thing that runs. It ships two flagship, fully-tested modules:
`app/firewall` (Memory-Firewall deterministic authZ) and `app/studio` (Experience-Spec schema + validators).

```powershell
cd services/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
python -m pytest -q            # run the safety + spec test suites
python -m uvicorn app.main:app --reload
```

(`uv` is recommended once installed: `uv sync` then `uv run pytest`.)

## Toolchain

Python 3.12 · Node ≥ 20 · pnpm ≥ 10 · Neon PostgreSQL · pgvector · Backblaze B2 · LangGraph.

## Non-negotiables

The Safety Gateway, three-layer output contract, Memory Firewall, provenance-on-every-fact, and "refuse to score bad data / refuse to say 'she has dementia'" are enforced in code and tested. See `CLAUDE.md` §1.
