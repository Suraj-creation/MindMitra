# CLAUDE.md — MindMitra Operating Manual

> This file is loaded every session. It is the **operating manual and guardrail** for building this platform.
> It is intentionally dense. When in doubt, follow this file. For depth, read `tech-stack.md`, `DESIGN.md` and the three design docs.
> **The rules in "NON-NEGOTIABLE INVARIANTS" override convenience, speed, and cleverness. Never trade them away.**

---

## 0. What this project is

**MindMitra** — SIH 2026, an AI-based cognitive gaming and memory-assistance platform for elderly people living with dementia in the **North Eastern Region (NER)**, for MDoNER.

It is **NOT a games app**, and it is **NOT four products**. It is **ONE longitudinal cognitive-care system centred on ONE person**, shared under consent with three other authorised human roles. Games are an *input mechanism*; reports are an *output mechanism*; the governed loop between them is the product.

**Governing rule (never violated by any code, prompt, model, or feature):**
> *AI detects, retrieves, summarises, personalises, prioritises and assists. Clinicians diagnose, prescribe and decide. The person and family retain agency.*

**North star:** preserve *meaningful independence and quality of life* for as long as safely possible, while reducing caregiver load and improving continuity of care. **The measure of success is not app usage or game scores — it is how much of their own life the person keeps.**

### 0.1 The four-role operating model (read this before any feature work)

```
                          ONE PERSON
                              │
                  PERSONAL COGNITIVE-CARE MODEL
                 (PWM · PCM · XM · GIM · CAE · Baseline)
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
        CAREGIVER            CHW           CLINICIAN
       compression       operational       longitudinal
       what changed?     what to check?    what changed,
       do I act?         escalate?         how trustworthy?
             └────────────────┼────────────────┘
                              │
                       governed by:
        consent · Memory Firewall · provenance · safety
                 role × purpose × context × time
```

The four roles receive **different derived information because they hold different responsibilities — never different truths**. One governed evidence base; four purpose-bound projections. This is the strongest architectural and UX principle in the project and it is enforced in code, not prose.

| Role | Receives | Never receives | The question its first screen answers |
|---|---|---|---|
| **Person** | Companionship, memory assistance, orientation, routine support, cognitive experiences drawn from their own verified life, encouragement, reminders | Scores, alerts about themselves, medical framing, statistics, "you failed", test framing | *"What can I help you do right now?"* |
| **Caregiver** | Compressed change, safety-relevant events, assistance needs, action cards, "nothing needs attention" | Unrestricted private memories, raw telemetry, every game interaction, raw model state, speculative AI conclusions, surveillance streams | *"How is she today? What changed? Do I need to do anything?"* |
| **CHW** | Visit-preparation brief, meaningful change since last visit, function/routine summary, unresolved needs, escalation/referral suggestion | Every interaction, irrelevant personal memories, unrestricted clinical records, raw AI reasoning | *"What do I need to know before this visit, and what should I check?"* |
| **Clinician** | Since-last-review longitudinal evidence with provenance, measurement confidence, confounders, contradictions, unanswered questions | Opaque AI scores, raw telemetry as the entry point, any diagnostic conclusion from the system | *"What changed since the last review, and how trustworthy is it?"* |

Full behaviour: `DESIGN.md` (Parts B–D) · full information matrix: `MindMitra_PS26003_Solution.md` §23 · mechanism: `tech-stack.md` §13.2, §19.1, §21.1.

### 0.2 Document authority (which document wins)

Six documents overlap. Where they disagree, the higher authority wins **for its domain**; the others are updated, never silently ignored.

| Rank | Document | Authoritative for | Not authoritative for |
|---|---|---|---|
| 1 | **CLAUDE.md** (this file) | Invariants, working rules, canonical vocabulary, what is implemented | Depth of reasoning |
| 2 | **tech-stack.md** | Technology choices, system architecture, data model, pipelines, ADRs | Product scope, clinical claims |
| 3 | **DESIGN.md** | UX/UI, information architecture, screens, design system, accessibility | Technology, clinical evidence |
| 4 | **MindMitra_PS26003_Solution.md** (Part I) | Product definition, safety boundaries, evidence discipline, MVP scope, the role information contract | Technology selection, UI |
| 5 | **MindMitra_PS26003_PartII.md** | The Personal Cognitive System (PWM/PCM/XM/GIM/CAE) and the Cognitive Studio | Anything Part I already settled |
| 6 | **SIH2026-…-Blueprint.md** | Problem analysis, NER evidence, literature, failure-mode and red-team depth | Technology (superseded by tech-stack.md §29.2 note) and UX (superseded by DESIGN.md) |

### 0.3 Canonical vocabulary (one name per thing)

Two engines carry a **system name** (used in code, tests, logs, APIs) and a **product name** (used in human-facing docs and UI copy). Both are correct; they are not two systems. Never introduce a third name.

| System / code name | Product / human-facing name | Where it lives |
|---|---|---|
| **Measurement-Quality Engine (MQE)**, `q ∈ [0,1]` | **Measurement Integrity** | `app/cognition/mq.py` |
| **Behaviour Cause-Reasoning Engine** | **Contextual Behaviour Support** | `app/behaviour/` (specified) |
| **Clinical Change Context Engine** | *(same)* — the reversible-cause triage that runs **before** any change is interpreted | `app/behaviour/context_engine.py` |
| **Experience-Spec** (the validated JSON artefact) | **Cognitive Experience** (the unit of design) | `app/studio/spec.py` |
| **Personal Capability Model (PCM)** | *(same)* — the per-domain, uncertainty-aware capability vector shipped in the MVP | `app/cognition/` |
| **Personal Cognitive State Model (PCSM)** | *(same)* — the **research-fenced**, latent longitudinal estimate. Distinct from the PCM. Never user-facing. | `research/` only |
| **`EvidenceClaim`** | *(no product name — internal)* — one assertion, worded once, shared by every role that receives it | `app/projection/models.py` |
| **Assistance Policy** | **Minimum Sufficient Assistance** — how much help to offer, and when to stay silent | `app/intervention/` (specified, tech-stack §18.2) |

**A game is a renderer. A Cognitive Experience is the unit.** Do not name new features "game X".

**There is no `P_t` / "Personal Cognitive-Care State" god-object, and there must not be.** The evolving person is represented by PWM + PCM + Experience Memory + Personal Baseline + CAE as *separate* stores, deliberately. A single monolithic state struct would have to be read and written whole, which fights the Memory Firewall — whose entire value is that it authorises **per category**, so a CHW can read routine without ever touching life story. If a caller needs several parts at once, assemble them on the read side under the firewall; never merge the stores.

---

## 1. NON-NEGOTIABLE INVARIANTS (never break these)

These are enforced in **code**, not documentation. If a change would weaken any of these, stop and reconsider the design.

1. **Deterministic safety lives OUTSIDE the LLM.** No LLM ever decides an emergency, a medication action, an escalation level, or an access-control outcome. LLMs do language; deterministic Python does safety. Emergency and medication paths **never enter an LLM graph**.
2. **The Safety Gateway is un-bypassable.** Every user-facing output passes the 10 checks and decomposes into the **three-layer contract**: `FACT` (sourced, timestamped, confidence) / `HYPOTHESIS` (labelled "This is not a diagnosis.") / `ACTION` (concrete, safe, guideline-aligned). Output that cannot be so decomposed is blocked, hedged, or withheld — never emitted raw.
3. **Forbidden claims — the system must be *demonstrably incapable* of these:**
   - Never say an activity "heals", "reverses", or "improves" dementia.
   - Never "diagnose" or "stage" dementia.
   - Never say "dementia is progressing" for any observed change (use the Behaviour Cause-Reasoning / Clinical Change Context engine → contextualised change statement only; only a clinician converts it to a trajectory).
   - Never fabricate personal memories or generate images/audio of real people.
   - Never make autonomous medication changes or dosing advice.
   - Never take autonomous financial control.
4. **Bad data cannot raise an alarm.** The Measurement-Quality gate (`q ∈ [0,1]`) is a **precondition** to every inference. A low-`q` observation is tagged `insufficient data` and can never feed a baseline or fire an alert — it terminates the pipeline at the gate and may produce only a *measurement action* ("her hearing aid appears unused; performance data is unreliable until this is resolved"), never a cognitive signal. "Refuse to score bad data" is a tested behaviour.
5. **No single "cognitive score" is ever computed or shown to anyone.** Capability is a per-domain, uncertainty-aware vector.
6. **Provenance on every fact, and sources are ranked.** Every stored assertion about a person carries `source`, `confidence`, `verification_status`, `valid_from/valid_to`, and `visibility`. Only `verified` facts are asserted plainly; `reported`/`unverified` → hedged or withheld. **Not all sources are equally authoritative.** The order is fixed and is used to resolve contradictions:

   > person's own statement **>** clinician-verified **>** caregiver-confirmed **>** CHW-confirmed **>** structured system data **>** repeated behavioural observation **>** model inference **>** LLM hypothesis

   Two rules follow, and neither is optional. **A lower-ranked source never silently overwrites a higher-ranked one** — a conflict is *stored as a conflict*, both sides retained, and surfaced to the clinician as an open question (this is the same no-last-writer-wins rule that Horizon B sync depends on). And **a model inference or LLM hypothesis can never be promoted to a verified fact by any automated path**; only a human at `caregiver-confirmed` or above can verify one. See `tech-stack.md` §9.4.
7. **Memory Firewall — deny by default, over raw data *and* derived information.** Access is a deterministic authZ decision (role × category × purpose × consent × context), always audited. It governs two surfaces: `evaluate()` over **raw data categories**, and `project()` over **derived artefacts** — insights, reports, notifications, live access, historical access, exports, CHW packets, clinician packets. A derived artefact carries the **union** of its sources' sensitivity; it can never be more visible than its least-visible input. Never-collected categories (**raw audio/video, financial**) must not exist and are hard-denied. Live position is visible to person + primary caregiver **only during an active L4/L5 escalation**, and logged.
8. **Personalisation is grounded.** Every personal element shown in an activity must resolve to an **in-scope, verified PWM fact**. If it can't → fall back to a generic culturally-appropriate activity, request the missing info, or defer. The LLM cannot inject an ungrounded person/place/event.
9. **The Studio produces a validated Experience-Spec (structured JSON), never executable code.** LLM proposes → two deterministic validators (grounding + safety/dignity) → one of 7 pre-built engines renders it.
10. **No unrestricted online RL on this population, ever.** The CAE learning ladder (rules → supervised ranking → ethics-approved bounded bandits → safe offline RL) has no shortcuts. Research models never reach production alerting before validation gates.
11. **Human contact is a goal, not a thing to replace.** The AI is barred from substituting for people. AI-only interaction share is a *risk* indicator, not a success metric.
12. **One governed evidence base, four purpose-bound projections.** A single event NEVER produces one generic report copied to everybody. It produces a `CertifiedObservation`, and from that, separate `RoleProjection`s — each authorised, safety-gated and audited independently. Role differences are **responsibility differences, never different truths**: two projections of the same evidence may differ in detail, register and completeness, but may never contradict each other.
13. **No path from game telemetry to a clinical claim.** The only permitted chain is `RawInteractionEvent → StructuredEvent → [MQE gate] → CertifiedObservation → capability/baseline update → MeaningfulChange → ContextualisedStatement → RoleProjection → [Safety Gateway] → Delivery`. There is **no shorter path**, and none may be added. `game score → cognitive score → diagnosis` must remain structurally impossible, not merely discouraged.
14. **`NO_ACTION_REQUIRED` is a valid, first-class output.** Not every observation is an insight; not every insight is an action; not every action is an alert; not every alert is an emergency. The delivery layer's job is to *reduce* interruption. Deliberate silence is a feature, is logged, and is auditable — a suppression policy without a suppression audit is a missed-alarm generator.

When a user request conflicts with an invariant, **surface the conflict** and propose a compliant alternative. Do not silently comply, and do not silently refuse.

---

## 1.5 The central loop, and the pipeline that implements it

Everything in this repo serves one loop. Memorise its shape.

> PERSON INTERACTS → OBSERVATION → **MEASUREMENT-QUALITY CHECK** → personal-state update → experience-memory update → world-model update → contextual interpretation → change/need detection → **DETERMINISTIC SAFETY + CONSENT + MEMORY FIREWALL** → role-specific insight generation → role-specific delivery → human response/action → the system learns from the response → next personalised experience

Implemented as a **typed pipeline with hard gates**. Each arrow is a named artefact; each `[gate]` can terminate the pipeline.

```
RawInteractionEvent            (client telemetry, caregiver note, CHW visit record, clinician annotation)
  → StructuredEvent            (normalised, idempotency-keyed, appended to the event log)
  → [MQE gate: q ≥ q_min]      ─fail→ InsufficientData + optional MeasurementAction. STOP.
  → CertifiedObservation       (the ONLY artefact that may update a model)
  → model updates              PWM · PCM · Experience Memory · Personal Baseline · CAE
  → MeaningfulChange | SupportNeed | NoChange
  → ContextualisedStatement    (Clinical Change Context Engine: reversible causes first; never "progression")
  → [Firewall.project(role, purpose, consent, time)]  ─deny→ Withheld + audit. STOP.
  → RoleProjection             (person | caregiver | CHW | clinician)
  → [Safety Gateway: 10 checks + FACT/HYPOTHESIS/ACTION]  ─fail→ block | hedge | withhold. STOP.
  → DeliverableInsight
  → [Delivery Policy: class + Attention Budget]  ─suppress→ logged, digest-visible, audited. STOP.
  → Delivery → Acknowledgement → Audit → (feedback re-enters as a StructuredEvent)
```

**Delivery classes are orthogonal to the escalation ladder.** L0–L5 says what the *evidence means*; the delivery class says how it *reaches a human*. The same L3 event is `ACTION_REQUIRED` for the caregiver, `REVIEW_WHEN_CONVENIENT` for the CHW and `NO_NOTIFICATION` for the clinician.

`EMERGENCY` · `URGENT` · `ACTION_REQUIRED` · `REVIEW_WHEN_CONVENIENT` · `INFORMATIONAL` · `NO_NOTIFICATION`

L5 always fires and always bypasses the Attention Budget. That is unchanged and unweakenable.

**Five mechanisms, five clocks — never conflate them:**

| Mechanism | What moves | When |
|---|---|---|
| 1 · Data synchronisation | events, facts, observations | continuously (Horizon A: immediate; B/C: on connectivity) |
| 2 · Model synchronisation | baseline, θ, PCM, XM, CAE policy | on certified observation |
| 3 · Insight generation | projections | on meaningful change, or on schedule (daily/weekly) |
| 4 · Notification | a delivery to a human | only when the delivery class says so |
| 5 · Human escalation | L4/L5 to named humans | deterministically, budget-bypassing |

"Real-time synchronisation" means (1) and (2), not (4). A caregiver's view being up to date is not the same as a caregiver being interrupted.

---

## 2. Canonical tech stack (see `tech-stack.md` for full reasoning)

**Current horizon (A) — internet-connected, cloud AI. Build this now.**

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm (JS/TS); `uv` (or venv/pip) for Python |
| Web (first-class NOW) | Next.js App Router + React + TypeScript + Tailwind + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod |
| Mobile (FUTURE) | Expo + React Native + Expo Router + Nativewind |
| Backend | FastAPI + Pydantic v2 + SQLAlchemy 2.0 (async) + Alembic — **modular monolith** |
| Database | **Neon PostgreSQL** — relational + JSONB + edge tables (graph) + plain temporal tables + `pgvector`. **No polyglot DB at MVP.** |
| Vector | pgvector (HNSW); embeddings BGE-M3 / multilingual-e5; NE-SpeechEmbed for Tier-C |
| Object storage | Backblaze B2 — **images + text assets only** (no video/audio pipeline) |
| AI orchestration | **LangGraph** — ONE orchestrator + bounded capability modules |
| LLM | Provider abstraction (LiteLLM); frontier default; Indic/open track for residency + edge |
| Speech | Bhashini / AI4Bharat (Tier-A ASR/TTS); human-recorded voice packs (Tier-C) |
| Realtime | SSE (WebSockets deferred) |
| Jobs | Postgres-backed queue (`FOR UPDATE SKIP LOCKED`) + APScheduler (Redis/Celery deferred) |
| Auth | JWT authN (FastAPI-Users / managed) + **custom deterministic Memory-Firewall authZ** |
| Contract | Pydantic → OpenAPI → `openapi-typescript` → shared TS types (drift fails CI) |

**Do not introduce** (deferred; each needs a named trigger — see `tech-stack.md` §34): Neo4j/AGE, TimescaleDB, Qdrant, Redis, Celery, Kafka, Elasticsearch, MongoDB, microservices, Kubernetes, WebSockets, on-device inference, federated learning, wearables/IoT.

**Postgres-first rule:** if Postgres (relational + JSONB + edge tables + pgvector) can do it, use Postgres. "The conceptual model mentions a graph" is not a reason to add Neo4j.

---

## 3. The four-way intelligence taxonomy (know which layer you are in)

| Layer | What it is | Examples | Rule |
|---|---|---|---|
| **Deterministic** | Plain Python rules/arithmetic | Safety Gateway, three-layer contract, emergency, medication, geofence, escalation L0–L5, alert eligibility, MQE gate, Memory Firewall, delirium rule | Auditable, tested, **never bypassable** |
| **Classical ML** | Numeric, interpretable | baseline `z=(x−median)/(1.4826·MAD)`, θ tracking `θ←θ+K·q·(obs−exp)`, MQE score `q`, deviation composite | No LLM; unit-tested against hand-computed cases |
| **LLM** | Generation/language | dialogue, RAG synthesis, clinical compression, experience-spec generation (validated JSON), copilot explanations | Never trusted for safety; output always validated |
| **Agentic** | Orchestration | ONE LangGraph orchestrator routing bounded modules + tools | Explicit state machine, not free-form loops; not a swarm |

The 13 "agents" (A1–A13, Blueprint §14.2) are **capabilities/tools invoked by the one orchestrator**, not autonomous loops. Part II §12's **nine Studio modules** are the *generation-path subset* of that same register, consolidated — not a second agent system. One orchestrator, one capability register, two views of it.

Capabilities the orchestrator coordinates: PWM retrieval · evidence retrieval · memory retrieval · experience planning · experience generation · personalisation · cognitive-state estimation · change detection · behaviour/context reasoning · **caregiver projection · CHW projection · clinical compression · report generation · notification prioritisation**. The last five are the projection layer (`📋 SPECIFIED`); the deterministic safety, firewall and delivery decisions sit *outside* the graph and cannot be routed around.

---

## 4. Horizons — build the seams now, defer the engine

- **A (now):** online, server-side AI, Next.js web client. **This is what we build.**
- **B (offline-capable):** local replica + append-only event log + delta sync (conflict-preserving; clinical facts never last-writer-wins). **Build the seams now** (event-sourced writes, idempotency keys, entity versioning, sync-shaped API) — they're required for audit anyway.
- **C (edge):** on-device inference, local RAG, CHW encrypted sync-mule. **Future; no rewrite needed.**

Key: the **append-only audit/provenance layer we build for safety IS the event-sourcing foundation for offline sync.** One structure, two jobs. Label anything B/C as such; do not force it into A.

**Current priority is unambiguous:** a fully functional web client, a real-time backend, deep agentic orchestration, RAG, personalisation, safety, report generation and role-specific information distribution — **all server-side, online**. Do **not** spend Horizon-A complexity forcing agents, LLMs, RAG or inference to run offline.

Several design documents describe the offline core in the present tense (Solution §4/§19, Part II §34, Blueprint §26.1). Those are **Horizon B/C commitments** and are labelled as such in place. When you read "runs offline", check the horizon label before implementing.

---

## 5. Repository structure and honest build status

`✅ BUILT` = exists with tests · `🟡 PARTIAL` = exists, incomplete · `📋 SPECIFIED` = designed in the docs, **not yet implemented**. Never describe a `📋` module as if it exists.

```
mindmitra/
  apps/
    web/                     ✅ Next.js — FIRST-CLASS production web. 5 demo routes today.
    mobile/                  📋 Expo + React Native (Horizon B — README only)
  services/
    api/                     ✅ FastAPI modular monolith  ← primary backend
      app/
        core/                ✅ config (Azure + JWT + Neon, reads .env.local), async db
                                (Neon URL normalisation for asyncpg), ORM, audit sink,
                                enforce_async, record_audit_independently
        auth/                ✅ THE authorization boundary. scrypt passwords, HS256 JWT
                                (access/refresh with a `typ` claim), rotation with
                                theft detection, person-device grants. `authorize()` is
                                the only way to obtain a firewall Actor; 404-not-403.
        firewall/            ✅ Memory Firewall: deny-by-default authZ over DATA categories
                             ✅   + project() over DERIVED artefacts (invariant 7, tech-stack §19.1).
                                   Sensitivity union is implemented by re-running evaluate() per
                                   source category — one policy table, no second matrix to drift.
        safety/              ✅ Safety Gateway: 10 checks, three-layer contract, forbidden-claim registry
        cognition/           ✅ MQE (q<0.40 → insufficient_data), baseline z/MAD, θ tracking, delirium rule
        identity/            ✅ persons, actor accounts, care relationships, consent grants
        pwm/                 ✅ provenance envelope, nodes + edges, firewall-enforced fact read
        observation/         ✅ MQE-gated observation persistence, windows, deviation series
        escalation/          ✅ L0–L5 ladder, alert eligibility, feedback, and the ChangeSignal /
                                ContextualisedStatement entry to the projection spine
        behaviour/           ✅ ChangeSignal, ContextSignals, ContextualisedStatement,
                                Clinical Change Context Engine (reversible-cause triage).
                                Progression language is rejected by a model validator.
        projection/          ✅ shared EvidenceClaim set, 4 role builders, deterministic delivery
                                classifier, RoleProjection | Withheld outcomes  ← the spine
        ai/                  ✅ Azure OpenAI provider port: chat (bounded, logged without
                                content), structured generation (LLM proposes, Pydantic
                                decides), Embedder port, realtime ephemeral sessions
        rag/                 ✅ K1–K6 labelled layers, 5 lanes, deterministic planner,
                                firewall-scoped BEFORE any lane runs, fusion ranked by
                                source authority, conflict detection, completeness critic.
                                Vector lane behind the Embedder port (no deployment yet).
        orchestrator/        ✅ ONE LangGraph graph + deterministic pre-check. Emergency
                                and medication never enter the graph. Safety Gateway wraps
                                it from OUTSIDE. Grounding check rejects an answer naming
                                anyone no retrieved fact supports.
        studio/              ✅ Experience-Spec incl. the four Part II §14 measurement
                                fields; grounding + dignity validators
        intervention/        📋 library, care-plan compiler, assistance policy (tech-stack §18.2)
        sync/                📋 event log, delta endpoints, idempotency (Horizon B seams)
        api/v1/              ✅ routers: auth, cognition, companion+voice, identity, pwm,
                                escalation, projection, safety, demo — all authenticated
      tests/                 ✅ 250 passing
    worker/                  📋 background jobs (digests, baseline recompute) — shares api code
  packages/
    domain/                  ✅ @mindmitra/domain — TS types generated from OpenAPI (drift-gated)
    ui-tokens/               ✅ @mindmitra/ui-tokens — design tokens (ratified by DESIGN.md Part F)
    api-client/              📋 typed client
    core/                    📋 platform-agnostic logic (provenance, consent, eligibility)
    experience-runtime/      📋 headless spec state machine + render adapters
    config/                  📋 eslint/tsconfig/tailwind presets
  research/                  📋 SEPARATE — governed, de-identified experimentation (README only)
  infra/                     📋 docker, IaC, CI (README only)
  docs/adr/                  🟡 ADR directory (README only)
  CLAUDE.md  tech-stack.md  DESIGN.md  + the three design docs
```

Python (`services/*`) uses `uv` (or venv/pip). JS/TS uses pnpm + Turborepo. CI runs both.

**Windows note:** run `uvicorn` **without `--reload`** — the WatchFiles reloader serves stale routes here. Restart manually after backend edits.

---

## 6. Coding conventions

**Python (backend)**
- Python 3.12; type hints everywhere; `from __future__ import annotations` where helpful.
- Pydantic v2 for all DTOs and domain value objects — Pydantic models are the **single source of truth** for the API contract (→ OpenAPI → TS types).
- Pure, side-effect-free functions for all deterministic safety/policy logic (e.g. `firewall.policy.evaluate()` returns a `Decision`; the caller performs the audit write). This makes safety trivially testable.
- SQLAlchemy 2.0 async + Alembic for persistence; never raw string SQL with interpolation.
- Deny-by-default in anything authorization-related.
- Lint/format: `ruff`. Type-check: `mypy` (or `pyright`).
- Tests: `pytest`. **The deterministic safety layer is tested to exhaustion**, including the two mandatory acceptance tests: (1) volume-down / language-switch → refuses to score; (2) any "she has dementia" / diagnosis prompt → refused.

**TypeScript (web/mobile/packages)**
- Strict TypeScript. Never hand-write types that mirror the API — generate them from OpenAPI (`openapi-typescript`).
- Share **domain logic**, not the render layer, across web and future mobile.
- Zod schemas for runtime validation; reuse across form + API boundary.
- Tests: Vitest + React Testing Library; Playwright for the demo E2E flows.

**General**
- Match the style of surrounding code. Small, reviewable changes.
- Every safety-relevant decision writes to the append-only audit log.
- No secrets in code or committed files. Config via typed settings + env.
- Commit/push only when the user asks.

---

## 7. What we are building, in order

1. **Production-grade web application** (first-class product surface, demonstrates full intelligence).
2. **Fully functional backend + AI/agentic infrastructure** (orchestration, RAG, PWM, cognitive-state estimation, personalisation, safety, provenance, escalation).
3. **Clean shared domain contracts + typed APIs.**
4. **Future React Native + Expo mobile app.**
5. **Progressive offline / edge capabilities.**

**MVP scope — one canonical answer.** The authoritative MVP list is the **14 scored rows marked MVP in Blueprint §29.3**. Solution §24's "ten MVP capabilities" is the same scope *grouped for narrative*, not a different list, and Part II §35 scopes the Studio slice of it. Anything outside the 14 rows is scope creep. The **SIH 36-hour demo beats** (Blueprint §29.5 / `tech-stack.md` §35) are the near-term target; the most memorable moment is the **Measurement-Quality refusal**.

**Design scope.** `DESIGN.md` phase-tags every screen `MVP / PHASE 2 / PHASE 3 / FUTURE`. Building a `PHASE 2` screen during MVP is scope creep even if the backend supports it.

---

## 8. How to work in this repo (workflow)

- **Before creative/feature work,** clarify intent and design first (use the brainstorming discipline for genuinely open-ended features; skip it for well-specified execution).
- **Backend contract-first:** define/adjust Pydantic models → regenerate OpenAPI → regenerate TS types. Drift fails CI.
- **Safety-critical code is TDD:** write the failing test (including the red-team case) before the implementation.
- **Verify before claiming done:** run the tests and report real output. If tests fail, say so.
- **Respect the horizons:** don't build offline/edge machinery into Horizon A; build the seams and label the rest.
- **Prefer Postgres**, prefer the modular monolith, prefer ONE orchestrator, prefer pgvector — before reaching for anything on the deferred list.
- **Before any UI work, read `DESIGN.md`.** It is authoritative for screens, states, tokens and the anti-AI-slop rules. Do not improvise visual decisions.
- **Ask the projection question on every feature that produces information:** *who receives this, for what purpose, under what consent, and what is deliberately withheld from the other three roles?* A feature that cannot answer it is not designed yet.
- **Persistent memory** lives in `C:\Users\Govin\.claude\projects\c--Users-Govin-Desktop-MindMitra\memory\` (indexed by `MEMORY.md`). Update it when durable project decisions change.

---

## 9. Key references

- `tech-stack.md` — full technology architecture (40+ sections), the Evidence & Projection Pipeline (§13.2), Firewall over derived information (§19.1), delivery policy (§21.1), and decision records.
- `DESIGN.md` — the UX/UI operating system: philosophy, information architecture, the four experiences, report visual grammar, design system, accessibility, screen inventory.
- `MindMitra_PS26003_Solution.md` — Part I product/solution spec; §23 is the four-role information contract and report taxonomy.
- `MindMitra_PS26003_PartII.md` — Part II: Personal Cognitive System + Cognitive Studio; §33 is role projection from an experience episode.
- `SIH2026-PS26003-Master-Solution-Blueprint (1).md` — master blueprint + appendices A–H (problem, evidence, red team, metric dictionary).
- Project memory (`MEMORY.md` index) — distilled overview, architecture, cognitive system, studio, NER, safety, MVP, tech stack.

---

**If you remember one thing:** this system continuously learns *the person, not the disease*, and turns one governed evidence base into four purpose-bound human experiences — and it must be able to prove, in code and in tests, that it will **refuse to score bad data** and **refuse to say "she has dementia."** Everything else serves that.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
rtk uv run <cmd>        # Compact uv project command output
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->