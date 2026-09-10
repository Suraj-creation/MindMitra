# MindMitra — Part II

## Advanced Personal Cognitive Intelligence, Continual Personalisation & the Agentic Cognitive Studio

**A continuation specification for Smart India Hackathon 2026 · Problem Statement PS26003**
*AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region (NER)*
Ministry of Development of North Eastern Region (MDoNER) · Software · Theme: Space Technology

> **Relationship to Part I.** This document is the direct continuation of the definitive solution specification (Part I). It does **not** rewrite Part I; it deepens the layer that Part I called the *Adaptive Cognitive Studio* and the *Cognitive Stimulation Compiler*, and it extends the platform's model of the person from a *Personal World Model* toward a bounded *Personal Cognitive System*. All of Part I's terminology, boundaries and safety architecture — Personal World Model, provenance envelope, Measurement Integrity Engine, Personal Baseline, Meaningful-Change detection, Contextual Behaviour Support, Minimum Sufficient Assistance, Caregiver Copilot, CHW Companion, Clinical Bridge, bounded agentic orchestration, Agentic RAG, offline-first operation, tiered NER language strategy, the Memory Firewall, consent and human oversight — carry forward unchanged and are assumed, not repeated.

> **On the name.** From this part onward the platform's working name is **MindMitra** (*mitra* = companion). The naming caveat from Part I still holds: *mitra* is legible across Indo-Aryan languages but not across Khasi, Garo, Mizo, Meitei, Nyishi, Kokborok or Nagamese. MindMitra remains an internal working name; per-state names and voice personas remain a first co-design deliverable. The official SIH problem-statement title is retained throughout.

---

### Evidence and language discipline (unchanged from Part I)

Every substantive claim carries a tag: **[ESTABLISHED]** (strong evidence, in guidelines), **[PROMISING]** (real but limited/heterogeneous evidence), **[RESEARCH-STAGE]** (technically shown, not clinically validated), **[DESIGN]** (our design inference), **[HYPOTHESIS]** (a premise for the NER pilot). The forbidden claims remain forbidden: no activity "heals," "reverses" or "improves dementia"; no system "diagnoses" or "stages" dementia. Permitted framings are: *supports cognitive stimulation; supports engagement; may support specific cognitive functions; supports functional participation; may support quality of life; assists memory; supports caregivers; generates longitudinal evidence for clinicians.*

> **The line that still cannot be crossed**
> **AI perceives, models, retrieves, generates, personalises, prioritises and assists. Clinicians diagnose, prescribe and decide. The person and family retain agency.**

---

## Executive Summary

Part I established that MindMitra is not a dementia game but a personalised, longitudinal cognitive-care layer with cognitive gaming and memory assistance as its entry points. Part II asks the harder question that follows from that: **if the platform is going to sit inside a person's everyday life for months, what should it be *learning*, and how should that learning make each subsequent interaction better than the last?**

The answer developed here is that the Cognitive Studio must stop being a catalogue of games and become a **personalised cognitive interaction environment** that continuously *generates* meaningful experiences from the person's own verified world — past, present and future — while learning, interaction by interaction, how this particular person remembers, understands, learns, acts, participates and responds to assistance. To do that safely, the platform's internal representation of the person must grow from the single Personal World Model of Part I into five coherent, interlocking models:

| Model | Question it answers | New in Part II? |
|---|---|---|
| **Personal World Model (PWM)** | What exists in this person's world? | Carried from Part I, extended with future/goal entities |
| **Personal Capability Model (PCM)** | What can this person currently do, understand, remember and accomplish — under which conditions? | **New** — replaces "one score" with a conditioned, uncertainty-aware capability estimate |
| **Experience Memory (XM)** | What actually happened when this person interacted, and what worked? | **New** — an episodic store of interaction outcomes, distinct from the event log and the medical record |
| **Goal & Intention Model (GIM)** | What is this person trying to accomplish? | **New** — moves the system from monitoring toward goal-directed assistance |
| **Continual Adaptation Engine (CAE)** | What has the platform learned about how to help *this* person better? | **New** — the personal intervention policy that closes the loop |

These are not five databases; they are one cognitive architecture. Part I's operating loop (*understand → engage → … → update world model*) is generalised into a **Personal Cognitive Loop** — *perceive → interpret → model → estimate state → understand goal → predict support need → select intervention → act → observe → learn → update world, capability and policy → continue* — wrapped at every step by safety, consent, dignity, uncertainty, provenance and human oversight.

On top of this architecture, Part II specifies the **Agentic Cognitive Studio**: a set of bounded capability modules behind one policy-aware orchestrator that turn the five models into a *grounded, generated* cognitive activity. The design's central safety decision is that **the platform never generates a game as free-form executable content**. Instead, a language model produces a **structured activity specification** against a fixed **Grounded Personal Game Contract**; that specification is validated for factuality, provenance, consent, safety and dignity; and only then is it rendered by a small set of deterministic, pre-built game engines. Personalisation lives in the *content, context, difficulty, modality, assistance, temporality, culture and goal* bound into a safe template — never in unrestricted generation.

The document then does the work the problem statement actually needs. It consolidates the proposed 40-activity list into a small set of reusable **cognitive primitives**; assembles a comprehensive, evidence-graded **catalogue**; scores candidates through a transparent **weighted selection matrix**; and selects exactly **ten activities for the MVP**, each specified in full (33 attributes) and each chosen because MindMitra can *actually generate it from data the platform already holds*. Traceability tables then map every game to the problem it addresses, the personal data it consumes, the agents that build it, the cognitive domain it exercises, and the evidence that justifies it.

The honest scientific position is stated throughout: personalised, life-integrated, generated cognitive experiences are a **[PROMISING]/[HYPOTHESIS]** proposition, not an established therapy. The evidence supports cognitive stimulation, reminiscence, spaced retrieval, errorless learning, goal-oriented rehabilitation and meaningful activity as *supports* for cognition, function, engagement and quality of life — with heterogeneous effect sizes and almost no data generated in NER languages or contexts. MindMitra is therefore framed as two things at once: **a real-world application that helps today**, and **a longitudinal cognitive-interaction laboratory** capable of generating the evidence the field is missing — without ever letting the research ambition erode the clinical and product safety boundary.

---

## 1. Why the Cognitive Studio Must Evolve

Part I already rejected the "library of translated puzzles" and replaced it with a Cognitive Stimulation Compiler. Part II argues that even a compiler is not enough, for three reasons that emerge only once the platform has been in a person's life for weeks.

**First, a fixed catalogue cannot honour "no same game all the time" without becoming random.** A person who opens the Studio every day will exhaust a fixed set quickly. The naïve fix — shuffle the deck — produces novelty without meaning, which is the opposite of what dementia engagement needs: apathy in dementia responds to *interest and familiarity*, not to surprise. The platform needs a way to keep the *cognitive objective* constant while continually renewing the *experience* from the person's own life. That requires generation, not selection.

**Second, a catalogue treats every session as independent, discarding the most valuable thing the platform produces: knowledge of what works for this person.** If visual cues help this person recall and auditory cues do not, if mornings are strong and evenings are fatigued, if family content drives participation and abstract puzzles drive refusal — a catalogue learns none of it. Each session should make the next one better. That requires an explicit memory of interaction outcomes and a policy that consumes it.

**Third, a catalogue is anchored in the past.** Most dementia software over-invests in reminiscence and under-invests in the two temporal frames that actually govern daily independence: the **present** (what is happening today, who is here, what must be done) and the **future** (the appointment this afternoon, the visitor tomorrow, the festival next week). Prospective-memory failure — forgetting to *do* a thing later — is one of the most disabling and most digitally tractable deficits in early and moderate dementia, and external memory aids have solid evidence for supporting it [ESTABLISHED — external memory aids and combination interventions preserve prospective memory in daily life; systematic review/meta-analysis, R31]. A studio that only looks backward cannot help a person prepare for their daughter's visit.

The evolution, then, is from a *content compiler* to a *cognitive interaction environment* that (a) generates renewed experiences from verified personal data, (b) remembers what happened and learns from it, and (c) works across past, present and future. Everything in Part II serves those three moves, under the safety architecture of Part I.

> **INPUT → PROCESS → OUTPUT → FEEDBACK (the shape of every section that follows)**
> Every architectural component in this document is specified as: what goes in (data, context, consent), what transforms it (model, agent, retrieval, deterministic logic), what comes out (a bounded, provenance-carrying artefact), and what feeds back (into the world, capability and policy models).

---

## 2. From Personal World Model to Personal Cognitive System

Part I's Personal World Model answered *"what exists in this person's world?"* — identity, relationships, places, routines, memories, preferences. That is necessary but not sufficient for a system that wants to *help a person act*, because knowing what exists says nothing about what the person can currently *do* with it, what happened last time the system tried to help, or what the person is trying to accomplish right now.

A **Personal Cognitive System** is the minimal set of models that lets a bounded assistant reason about helping a specific person, plus the engine that improves that reasoning over time. It is deliberately *not* a model of the disease and *not* a simulation of a brain. It is a model of a person's observable functioning, held with explicit uncertainty and provenance.

```
                         THE PERSONAL COGNITIVE SYSTEM
                    (one architecture, five interlocking models)

   ┌─────────────────────────── GOAL & INTENTION MODEL ───────────────────────────┐
   │           "What is this person trying / wanting to accomplish?"               │
   └───────────────────────────────────┬──────────────────────────────────────────┘
                                        │ frames
                                        ▼
   ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
   │  PERSONAL WORLD MODEL │   │ PERSONAL CAPABILITY   │   │   EXPERIENCE MEMORY   │
   │  what EXISTS in the   │   │ MODEL                 │   │  what HAPPENED when   │
   │  person's world       │◄─►│ what the person CAN   │◄─►│  we interacted, and   │
   │  (people, places,     │   │ currently DO, under   │   │  what WORKED          │
   │  events, media,       │   │  which conditions     │   │  (episodic outcomes)  │
   │  routines, culture)   │   │  (conditioned, ±unc.) │   │                       │
   └───────────┬───────────┘   └───────────┬──────────┘   └───────────┬──────────┘
               │                           │                          │
               └───────────────┬──────────┴───────────┬──────────────┘
                               ▼                       ▼
                    ┌───────────────────────────────────────────┐
                    │        CONTINUAL ADAPTATION ENGINE          │
                    │  "what have we learned about how to help    │
                    │   THIS person better?" (personal policy)    │
                    └───────────────────────────────────────────┘
        ── surrounded at every step by ──
        SAFETY · CONSENT · DIGNITY · UNCERTAINTY · PROVENANCE · HUMAN OVERSIGHT
```

**Why this matters.** These five models are what separate "a good dementia app" from a system that gets better at helping one particular human being. The World Model tells us *what matters* to the person; the Capability Model tells us *what they can do with it today*; Experience Memory tells us *what happened last time*; the Goal & Intention Model tells us *what they are reaching for*; and the Continual Adaptation Engine turns all of it into *a better next intervention*. Crucially, each model is separately governed: the Memory Firewall scopes the World Model, Measurement Integrity gates what may enter the Capability Model, and a strict provenance rule keeps Experience Memory from ever hardening an inference into a clinical fact.

The product's conceptual maturation runs: **dementia app → memory assistant → personalised cognitive-care platform → Personal Cognitive System → longitudinal research platform for continual, developmental artificial cognition.** Each stage is a superset of the last, and — this is the essential discipline — *no stage changes the safety boundary*. The research ambition of the final stage is realised entirely through richer models and better-grounded generation, never through greater autonomy over medical decisions.

---

## 3. Personal World Model (extended)

**Why.** The World Model is the ground truth from which every generated experience draws. Its Part I job — dignity, correct address, relationship-aware retrieval, orientation, reminiscence — is unchanged. Part II adds the requirement that it also hold **present and future** entities, because a studio that generates from past-only data cannot build present- or future-oriented experiences.

**What (extension).** Part I's domains (identity, biography, relationships, places, routines, preferences, function, cognition, culture, care context, dynamic state) are extended with an explicit temporal partition of entities:

| Temporal frame | Example entities | Primary source | Freshness |
|---|---|---|---|
| **Past** | autobiographical events, childhood, occupation, hometown, life-story photos, songs | family upload, person, CHW | stable |
| **Present** | today's routine, who is here now, recent events (this week), current environment, current tasks | routine model, caregiver, device context | hours–days |
| **Future** | appointments, expected visitors, upcoming festivals, planned trips, clinician-authored medication schedule, tomorrow's tasks, stated goals | calendar, caregiver, clinician, Goal & Intention Model | days–weeks |

**How / Data / Provenance.** Every entity keeps the Part I provenance envelope (source, timestamp, validity interval, confidence, verification status, visibility). Future entities add a **valid-until** and an **event-status** field (`expected`, `confirmed`, `occurred`, `cancelled`) so a generated "prepare for Rina's visit" experience automatically stands down when the visit's status flips to `occurred` or `cancelled`. This is the same temporal-correctness mechanism that stops a stopped medication being surfaced as current — applied to generation.

**Safety / Failure mode.** The dominant failure is a stale or unverified entity driving a confident personal prompt ("Your son is visiting today" when he is not). Mitigation: generation may only bind entities whose verification status and freshness meet the game's contract (§14); an entity that fails the check is dropped, and if too few remain, the studio degrades to a generic culturally-appropriate activity rather than fabricating (§11, §15).

**Output.** A consent-scoped, temporally-partitioned graph of verified entities and media that the retrieval planner can query by frame, domain, relationship, recency and confidence.

---

## 4. Personal Capability Model (new)

**Why.** "Executive function = 72" is close to useless for choosing what to do with a person this afternoon. What a bounded assistant actually needs is a **conditioned** estimate: what can this person do, understand, remember and accomplish, *under which conditions* (time of day, fatigue, modality, environment, assistance level, familiarity), *with what uncertainty*, *observed when*, and *trending how*. This is the difference between a score and a usable model of functioning, and it is directly aligned with the goal-oriented, functional-cognition tradition rather than the psychometric one [ESTABLISHED — goal-oriented cognitive rehabilitation improves attainment of personally meaningful everyday goals in early-stage dementia without necessarily changing standard cognitive scores; GREAT RCT, R32].

**What.** The PCM represents capability across a spectrum of domains, and — critically — never collapses them into one number:

```
CAPABILITY DIMENSIONS (each held as: estimate ± uncertainty, conditions, evidence, last-observed, trend)

  memory:      recognition · cued recall · free recall · working memory · associative
  attention:   sustained · selective · divided
  language:    naming · comprehension · fluency · conversation
  executive:   sequencing · planning · categorisation · initiation · task-switching
  spatial:     orientation (time/place) · route/navigation
  social:      relationship recognition · social reasoning · turn-taking
  functional:  task initiation · task completion · ADL/IADL assistance level
  prospective: remembering to do a thing later
  modality-dependence: which input/output channels help or hinder THIS person
```

**Representation, by example.** A PCM entry is a conditioned statement, not a scalar:

> *"Can complete tea preparation independently in the familiar kitchen; usually needs one initiation cue after a poor night; recognition of close family from photographs is reliable, free recall of names is not; visual + relationship cues raise recall; performance in noisy rooms drops sharply."*
> — evidence: 14 sessions + 2 CHW visits · confidence: moderate · last observed: 3 days ago · trend: stable · condition tags: {familiar-environment, morning, low-noise}

**How / Model.** Each dimension is updated by a lightweight, on-device estimator (a per-domain ability update with a measurement-quality weight, exactly as Part I's difficulty targeting — low-quality trials barely move the estimate). Condition tags are attached to every observation so the model can answer *conditional* queries ("what is her attention like in the evening?") rather than only marginal ones. The PCM is fed by three streams: structured activity telemetry (§31), caregiver/CHW observation, and clinician annotation (highest authority, rarest).

**Safety.** The Measurement Integrity Engine is the gatekeeper: an observation that fails audibility/visibility/language-match/fatigue/coaching/identity checks is tagged and excluded from capability updates. The PCM is explicitly **not** a cognitive test score, **not** a stage, and **not** a diagnosis, and it is never shown to the person as a number. Its clinician-facing form is the conditioned, provenance-carrying statement above.

**Failure modes.** (a) Over-confidence from too few observations → uncertainty is surfaced and the studio widens tolerance during the cold-start window (Part I). (b) Condition confounding (a bad day read as decline) → condition tags + persistence requirement. (c) Drift → periodic clinician-agreement re-checks.

**Output.** For the studio: "given today's conditions, what can she likely do, and at what difficulty and scaffolding?" For the caregiver/clinician: a plain-language capability profile with uncertainty and trend.

---

## 5. Experience Memory (new)

**Why.** The single most wasteful thing a longitudinal system can do is forget what happened last time it tried to help. Experience Memory (XM) is the platform's episodic record of *interaction outcomes* — not scores, but what the interaction was, what assistance was given, how the person responded, whether it was measured trustworthily, and what it implies for next time. It is the substrate the Continual Adaptation Engine learns from.

**What an episode contains.**

```
EXPERIENCE EPISODE
  context:        time, environment, who present, fatigue, recent events, temporal frame
  activity:       game/primitive, cognitive objective, content bound, difficulty, modality
  assistance:     scaffolding level used, cues offered, which cue helped
  response:       recognition/recall success, latency, hesitation, abandonment, help requests
  engagement:     initiation (voluntary?), affect signal, completion, refusal
  measurement:    integrity score + reasons (was it trustworthy?)
  human feedback: caregiver/CHW note ("positive mood after"), clinician annotation
  implication:    a learned hint, e.g. "visual relational cues effective; voice-only less so"
```

**Worked example.**

> *18 Aug, 16:40, familiar room, daughter present, moderate fatigue. Personal Memory Match, objective = family recognition, bound to {granddaughter, daughter, neighbour}, difficulty = recognition, modality = photo+voice. Free recall of the granddaughter's name failed; recognition succeeded after a visual relationship cue; voice-only cue did not help. Engagement high, voluntarily initiated, caregiver reported positive mood after. Measurement integrity high. Implication: visual relational cues effective for this person; prefer recognition-before-recall for names.*

**How it differs from neighbouring stores (this distinction is load-bearing).**

| Store | Holds | Authority | Example |
|---|---|---|---|
| **Event log** | raw, append-only system events | mechanical | "session_start 16:40; tap; tap; session_end 16:52" |
| **Personal memory (in PWM)** | facts about the person's life | verified facts | "Rina is her daughter" |
| **Medical record / Clinical Bridge** | clinician-owned clinical data | clinical | "MMSE administered 12 Jun" |
| **Personal Baseline** | statistical norms *for this person* | derived statistics | "repetition rate 1–2/day is normal for her" |
| **Personal Capability Model** | conditioned ability estimates | derived, uncertainty-aware | "needs one initiation cue after poor sleep" |
| **Experience Memory** | episodic outcomes of *interactions* + learned hints | derived, provenance-tagged | "visual relational cues helped recall on 18 Aug" |

**Safety.** XM stores *interaction* observations and *design* hints; it may never assert a clinical conclusion. A hint is a `[DESIGN]`/`[HYPOTHESIS]`-tier object consumed by the studio, not a `[clinical]` fact. XM entries inherit the person's consent scope and are subject to the Memory Firewall like any other data.

**Output.** A queryable episodic memory ("what worked for family-recognition activities in the last month?") plus aggregated hints that feed the Continual Adaptation Engine (§7).

---

## 6. Goal & Intention Model (new)

**Why.** A monitoring system waits for problems; an *assistive* system helps a person do what they are trying to do. Goal-oriented cognitive rehabilitation is one of the best-evidenced functional interventions in early dementia precisely because it works on *personally meaningful goals* rather than abstract cognition [ESTABLISHED — GREAT RCT, R32]. The Goal & Intention Model (GIM) gives MindMitra a first-class representation of what the person wants — from a moment's intention ("I want to call my daughter") to a standing goal ("keep making my own tea," "keep going to church").

**What.**

```
GOAL / INTENTION
  statement:     the goal in the person's words, in their language
  scope:         momentary intention | daily goal | standing goal
  source:        person-stated | caregiver-stated | inferred-from-routine (labelled)
  status:        active | supported | at-risk | achieved | paused
  required capabilities:  which PCM dimensions it draws on
  safety class:  everyday | needs-supervision | needs-clinical-input
```

**How the system reasons.**

```
GOAL ("I want to prepare tea")
   → required capabilities (executive sequencing, initiation, safe stove use)
   → current capability (PCM: independent in familiar kitchen; one initiation cue after poor sleep)
   → assistance required (a single "what comes next?" cue, not takeover)
   → safe plan (guided steps only if a step fails; caregiver alerted only on a safety condition)
   → support delivered → outcome observed → XM + PCM updated
```

**Safety.** The GIM only *supports* goals; it never overrides refusal, never sets a clinical target, and never authorises an unsafe plan. Goals with a `needs-clinical-input` class (e.g., driving) are routed to the human pathways from Part I, never actioned by the studio. Inferred goals are always labelled as inferred and confirmed with the person or caregiver before they drive assistance.

**Output.** For the studio: goal-framed activities (the strongest kind — see §18, §22). For the caregiver: a shared view of what the person is working toward, which is itself a dignity and coordination win.

---

## 7. Continual Adaptation Engine (new)

**Why.** The four models above are static without something that *learns from them across time*. The Continual Adaptation Engine (CAE) is the **personal intervention policy**: it consumes Experience Memory and the Capability Model and decides, for this person, which cognitive objectives to prioritise, which content and modality to use, what difficulty to target, and how to scaffold — and it improves those decisions as evidence accrues.

**What it learns (illustrative, per person).**

```
  visual cue        → better recall            (from XM aggregation)
  music             → higher engagement
  voice-only        → lower performance in noisy environments
  morning           → stronger attention
  evening           → higher fatigue → shorter, calmer sessions
  family context    → higher participation
  abstract puzzles  → higher refusal → deprioritise
```

**How — the staged learning path (this is a critical safety decision).** The platform does **not** start with autonomous reinforcement learning on a vulnerable population. It climbs a ladder, and each rung must be justified and validated before the next:

| Phase | Method | When | Why not sooner |
|---|---|---|---|
| **1** | Deterministic rules + clinician/designer-defined policy + per-person statistics (what she has accepted and succeeded at) | **MVP** | Nothing else is defensible before measurement reliability exists |
| **2** | Supervised ranking / preference models over a whitelisted action set | Phase 2, once ~8–12 weeks of quality-gated data exist | Needs enough trustworthy per-person data |
| **3** | Contextual bandits with clinician-set no-go contexts, bounded exploration | Phase 3, research protocol, ethics-approved | Requires interpretable action space + safety monitoring |
| **4** | Safe *offline* RL / constrained policy optimisation from logged data only | Phase 4, research only, if justified by evidence | Online exploration on vulnerable people is not acceptable |

> **Hard rule (carried from Part I, restated for the CAE):** no unrestricted online reinforcement learning on this population, in any phase, under any framing. Exploration is bounded to a whitelisted, clinically-vetted action set; every exploratory choice is logged and reviewable; the objective function rewards meaningful engagement, independence, wellbeing, human connection and caregiver capacity, and **penalises** risk, intrusiveness and caregiver attention consumed — so the system is structurally discouraged from over-assisting or over-alerting.

**Safety / Failure modes.** (a) Over-fitting to a fatigued week → persistence and recency weighting; caregiver "this was an unusual week" feedback. (b) Reinforcing avoidance (only ever offering the easiest thing) → the objective rewards *appropriate challenge* (the 75–85% success band from Part I), not success rate alone. (c) Drift into a narrow content rut → an explicit *renewal* term (§8, §17) that values progressive personalisation.

**Output.** A per-person policy the studio queries as: "for her, now, given her goals and today's conditions, what is the best next cognitive objective, content, difficulty, modality and scaffolding?"

---

## 8. The Personal Cognitive Loop

Part I's loop was *understand → engage → assist → observe → certify measurement → learn baseline → detect change → contextualise → support → inform human → human action → update world model*. Part II generalises it into a loop that also updates capability and policy, and that reasons about goals and predicted support need:

```
   ┌────────────────────────── HUMAN OVERSIGHT ───────────────────────────┐
   │  SAFETY · CONSENT · DIGNITY · UNCERTAINTY · PROVENANCE (every step)   │
   │                                                                      │
   │   PERCEIVE ─► INTERPRET ─► MODEL ─► ESTIMATE CURRENT STATE            │
   │   (inputs)    (meaning)   (5 models)  (capability × context)         │
   │       ▲                                     │                        │
   │       │                                     ▼                        │
   │   UPDATE POLICY ◄─ UPDATE CAPABILITY ◄─ UNDERSTAND GOAL / INTENTION   │
   │   (CAE)            (PCM)                     │                        │
   │       ▲                                     ▼                        │
   │   UPDATE WORLD ◄── LEARN ◄── OBSERVE     PREDICT SUPPORT NEED         │
   │   MODEL (PWM+XM)   (XM)      OUTCOME         │                        │
   │       ▲                        ▲            ▼                        │
   │       └──────────── ACT / ASSIST ◄── SELECT INTERVENTION ◄───────────┘
   │                    (deterministic renderer)  (grounded generation)   │
   └──────────────────────────────────────────────────────────────────────┘
                              ↺  CONTINUE
```

**Reading the loop.** The platform *perceives* interaction and context, *interprets* it into meaning (this tap is a correct recognition; this pause is hesitation, not disengagement), *models* it into the five representations, *estimates the current state* as capability conditioned on context, *understands the active goal*, *predicts* how much and what kind of support is needed, *selects* an intervention via the personal policy, *acts* by rendering a grounded activity, *observes* the outcome, *learns* an episode, and *updates* the world, capability and policy models — then continues. Two new arrows distinguish it from Part I: the loop now explicitly **understands goals** before selecting, and it **updates three models** (world, capability, policy) rather than one.

**Why this architecture matters.** It makes the platform's improvement *legible and bounded*. Every update has a provenance and a scope; every prediction carries uncertainty; every action is a validated, deterministic render of a grounded specification; and every learning step is governed by a policy whose objective is meaningful independence, not engagement. The loop is what lets MindMitra become genuinely personal over months without becoming autonomous over medicine.

---

## 9. The Cognitive Studio as a Personalised Interaction Environment

The Studio is redefined from *"a collection of dementia games"* to *"a personalised cognitive interaction environment that dynamically generates meaningful cognitive experiences from the person's actual world, history, present context and future intentions."*

The reframe changes the unit of design. The unit is no longer a *game*; it is a **cognitive objective** (e.g., *support cued recall of close family*) that can be realised through many *experiences*, each generated by binding the person's verified content, present context and future goals into a safe template at an appropriate difficulty and modality. "Personal Memory Match" is not one game — for one person it is *match grandchildren to their names*; for another, *match old photographs to hometown places*; for another, *match tools to the trades they were used in*. Same cognitive primitive; entirely different, personally meaningful experience.

```
                         COGNITIVE STUDIO (interaction environment)
                                      │
                          ┌───────────┴───────────┐
                          │   COGNITIVE OBJECTIVE   │  (the design unit)
                          └───────────┬───────────┘
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   PERSONAL CONTENT             PRESENT CONTEXT              FUTURE / GOAL
   (verified, consented)        (today, fatigue, who's here) (visit, festival, task)
   people · photos · music      routine · time · environment  appointment · intention
   biography · occupation                                     prospective memory
          └───────────────────────────┼───────────────────────────┘
                                      ▼
                    GROUNDED, GENERATED PERSONAL EXPERIENCE
                                      ▼
                          MEASUREMENT INTEGRITY (gate)
                                      ▼
                       INTERACTION  →  ADAPTIVE ASSISTANCE
                                      ▼
                    EXPERIENCE MEMORY · CAPABILITY · POLICY UPDATE
```

The output of any interaction is never a bare score. It is an **experience episode** with performance-in-context, measurement integrity, assistance used, engagement and a learned implication — the raw material of longitudinal evidence and continual personalisation.

---

## 10. Static vs Parametric vs Generative Games — and why we choose the middle

A central design decision is *how much* of a game is generated. There are four points on the spectrum, and the safest, most defensible choice is **not** the most generative one.

| Model | What varies | Safety | Personal meaning | Verdict |
|---|---|---|---|---|
| **A. Fixed static games** | nothing | highest | lowest — generic content, repetition-blind | Insufficient (Part I's rejected "catalogue") |
| **B. Parametrically personalised** | content slots filled from personal data; difficulty | high | moderate–high | **Core of MVP** |
| **C. Dynamically generated** | template + content + context + modality + difficulty assembled per session | moderate (needs strong validation) | high | **MVP, tightly bounded** |
| **D. Fully generative (LLM invents the game)** | the entire game, rules and content | low — factuality, safety, dignity, reproducibility all at risk | high but unreliable | **Rejected for the person-facing path** |

**Our direction:** *safe game templates + dynamic personal content + controlled generation + strict validation.* The intelligence sits in **choosing and binding**, not in inventing rules. A template such as *"match a person to their relationship"* with dynamic content (the verified family graph), dynamic modality (photo + voice), and dynamic difficulty (recognition → association → recall) is far safer than asking a model to invent a whole game, and loses almost nothing in personal meaning.

**Why fully-generative is rejected for the person-facing path.** A person with dementia cannot detect when a generated game has an incoherent rule, a false personal claim, or a subtly distressing frame. Fully-generative output is hard to make factual, hard to make reproducible, hard to audit, and hard to keep dignified. The failure cost lands on the most vulnerable user. Generation is therefore constrained to producing a **structured specification** that a validator can check and a deterministic engine can render — never free-form content or code shipped to the person (§15, §16).

---

## 11. Grounded Personal Game Generation

The defining rule of the Studio: **a generated activity may never state or imply a personal fact it cannot trace to a verified source.** Personalisation without grounding is fabrication, and fabricated personal content in dementia care is an identity harm.

**The grounding rule, operationally.** Every personal element a generated activity displays — a photo used as "your granddaughter," a relationship asserted, an event referenced, a place named — must resolve to a Personal World Model entity whose provenance envelope satisfies the game's contract (verification status, confidence, freshness, consent scope). If it cannot:

```
INSUFFICIENT TRUSTWORTHY INFORMATION → the generator does NOT fabricate. It:
  1. falls back to a generic but culturally-appropriate activity (same objective, non-personal content), or
  2. requests the missing information through an authorised workflow (caregiver/CHW verification), or
  3. defers generation and offers a different objective for which grounded content exists.
```

**Worked example of the guardrail.** The studio wants to build a family-recognition activity but the person has only three uploaded photos and one is unverified (`verification_status: reported`, no confirming caregiver). The generator uses only the two verified photos, sets difficulty to recognition (not free recall, which the sparse graph cannot safely support), and — rather than inventing a fourth face — pads with neutral non-personal distractors drawn from a culturally-appropriate generic set clearly not claimed as the person's own. If even two verified photos did not exist, it would switch to a generic culture/festival match and quietly raise a caregiver task: "add and confirm a few family photos to unlock personal memory activities."

This is why grounded generation is *safer* than a static catalogue as well as more meaningful: the catalogue cannot tell a verified fact from an unverified one, so it either shows nothing personal or risks showing something wrong. Grounded generation makes the distinction structural.

---

## 12. The Agentic Cognitive Studio Architecture

Following Part I, the Studio is **one policy-aware orchestrator + bounded capability modules + a deterministic safety/policy engine + multi-modal retrieval + the five personal models.** The agents are *mechanisms*, not the cognitive architecture. We resist proliferating agents for sophistication's sake: the twenty candidate capabilities the brief lists are **consolidated into nine bounded modules** plus the orchestrator and the deterministic engine.

> **One register, two views (canonical, per `CLAUDE.md` §3).** These nine modules are **not a second agent system**. They are the *generation-path subset* of the single capability register the one orchestrator coordinates — the same register that Blueprint §14.2 lists as A1–A13 for the whole platform. Studio module 1 (Intent & Goal Planner) is the generation-path face of the Cognitive Coach capability; module 2 (Personal Context Retriever) is the studio's use of the shared PWM-retrieval and RAG capabilities; the write-side module 9 is Measurement Integrity + Experience-Memory + Capability, which the rest of the platform also reads. There is **one orchestrator and one capability register**; "nine modules" and "A1–A13" are two views of it, not two systems. The projection builders (caregiver, CHW, clinical, person) are further capabilities in the same register (§33), invoked *after* the studio's write-side module produces a certified episode.

| # | Module | Responsibility | Key inputs | Outputs | Tools / retrieval | Forbidden actions | Offline? |
|---|---|---|---|---|---|---|---|
| **O** | **Studio Orchestrator** | Sequence modules under policy; enforce the contract; own the runtime | request, GIM, PCM, CAE policy | a validated activity spec, or a safe fallback | policy engine | bypass a validator; ship unvalidated content | yes (rule-driven) |
| **1** | **Cognitive Intent & Goal Planner** | Turn a request + goals + state into a cognitive/functional objective and duration | GIM, PCM, recent XM, CAE | objective, target difficulty band, session budget | — | choose an objective the PCM says is unsafe/too hard | yes |
| **2** | **Personal Context Retriever** | Assemble consent-scoped content across frames (past/present/future) | PWM, temporal store, Memory Firewall | candidate entities + provenance | graph · temporal · vector · media retrieval | retrieve out-of-scope data; cross the Firewall | yes (cached) |
| **3** | **Personalisation Compiler** | Bind objective + content + modality + culture into a template spec | objective, entities, PCM, culture ontology | draft activity spec (DSL/JSON) | template library | fill a slot with unverified data | yes |
| **4** | **Difficulty & Scaffolding Engine** | Set target difficulty (75–85% band) and the assistance ladder | PCM, XM, fatigue | difficulty + scaffolding policy in the spec | ability estimator | remove the graceful-exit / no-shame guarantees | yes |
| **5** | **Cultural Localisation Module** | Apply language tier, honorifics, local references (person-specific first) | culture ontology, person culture, language tier | localised strings, asset choices | Bhashini/AIKosh assets, recorded packs | apply regional stereotype over personal data | yes (packs) |
| **6** | **Grounding & Provenance Validator** | Verify every personal claim traces to a verified source at required confidence | draft spec, PWM provenance | pass / fail + reasons | provenance checker | approve an ungrounded personal claim | yes |
| **7** | **Safety & Dignity Validator** | Enforce no-shame/no-test framing, sensitive-content exclusion, safety constraints | draft spec, sensitive flags | pass / fail + reasons | Safety Gateway rules | approve distressing/undignified framing | yes |
| **8** | **Deterministic Game Renderer** | Render the validated spec via a pre-built engine; capture interaction events | validated spec | rendered activity + event stream | fixed game engines | execute model-authored code; render an unvalidated spec | yes |
| **9** | **Measurement, Experience & Capability Writer** | Compute measurement integrity; write the episode; update PCM/CAE | event stream, context | XM episode, PCM/CAE updates, caregiver summary line | integrity engine, model updaters | write an inference as a clinical fact | yes |

**Why these and not twenty.** Retrieval sub-types (graph/temporal/vector/media) are *tools of module 2*, not separate agents. Evidence/clinical-rationale retrieval is a Part I Agentic-RAG capability the orchestrator calls when a caregiver/clinician asks *why* an activity is offered — it is not in the person-facing generation path. Measurement Integrity, Experience-Memory writing and Capability updating are one write-side module (9) because they share the same event stream and must be transactional. Consolidation reduces the attack surface, the audit burden and the number of places a personal fact could leak or be fabricated.

**The two validators are non-negotiable and deterministic.** Modules 6 and 7 sit between generation and rendering. A spec that fails either is never rendered; it is repaired (drop the offending element) or replaced by a fallback. No language model can override them.

---

## 13. The Personal Game Generation Pipeline

Every generated activity flows through one pipeline. Each stage is bounded, logged and reversible.

```
 USER REQUEST ("Let's do something" / a goal / a scheduled prompt)
   │
 1 INTENT UNDERSTANDING ....... what does the person want? (module 1 + GIM)
 2 CURRENT STATE ............... capability × today's conditions (PCM)
 3 GOAL / PURPOSE .............. active goal & cognitive objective (module 1)
 4 PWM RETRIEVAL ............... candidate entities across past/present/future (module 2)
 5 CAPABILITY CHECK ............ is the objective safe & in-band for her now? (PCM)
 6 EXPERIENCE MEMORY ........... what worked before for this objective? (XM → CAE)
 7 RECENT CONTEXT .............. fatigue, last session, time of day
 8 CONSENT / MEMORY FIREWALL ... scope-filter BEFORE any binding (Firewall)
 9 RETRIEVAL PLANNER ........... choose graph/temporal/vector/media queries (module 2)
10 EVIDENCE / FACT VALIDATION .. keep only verified, fresh, in-scope entities (module 6)
11 CONTENT SELECTION ........... pick the specific items to use (modules 1+3)
12 COGNITIVE OBJECTIVE LOCK .... finalise objective + measured constructs
13 GAME TEMPLATE SELECTION ..... choose a safe template that fits (module 3)
14 PERSONALISATION COMPILER .... bind content/culture/modality into a spec (modules 3+5)
15 DIFFICULTY / SCAFFOLDING .... set 75–85% target + assistance ladder (module 4)
16 MULTIMODAL GENERATION ....... assemble prompts, images, audio into the spec
17 SAFETY VALIDATION ........... dignity, sensitive-content, safety (module 7)
18 FACTUALITY / PROVENANCE ..... every personal claim traced to source (module 6)
19 DIGNITY VALIDATION .......... no-shame/no-test framing confirmed (module 7)
20 RENDER ...................... deterministic engine renders the spec (module 8)
21 INTERACTION ................. person plays; events captured
22 MEASUREMENT INTEGRITY ....... was this trustworthy? (module 9)
23 OUTCOME CAPTURE ............. performance-in-context, assistance, engagement
24 EXPERIENCE MEMORY .......... write the episode (module 9)
25 CAPABILITY MODEL UPDATE ..... conditioned, quality-weighted (module 9)
26 PERSONALISATION POLICY UPDATE learned hint → CAE (module 9)
```

Stages 8, 10, 17, 18, 19 are **hard gates**: failure at any of them stops the person-facing render and triggers repair-or-fallback (§11). Stages 22–26 are the learning tail that makes the next generation better — the part a static catalogue lacks entirely.

---

## 14. The Grounded Personal Game Contract

Generation is governed by an explicit contract. The input constrains what the generator may use; the output records what it produced and how it is scoped. Nothing outside the contract may appear in a person-facing activity.

```
GAME_CONTEXT (input to generation)
{
  person_id,
  cognitive_goal,                 // e.g. "cued recall of close family"
  functional_goal,                // e.g. "prepare for daughter's visit"  (nullable)
  allowed_memory_scope,           // Memory Firewall: which memories are visible for this purpose/role
  allowed_media_scope,            // which photos/audio may be shown
  verified_entities[],            // only verification_status ∈ {verified} (or reported+confirming source)
  verified_relationships[],
  temporal_context,               // past | present | future frame(s) in play
  current_state,                  // capability × conditions snapshot (PCM)
  capability_state,               // per-domain estimates ± uncertainty
  preferred_language + tier,
  cultural_context,               // person-specific first, then community ontology
  sensory_constraints,            // audio/visual/motor
  previous_activity_history,      // from XM: content/difficulty/modality already used, what worked
  desired_duration,
  target_difficulty,              // 75–85% success band
  safety_constraints              // sensitive flags, no-go content, refusal state
}

GAME_OUTPUT (validated specification — NOT code)
{
  activity_definition,            // template id + parameters (a DSL/JSON spec)
  content_sources[],              // every displayed personal element → source entity + provenance
  cognitive_target,               // measured constructs
  functional_target,              // if any
  difficulty,
  scaffolding_policy,             // the assistance ladder for this session
  modality,                       // photo/voice/touch/audio, per person
  expected_observation_types[],   // what this experience is expected to observe
                                  //   (e.g. recognition_success, recall_latency, cue_effectiveness)
                                  //   — declared UP FRONT so measurement is designed, not scavenged
  measurement_plan,               // which observations feed the MQE, which conditions are tagged,
                                  //   what q_min applies, and which constructs may update the PCM
  stop_decline_behaviour,         // exactly what happens if the person stops, declines, or fails:
                                  //   graceful exit · never a penalty · always ends on a success ·
                                  //   refusal honoured · no re-ask in-session
  post_experience_interpretation_rules,  // how the resulting episode may and may NOT be read:
                                  //   e.g. "a miss in the wrong language is never anomia";
                                  //   "this updates capability only, never a clinical fact"
  safety_metadata,                // dignity + sensitive-content clearance
  provenance,                     // signed record of what was used and why
  consent_scope,                  // audience/visibility
  expiry                          // e.g. a "prepare for the visit" activity expires when the visit occurs
}
```

**The contract makes three failures structurally impossible.** (1) *Fabrication*: `content_sources[]` must map every personal element to a verified source; a spec with an unsourced personal claim fails validation. (2) *Scope violation*: `allowed_memory_scope`/`allowed_media_scope` come from the Memory Firewall and are applied before binding, so out-of-scope data is never even a candidate. (3) *Staleness*: `expiry` and the entity `valid-until` fields retire time-bound experiences automatically.

**The four measurement fields are what make an activity a *Cognitive Experience* rather than a game.** By declaring `expected_observation_types[]`, a `measurement_plan`, a `stop_decline_behaviour` and `post_experience_interpretation_rules` *before* the person interacts, the spec commits in advance to what may be observed, how trustworthy it must be, what a stop means, and — critically — how the resulting episode may and may not be interpreted. Measurement is therefore designed into the experience, not reverse-engineered from telemetry afterwards. This is the first link in the game→clinical firewall of §32: the interpretation rules travel with the spec, so an episode can never be read as something the experience was not designed to measure.

> **Canonical vocabulary (per `CLAUDE.md` §0.3).** The unit of design is the **Cognitive Experience** — this validated spec; a *game* is only the **renderer** that draws it. The system name for the spec is **Experience-Spec** (`app/studio/spec.py`); *Cognitive Experience* is its product name. They are one artefact. Do not name new activities "game X".

**Traceability, concretely.** If the person sees a photo labelled implicitly as "your granddaughter," the output's `content_sources[]` contains `{entity: person:anu-daughter-child, media: photo_8817, source: caregiver:rina, verification_status: verified, last_verified: 2026-08-20}`. If a photo cannot be confidently identified, the activity does not assert an identity for it; if a relationship is uncertain, it is not stated as fact; if no appropriate personal information exists, none is invented.

---

## 15. Game Runtime Architecture

The runtime enforces the single most important technical-safety decision in Part II: **the system never generates arbitrary executable code into the client.** A language model produces a *structured activity specification* (a constrained DSL / JSON schema); a deterministic validator checks it; a small set of pre-built, audited game engines render it.

```
 Game Request
   → Orchestrator builds GAME_CONTEXT (Firewall-scoped)
   → Generation produces a candidate SPEC (DSL/JSON)          ← LLM confined to structured output
   → Grounding + Provenance Validator (module 6)   ── fail ─► repair or fallback (§11)
   → Safety + Dignity Validator (module 7)         ── fail ─► repair or fallback
   → Schema Validator (is this a well-formed, renderable spec for a KNOWN engine?)
   → Deterministic Renderer (module 8) instantiates a pre-built engine with the spec
   → Person interacts; events captured
   → Measurement Integrity evaluates trustworthiness
   → Adaptive assistance policy responds within the session
   → Experience episode stored; PCM + CAE updated
```

**Properties the runtime guarantees.**

| Property | How |
|---|---|
| **Versioned** | every spec carries the template version, engine version, model version and content hashes |
| **Reproducible** | a spec + the same content re-renders identically; specs are stored, not just outcomes |
| **Auditable** | the signed provenance record answers "why did she see this, and where did each fact come from?" |
| **Cancellable** | any activity is skippable at any moment with no penalty and no shame |
| **Safe** | no model-authored code executes; only known engines run; two deterministic validators gate rendering |
| **Privacy-scoped** | the spec cannot reference data outside its consent scope, by construction |
| **Testable** | engines and templates have their own test suites; specs can be replayed against them offline |
| **Evaluable** | every render produces a measurement-integrity-gated episode for §38's evaluation framework |

**Engine set (small and fixed for MVP).** A handful of deterministic engines cover the Top 10: a *matching/pairing engine*, a *sequencing/ordering engine*, a *selection/odd-one-out engine*, a *naming/recognition engine*, a *timeline engine*, a *guided-task engine*, and a *conversation/reminiscence engine*. New activities are new *specs and templates* for these engines, not new code — which is what keeps "no same game all the time" cheap and safe.

---

## 16. (Runtime, continued) Why structured-spec generation is the safety keystone

It is worth stating plainly why this architecture is chosen over the tempting alternative of "let the model make a game."

- **Factuality is checkable.** A spec's personal claims are discrete fields that a validator can trace to sources. Free-form generated content is not mechanically checkable at the clause level for a non-technical, cognitively-impaired user.
- **Behaviour is bounded.** A deterministic engine cannot surprise the person with an emergent, undignified or unsafe interaction; a model-authored interactive experience can.
- **Failure is graceful.** If a spec fails validation, the fallback path is clean (generic activity / request info / defer). A failed free-form generation has no clean fallback.
- **The learning loop stays clean.** Because every activity is a known template + known constructs, the outcomes are comparable across sessions and people — which is what makes Experience Memory, the Capability Model and the evaluation framework meaningful. Fully-generative games would make every episode incommensurable.

The model's intelligence is fully used — in understanding intent, choosing objectives, selecting and binding content, phrasing prompts in the person's language and register, and adapting difficulty — but always *inside the rails* of a validated specification.

---

## 17. Personalisation Dimensions — personalisation is not random content

"Personalised" must not degrade into "random." MindMitra personalises along **nine distinct dimensions**, each independently controlled, so that the same cognitive objective can be delivered in the right way for the right person at the right moment.

| Dimension | What it varies | Example |
|---|---|---|
| **Content** | which verified entities are used | granddaughter's photo vs hometown market vs old work tools |
| **Difficulty** | recognition → association → cued recall → free recall | show name choices vs ask the name unaided |
| **Modality** | input/output channel | photo + voice vs touch-only vs audio-first |
| **Context** | the framing situation | "who is visiting today?" vs "who is in this old photo?" |
| **Assistance** | scaffolding level and cue type | a visual relationship cue vs a verbal cue vs partial reveal |
| **Temporal** | past / present / future frame | reminisce vs orient to today vs prepare for tomorrow |
| **Cultural** | language, honorifics, local references | Bihu vs Khasi hymn; *Aitâ* vs *Kong* |
| **Goal** | the personal purpose it serves | "prepare to call your daughter" vs abstract practice |
| **Social** | solo vs dyadic/caregiver-mediated | play alone vs with a visiting grandchild |

**Deep personalisation, by example.** Same underlying task — *recognise a person* — realised as: **content** = granddaughter; **modality** = photo + voice; **difficulty** = recognition; **context** = *she is visiting today*; **assistance** = visual relationship cue ready; **temporal** = present + future; **goal** = *prepare for her visit*; **social** = solo now, dyadic when she arrives. That is a personally meaningful cognitive-life experience, not a puzzle — and every one of those nine choices is a logged, bounded decision, not a random draw.

**Progressive personalisation vs novelty (the key distinction the brief demands).** Novelty is change for its own sake. *Progressive personalisation* keeps the cognitive objective constant while renewing content, context, difficulty and modality along a meaningful trajectory:

```
Week 1  Match family photos                         (recognition, past)
Week 2  Match family members to their relationship  (association, past)
Week 3  Who usually visits on Tuesday?              (association + present routine)
Week 4  Prepare for Rina's visit                    (present + future, goal-framed)
Week 5  Tell the story behind this photograph       (narrative + reminiscence)
```

Same underlying memory/association capability, continually renewed and gently progressed — not five unrelated games. The Continual Adaptation Engine chooses the next step from Experience Memory (what worked) and the Capability Model (what is now in-band), with an explicit renewal term so the studio neither ruts nor thrashes.

---

## 18. Difficulty, Scaffolding, and Past / Present / Future Experiences

**Difficulty** targets the Part I success band of **75–85%** — high enough to protect dignity and self-efficacy, low enough to stimulate, stable enough to be a usable longitudinal signal. Difficulty is a *dimension of the spec*, adapted within a session (a run of hesitations lowers it; a run of easy successes raises it) and across sessions (via the Capability Model), and it is expressed as a progression of *cognitive demand*, not a "hard/easy" label the person ever sees: **recognition → cued recall → association → free recall**, or for tasks, **recognise a step → order the steps → initiate the sequence → complete unaided**.

**Scaffolding** implements Part I's Minimum Sufficient Assistance as an in-activity ladder, and it is grounded in two well-evidenced learning principles:

- **Errorless learning** — prevent errors during learning rather than let the person guess and fail, because people with dementia can encode their own errors. Errorless approaches are superior to trial-and-error for practical-skill and knowledge learning in dementia and rehabilitation [ESTABLISHED — RCTs incl. skill-learning and ADL relearning (REDALI-DEM); R33]. In the Studio this means: cue *before* the person can err, reveal enough context to make success likely, and never present a bare "wrong."
- **Spaced retrieval** — re-present a to-be-remembered item at expanding intervals to strengthen recall. Spaced retrieval supports learning and longer-term recall in mild-to-moderate cognitive impairment and Alzheimer's disease [PROMISING/[ESTABLISHED] for specific memory targets — systematic review/meta-analysis and algorithmic pilots; R34]. In the Studio this schedules *when* a name or fact re-appears across sessions, not just within one.

```
SCAFFOLDING LADDER (per activity, lowest sufficient level first)
  0  independent            → no cue
  1  contextual cue         → show the relationship/setting ("this is at the Bihu festival…")
  2  modality shift         → add voice to photo, or picture to word
  3  narrowed choice        → recognition among 2 instead of free recall
  4  partial reveal         → first sound / first letter / half the photo
  5  full support + success  → complete it together, always ending on success
  → escalate only on observed need; de-escalate as capability returns
  → never: "wrong", red X, timers shown, scores shown, comparison to others
```

**Past / Present / Future as first-class experience design.** Most dementia software lives in the past. MindMitra deliberately spans three temporal frames, because the present and future are where daily independence is won or lost:

| Frame | Cognitive function supported | Example experience | Evidence anchor |
|---|---|---|---|
| **Past** | autobiographical & semantic memory, identity, mood | Reminiscence Journey; Music Memory; My Life Timeline | reminiscence [PROMISING], music [PROMISING] |
| **Present** | orientation, recognition, working memory | Yesterday/Today/Tomorrow; Who Is Here Today? | reality orientation woven gently [PROMISING] |
| **Future** | prospective memory, planning, goal-directed action | What Comes Next?; Prepare-For (a visit/appointment/festival) | prospective-memory aids [ESTABLISHED]; goal-oriented rehab [ESTABLISHED] |

**A single experience that spans all three (the signature of the Studio):**

> **Past** — a verified photo of her daughter Rina.
> **Present** — Rina is visiting this afternoon (a `confirmed` future→present event).
> **Future** — prepare for the visit.
>
> The generated experience: *"Do you remember who is visiting today?"* → recognise Rina (photo + voice) → recall the relationship (cued if needed) → *"She usually comes after tea — shall we get the cups ready?"* (a light functional-sequencing step) → *"Would you like to call her before she leaves home?"* (a prospective, goal-framed action). One activity braids recognition, orientation, sequencing and prospective memory into a meaningful slice of the person's actual day — not a puzzle.

---

## 19. Evidence-Based Cognitive Activity Framework

Before cataloguing activities, we fix the science and the claims. The table separates *mechanisms* (what the activity does cognitively), *evidence strength*, and the *permitted product claim*. This is the discipline that keeps an ambitious studio honest.

| Approach / mechanism | What the evidence says | Tier | Permitted MindMitra claim |
|---|---|---|---|
| **Cognitive Stimulation Therapy (CST)** | NICE recommends group CST for mild–moderate dementia; benefits on cognition, communication, QoL; digital CST promising but heterogeneous | **[ESTABLISHED]** (group) → **[PROMISING]** (digital) | supports cognitive stimulation and engagement; not a cure |
| **Reminiscence therapy** | Cochrane review: effects generally small and vary by modality/setting; some benefit to QoL, cognition, communication, mood; individual and multi-sensory formats matter | **[PROMISING]** (heterogeneous) | supports autobiographical engagement, mood, connection |
| **Reality orientation** | classic component of CST; supports time/place orientation when woven gently, not quizzed | **[PROMISING]** | supports orientation; delivered without testing/shaming |
| **Errorless learning** | superior to trial-and-error for skills and specific knowledge in dementia/rehab (RCTs) | **[ESTABLISHED]** (for targeted learning) | supports learning of names/steps without reinforcing errors |
| **Spaced retrieval** | supports learning and longer-term recall of specific targets in MCI/AD | **[PROMISING]→[ESTABLISHED]** (targeted) | supports retention of chosen names/facts |
| **Montessori-based activities** | RCTs: reduced agitation, improved engagement and affect; culturally adaptable; deliverable by family carers | **[PROMISING]** | supports engagement, affect, meaningful activity |
| **Music-based intervention** | meta-analysis: reduces agitation (moderate effect); melody memory often preserved | **[PROMISING]** | supports mood regulation and engagement |
| **Cognitive rehabilitation (goal-oriented)** | GREAT RCT: improves attainment of personally meaningful everyday goals; standard cognitive scores unchanged | **[ESTABLISHED]** (goal attainment) | supports personally meaningful functional goals |
| **Prospective-memory / external aids** | systematic review/meta-analysis: external aids and combinations preserve prospective memory in daily life | **[ESTABLISHED]** | supports remembering to do things later |
| **Serious games / computerised cognitive training** | 2024–25 meta-analyses: benefits on cognition/attention in MCI/mild dementia, heterogeneous; tablet delivery tends to do better | **[PROMISING]** | supports specific cognitive functions; effects vary |
| **Personalised / individualised meaningful activity** | valued by people and carers; evidence heterogeneous; note: *generic* content can also elicit engagement (a genuine counterpoint) | **[PROMISING]/[HYPOTHESIS]** | supports meaning and engagement; superiority to generic is a pilot question |

**Two honest conflicts, stated explicitly (as the brief requires).**

1. **Personalised vs generic content.** We hypothesise that personally-grounded content improves engagement, comprehension and measurement validity, and the meaningful-activity literature is broadly supportive [PROMISING]. But there is a real counter-signal: studies show *generic* video and materials can also elicit conversational language and engagement, and personalisation adds onboarding cost and a fabrication risk. We therefore treat "personalised beats generic" as a **[HYPOTHESIS]** to be tested head-to-head in the NER pilot (§39), not an assumption — and we keep a generic culturally-appropriate fallback that is good on its own merits, not a degraded mode.
2. **Cognitive training vs functional benefit.** Computerised cognitive training can move trained-task and some cognitive scores [PROMISING], but transfer to everyday function is weak and inconsistent, whereas goal-oriented rehabilitation improves *function* without moving cognitive scores [ESTABLISHED]. We resolve this by prioritising **functional and goal-framed activities** in the Top 10 and treating pure cognitive-training gains as a secondary, clearly-bounded claim — never as evidence of "improvement in dementia."

---

## 20. Comprehensive Game & Activity Catalogue

The proposed 40-activity list is a useful *reference*, but building 40 separate games is the wrong move: most of them are the same handful of cognitive operations wearing different content. The correct abstraction is a small set of **reusable cognitive primitives**, each realised as many generated experiences. We first consolidate, then present the exhaustive catalogue for coverage.

### 20.1 Consolidation — 40 activities → 8 primitive families → ~7 engines

```
FAMILY (cognitive objective)        PRIMITIVE OPERATION            RENDER ENGINE
────────────────────────────        ──────────────────            ─────────────
1 Recognition & Recall (memory)     match / recall an entity      matching + naming
2 Relationship & Social Reasoning   associate entity ↔ relation   matching + conversation
3 Autobiographical Sequencing       order events in time          timeline + sequencing
4 Orientation (time/place)          place self in today/here      selection + timeline
5 Prospective & Functional          order/complete a task, prepare guided-task + sequencing
6 Attention & Discrimination        find / compare / spot change  selection + matching
7 Language & Naming                 name / associate / complete   naming + conversation
8 Reminiscence & Social Engagement  narrate / converse / reminisce conversation/reminiscence
```

Deduplication examples: *Personal Memory Match, Pairs, Familiar Faces, Photo Memories, Name–Place–Person* are all **Recognition & Recall** over different entity types; *What Comes Next?, Everyday Planning, Grocery/Kitchen Game, Daily Routine Builder, Making Tea* are all **Prospective & Functional** sequencing; *Object Hunt, Find the Difference, What's Missing?, Remember the Tray* are all **Attention & Discrimination** with a working-memory load. Merging these removes redundancy while *increasing* variety, because each family generates endless experiences from personal content.

**Improved / removed / added.**
- *Improved:* "Who Is Who?" → **Relationship Reasoning** (recognition → relationship → context), grounded strictly in the verified family graph.
- *Removed / demoted:* free "True or Familiar?" as a person-facing game — deliberately introducing *incorrect* information to a person who cannot reliably reject it risks seeding a false memory; retained only as an internal caregiver-verification workflow, never as a person-facing quiz.
- *Added:* explicit **future/goal-framed** activities ("Prepare-For"), **caregiver-mediated social** activities (family-contributed prompts — strong Montessori/family-carer evidence), and **functional-cognition** activities (real ADL/IADL sequences), which the reference list under-weighted.

### 20.2 The exhaustive catalogue

Terse by design (coverage, not depth). *Data* = personal data required; *Gen* = agentic-generation potential (H/M/L); *Ev* = evidence tier (E=established, P=promising, R=research-stage, Hy=hypothesis). Family numbers refer to §20.1.

| # | Activity | Problem addressed | Domain (family) | Data needed | Personalisation | Core interaction | Why it may help | Ev | Stage | Modality | Gen | Key safety note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Personal Memory Match | recall of familiar people/objects/places | memory (1) | verified photos/entities | whose photos, which places | match photo↔name/relation | recognition/recall support; errorless+spaced | P | all | photo+voice | H | no unverified faces; no shame |
| 2 | Relationship Reasoning (Who Is Who?) | relationship recognition | memory/social (2) | family graph + photos | which relatives | "who is this? how related?" | social recognition; identity | P | early–mod | photo+voice | H | verified relations only |
| 3 | My Life Timeline | autobiographical sequencing | memory (3) | dated life events + photos | which life period | order events on a timeline | autobiographical engagement | P | early–mod | photo+touch | H | exclude sensitive events by default |
| 4 | Yesterday/Today/Tomorrow | temporal disorientation | orientation (4) | calendar, recent/upcoming events | actual events | place events in time | reality orientation, gentle | P | all | voice+photo | H | never quiz/shame; support not test |
| 5 | Prepare-For (visit/appt/festival) | prospective memory, planning | prospective/functional (5) | future events, goals, routine | the actual upcoming event | recognise → plan → act | prospective-memory aid; goal rehab | E | early–mod | voice+photo | H | only clinician-authored med steps |
| 6 | Sequence-a-Task (tea/market/dress) | executive sequencing, ADL | functional (5) | routine, occupation, objects | the person's real task | order/complete real steps | errorless functional relearning | E/P | all | voice+demo | H | no unsafe real-action prompts |
| 7 | Name & Find (naming + attention) | word retrieval, selective attention | language/attention (6,7) | familiar objects/occupation | which objects | name it / find it among distractors | naming; sustained attention | P | all | photo+voice | H | culturally real objects only |
| 8 | Reminiscence Journey | autobiographical recall, mood | reminiscence (8) | photos, music, stories, places | their life & music | navigate life via media | reminiscence; music for mood | P | all | photo+music+voice | H | sensitive-content flags honoured |
| 9 | Festival & Culture Match | cultural familiarity, semantic memory | reminiscence/semantic (8,1) | community + personal culture | their festivals/food/music | match cultural items | orientation + identity + engagement | P | all | photo+audio | H | personal culture ≠ regional stereotype |
| 10 | Conversation & Story Circle | social engagement, language | language/social (8) | biography, family contributions | their topics, family voices | prompted conversation/storytelling | Montessori/family-mediated CST | P | all | voice | M | family-contributed content verified |
| 11 | Pairs / Concentration | associative memory | memory (1) | familiar images | familiar themes | flip & match pairs | associative memory | P | all | touch | H | end on success |
| 12 | Remember the Tray | working memory | attention (6) | familiar objects | their objects | recall shown items | short-term/working memory | P | early–mod | photo | H | small set; no timer shown |
| 13 | What's Missing? | working memory + attention | attention (6) | familiar scene | their scene | spot the removed item | visual working memory | P | early–mod | photo | H | familiar scenes only |
| 14 | Odd One Out | categorisation, reasoning | executive (5) | familiar categories | their categories | pick the item that doesn't fit | categorisation | P | early–mod | photo+touch | M | avoid ambiguous items |
| 15 | Sort It Out | categorisation, organisation | executive (5) | household/market items | their items | group into categories | executive organisation | P | all | touch | M | culturally correct categories |
| 16 | Find the Difference | visual discrimination, attention | attention (6) | any two scenes | familiar scenes | spot differences | selective attention | P | early–mod | photo | M | not too dense/fatiguing |
| 17 | Object Hunt | selective/sustained attention | attention (6) | familiar objects | their objects | find requested items | attention | P | all | photo+voice | H | fatigue-aware |
| 18 | Name That Object | naming | language (7) | familiar objects | their objects | name via voice/choice | word retrieval | P | all | photo+voice | H | accept dialect/synonyms |
| 19 | Word Association | semantic association | language (7) | cultural/personal vocab | their vocabulary | connect related words | semantic access | P | early–mod | voice | M | culturally familiar pairs |
| 20 | Complete the Sentence/Saying | language production | language (7) | local sayings, biography | their sayings | finish familiar phrases | language production | P | all | voice | M | truly familiar sayings only |
| 21 | Music Memory | reminiscence, engagement, mood | reminiscence (8) | songs tied to memories | their music | recognise song → memory | music for mood/agitation | P | all | audio+voice | H | avoid grief-linked songs by default |
| 22 | Story Builder / Sequence Pictures | sequencing, narrative | executive/language (3,7) | event images | their events | order images into a story | sequencing + narrative | P | early–mod | photo+voice | M | coherent, non-distressing sets |
| 23 | Where Am I / Where Next? | spatial orientation | orientation (4) | landmarks, routes | their village/home | match places/routes | orientation; safe-return rehearsal | P | early–mod | photo | M | doubles as safe-return practice |
| 24 | Route Builder | spatial planning, navigation | orientation/executive (4,5) | familiar routes | their routes | build a route between places | spatial planning | P | early | photo+touch | M | never "route-lock" the person |
| 25 | Daily Routine Builder | routine memory, sequencing | functional (5) | their routine | their actual routine | reconstruct morning/evening | routine scaffolding | P | all | voice+photo | H | reflects, not dictates, routine |
| 26 | Occupation Memory | identity, procedural/semantic memory | reminiscence/functional (8,5) | occupation, tools, skills | their trade | activities from their work life | role identity; procedural memory | P | all | photo+voice | H | dignity of lost role |
| 27 | Emotion in the Story | social cognition | social (2) | simple scenes | familiar contexts | read emotional context | social interpretation | R/P | early–mod | photo+voice | M | avoid distressing scenes |
| 28 | Conversation Cards | spontaneous conversation | language/social (8) | biography, interests | their life topics | personalised prompts | social engagement | P | all | voice | M | never interrogate |
| 29 | Family Story Circle | isolation + autobiographical | social (8) | family-contributed stories | family voices/photos | family-seeded prompts | social + reminiscence | P | all | voice+photo | M | contributions verified & consented |
| 30 | Memory Garden (calming activity) | need for calm engagement | integrated (8) | preferences | their calm imagery | tend a simple familiar scene | low-arousal engagement | R/Hy | mod–adv | touch | M | purely calming; no failure states |
| 31 | Listen & Remember | auditory attention/memory | attention/memory (6,1) | short familiar audio | their content | answer after listening | auditory attention | P | early–mod | audio+voice | M | quiet-environment gating |
| 32 | Daily Choices | initiation, meaningful choice | executive (5) | preferences, routine | their options | pick from a few options | supports initiation (apathy) | P | all | photo+voice | H | 2–3 options max |
| 33 | My Day Challenge (integrated) | integrate multiple functions | integrated (all) | routine + people + events | their whole day | orient→recall→plan→act chain | life-integrated cognition | Hy | early–mod | mixed | M | short; end on success |

New high-value additions beyond the reference list are rows **5, 6, 10, 25, 26, 29, 32** (future/goal, functional, caregiver-mediated, routine, occupation, family-social, initiation-for-apathy) — the ones that move the studio from "brain games" toward cognitive-life support and that the platform can most readily generate from data it already holds.

---

## 21. Game Selection Methodology

The Top 10 is chosen by a transparent weighted matrix, **not** by how fun an activity sounds. Two filters run first, then a weighted score.

**Hard filters (a candidate must pass both).**
1. **Data-groundedness** — MindMitra can realistically generate it from data the platform already collects or can collect through an authorised workflow. (An activity we cannot ground is not a candidate, however appealing.)
2. **Safety & dignity** — it can be delivered with no shame, no test framing, no fabrication, and no unsafe real-world action.

**Weighted criteria (17, normalised).** Weights reflect the platform's actual objectives: data-groundedness, daily-life usefulness, personalisation and safety are weighted above novelty and multimodality.

| # | Criterion | Weight | # | Criterion | Weight |
|---|---|---|---|---|---|
| C1 | Relevance to core dementia problems | 10 | C10 | Offline feasibility | 6 |
| C2 | Evidence support | 9 | C11 | Cultural adaptability (NER) | 7 |
| C3 | Personalisation potential | 8 | C12 | Multimodal potential | 4 |
| C4 | Availability of personal data | 9 | C13 | Longitudinal learning value | 8 |
| C5 | Generatable from existing DB | 9 | C14 | Caregiver value | 6 |
| C6 | Usefulness for daily life | 9 | C15 | Novelty of experience generation | 4 |
| C7 | Meaningful engagement | 7 | C16 | Uses past/present/future context | 7 |
| C8 | Safety | 10 | C17 | Works via bounded agentic orchestration | 6 |
| C9 | Technical feasibility | 7 | | **(weights sum = 132)** | |

**Scoring.** Each candidate family is scored 1–5 on each criterion; the weighted total is `Σ(weight × score)`, max = 132 × 5 = 660. The matrix below shows the composite and the highest-leverage sub-scores (C1 problems, C2 evidence, C4 data, C5 generatable, C6 daily-life, C8 safety, C16 past/present/future); full per-criterion scores are maintained in the build sheet.

| Candidate family / activity | C1 | C2 | C4 | C5 | C6 | C8 | C16 | Weighted total | Rank |
|---|---|---|---|---|---|---|---|---|---|
| Prepare-For (prospective + functional + goal) | 5 | 5 | 4 | 4 | 5 | 4 | 5 | **596** | 1 |
| Personal Memory Match (recognition→recall) | 5 | 4 | 5 | 5 | 4 | 4 | 3 | **585** | 2 |
| Sequence-a-Task (functional ADL) | 5 | 5 | 4 | 4 | 5 | 4 | 4 | **584** | 3 |
| Yesterday/Today/Tomorrow (orientation) | 5 | 4 | 5 | 5 | 5 | 5 | 5 | **582** | 4 |
| Relationship Reasoning (Who Is Who?) | 4 | 4 | 5 | 5 | 4 | 4 | 3 | **556** | 5 |
| Reminiscence Journey (photo+music+story) | 4 | 4 | 4 | 4 | 4 | 4 | 3 | **548** | 6 |
| Daily Routine Builder | 4 | 4 | 5 | 5 | 5 | 4 | 4 | **546** | 7 |
| Name & Find (naming + attention) | 4 | 4 | 4 | 5 | 3 | 5 | 2 | **528** | 8 |
| Festival & Culture Match (NER) | 4 | 3 | 4 | 4 | 3 | 5 | 4 | **520** | 9 |
| Conversation & Story Circle (caregiver-mediated) | 4 | 4 | 4 | 4 | 4 | 4 | 3 | **518** | 10 |
| My Life Timeline | 4 | 4 | 4 | 4 | 3 | 4 | 3 | 505 | 11 |
| Music Memory (standalone) | 4 | 4 | 3 | 4 | 3 | 4 | 2 | 486 | 12 |
| Sort It Out / Odd One Out (executive) | 3 | 4 | 4 | 5 | 3 | 5 | 2 | 470 | 13 |
| Attention suite (hunt/difference/tray) | 3 | 4 | 4 | 5 | 2 | 5 | 2 | 452 | 14 |
| Route Builder | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 405 | 15 |
| Memory Garden (calming) | 2 | 2 | 3 | 4 | 2 | 5 | 1 | 360 | 16 |

**The Top 10 (for MVP):** Prepare-For, Personal Memory Match, Sequence-a-Task, Yesterday/Today/Tomorrow, Relationship Reasoning, Reminiscence Journey, Daily Routine Builder, Name & Find, Festival & Culture Match, Conversation & Story Circle.

**Why the ranking looks like this.** The activities that rise are the ones that (a) the platform can *ground from data it already holds* (photos, family graph, routine, calendar, culture ontology), (b) support *daily-life function* rather than abstract cognition, (c) span *past/present/future*, and (d) carry defensible evidence. Pure attention/executive puzzles (rows 13–14) are safe and generatable but score lower on daily-life usefulness and past/present/future span, so they enter as *difficulty variants and warm-ups inside* the Top 10 engines rather than as standalone MVP headliners. The calming "Memory Garden" is deferred: appealing but weakly evidenced and low on core-problem relevance.

---

## 22. The Top 10 MVP Activities — overview

Ten activities, chosen because MindMitra can generate each from data it already holds, each maps to a real dementia problem, each is safe and dignified, and together they span memory, orientation, language, executive/functional cognition, reminiscence and social engagement across past, present and future. They are realised by the seven deterministic engines of §15, so "no same game all the time" is achieved by generating new specs, not new code.

| # | Activity | Primary problem | Family | Temporal frame | Render engine | Data it needs |
|---|---|---|---|---|---|---|
| 1 | **Prepare-For** | prospective memory, planning, goal support | prospective/functional | present + future | guided-task + sequencing | future events, routine, goals |
| 2 | **Personal Memory Match** | recall/recognition of familiar people | recognition & recall | past (+present) | matching + naming | verified photos, family graph |
| 3 | **Sequence-a-Task** | executive sequencing, ADL independence | functional | present | guided-task + sequencing | routine, occupation, objects |
| 4 | **Yesterday / Today / Tomorrow** | temporal disorientation | orientation | past + present + future | selection + timeline | calendar, recent/upcoming events |
| 5 | **Relationship Reasoning** | relationship recognition, social memory | recognition & social | past (+present) | matching + conversation | verified family relationship graph |
| 6 | **Reminiscence Journey** | autobiographical recall, mood, engagement | reminiscence | past | conversation/reminiscence + timeline | photos, music, stories, places |
| 7 | **Daily Routine Builder** | routine memory, sequencing, initiation | functional | present | sequencing | the person's actual routine |
| 8 | **Name & Find** | word retrieval + selective attention | language + attention | present | naming + selection | familiar/occupational objects |
| 9 | **Festival & Culture Match** | cultural familiarity, orientation, identity | reminiscence/semantic | past (+present) | matching | community + personal culture |
| 10 | **Conversation & Story Circle** | social engagement, language, isolation | language + social | past (+present) | conversation/reminiscence | biography, family contributions |

Each specification below covers all 33 required attributes. Attribute 1 (**Prepare-For**) is written at full depth as the exemplar; the rest are complete but tighter.

---

## 23. Detailed Specification of the Top 10

### 23.1 — Prepare-For  *(the signature life-integrated activity)*

**1. Name.** Prepare-For (a visit / an appointment / a festival / a task).
**2. Problem.** Prospective-memory failure — forgetting to *do* things later — and difficulty planning multi-step future actions, which together break daily independence and drive caregiver load.
**3. Why it matters.** Prospective memory is among the earliest and most disabling failures in dementia, and it is the one most amenable to external support; missed appointments, unpreparedness for a visitor and skipped steps erode confidence and increase supervision. Helping a person *prepare* is both a cognitive exercise and a real-world win.
**4. Cognitive/functional domain.** Prospective memory; executive planning/sequencing; orientation; goal-directed action.
**5. Scientific rationale.** External memory aids and combination interventions preserve prospective memory in daily life; goal-oriented cognitive rehabilitation improves attainment of personally meaningful everyday goals. Prepare-For fuses both: a concrete personal goal ("be ready for Rina's visit") supported by structured cueing and light sequencing.
**6. Evidence.** [ESTABLISHED] for external prospective-memory aids (systematic review/meta-analysis, R31); [ESTABLISHED] for goal-oriented rehabilitation on goal attainment (GREAT RCT, R32). Claim is confined to *supporting prospective memory and personally meaningful goals* — never "improving dementia."
**7. Target population / use context.** Early-to-moderate stage; used ahead of a real upcoming event; often lightly caregiver-supported.

| Attr | Prepare-For |
|---|---|
| **8. Required personal data** | one `confirmed`/`expected` future event (visit/appointment/festival/task) with time; the person's routine |
| **9. Optional personal data** | the visitor's verified photo & relationship; transport plan; a stated goal from the GIM; clinician-authored medication schedule (display-only) |
| **10. How data is retrieved** | temporal store (events by frame + `event-status`), routine model, GIM; media via consented photo store |
| **11. Agentic orchestration** | O→1 (goal/objective) →2 (retrieve event+routine+visitor) →3 (bind template) →4 (difficulty) →6+7 (validate) →8 (render) →9 (write) |
| **12. RAG strategy** | structured + temporal retrieval for the event and routine; graph retrieval for the visitor relationship; **no** medical corpus in the person path (medication steps are display-only, clinician-authored) |

**13. Generation pipeline.** Objective = *support prospective memory for a specific upcoming event*. Retrieve the nearest `confirmed` future event within the person's horizon; if none exists, fall back to a present-orientation activity (do not fabricate an event). Bind the event, the person's routine around it, and (if verified) the visitor's photo into the guided-task template; set difficulty by how much of the plan the person assembles unaided.
**14. Game template.** *Recognise the upcoming event → recall its details (who, when) → order the small preparation steps → optionally trigger a real prospective action (a reminder, a call).*
**15. Personalisation logic.** Content = the person's real event; context = present→future; goal = the person's own ("be ready for her"); modality per PCM; cultural framing (a festival's real customs). Progressive personalisation: week-to-week the same objective attaches to different real events.
**16. Difficulty adaptation.** recognition ("is someone coming today?") → cued recall ("who?") → free recall of details → independent step-ordering → independent initiation of the real action. Target 75–85%.
**17. Scaffolding.** contextual cue (photo of the visitor) → narrowed choice → partial reveal ("she usually comes after…") → complete together. Errorless: cue before error.
**18. Modalities.** voice-first + photo; touch for step-ordering; optional real reminder set at the end.

**19. Example gameplay.**
```
System: "Good afternoon, Aitâ. Something nice today — do you remember who is visiting?"
Person: "…is someone coming?"                          [recognition cue needed]
System: (shows Rina's photo) "This lady is coming after tea. Do you know her?"
Person: "Rina! My daughter."                            [cued recall success]
System: "Yes — Rina, your daughter. Shall we get ready? What might we do first?"
Person: "…make tea?"
System: "Good idea. Shall I remind you when she is leaving home, so the tea is fresh?"
Person: "Yes."
System: "Done. I'll tell you when she sets off."         [real prospective action set]
```
**20. Success/failure handling.** Success → warm acknowledgement + the real reminder is set (the tangible win). Struggle → drop to recognition, reveal the visitor context, never "wrong"; if the person is uninterested, respect refusal and offer later.
**21. What is measured.** recognition vs cued vs free recall of the event; steps ordered unaided; whether the real action was accepted; latency; engagement; affect.
**22. Measurement Integrity.** gate on audibility/language/fatigue; a distracted or mis-heard session is tagged low-integrity and excluded from capability updates (but the *reminder still gets set* — assistance is never withheld for measurement reasons).
**23. Experience Memory.** e.g. *"Recognised the visit only after a photo cue; ordered 2 of 3 prep steps; accepted a departure reminder; high engagement. Hint: pair future events with the visitor's photo."*
**24. Capability Model update.** prospective-memory dimension (conditioned on "with photo cue"); planning/sequencing; initiation.
**25. Future evolution.** as prospective memory strengthens or wanes, the ratio of cue-to-independent shifts; the activity migrates from single-step prep to multi-step plans (a market trip), or down to pure recognition + an automatic reminder.
**26. Caregiver output.** "Aitâ prepared for Rina's visit; she needed a photo cue to recall it, ordered most steps herself, and a departure reminder is set." + trend in prospective-memory support needed.
**27. Clinical relevance.** prospective-memory support-need trend is a functional signal for the Clinical Bridge (never a diagnosis); pairs naturally with medication-schedule adherence (clinician-owned).
**28. Safety constraints.** medication steps are display-only and clinician-authored; no unsafe real-action prompt (no "turn on the stove"); the real reminder uses the safe Part I routine engine.
**29. Privacy/consent.** the visit and visitor are shown only within the person's + primary-caregiver scope; the visitor's photo obeys the Memory Firewall.
**30. Offline.** fully offline — events, routine, photos and reminders are on-device; only cross-city caregiver coordination needs sync.
**31. NER localisation.** festivals bind to the community calendar and the person's own observance; honorifics and language per tier; "visit" framing respects local kinship and hospitality norms.
**32. Why MVP.** highest-ranked: uniquely spans present+future, directly targets the most disabling everyday deficit, generatable from calendar+routine+photos, and produces a tangible daily win.
**33. Future extension.** multi-step goal plans; integration with the Care Network for out-migrated family ("your son lands Thursday — shall we prepare?"); optional gentle location-aware safe-return rehearsal.

---

### 23.2 — Personal Memory Match

**1–7.** *Match a familiar person/object/place to its name or relationship* — addressing recall and recognition of familiar people, the stated core problem. Domain: recognition, cued recall, associative memory (family 1). Rationale: recognition is typically preserved after free recall fails, so a recognition-first ladder protects dignity while exercising the failing function; errorless learning and spaced retrieval strengthen chosen targets (names). Evidence: [PROMISING] (recognition/reminiscence, digital CST), with errorless [ESTABLISHED] and spaced retrieval [PROMISING→ESTABLISHED] for targeted names (R33, R34). Population: all stages (difficulty scales down to pure recognition in later stages).

| Attr | Personal Memory Match |
|---|---|
| **8. Required data** | ≥2 verified photos with identified people/objects/places |
| **9. Optional data** | relationships, associated events, associated audio (a name in a family member's voice) |
| **10. Retrieval** | media store + graph (identity/relationship) + provenance filter |
| **11. Agents** | O→1→2 (media+graph) →3→4→6 (grounding is critical here) →8→9 |
| **12. RAG** | graph + media retrieval only; strictly verified entities; no external corpus |

**13–18.** Template: *show a familiar item → identify it (recognition among options → cued recall → free recall)*. Personalisation: whose photos, which objects, which modality; spaced-retrieval schedule re-surfaces specific names across sessions. Difficulty: 2-choice recognition → 4-choice → cued recall → free recall. Scaffolding: relationship/context cue → narrowed choice → partial reveal (first sound, half-photo) → reveal with success. Modality: photo + voice; audio-name option.

**19. Example.**
```
System: (two photos) "One of these is your granddaughter. Which one?"   [recognition]
Person: (taps correctly)
System: "Yes! And do you remember her name?"                            [cued recall]
Person: "…"
System: "Her name starts with 'A'… A—"                                   [partial reveal, errorless]
Person: "Anu!"
System: "Anu. Your granddaughter Anu."                                   [end on success]
```
**20.** Success → optional step up + schedule the name for spaced re-test later; struggle → step down a rung, never "wrong." **21.** recognition vs recall level reached; which cue worked; latency; retention across spaced intervals. **22.** integrity gate (audio/visual/language/identity-on-shared-device); low-integrity trials excluded from capability. **23.** e.g. *"recognition reliable, free recall of names weak, visual+phonemic cue effective."* **24.** memory dimensions (recognition/cued/free), modality-dependence. **25.** the spaced-retrieval schedule and the recognition→recall ratio evolve per person; content rotates across people/objects/places to renew without novelty-for-its-own-sake. **26.** caregiver: recognition strong / name recall needs cues + which cues help. **27.** recognition-vs-recall trend is a functional memory signal (not a score/diagnosis). **28.** never present an unverified face as the person's own; no shame; end on success. **29.** photos strictly Firewall-scoped; shared-device subject confirmation. **30.** fully offline (on-device graph + media). **31.** names in the person's language/voice; culturally correct kinship terms (matrilineal where applicable). **32. MVP:** the most directly generatable activity from the platform's richest asset (family photos) and the clearest recognition-vs-recall longitudinal signal. **33. Future:** voice-of-family audio prompts; automatic spaced-retrieval of the names that matter most to the person.

---

### 23.3 — Sequence-a-Task  *(functional cognition)*

**1–7.** *Order and complete the steps of a real, familiar task* (making tea, preparing for market, dressing) — addressing executive-sequencing failure that costs ADL/IADL independence. Domain: executive sequencing, initiation, procedural/functional cognition (family 5). Rationale: functional, goal-oriented practice transfers to daily life better than abstract training; errorless relearning of ADLs has RCT support. Evidence: [ESTABLISHED/PROMISING] — errorless ADL relearning (REDALI-DEM), goal-oriented rehabilitation (GREAT); R32, R33. Population: all stages; content and support scale with stage.

| Attr | Sequence-a-Task |
|---|---|
| **8. Required data** | one familiar task with its steps (from routine/occupation) |
| **9. Optional data** | photos of the person's own utensils/objects; occupation-linked tasks |
| **10. Retrieval** | routine model + object media + (optional) occupation graph |
| **11. Agents** | O→1→2→3→4→7 (safety: no unsafe real-action) →8→9 |
| **12. RAG** | structured (routine/steps) + media; no external corpus in person path |

**13–18.** Template: *recognise the next step → order the steps → initiate → complete (unaided where safe)*. Personalisation: the person's real task, real objects, real sequence; occupation variants restore role identity. Difficulty: recognise-next-step → order-3 → order-full → initiate unaided. Scaffolding: show the setting → highlight the next item → partial demo → do-together. Modality: voice + photo/demo; touch drag-to-order.

**19. Example.**
```
System: (photos of tea items) "Let's make tea together. What comes first?"
Person: (unsure)
System: "The kettle is here — shall we start with the water?"   [errorless next-step cue]
Person: "Water first."
System: "Yes. And after the water boils…?"
Person: "Tea leaves."
System: "One spoon of tea leaves. You remember it well."         [success framing]
```
**20.** success → fewer cues next time; struggle → more cues, never takeover unless safety requires. **21.** steps ordered unaided; initiation; where the sequence breaks; assistance level. **22.** integrity gate; a task attempted while very fatigued is tagged, not counted as decline. **23.** e.g. *"orders familiar tea steps with one initiation cue; struggles at 'when is it ready'."* **24.** executive-sequencing, initiation, functional assistance-level dimensions. **25.** as capability shifts, tasks scale from single familiar tasks to multi-step chains (market trip) or down to recognise-the-next-step; new tasks drawn from routine/occupation renew the experience. **26.** caregiver: which steps need cues, which are independent — directly actionable. **27.** IADL assistance-level trend for the Clinical Bridge; strong functional signal. **28.** the studio *practices* sequences; it never instructs an unsafe real action (no live stove/knife prompts) — real-world execution stays under human supervision per the task's safety class. **29.** routine/occupation data Firewall-scoped. **30.** fully offline. **31.** tasks and objects are locally real (pitha, jhum tools, loom, tea-garden work); kinship/occupation authentic to the community and person. **32. MVP:** moves the studio beyond "brain games" to daily independence, and it is generatable straight from the routine model. **33. Future:** optional on-device vision to recognise a real step in progress (research-fenced); caregiver-authored custom tasks.

---

### 23.4 — Yesterday / Today / Tomorrow  *(orientation, all three frames)*

**1–7.** *Place recent, current and upcoming events in time* — addressing temporal disorientation, a core stated symptom, delivered as gentle reality orientation woven into interaction, never as a quiz. Domain: temporal orientation, episodic memory, prospective awareness (family 4). Rationale: reality orientation is an evidenced CST component when delivered supportively; anchoring to real personal events (not abstract dates) makes it meaningful. Evidence: [PROMISING] (reality orientation within CST). Population: all stages.

| Attr | Yesterday/Today/Tomorrow |
|---|---|
| **8. Required data** | recent events (this week) + today's routine + upcoming events |
| **9. Optional data** | photos tied to those events; weather; festival calendar |
| **10. Retrieval** | temporal store across frames + routine model |
| **11. Agents** | O→1→2 (temporal) →3→4→7 (no-quiz framing) →8→9 |
| **12. RAG** | temporal + structured; graph for people involved |

**13–18.** Template: *anchor now (day, part of day) → recall one recent event → identify one upcoming event → connect to a person/action*. Personalisation: the person's actual calendar; framing as support ("let's look at the week"), not testing. Difficulty: recognition of today → recall of yesterday → anticipation of tomorrow. Scaffolding: offer the anchor first (never "what day is it?" cold); photo cues; narrowed choices. Modality: voice + photo/calendar visual.

**19. Example.**
```
System: "It's Tuesday morning, and it's sunny. Yesterday your neighbour visited —
         do you remember?"                                   [anchor, then gentle recall]
Person: "Kamala came."
System: "Yes, Kamala. And tomorrow is something special — the temple day.
         Shall we keep your good sari ready?"                [future anchor + light action]
```
**20.** success → lighter anchors over time; struggle → provide the anchor and move on warmly, never leave the person failing a date. **21.** orientation level (needs anchor vs independent) across frames; recall of recent events. **22.** integrity gate; disorientation from a genuinely disrupted week (travel, illness) is context-tagged, not counted as decline. **23.** e.g. *"orients to today with a weather/day anchor; recalls yesterday with a photo cue; future events need prompting."* **24.** orientation dimension (time), episodic recency, prospective awareness. **25.** anchors lighten or strengthen with capability; the events refresh daily by construction, so this activity is intrinsically renewing. **26.** caregiver: orientation support-need trend; a rising need is a gentle flag (with measurement integrity), never a diagnosis. **27.** orientation-event trend feeds the Clinical Bridge exactly as in Part I. **28.** never quiz cold; never shame a wrong date; support-first. **29.** events Firewall-scoped. **30.** fully offline. **31.** anchors use local festivals, market days, agricultural calendar; language/tier per person. **32. MVP:** uniquely spans past+present+future, is intrinsically renewing (new events daily), and directly supports the "confusion/disorientation" the statement names. **33. Future:** ties into the morning routine and the Care Network shared calendar.

---

### 23.5 — Relationship Reasoning (Who Is Who?)

**1–7.** *Recognise a familiar person, then reason about their relationship and context* — addressing loss of relationship memory and social recognition. Domain: social/semantic memory, associative reasoning (family 2). Rationale: relationships are retrieved through a graph, not keyword search; reasoning "how are they related" exercises semantic and social cognition and reinforces identity and social connectedness. Evidence: [PROMISING] (recognition/reminiscence, social engagement). Population: early–moderate (recognition-only in later stages).

| Attr | Relationship Reasoning |
|---|---|
| **8. Required data** | verified family/relationship graph + ≥2 identified photos |
| **9. Optional data** | events shared with those people; who-visits-when routine |
| **10. Retrieval** | graph (relationships, time-scoped) + media + provenance |
| **11. Agents** | O→1→2 (graph) →3→6 (grounding critical) →8→9 |
| **12. RAG** | graph-first; verified relationships only; conflict-preserving (never assert a disputed relation) |

**13–18.** Template: *recognise the person → recall/choose the relationship → connect to a context (event/visit)*. Personalisation: the person's real family, matrilineal/patrilineal kinship as appropriate. Difficulty: recognise → choose relationship → free-recall relationship → link to a recent/upcoming event. Scaffolding: photo + first-name cue → narrowed relationship choices → reveal with warmth. Modality: photo + voice.

**19. Example.**
```
System: (photo) "Who is this?"
Person: "That's… my son."
System: "Yes — your son, Bikram. And who is the little boy with him?"
Person: "…"
System: "That's Bikram's son — your grandson. He was here at Bihu."   [context, errorless]
```
**20.** success → add a context/association step; struggle → recognition-only, supply relationship warmly. **21.** recognition vs relationship recall; social-association reach; latency. **22.** integrity gate; shared-device subject confirmation critical here. **23.** e.g. *"recognises close family reliably; relationship labels need cues; links to events well."* **24.** social/relationship-memory dimension; associative reach. **25.** as the graph grows (family adds people), content renews; difficulty shifts recognition↔recall; can braid into Prepare-For (who is visiting). **26.** caregiver: which relationships are secure vs fading — sensitive and useful. **27.** relationship-memory trend is a functional signal; never a diagnosis. **28.** never assert a disputed/unverified relationship; conflicts preserved for human resolution (Part I); no shame. **29.** the family graph is deeply personal → strict Firewall scope; secondary caregivers see less by default. **30.** fully offline (on-device graph). **31.** kinship ontology per community (Khasi/Garo matrilineal terms differ fundamentally); honorifics correct. **32. MVP:** generatable directly from the family graph (a core PWM asset) and central to identity and social connectedness. **33. Future:** dyadic mode with a visiting relative; voice-of-family cues.

---

### 23.6 — Reminiscence Journey  *(photo + music + story)*

**1–7.** *Navigate life periods through photos, music, places and stories, and narrate them* — addressing reduced autobiographical recall, low mood and social disengagement. Domain: autobiographical/semantic memory, language, mood (family 8). Rationale: reminiscence and music engage preserved long-term and melodic memory and support mood and connection; music has meta-analytic support for reducing agitation. Evidence: [PROMISING] (reminiscence — Cochrane: small, heterogeneous but real; music for agitation — meta-analysis, R7/R35). Population: all stages, including advanced (music/sensory-only).

| Attr | Reminiscence Journey |
|---|---|
| **8. Required data** | ≥a few verified life photos or songs tied to the person |
| **9. Optional data** | places, life events, family-recorded stories, occupation |
| **10. Retrieval** | media + vector (story text) + temporal (life periods) |
| **11. Agents** | O→1→2 (media/story) →3→7 (sensitive-content) →8→9 |
| **12. RAG** | vector over the person's own stories/notes; media; **retell only verified facts** |

**13–18.** Template: *present a life-period cue (photo/song/place) → invite recognition → invite narration → gently prompt associated people/events*. Personalisation: their music, their places, their era; open vs guided depending on impairment (task-based framing at greater impairment, per Part I's India-study guidance). Difficulty: passive listening/looking → recognition → guided narration → free narration. Scaffolding: multi-sensory cues; never correct a misremembered detail harshly. Modality: photo + music + voice.

**19. Example.**
```
System: (plays a Bihu song softly) "Do you remember this one?"
Person: "…Bihu. We danced at Bihu."
System: "You danced at Bihu. Who did you dance with?"   [open, warm, no pressure]
Person: "My sister. In the village."
System: "Your sister, in the village. Tell me about her."   [narration invited]
```
**20.** there is no "failure" state — engagement and mood are the outcomes; a misremembered detail is not corrected, only gently anchored to a verified fact if helpful. **21.** engagement, affect, narration length/richness (a language signal), recognition of familiar media. **22.** integrity mainly for the language signal (shadow only, never shown as a score); mood/engagement are primary. **23.** e.g. *"music strongly engages; village/childhood period rich; recent periods sparse; positive affect."* **24.** language (narrative), autobiographical reach, mood-response-to-modality (which media lifts mood). **25.** the journey moves across life periods and media types to renew; the CAE learns which media reliably engage. **26.** caregiver: what content reliably brings comfort/engagement — directly useful for hard moments. **27.** narrative-language change is a research-stage signal (shadow only); mood/engagement inform care, not diagnosis. **28.** **sensitive-content flags honoured** — bereavements/trauma excluded from spontaneous prompts by default (Part I); no AI-generated imagery of real people; retell only verified facts. **29.** deeply personal media → strict Firewall scope. **30.** offline for cached media; large media sync on unmetered connections only. **31.** local music forms (Borgeet, Khasi hymns, Mizo choral, Manipuri Nat), festivals, places; recorded human voice for Tier-C. **32. MVP:** high engagement and mood value, works at every stage (crucial for advanced users), generatable from photos/music the family uploads. **33. Future:** family "Story Circle" contributions feed it; personalised calming playlists for sundowning.

---

### 23.7 — Daily Routine Builder

**1–7.** *Reconstruct the person's own morning/evening routine in order* — addressing loss of routine structure, which drives disorientation, missed self-care and anxiety. Domain: sequencing, routine memory, initiation (family 5). Rationale: predictable routine reduces anxiety and supports independence; rebuilding one's *own* routine is meaningful and functional, not abstract. Evidence: [PROMISING] (routine/structure within CST and OT-informed practice). Population: all stages.

| Attr | Daily Routine Builder |
|---|---|
| **8. Required data** | the person's actual routine model |
| **9. Optional data** | photos of routine moments; medication times (clinician-authored, display-only) |
| **10. Retrieval** | routine model + temporal |
| **11. Agents** | O→1→2→3→4→7→8→9 |
| **12. RAG** | structured routine retrieval only |

**13–18.** Template: *recall the next routine step → order the routine → connect steps to times of day*. Personalisation: their real routine (reflected, not dictated). Difficulty: order-3 → order-full → time-anchoring. Scaffolding: show the setting/time cue → narrowed choice → reveal. Modality: voice + photo/icon; touch drag.

**19. Example.**
```
System: "Let's set up your morning. After you wake and wash — what usually comes next?"
Person: "Tea."
System: "Tea, yes. And you take your medicine with tea — shall I remind you?"  [display-only med step]
Person: "Yes."
```
**20.** success → lighter cues; struggle → provide structure warmly; if a step has been failing for days, flag as a functional change (Part I), don't nag. **21.** routine steps ordered unaided; time-anchoring; initiation. **22.** integrity gate; a disrupted routine week is context-tagged. **23.** e.g. *"orders morning routine well; evening routine needs cues; medication step reliably remembered with tea anchor."* **24.** sequencing, routine memory, prospective (tying meds to anchors). **25.** as routine changes (season, health), the model updates; the activity stays fresh because it mirrors real life. **26.** caregiver: which routine steps need support — directly actionable; emerging step-loss surfaced gently. **27.** routine adherence and step-loss are functional signals for the Clinical Bridge. **28.** medication content is clinician-authored and display-only; the studio never alters a regimen. **29.** routine is Firewall-scoped; continence/intimate steps private by default (Part I). **30.** fully offline. **31.** routine reflects local rhythms (prayer, agricultural day, festival disruptions). **32. MVP:** generatable straight from the routine model; underpins orientation, prospective memory and independence at once. **33. Future:** auto-links to Dinacharya reminders and the Prepare-For engine.

---

### 23.8 — Name & Find  *(naming + selective attention)*

**1–7.** *Name a familiar object, or find requested objects among distractors* — addressing word-retrieval (anomia) and selective/sustained attention. Domain: language (naming), attention (families 7, 6). Rationale: naming exercises lexical retrieval; visual search exercises selective attention; both use *familiar/occupational* objects so failures aren't artefacts of unfamiliarity (a measurement-validity point). Evidence: [PROMISING] (serious games for attention — npj Digital Medicine; naming within CST/SLT). Population: all stages; scales to recognition-naming in later stages.

| Attr | Name & Find |
|---|---|
| **8. Required data** | familiar/occupational object set (culturally real) |
| **9. Optional data** | the person's own object photos; occupation link |
| **10. Retrieval** | media + culture ontology + (optional) occupation graph |
| **11. Agents** | O→1→2→3→5 (cultural) →4→7→8→9 |
| **12. RAG** | media + structured; culturally-validated object banks |

**13–18.** Template: *name it (free → cued → choice)* and *find it (among few → many distractors)*. Personalisation: their objects, their trade's tools; accept dialect/synonyms. Difficulty: recognition-name → cued-name → free-name; find-among-3 → among-8. Scaffolding: category cue → first-sound cue → choice. Modality: photo + voice; touch for find.

**19. Example.**
```
System: (photo of a familiar object) "What do we call this?"
Person: "…for water…"
System: "Yes, for water — it starts with 'kal—'"     [errorless phonemic cue]
Person: "Kalah!" (pitcher)
System: "Kalah. Well remembered."
```
**20.** success → fewer cues / more distractors; struggle → step down; accept any valid local word. **21.** naming level (free/cued/choice); search accuracy and time; attention sustain. **22.** integrity gate: **language-mismatch is critical** — a miss in the wrong language is never counted as anomia (Part I). **23.** e.g. *"cued naming good, free naming effortful; selective attention within personal range; phonemic cues effective."* **24.** language (naming), attention (selective/sustained), modality-dependence. **25.** object sets rotate (home → market → occupation) to renew; the CAE learns effective cue types. **26.** caregiver: word-finding support strategies that work (e.g., "give the first sound"). **27.** naming trend is a language signal (shadow for markers; never a diagnosis). **28.** culturally real objects only; accept synonyms/dialect; no shame. **29.** object media Firewall-scoped. **30.** fully offline. **31.** object banks per community and per person's life; dialectal acceptance; recorded voice for Tier-C. **32. MVP:** cheap to generate, strong measurement-validity discipline (familiar objects, language-match gating), and a clear language/attention signal. **33. Future:** conversation-embedded naming; occupation-specific expert vocabularies.

---

### 23.9 — Festival & Culture Match  *(NER cultural)*

**1–7.** *Match culturally familiar foods, festivals, songs, objects and traditions* — addressing loss of cultural/contextual familiarity and supporting orientation and identity. Domain: semantic memory, orientation, identity (families 8, 1, 4). Rationale: culturally and personally familiar content is the reliable activation key for apathy and a validity safeguard (alien items produce failures that mimic agnosia); festival anchoring supports temporal orientation. Evidence: [PROMISING] (culturally-adapted activities — e.g., culturally-adapted Montessori RCT; CST cultural adaptation). Population: all stages.

| Attr | Festival & Culture Match |
|---|---|
| **8. Required data** | community cultural ontology + the person's own observances |
| **9. Optional data** | the person's festival photos, food/music preferences |
| **10. Retrieval** | culture ontology + personal preferences + media |
| **11. Agents** | O→1→2→5 (cultural, person-first) →3→4→7→8→9 |
| **12. RAG** | structured culture ontology + personal media; **person-specific overrides regional defaults** |

**13–18.** Template: *match/identify a cultural item (festival↔food↔song↔object↔season)*. Personalisation: the community's *and* the person's actual traditions (not a state-level stereotype). Difficulty: match → identify → recall-the-custom → connect-to-a-memory. Scaffolding: image + audio cue → narrowed choice. Modality: photo + audio.

**19. Example.**
```
System: (image) "Which festival is this?"
Person: "Bihu!"
System: "Yes — and what do we cook for Bihu?"
Person: "Pitha."
System: "Pitha. Did you use to make til pitha or ghila pitha?"   [bridges to reminiscence]
```
**20.** success → deepen toward personal memory; struggle → recognition + supply warmly. **21.** cultural-semantic recognition/recall; engagement; bridges to autobiographical recall. **22.** integrity gate; **person-specific culture must not be overridden by regional assumptions** (a validity + dignity rule). **23.** e.g. *"strong festival recognition; food associations rich; bridges readily to family memories."* **24.** semantic memory, orientation (festival calendar), engagement-by-content. **25.** rotates across the year's festivals and the person's own observances; intrinsically renewing with the calendar. **26.** caregiver: which cultural content engages — useful for meaningful activity planning. **27.** minimal direct clinical relevance; primarily engagement/identity (correctly a product, not clinical, outcome). **28.** avoid stereotyping; personal data overrides community defaults; respect religious/observance differences. **29.** cultural + personal media Firewall-scoped. **30.** offline (packs per community). **31.** *this is the NER-localisation showcase* — content is co-designed per community (§29) and personalised per individual; matrilineal kinship, local crops, local music, local sacred sites. **32. MVP:** the clearest expression of "culturally inclusive," generatable from the community ontology + personal preferences, and a strong apathy-activation lever. **33. Future:** community-contributed cultural asset libraries; festival-timed proactive activities.

---

### 23.10 — Conversation & Story Circle  *(caregiver-mediated social)*

**1–7.** *Personalised conversation and storytelling prompts, optionally seeded by family contributions* — addressing social isolation and reduced spontaneous language. Domain: language (discourse), social engagement, autobiographical memory (family 8). Rationale: social engagement and meaningful conversation support wellbeing and language; family-/carer-delivered activities (Montessori tradition) reduce agitation and improve engagement; the AI *facilitates human connection* rather than substituting for it (Part I's firm line). Evidence: [PROMISING] (family-carer-delivered Montessori RCTs; social engagement within CST). Population: all stages; especially valuable where family is out-migrated (asynchronous contributions).

| Attr | Conversation & Story Circle |
|---|---|
| **8. Required data** | biography + interests; (for Circle mode) family-contributed stories/photos |
| **9. Optional data** | recorded family voices; occupation, music, festivals |
| **10. Retrieval** | vector (biography/stories) + media + graph (who contributed) |
| **11. Agents** | O→1→2→3→7 (dignity; never interrogate) →8→9 |
| **12. RAG** | vector over the person's own life material; verified family contributions only |

**13–18.** Template: *offer a warm, personal prompt → listen → follow up → optionally play a family-contributed story*. Personalisation: their topics, their people, their era; open vs task-based framing by impairment. Difficulty: (not a difficulty game) — depth of prompt scales with engagement. Scaffolding: photo/voice seeds; never correct; never quiz. Modality: voice-first.

**19. Example.**
```
System: "Your grandson Rahul sent something for you." (plays Rahul's recorded voice note)
Rahul (recorded): "Aitâ, tell me about the loom you made — I want to learn."
System: "He wants to hear about your loom. Shall we tell him?"    [human connection facilitated]
Person: "The loom… I made it in 1975…"
System: (records her story to share back with Rahul)
```
**20.** no failure state — participation and connection are the outcomes; a lull is met with a gentler seed, not pressure. **21.** conversation initiation, discourse length/richness (language signal, shadow), engagement, **human-contact events** (the real KPI). **22.** integrity for the language signal only (shadow); engagement/connection primary. **23.** e.g. *"family-voice seeds strongly engage; occupation stories rich; converses more in the morning."* **24.** language (discourse), social-engagement patterns, content-that-connects. **25.** family contributions continually renew the material; the CAE learns which seeds and times engage. **26.** caregiver/family: prompts to contribute; a record of stories captured (a treasured by-product); AI-only-interaction share flagged as a *risk* signal, not success (Part I). **27.** discourse-language change is research-stage (shadow); social engagement informs care, not diagnosis. **28.** **AI must not substitute for people** — it routes to and records for humans; contributions verified and consented; never interrogate. **29.** biography and family contributions Firewall-scoped; contributors' consent required. **30.** prompts offline; family-contribution exchange needs sync (asynchronous, ideal for out-migrated family). **31.** local languages/dialects; recorded human voices for Tier-C; culturally appropriate topics and honorifics. **32. MVP:** directly attacks isolation (a core stated problem), leverages out-migrated family asynchronously (the NER reality), and produces treasured human artefacts. **33. Future:** full Care-Network Story Circle across cities; intergenerational prompts; preserved life-story archive.

---

## 24. Game → Problem → Architecture Traceability

Every MVP activity traces from a stated PS26003 problem, through the Part I engine that gives it meaning, to the Part II model it updates.

| Activity | PS26003 problem | Part I engine it feeds | Part II model it updates | Output that matters |
|---|---|---|---|---|
| Prepare-For | memory decline; can't manage tasks | Measurement Integrity → Baseline → Meaningful Change | GIM, PCM (prospective), CAE | a real prospective win + a functional trend |
| Personal Memory Match | memory decline | Baseline → Meaningful Change | PCM (recognition/recall), XM | recognition-vs-recall trend |
| Sequence-a-Task | loss of daily function | Contextual Behaviour Support (comfort); Baseline | PCM (executive/functional), GIM | IADL assistance-level trend |
| Yesterday/Today/Tomorrow | confusion; disorientation | Baseline; Acute-Change awareness | PCM (orientation), XM | orientation support-need trend |
| Relationship Reasoning | memory; social isolation | Baseline | PCM (social memory), XM | relationship-memory trend |
| Reminiscence Journey | anxiety; isolation; apathy | Contextual Behaviour Support (mood) | PCM (language/mood), CAE | engagement + mood levers |
| Daily Routine Builder | can't manage routine | Baseline; Dinacharya | PCM (sequencing), GIM | routine step-loss detection |
| Name & Find | memory; communication | Measurement Integrity (language gating) | PCM (language/attention) | naming/attention trend |
| Festival & Culture Match | cultural inclusivity; apathy | Personalisation engine | PCM (semantic), CAE | engagement-by-content |
| Conversation & Story Circle | social isolation | Social orchestration | PCM (discourse), XM | human-contact events (KPI) |

## 25. Game → Personal Data Mapping

Confirms the Top 10 are generatable from data the platform already holds (the hard filter of §21). *R* = required, *O* = optional.

| Data asset (PWM) | Prep | Match | Seq | Y/T/T | Rel | Remin | Routine | Name | Cult | Conv |
|---|---|---|---|---|---|---|---|---|---|---|
| Verified photos | O | **R** | O | O | **R** | O | O | O | O | O |
| Family/relationship graph | O | O | – | O | **R** | O | – | – | – | O |
| Routine model | **R** | – | **R** | **R** | – | – | **R** | – | – | – |
| Calendar / future events | **R** | – | – | **R** | O | – | O | – | O | – |
| Biography / life events | O | O | O | O | O | **R** | – | – | O | **R** |
| Music | – | O | – | – | – | **R** | – | – | O | O |
| Occupation / objects | O | O | **R** | – | – | O | – | **R** | O | O |
| Culture ontology | O | – | O | O | – | O | O | **R** | **R** | O |
| Family contributions | O | O | – | – | O | O | – | – | – | **R** |
| Goals (GIM) | **R** | – | O | O | – | – | O | – | – | – |

Every column has at least one asset the platform collects during Part I onboarding; none requires data the platform cannot obtain through an authorised workflow.

## 26. Game → Agent (module) Mapping

Using the nine bounded modules of §12 (O = orchestrator). All ten run the same spine; the differences are which retrieval and which validators dominate.

| Activity | Dominant retrieval (mod 2) | Critical validator | Notes |
|---|---|---|---|
| Prepare-For | temporal + graph | safety (no unsafe action) | display-only med steps |
| Personal Memory Match | media + graph | **grounding (mod 6)** | never an unverified face |
| Sequence-a-Task | structured routine | safety | no live-hazard prompts |
| Yesterday/Today/Tomorrow | temporal | dignity (no quiz) | intrinsically renewing |
| Relationship Reasoning | graph | **grounding** | conflicts preserved |
| Reminiscence Journey | media + vector | dignity (sensitive-content) | retell verified only |
| Daily Routine Builder | structured routine | safety (med display-only) | reflects, not dictates |
| Name & Find | media + ontology | **integrity (language-match)** | accept dialect |
| Festival & Culture Match | ontology + media | dignity (no stereotype) | person overrides region |
| Conversation & Story Circle | vector + media | dignity (never interrogate) | route to humans |

## 27. Game → Cognitive Domain Mapping

Coverage check — the Top 10 span the domains the problem statement implies, with deliberate weight on functional and prospective cognition (where transfer to daily life is best-evidenced).

| Domain | Prep | Match | Seq | Y/T/T | Rel | Remin | Routine | Name | Cult | Conv |
|---|---|---|---|---|---|---|---|---|---|---|
| Recognition / recall | ● | ●● | | ● | ●● | ● | | ● | ● | |
| Prospective memory | ●● | | | ● | | | ● | | | |
| Executive / sequencing | ● | | ●● | | | | ●● | | | |
| Orientation (time/place) | ● | | | ●● | | | ● | | ● | |
| Language / naming | | | | | ● | ● | | ●● | | ●● |
| Attention | | | | | | | | ●● | | |
| Social / relationship | | | | | ●● | ● | | | | ●● |
| Autobiographical / mood | | ● | | ● | ● | ●● | | | ● | ● |
| Functional (ADL/IADL) | ● | | ●● | | | | ● | | | |

(●● primary, ● secondary.) Attention and pure executive puzzles are represented but intentionally not over-weighted, per §19's transfer argument.

## 28. Game → Evidence Mapping

| Activity | Primary evidence anchor | Tier | Permitted claim |
|---|---|---|---|
| Prepare-For | prospective-memory external aids (R31); GREAT goal attainment (R32) | E | supports prospective memory & meaningful goals |
| Personal Memory Match | errorless (R33) + spaced retrieval (R34); digital CST (R5) | E/P | supports recognition/recall of chosen targets |
| Sequence-a-Task | errorless ADL relearning (R33); GREAT (R32) | E/P | supports functional task independence |
| Yesterday/Today/Tomorrow | reality orientation within CST (R1) | P | supports orientation |
| Relationship Reasoning | recognition/reminiscence; social engagement | P | supports social memory & connection |
| Reminiscence Journey | reminiscence (Cochrane, R36); music for agitation (R7/R35) | P | supports autobiographical engagement & mood |
| Daily Routine Builder | routine/structure within CST/OT | P | supports routine memory & initiation |
| Name & Find | serious games for attention (R37); naming in CST/SLT | P | supports naming & attention |
| Festival & Culture Match | culturally-adapted activities (R38) | P | supports engagement & cultural identity |
| Conversation & Story Circle | family-carer Montessori (R39); social engagement | P | supports social engagement & language |

No activity claims cognitive cure, dementia reversal, or diagnosis. Every claim is a *support* claim, tier-tagged, and (for the two personalisation hypotheses of §19) explicitly routed to the pilot.

---

## 29. NER Cultural Adaptation

The Studio operationalises Part I's rule that *culture is data, not a skin*, and that **personal culture is not the same as regional culture**. A person from Meghalaya is not "a Khasi user"; they are a specific person with a specific faith, village, trade, music and family structure. Content therefore comes from three layers, in priority order:

```
1  PERSON-SPECIFIC data        (their photos, songs, festivals they actually observe, their trade)
        ↓  overrides
2  COMMUNITY-VALIDATED ontology (co-designed per community: kinship, festivals, food, music, landmarks)
        ↓  overrides
3  REGIONAL default            (state-level content — used only as a last-resort generic fallback)
```

The generation contract enforces the priority: the Personalisation Compiler and Cultural Localisation Module bind person-specific content first and fall back to community content only when person-specific content is absent, and to regional content only when neither exists (and then clearly as non-personal generic material). This is both a dignity rule and a **measurement-validity** rule — a festival the person does not observe is an unfamiliar item that would produce a false "failure."

Dynamic cultural material the Studio uses: local languages and accents (tiered per Part I; recorded human voice for Tier-C), local food and crops, local occupations (jhum, tea, weaving, fishing, cattle, teaching), festivals and the agricultural calendar, local music forms, geography and landmarks, kinship systems (matrilineal Khasi/Garo handled correctly), and local stories and objects. **Anti-stereotyping is architectural**, not aspirational: the priority order above means the system cannot substitute a regional cliché for a person whose own data contradicts it, and community ontologies are built with local co-designers, not assumed.

## 30. Safety, Dignity, Consent and the Memory Firewall (studio-specific)

The Studio inherits every Part I control and adds generation-specific ones. Consolidated:

| Control | Studio-specific enforcement |
|---|---|
| **Memory Firewall** | `allowed_memory_scope`/`allowed_media_scope` filter candidate content *before* binding; a spec cannot reference out-of-scope data by construction |
| **No fabrication** | grounding validator (mod 6) fails any spec whose personal claims don't trace to verified sources; sparse data → generic fallback, never invention |
| **No unsafe real action** | safety validator (mod 7) blocks any prompt to perform a hazardous real-world action; task *practice* only, real execution under human supervision |
| **Dignity** | no scores/timers/ranks shown; no "wrong"; end on success; errorless cueing; graceful skip; task-based framing at greater impairment |
| **Sensitive content** | bereavement/trauma entities flagged and excluded from spontaneous prompts by default |
| **No deliberate misinformation** | the "True or Familiar?" quiz is removed from the person-facing path (§20) |
| **Consent** | per-purpose, revocable; contributors (family Story Circle) consent separately; medication content clinician-authored |
| **Deterministic rendering** | no model-authored code executes; only known engines run; two validators gate every render |
| **Auditability** | every activity's signed provenance answers "why did she see this, and where did each fact come from?" |

## 31. Measurement Integrity (studio-specific)

The Measurement Integrity Engine (Part I) gates whether an interaction may update the Capability Model or the Personal Baseline. In the Studio it is applied per activity:

```
Before an interaction counts toward capability/baseline, certify:
  audibility (volume, noise, ASR confidence) · visibility (brightness, font)
  language-match (was it played in her best language?) · fatigue (time since waking, session position)
  assistance/coaching (was a caregiver answering?) · device/data integrity · subject identity (shared device)
→ integrity score q ∈ [0,1]; low-q trials are TAGGED and EXCLUDED from capability/baseline updates
→ BUT assistance is never withheld for measurement reasons: the person still gets the help/experience
```

Two studio-specific consequences: (1) **familiar content is a validity safeguard** — using culturally/personally familiar items removes "unfamiliarity" as a hidden confounder, so a miss is more likely a real difficulty than an artefact; (2) **language-match gating is decisive for Name & Find and any naming/discourse activity** — a miss in the wrong language is never recorded as anomia. As in Part I, the Clinical Bridge prints measurement confidence, so a clinician can trust the system's silence as much as its signals.

## 32. Experience Memory + Capability Learning (the closing loop)

Each activity ends by writing an **experience episode** and updating the **Capability Model** and the **Continual Adaptation Engine** — the mechanism that makes tomorrow's activity better than today's.

```
INTERACTION ── events ──► MEASUREMENT INTEGRITY ── q ──►  (if q high)
      │                                                   │
      ▼                                                   ▼
 EXPERIENCE EPISODE (context, activity, assistance,   CAPABILITY UPDATE
  response, engagement, integrity, human feedback,     (conditioned, quality-weighted,
  learned hint)                                          per-domain ± uncertainty)
      │                                                   │
      └──────────────► CONTINUAL ADAPTATION ENGINE ◄──────┘
                       (personal policy: next objective,
                        content, difficulty, modality, scaffolding)
                                    │
                                    ▼
                         BETTER NEXT ACTIVITY  (progressive personalisation, §17)
```

### 32.1 The game→clinical structural firewall

The distance between "she tapped the wrong photo" and anything a clinician reads is **not a matter of tone — it is a matter of type**. There is exactly one permitted chain, and it is the same typed pipeline the whole platform runs on (`tech-stack.md` §13.2; `CLAUDE.md` invariant 13):

```
GAME INTERACTION (taps, latencies, cue usage)
   → StructuredEvent
   → [MEASUREMENT INTEGRITY GATE: q ≥ q_min]     ── fail ─► InsufficientData. STOP. (no clinical read, ever)
   → CertifiedObservation                         (the ONLY artefact that may update a model)
   → capability update (PCM, conditioned, per-domain, ± uncertainty)   — NEVER a single score
   → MeaningfulChange | SupportNeed | NoChange     (deviation × persistence × quality × context)
   → ContextualisedStatement                       (reversible causes first; the word "progression" is unreachable)
   → RoleProjection (clinician)                     (Firewall-authorised, provenance-carrying)
   → [SAFETY GATEWAY]                               → clinician-facing evidence, never a verdict
```

**There is no shorter path, and none may be added.** The chain `game score → cognitive score → dementia score → diagnosis` is not merely discouraged; the intermediate types it would require *do not exist* in the system. A game telemetry value cannot become a clinical claim because:

- it is not a `CertifiedObservation` until it clears the MQE gate, and a low-`q` interaction never clears it;
- capability is a per-domain vector with uncertainty, so there is no "cognitive score" for a diagnosis to be derived from;
- a `ContextualisedStatement` runs reversible causes first and is structurally incapable of emitting "progression"; only a clinician converts change into a trajectory;
- every clinician-facing artefact is a projection carrying provenance and a "what this is not" statement, not a conclusion.

The `post_experience_interpretation_rules` declared in the Experience-Spec (§14) are the first gate in this chain: an episode may only ever be read in the ways its own spec permitted before the person played.

### 32.2 What the loop actually emits

The system's output is therefore never a bare score. A representative summary object:

```
Activity: Personal Memory Match (family recognition)
Recognition: reliable        Free recall (names): effortful
Effective cue: visual+phonemic   Ineffective: voice-only
Assistance level: 2          Engagement: high (voluntary)   Affect: positive
Measurement integrity: high  Language confidence: high
Personal baseline: recognition within her range; naming slightly below her range (3 sessions)
System conclusion: "Possible meaningful change in name recall — measurement trustworthy — continue to monitor."
NOT: "Dementia is worsening."
```

## 33. Role Projections from an Experience Episode

One completed activity produces **one governed episode and four purpose-bound projections** — never one report copied to everybody, and never four different truths (`CLAUDE.md` invariant 12; the mechanism is `tech-stack.md` §13.2; the full information contract is `Solution.md` §23). Part I's Caregiver Copilot and Clinical Bridge are two of these four projection builders; the Studio also feeds the person and the CHW. The rule is **compression and register differ; the underlying evidence does not**.

### 33.1 Worked example — the same episode, four ways

The episode from §32: *Personal Memory Match, family recognition; recognition reliable, name recall effortful; visual+phonemic cue helped, voice-only did not; assistance level 2; engagement high, voluntary; measurement integrity high; naming slightly below her own range across 3 sessions.*

| Role | What is projected | Register / delivery | What is **withheld** |
|---|---|---|---|
| **Person** | *"You did well — you knew everyone. Shall we look at one more photograph?"* | warm, in-session, no notification | the naming-below-range signal; any score; any word implying assessment |
| **Caregiver** | *"She enjoyed the family photos and knew everyone. Finding names is a little harder this fortnight — the first-sound cue helped. Nothing to do; worth a mention at the next visit."* | plain, actionable; weekly digest, `REVIEW_WHEN_CONVENIENT` | raw per-session telemetry; latency numbers; the "cognitive number" (there isn't one); every individual interaction |
| **CHW** | Added to visit prep: *"Name/word-finding slightly below her usual over 3 sessions, measurement good. Check hearing-aid use; confirm medicine list."* | terse, checklist; `INFORMATIONAL`, visit-scoped | irrelevant personal memories; the family's private content; raw AI reasoning |
| **Clinician** | *"Recognition reliable; free recall of names differs from her own recent pattern across 3 comparable sessions (14 days), measurement confidence high. Visual+phonemic cueing effective. No stage or diagnosis implied."* | provenance-strict; `NO_NOTIFICATION`, in the since-last-review pack | opaque scores; raw telemetry as the entry point; any diagnostic conclusion |

The four differ in **detail, register and completeness** — the caregiver's omits the trajectory the clinician sees, the CHW's is scoped to the next visit, the person's contains no measurement at all — but no two of them assert contradictory facts. That non-contradiction is a tested property, not a stylistic aim (`tech-stack.md` §26, projection tests).

### 33.2 The projection builders the Studio drives

- **Person projection** — continuity and reassurance; the next meaningful step; never a number, never a comparison to last week.
- **Caregiver Copilot** receives, per day, at most: what engaged the person, what support helped (actionable — "the first-sound cue helped her find words"), any gentle functional flag (measurement-integrity-gated), and treasured by-products (a story captured, a good mood after music). Never raw scores; alerts obey the Attention Budget and the delivery classes (`tech-stack.md` §22.1).
- **CHW projection** — what changed since the last visit and what to check, scoped to the visit, budgeted to the ≤10-minute workflow; a referral suggestion where a persistent change warrants it, never a diagnostic suggestion.
- **Clinical Bridge** receives compressed *functional* trends with provenance and measurement confidence — recognition-vs-recall trajectory, IADL assistance-level change, orientation support-need, prospective-memory support-need — framed as "differs from her own recent pattern," never as a stage or diagnosis. Clinician annotations flow back as the highest-authority observations and become training signal for the Capability and policy models (the human-in-the-loop is the learning loop).

Each projection is independently authorised by the Memory Firewall's `project()` decision, independently passed through the Safety Gateway, and independently audited. **If the episode's measurement integrity had been low, no projection would be generated for any role** — the studio would surface a measurement action instead (§31). The visual and interaction design of each of these four surfaces is authoritative in `DESIGN.md` Parts C–D.

---

## 34. Product Implementation Architecture

> **Horizon label (canonical, per `CLAUDE.md` §4 and `tech-stack.md` §4).** The edge/cloud split below is the **Horizon B/C target architecture** — the on-device replica, on-device models and offline generation are Horizon B/C deliverables, not the current build. **What we build now (Horizon A)** is the same Studio running **server-side, online**, delivered to the Next.js web client: server-side spec generation, the two deterministic validators, the seven engines, measurement integrity and episode writing all run in the FastAPI monolith; the web client renders the validated spec and posts interaction events back. A PWA shell plus cached specs and content give a *web* offline story later; the on-device engine arrives with the Expo mobile app in Horizon B. The seams that make this non-destructive — event-sourced episodes, idempotent writes, versioned specs, provenance on every artefact — are built in Horizon A because safety requires them anyway. Read the diagram below as the destination, with the horizon of each half in mind.

**Horizon-A equivalent (build this now):**

```
 WEB CLIENT (Next.js, online)                         SERVER (FastAPI monolith)
 ─────────────────────────────                        ────────────────────────────
 • renders the validated Experience-Spec              • orchestrator + 9 studio modules
 • captures interaction events → POST /v1/...         • spec generation (LLM → structured output)
 • SSE for state freshness                            • BOTH validators (grounding, safety) — DETERMINISTIC
 • no model, no PWM, no validators on the client      • 7 deterministic engines + template library
                                                      • Measurement Integrity + episode writer
                                                      • PCM / XM / GIM / CAE (server-side)
                                                      • projection builders + delivery policy
```

**Horizon B/C target (edge/cloud split — future):** the generation path is split across edge and cloud so the person's daily experience never depends on connectivity.

```
 PERSON DEVICE (offline core)                         CLOUD (connectivity-enhanced)
 ─────────────────────────────                        ────────────────────────────
 • on-device PWM replica (graph+media, SQLite/vec)    • richer generation for novel specs
 • the five models (PCM, XM, GIM, CAE cached)         • Agentic-RAG "why this activity" (clinician)
 • template library + 7 deterministic engines         • large-model phrasing for open dialogue
 • small on-device model for spec assembly &          • model/content-pack updates
   phrasing (Tier-A) + recorded packs (Tier-B/C)      • cross-city family Story-Circle exchange
 • both validators (grounding, safety) — DETERMINISTIC • research/shadow model computation
 • Measurement Integrity + episode writer             
 • adaptive assistance within a session               
```

**What runs offline (Horizon B/C target).** Template selection, content binding from the on-device PWM, both validators, deterministic rendering, interaction capture, measurement integrity, episode writing and capability/policy updates for the Top 10 all run with zero network *once the on-device engine ships*. A small on-device model handles Tier-A phrasing and spec assembly; Tier-B/C use recorded human-voice packs. **What needs the cloud.** Generating genuinely novel specs beyond the cached template space, open-ended dialogue, the clinician-facing "why this activity" evidence retrieval, and cross-city family contributions. If the cloud is unavailable, the Studio degrades gracefully to the cached template + personal-content path — which is itself the full Top 10.

**Data stores (extending Part I's polystore).** Graph (relationships), temporal (events across frames + episodes), vector (stories/notes for reminiscence & conversation), relational (consent, templates, specs), object (media, packs), append-only audit (every spec + provenance). The Capability Model and Continual-Adaptation policy are compact per-person structures held on-device and synced as deltas.

**Model inventory (least-powerful-sufficient).** Deterministic engines + rules for rendering, difficulty and safety; small on-device models for phrasing/ASR/TTS (Tier-A); a larger cloud model only for novel-spec generation and open dialogue, always confined to structured output behind the validators. No model is in the emergency or medication path (Part I).

## 35. MVP Technical Scope

The MVP ships the smallest system that proves the thesis — *generated, grounded, personal activities that learn* — without pretending to be the full research platform.

| Component | In MVP | Deferred |
|---|---|---|
| Five models | PWM (extended), PCM (v1, rules + per-person stats), XM (episodes), GIM (person/caregiver-stated goals) | learned/inferred goals at scale; multimodal state estimation |
| CAE (personal policy) | Phase-1: rules + clinician/designer policy + per-person statistics | supervised ranking, bandits, offline RL |
| Generation | parametric + tightly-bounded controlled generation into specs | broad novel-spec generation |
| Engines | 7 deterministic engines; the Top 10 templates | expanded engine set |
| Validators | grounding + safety/dignity (deterministic) | — |
| Languages | Tier-A full; one Tier-C recorded pack | Tier-B constrained ASR |
| Offline | full Top-10 generation + learning offline | cloud novel-spec generation |
| Caregiver/clinical | daily engagement/support-need summaries; functional trends | full agentic RAG rationale |

**MVP acceptance:** a person and caregiver use the Studio for a realistic week; activities are personal, grounded (zero fabricated personal claims), never repeat identically, adapt difficulty, and produce measurement-integrity-gated episodes that visibly change what the system offers next — and the studio **refuses** to score a low-integrity session and **refuses** to state an unverified personal fact.

## 36. Phase 2 / Phase 3

| Phase | Studio capabilities added | Learning rung (CAE) | Gate |
|---|---|---|---|
| **Phase 2** | broader controlled generation; richer PCM (conditioned, multimodal telemetry); Tier-B voice; dyadic/family Story-Circle across cities; "why this activity" agentic RAG for clinicians | supervised ranking / preference models over a whitelisted action set | prospective cohort; engagement, assistance-reduction, caregiver-burden, alert-utility endpoints |
| **Phase 3** | multimodal generation (image/audio scene assembly from verified assets); NER low-resource interaction corpus; optional passive signals (opt-in) feeding conditions | contextual bandits with clinician-set no-go contexts, bounded exploration, ethics-approved | measurement reliability + validity study; no clinical claims released |

## 37. Research Frontier

The architecture is, deliberately, a bridge between a product and a research platform. Because MindMitra holds five well-scoped models and records measurement-integrity-gated interaction episodes, it becomes a **longitudinal cognitive-interaction laboratory** for questions the field cannot currently study at scale — while every study runs behind the same safety boundary.

Directions it enables: **continual learning** of a personal policy under strict safety constraints; **multimodal personal world models**; **longitudinal cognitive-state estimation** as a latent, uncertainty-aware trajectory (never a disease label); **personalised intervention modelling** (which support works for whom, when); **human–AI co-cognition** (the person and the system remembering together); **goal-directed cognitive assistance**; **adaptive assistance and scaffolding policies**; and **safe agentic and cognitive architectures** grounded in provenance. Two research assets are unique to this setting: the **NER low-resource-language cognitive-interaction corpus**, essentially absent today, and a **within-person, measurement-gated longitudinal record** of how specific supports change functioning over months.

> **The essential distinction.** MindMitra has **not** solved artificial cognition, and this document claims no such thing. What it proposes is a real-world application that helps people today **and** a disciplined laboratory that can generate the missing evidence tomorrow. **MindMitra = real-world cognitive-care application + longitudinal cognitive-interaction laboratory.** The research ambition is realised entirely through richer, better-grounded models — never through greater autonomy over diagnosis, prescription or decision.

## 38. Validation Framework

The Top 10 and the generation system are evaluated on outcomes that matter, not on scores, time and accuracy. Metrics are separated into three registers so that a product win is never mistaken for a clinical claim.

| Register | Measures | Example targets (pilot, [HYPOTHESIS]) |
|---|---|---|
| **Product metrics** | voluntary initiation; meaningful engagement (neutral/positive affect, completion without distress); abandonment; retention; **experience novelty without disorientation**; assistance level; caregiver-rated usefulness; acceptability; cultural fit; equity spread across literacy/gender/language-tier | ≥4 sessions/wk; ≥40% voluntary; retention ≥60%; no tier < 50% of best |
| **Clinical outcomes** (partner-run) | validated cognition (education-appropriate) at 0/12/24 wks; QoL; caregiver burden & self-efficacy; **assistance-level reduction** on ≥1 IADL; function | feasibility first; effect estimation only in a powered study |
| **Research outcomes** | θ test-retest reliability; measurement-integrity gate rate; language-mismatch rate; capability-estimate calibration vs clinician; hint-validity (do learned hints predict future response?) | reliability reported *before* any utility claim |
| **Safety metrics** | fabricated-personal-claim rate (**target zero**); unsafe prompts (**zero**); privacy incidents (**zero**); false-alert rate; dignity violations | zero on the three "target zero" rows |

Crucially, the framework tests the two honest hypotheses of §19 head-to-head: **personalised-vs-generic** content (does grounded personalisation beat a good generic activity on engagement and measurement validity?) and **generated-vs-static** (does a non-repeating generated studio improve adherence and reduce test-anxiety versus a fixed set?). These are the claims Part II is built on; they are treated as questions, not results.

## 39. Open Research Questions

| RQ | Question | Type |
|---|---|---|
| RQ-P1 | Does grounded personalised content improve engagement and measurement validity vs a good generic activity? | RCT / within-subject |
| RQ-P2 | Does a non-repeating *generated* studio improve adherence and reduce test-anxiety vs a static set? | Crossover |
| RQ-P3 | Do past+present+future (goal-framed) activities improve prospective-memory support and daily preparedness vs past-only? | RCT |
| RQ-P4 | Does the Capability Model (conditioned, uncertainty-aware) predict real functional change better than a single score? | Prospective cohort |
| RQ-P5 | Do learned Experience-Memory hints (e.g., "visual cues help recall") generalise and improve subsequent outcomes? | Within-subject |
| RQ-P6 | Does errorless + spaced-retrieval scheduling in-studio improve retention of *personally chosen* names/facts in NER languages? | RCT |
| RQ-P7 | Does measurement-integrity gating (esp. language-match) reduce false decline signals from naming/discourse activities? | Ablation |
| RQ-P8 | Does the Continual Adaptation Engine (Phase-1 rules → Phase-2 ranking) improve engagement/assistance-fit without harming safety? | Staged evaluation |
| RQ-P9 | Can within-person, measurement-gated interaction trajectories provide clinically useful functional signals in low-resource-language populations? | Cohort |
| RQ-P10 | How does personal culture diverge from regional culture in NER, and how much does person-first content matter for engagement and validity? | Mixed-methods |

## 40. Final Architecture Synthesis

Part II's whole argument reduces to one loop: a bounded system that continually learns *how this particular person remembers, understands, learns, acts, participates and responds to assistance*, and uses that knowledge to generate better cognitive and everyday experiences — through activities that are the interaction mechanism, not the product.

```
                                   PERSON
                                     │
                          GOALS / INTENTIONS  (GIM)
                                     │
              ┌──────────────────────┼──────────────────────┐
     PERSONAL WORLD MODEL    PERSONAL CAPABILITY MODEL    EXPERIENCE MEMORY
       what matters              what they can do            what worked
              └──────────────────────┼──────────────────────┘
                                     ▼
                             CURRENT STATE  (capability × context)
                                     ▼
                        PERSONALISED COGNITIVE POLICY  (CAE)
                                     ▼
                          AGENTIC ORCHESTRATION  (bounded)
                                     ▼
             MEMORY / GAME / ROUTINE / SOCIAL / FUNCTIONAL ASSISTANCE
                     (grounded spec → validators → deterministic render)
                                     ▼
                            REAL-WORLD INTERACTION
                                     ▼
                                OBSERVATION
                                     ▼
                          MEASUREMENT INTEGRITY  (gate)
                                     ▼
                             EXPERIENCE MEMORY
                                     ▼
                            CAPABILITY UPDATE
                                     ▼
                          PERSONALISATION UPDATE
                                     ↺  (continue)

        ── around everything, at every step ──
        SAFETY · CONSENT · DIGNITY · PROVENANCE · HUMAN OVERSIGHT
```

The World Model tells the system what matters to the person; the Capability Model, what they can currently do; Experience Memory, what happened last time; the Goal & Intention Model, what they are reaching for; the Continual Adaptation Engine, what to do better next. Agentic orchestration connects them; RAG grounds them; the Memory Firewall governs access; Measurement Integrity prevents false conclusions; deterministic rendering keeps generation safe; and human oversight prevents unsafe autonomy. The games are simply the richest, most dignified way for that loop to touch a person's real life — past, present and future — and the studio's success is measured not by how much of the app the person uses, but by how much of their own life they keep.

---

## References (Part II additions)

Part I references **R1–R30** are carried forward unchanged (NICE NG97, WHO risk-reduction & AI-ethics guidance, LASI-DAD India prevalence, digital CST, music-for-agitation, caregiver-intervention meta-analyses, remote-monitoring & speech-biomarker reviews, ABDM/eSanjeevani, Bhashini/AI4Bharat/AIKosh, NER connectivity/language sources, DPDP 2023, and the rest). Part II adds the cognitive-activity-science sources below. Evidence tiers are assigned in-text.

- **R31.** Preserving prospective memory in daily life: systematic review & meta-analysis of mnemonic strategy, cognitive training, external memory-aid and combination interventions — external aids and combinations support prospective memory in daily life. *(prospective-memory evidence base)*
- **R32.** Clare L, et al. **GREAT** — Goal-oriented cognitive Rehabilitation in Early-stage Alzheimer's and related dementias: multi-centre single-blind RCT (and the NIHR programme report) — improves attainment of personally meaningful everyday goals; standard cognitive scores unchanged. Also: Cochrane review, *Cognitive rehabilitation for people with mild-to-moderate dementia*, 2023.
- **R33.** Errorless learning evidence: Donaghey CL, et al., *Errorless learning is superior to trial-and-error when learning a practical skill in rehabilitation: RCT*; **REDALI-DEM** RCT, *Structured relearning of activities of daily living in dementia* (Alzheimer's Research & Therapy); plus literature reviews of errorless learning in Alzheimer's disease.
- **R34.** Spaced retrieval evidence: systematic review & meta-analysis of spaced-retrieval effects on learning capacity in mild-to-moderate cognitive impairment (*European Psychologist*); *Algorithmic spaced retrieval enhances long-term memory in Alzheimer disease* (JMIR Formative Research, 2024, pilot); reviews of spaced-retrieval as a direct memory intervention in dementia.
- **R35.** Music-based intervention meta-analyses for agitation in dementia (moderate effect) — see also R7 (Part I).
- **R36.** Woods B, et al. **Reminiscence therapy for dementia** — Cochrane systematic review (2018): effects generally small and heterogeneous; benefits vary by modality/setting (individual and multi-sensory formats); plus subsequent meta-analyses on agitation/depression/QoL in long-term care.
- **R37.** Serious games / computerised cognitive training in MCI and dementia: 2024–2025 systematic reviews & meta-analyses (JMIR Serious Games, 2024; *Age and Ageing*, 2025) — benefits on cognition/attention, heterogeneous, tablet delivery tends to perform better; *The performance of serious games for enhancing attention* (npj Digital Medicine).
- **R38.** Culturally-adapted activity evidence: *Effects of a culturally-adapted group-based Montessori intervention on engagement and affect in Chinese older people with dementia: RCT* (BMC Geriatrics); CST cultural-adaptation literature.
- **R39.** Family-carer-delivered activity evidence: cluster-randomised crossover trial of **Montessori activities delivered by family carers** to residents with BPSD; personalised one-to-one Montessori crossover RCT (agitation, affect, engagement).
- **R40.** Goodall G, et al. *The use of technology in creating individualized, meaningful activities for people living with dementia: a systematic review* (2021) — supports value of individualised meaningful activity, evidence heterogeneous; read alongside work showing *generic* video can also elicit conversational language (the personalised-vs-generic counterpoint, RQ-P1).

---

> **Closing note on intellectual honesty (Part II).** This continuation deepens the architecture without moving the safety boundary. It introduces four new models and a generation system, and it selects and specifies ten activities the platform can actually build from data it already holds — but it claims no cognitive cure, no dementia reversal, no diagnosis, and no proven superiority of personalised-over-generic or generated-over-static content. Those last two are the hypotheses the whole design rests on, and they are routed to the NER pilot as questions. The honest summary: MindMitra Part II specifies a safe, bounded, continually-personalising cognitive interaction environment that can help a person today and generate the evidence the field is missing tomorrow — with safety, consent, dignity, provenance and human oversight around every step.







