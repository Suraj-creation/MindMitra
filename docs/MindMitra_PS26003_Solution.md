# MindMitra — PS26003 Definitive Solution Document

*A Personalised, Culturally-Adaptive Cognitive Care and Memory-Assistance Platform for Elderly People Living with Dementia in the North Eastern Region*

Smart India Hackathon 2026 · Problem Statement PS26003 · MDoNER · Software · Theme: Space Technology

---

## How to read this document
This is a solution-definition document, not a research review. It answers one question: exactly what we propose to build for PS26003, why each part exists, and how the parts work together as one coherent system. The evidence cited exists to justify and constrain design decisions — the pattern throughout is **evidence → design implication → product decision** — never to survey the literature for its own sake.

So that ambition stays honest, every substantive claim is tagged with the strength of what stands behind it, and design language keeps four things separate: what a source establishes; what our own design infers; what the product will do; and what remains a hypothesis to be tested. The tags:

| **Tag**            | **Meaning**                                                                                       | **What we build on it**                                        |
|--------------------|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| \[ESTABLISHED\]    | Strong clinical/scientific evidence; reflected in guidelines (WHO, NICE, Alzheimer's Association) | Core product decisions and clinical framing                    |
| \[PROMISING\]      | Real evidence (RCTs, meta-analyses) but limited, heterogeneous or short-term                      | Product features, with measured claims and in-pilot evaluation |
| \[RESEARCH-STAGE\] | Technically demonstrated, not clinically validated; reference standards weak                      | Research modules; shadow mode; never user-facing as fact       |
| \[DESIGN\]         | Our design inference from evidence and field constraints                                          | Architecture choices, stated as ours                           |
| \[HYPOTHESIS\]     | A design premise requiring validation in the NER pilot                                            | Listed as a pilot question, never asserted as a result         |

One rule governs the whole system, and nothing in the pages that follow overrides it:

> **The line that cannot be crossed**
>
> **AI detects, retrieves, summarises, personalises, prioritises and assists. Clinicians diagnose, prescribe and decide. The person and family keep agency.**

A note on the name. **MindMitra** (*mitra* = companion) is a working codename used for internal consistency. *Mitra* is legible across the Indo-Aryan languages (Assamese, Bengali, Bodo, Nepali, Hindi) but not across Khasi, Garo, Mizo, Meitei, Nyishi, Kokborok or Nagamese, which belong to different language families entirely. A platform whose core promise is cultural inclusion cannot ship one Indic name to eight states, so per-state names and voice personas are a first onboarding deliverable, co-designed with local partners. The official problem-statement title is retained throughout.

## 1. The Solution in One Page

PS26003 asks for an AI-based cognitive-gaming and memory-assistance platform for elderly people with dementia in the North East. Read literally, that is a games app with reminders. Read seriously, the problem statement's own background paragraph describes several failing systems at once: cognitive decline in the person; anxiety and social isolation; caregivers who cannot monitor or engage continuously; near-absent specialist neurology and cognitive therapy; geography and thin infrastructure; and the absence of affordable, culturally inclusive digital therapeutics. A games app addresses roughly one part of what is written.

Our position is that **cognitive gaming and memory assistance are the correct entry point and an insufficient endpoint**. They are the two things a person with dementia will actually open, in a region where no one installs a “care-management system.” Underneath them we build a personalised, longitudinal cognitive-care intelligence layer shared — under consent — between the person, the family caregiver, the community health worker and the clinician.

The person experiences one simple, voice-first application. Beneath it, a shared core maintains a provenance-aware Personal World Model, a within-person baseline, an intervention engine, bounded AI capabilities behind a deterministic safety gateway, and consent-aware retrieval. Caregivers receive a focused copilot; community workers and clinicians receive purpose-specific, compressed views. It runs offline by default, in the person's own language and culture, and it is architecturally prevented from quietly becoming surveillance.

> **North-star outcome**
>
> Preserve **meaningful independence and quality of life** for as long as safely possible — while **reducing caregiver cognitive load** and **improving continuity of care**. Not app engagement; not a game score; not an AI diagnosis.

The whole system runs one operating loop. It is the spine of every section that follows:

> **The canonical operating loop**
>
> UNDERSTAND → ENGAGE → ASSIST → OBSERVE → CERTIFY THE MEASUREMENT → LEARN THE PERSON'S BASELINE → DETECT MEANINGFUL CHANGE → UNDERSTAND POSSIBLE CONTEXT → SELECT THE LEAST-INTRUSIVE SAFE SUPPORT → INFORM THE RIGHT HUMAN → HUMAN ACTION → NEW EVIDENCE → UPDATE THE PERSONAL WORLD MODEL
>
> The loop learns **the person**, not the disease. Its output is not primarily an AI answer — it is **better human action**: the right reminder for the person, the one thing that changed for the caregiver, the household that needs a visit for the CHW, and a usable longitudinal story for the clinician.

If the solution has to be compressed to a sentence:

|                                                                                                                                                                                                                                                                                                                                                                                                                    |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **A consent-aware, offline-capable, evidence-grounded platform that learns a person's everyday world and trusted baseline, provides adaptive memory assistance and cognitive stimulation drawn from their own life, preserves meaningful independence, reduces caregiver cognitive load, detects potentially meaningful change cautiously, and connects the right evidence to the right human at the right time.** |

## 2. Core Solution Thesis

The most common design error in dementia technology is to treat the condition as “memory loss” and to answer it with reminders. The deeper truth is that dementia is the **progressive failure of a person's internal model of their own world** — who they are, where they are, what happens next, who can be trusted, how a familiar task is done. As that internal model degrades, it is transferred, by force, onto a caregiver who has no training, no tools and little rest, inside a health system that sees the person for fifteen or twenty minutes every few months, across terrain where those minutes can cost a day's travel.

This reframing changes what the product is. It is not an app the person lives inside; it is **an intelligence layer that lives inside the person's life**. And it is not one tool for one user: the person, the caregiver, the community health worker and the clinician each see a different part of the same longitudinal reality. So the strongest framing of the whole system is a single shared cognitive-care model with role-specific views — simple and private for the person, actionable for the caregiver, operational for the CHW, evidence-rich for the clinician, and governed for research.

The thesis, stated plainly: **the platform should build a trustworthy, personalised, longitudinal model of the person's world, and use it to provide adaptive cognitive stimulation, memory assistance, routine scaffolding, contextual support and caregiver intelligence.** It understands the person; engages them meaningfully; assists memory and daily life; observes interaction and routine; certifies whether those observations can be trusted; learns the person's own baseline; detects meaningful deviations rather than reacting to single scores; adds context; selects the least-intrusive safe assistance; informs only the appropriate human; and learns from the human's response. That closed loop is the product's actual engine — not any single game, chatbot or model.

> **The governing principle**
>
> **PERSON FIRST → FUNCTION FIRST → SAFETY FIRST → EVIDENCE FIRST → AI SECOND**
>
> AI is an enabling technology, not the product's purpose. Where a deterministic rule is safer, the rule wins. The system is designed to support human decisions and everyday life, not to autonomously diagnose, prescribe or control.

Everything that follows is derived from this thesis rather than accumulated around it. The temptation in a system this broad is to keep adding capabilities — more agents, more sensors, more games, more dashboards. We resist it deliberately: the goal is not maximum feature count but maximum coherence, safety, usefulness and feasibility. Several capabilities that appear in earlier drafts of this work are consolidated, downgraded to research, or removed outright in the sections below, and we say so where it happens.

## 3. The Problem We Are Solving

Dementia is a systemic problem, and the platform is shaped by the specific way its layers connect. Cognitive decline produces daily-life difficulty; daily-life difficulty transfers load onto a caregiver; the caregiver becomes the person's external memory and coordinator and is progressively overwhelmed; and the health system sees only episodic snapshots, missing what unfolds at home across weeks. Each layer is a place the platform can intervene, and each has a hard boundary it must not cross.

> **The chain the platform addresses**
>
> dementia-related cognitive decline → daily-life difficulty → caregiver becomes the external memory → caregiver cognitive overload → fragmented, episodic clinical observation → missed changes and preventable crises → in NER: amplified by geography, connectivity, language and out-migration

### 3.1  What the person experiences

Dementia is not one deficit. Over time a person can lose recent and prospective memory (forgetting to do things later is the failure that most breaks daily life), orientation to time and place, familiar routes, word-finding, attention, planning and sequencing, and the ability to execute learned tasks even when the goal is clear. Alongside these come behavioural and psychological changes — anxiety, apathy, agitation, sleep disruption, repetition — that are usually **responses** to unmet needs, discomfort, or an incomprehensible environment rather than free-standing symptoms. Two clinical facts drive the design more than any other. First, cognitive symptoms can be worsened or mimicked by reversible causes — delirium, infection, dehydration, medication effects, depression, thyroid or B12 problems, and above all untreated hearing and vision loss \[ESTABLISHED\]. Second, in India most people in scope have **no diagnosis at all** — a roughly 90% diagnosis-and-care gap \[ESTABLISHED, R11\] — so the platform must be useful before a diagnosis exists and must never fabricate one.

### 3.2  What the caregiver experiences

As the person's internal model degrades, the caregiver must hold appointments, medication schedules, routines, preferences, behavioural patterns, family relationships, what happened yesterday, what changed this week, what to tell a clinician, what to watch, and — critically — what is **not** an emergency. This is a second failing system: caregiver cognitive overload. Indian evidence documents heavy burden, poor caregiver health, inadequate respite and information gaps \[ESTABLISHED, R12\], and the strongest intervention evidence in the whole field is for caregiver support: network meta-analysis ranks multicomponent caregiver interventions highest for reducing behavioural symptoms and caregiver reactions \[PROMISING→ESTABLISHED, R9\], and digital caregiver interventions reduce burden and improve self-efficacy and quality of life \[PROMISING, R10\]. The deliverable the caregiver needs is therefore **information compression** — what changed, what matters, what to do — not a dashboard.

### 3.3  What the health system experiences

India has on the order of 0.3 psychiatrists per 100,000 people against a WHO-recommended minimum near 3 \[ESTABLISHED, R29\], and rural cognitive-therapy and rehabilitation capacity is thinner still. The clinician sees the person briefly and rarely, with no standardised home observation and fragmented records. The useful contribution is not another opinion; it is **compressed longitudinal evidence** — what changed, when, with what confidence, in what context — delivered inside the provider-assisted teleconsultation workflow the region already uses \[ESTABLISHED, R20\].

### 3.4  The North-Eastern constraints that dictate architecture

NER is not one market. Eight states span at least four language families, radically different connectivity, and very different health infrastructure. Three facts, in particular, are not background colour — they change the engineering:

| **NER reality**                                                                                         | **Evidence**             | **Design consequence**                                                                                           |
|---------------------------------------------------------------------------------------------------------|--------------------------|------------------------------------------------------------------------------------------------------------------|
| 1,841 of 45,934 villages have no mobile coverage (Feb 2026); Arunachal alone has 1,176                  | \[ESTABLISHED, R23\]     | Offline-first is a correctness requirement, not an optimisation; a CHW sync-mule for uncovered villages          |
| Lowest average formal education among people 60+ in India — Sikkim 6.2 yrs, Mizoram 6.3 yrs             | \[ESTABLISHED, R27\]     | Population-normed cognitive scoring is a bias amplifier here; within-person baselines are the defensible choice  |
| Four+ language families; production speech AI exists only for a few languages                           | \[ESTABLISHED, R26\]     | A tiered language strategy; human-recorded voice for low-resource languages; never translation-as-inclusion      |
| ~38% household digital literacy; care delivered through ASHA/ANM/CHO and provider-assisted teleconsults | \[ESTABLISHED, R29/R20\] | Voice-first as the primary channel; the CHW as a first-class user; integrate with AAM/eSanjeevani, don't replace |
| Out-migration of working-age children; caregivers are often frail spouses                               | \[DESIGN, from R12\]     | Multi-caregiver, multi-city coordination is the default, not an exception                                        |

Two demographic notes keep the impact case honest. National prevalence is well established — about 7.4% of adults 60+ in India, roughly 8.8 million people, with strong age and education gradients \[ESTABLISHED, R4\] — but reliable state-level, community-based prevalence for individual NER states is thin, so we do not manufacture per-state figures; generating that evidence is itself a research contribution. And NER is demographically younger than peninsular India, which means its dementia challenge is driven less by today's elderly share than by rapid future ageing, an extremely thin care-service base, and the removal of the traditional caregiving generation by migration.

## 4. Solution Principles

Ten principles govern every design decision in this document. Each is testable, and each maps to a concrete mechanism described later — a principle with no mechanism is only a slogan.

| **Principle**                     | **What it means in the product**                                                                              |
|-----------------------------------|---------------------------------------------------------------------------------------------------------------|
| **Person-centred**                | Biography, preferences, strengths, culture and the right to refuse are first-class data, not settings.        |
| **Independence-first**            | Use the lowest safe level of assistance that still enables participation; independence is a measured outcome. |
| **Memory-assistance-first**       | Externalise memory where it helps, instead of forcing the person to recall or be tested.                      |
| **Life-integrated**               | Cognitive stimulation extends into meaningful everyday activity, not only into on-screen games.               |
| **Longitudinal**                  | Compare the person primarily with their own trustworthy baseline, not a population norm.                      |
| **Measurement-integrity-first**   | A poor-quality observation may never become a pseudo-clinical signal.                                         |
| **Caregiver-as-first-class-user** | Summaries answer what changed, what matters and what to do — and treat attention as scarce.                   |
| **Culturally adaptive**           | Language, kinship, food, music and local references shape the interaction; culture is data, not a skin.       |
| **Offline-capable (by horizon)**  | The *architecture* keeps core daily functions able to survive intermittent and absent connectivity. This is a **Horizon B/C commitment** whose seams (event-sourced writes, idempotency, entity versioning, a sync-shaped API) are built into Horizon A now; the offline *engine* — local replica and on-device inference — is built later. Horizon A itself is online, server-side. See `tech-stack.md` §4, §21. |
| **Evidence-grounded**             | Medical claims are separated from personal facts and from AI hypotheses, and are tagged by strength.          |
| **Human-supervised**              | High-consequence decisions remain with authorised humans; safety-critical paths are deterministic.            |
| **Dignity-preserving**            | No shaming, no infantilising, no forced testing, no default always-on surveillance.                           |

### 4.1  Product boundaries — what this is, and is not

These boundaries are architectural, not merely legal. They are enforced structurally in later sections (the Safety Gateway, the three-layer output contract, the Memory Firewall and rule-based emergency paths), and they reflect current clinical-decision-support expectations that a professional can independently review the basis of any recommendation — its inputs, methods, validation and patient-specific information \[R16\].

| **The platform IS**                                              | **The platform is NOT**                                            |
|------------------------------------------------------------------|--------------------------------------------------------------------|
| Personalised cognitive-care and memory-assistance infrastructure | An autonomous dementia diagnostic or staging system                |
| Adaptive cognitive stimulation + life-integrated activity        | A claim that game scores equal cognitive recovery                  |
| A tool that reduces caregiver cognitive load                     | A surveillance dashboard with unlimited alerts                     |
| Longitudinal evidence prepared for human review                  | A replacement for clinician judgement                              |
| Consent-aware family / CHW / clinical coordination               | A system where caregivers automatically own the person's data      |
| Offline-capable daily support                                    | A promise that every advanced model runs offline                   |
| A bounded AI system with explicit uncertainty                    | An autonomous prescriber, therapist, banker or emergency authority |

## 5. End-to-End Solution Architecture

There is one canonical architecture, not several competing ones. It is a stack of layers, each with a single responsibility, held together by a cross-cutting trust plane and a connectivity plane. The person and the three supporting roles enter at the top through role-specific experiences; every layer beneath is shared. Reading the stack downward is reading the operating loop of Section 1 turned into components.

![](images/fig-01-architecture.png)

Figure 5.1 — The canonical layered architecture. Trust & safety is cross-cutting and cannot be bypassed; the connectivity plane keeps the daily experience independent of the cloud.

The layers, and why each exists:

| **Layer**                          | **Canonical responsibility**                                                                                                                         |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Role experiences**               | One simple interface per human role — person, caregiver, CHW, clinician.                                                                             |
| **Interaction & language**         | Voice-first, picture-first delivery; the tiered language strategy; the cultural-ontology binder; accessibility.                                      |
| **Personal World Model**           | The stable, relational representation of the person's life, with provenance and uncertainty.                                                         |
| **Intelligence engines**           | The reusable engines: stimulation compiler, personal baseline, measurement integrity, meaningful-change, contextual behaviour support, independence. |
| **Bounded agentic layer**          | One orchestrator selecting bounded capability modules under policy — not a swarm of autonomous agents.                                               |
| **Agentic RAG**                    | Consent-scoped, multi-mode retrieval and evidence fusion with conflict and completeness checks.                                                      |
| **Data spine**                     | Graph, temporal, vector, relational and object stores plus an append-only audit log.                                                                 |
| **Trust & safety (cross-cutting)** | Consent, Memory Firewall, role scoping, the deterministic Safety Gateway, emergency rules, audit, encryption.                                        |
| **Connectivity plane**             | Offline core plus connectivity-enhanced intelligence and sync, including the CHW sync-mule.                                                          |

### 5.1  One representation, not five overlapping “cores”

Earlier work in this project named several apparently separate cores — a memory graph, a digital twin, a cognitive-state model, a memory vault, a personal profile. Consolidating them is one of the most important refinements in this document. There is **one** central representation, the Personal World Model (Section 6). Within it, the Personal Memory Graph is the relationship/event/memory view, the Personal Baseline is the longitudinal-statistics view, and the dynamic state is the current-context view. They are facets of one model, not independent systems. We explicitly reject “cognitive digital twin” as a claim — it implies simulating a brain — and where a longitudinal state estimate is genuinely useful we build a clearly research-fenced Personal Cognitive State Model with explicit uncertainty (Section 25), never a diagnosis.

> **Major architectural refinement**
>
> **Do not build thirteen autonomous LLM agents.** Use one policy-aware orchestrator plus bounded capability modules and a deterministic safety engine. It is safer, easier to test, cheaper to operate and more coherent — and it keeps the emergency and medication paths rule-based, where no language model stands between a fall and an alert. (Developed in Section 16.)

## 6. The Personal World Model

The Personal World Model (PWM) is the central representation of the person's observable life context, and the substrate from which memory assistance, personalisation, routines and longitudinal interpretation are all derived. It is deliberately **not** a simulated brain and **not** a diagnostic model. It is the answer to a simple question the whole system keeps asking: what is true about this person's world, how do we know it, and how sure are we?

![](images/fig-02-personal-world-model.png)

Figure 6.1 — The Personal World Model as a single hub. Every domain feeds one representation; every fact carries a provenance envelope.

The domains it holds, and why each matters:

| **Domain**         | **Examples**                                                  | **Why it earns its place**                                     |
|--------------------|---------------------------------------------------------------|----------------------------------------------------------------|
| Identity           | Preferred name, honorific, communication style                | Dignity, and correct address in every interaction              |
| Biography          | Occupation, hometown, major life events                       | The substrate for meaningful reminiscence and activity         |
| Relationships      | Family, friends, caregivers, clinicians                       | People are retrieved through relationships, not keyword search |
| Places             | Home, clinic, market, familiar routes                         | Orientation and safe-return support                            |
| Routines           | Waking, meals, prayer, rest, sleep, medication                | Daily scaffolding and prospective-memory support               |
| Preferences        | Music, food, activities, topics, people                       | Engagement and adherence — the activation key for apathy       |
| Function           | Tasks done independently; where assistance is needed          | Independence optimisation and change detection                 |
| Cognitive profile  | Relative strengths and difficulties; personal baseline        | Choosing the right activity today; interpreting change         |
| Culture & language | Language, kinship system, local references                    | Comprehension, dignity, and valid measurement                  |
| Care context       | Goals, caregiver availability, care tasks                     | Coordination across a multi-person, multi-city care team       |
| Dynamic state      | Current activity, recent interactions, engagement, deviations | The time-varying view the intervention engine reads            |

### 6.1  Provenance — every fact declares where it came from

Consider a single stored fact: “Rina is the person's granddaughter.” It matters enormously whether the person said it, a caregiver reported it, a clinician confirmed it, a document recorded it, or the AI inferred it. These are not equivalent, and the system must never silently promote an inference to a fact. Every important item therefore carries a **provenance envelope**: its source, timestamp, validity interval, confidence, verification status and visibility. A caregiver-reported relationship spoken with certainty and an AI-inferred one spoken with hedging are different objects with different rights to be asserted.

| **Source**         | **Meaning**                                                            | **Verification status** |
|--------------------|------------------------------------------------------------------------|-------------------------|
| Patient-reported   | Supplied by the person themselves — authoritative about their own life | reported → verified     |
| Caregiver-reported | Observation or report from a caregiver                                 | reported                |
| Clinician-verified | Confirmed by an authorised professional                                | verified                |
| Document-derived   | Extracted from a trusted record                                        | reported / verified     |
| Observed           | Captured as an interaction or event                                    | observed                |
| AI-inferred        | A hypothesis generated from data — never silently promoted to fact     | inferred                |

### 6.2  Time, uncertainty and conflict

Facts are time-scoped. A medication, caregiver, address, routine or appointment can change, so retrieval uses valid-time semantics: what was true, when it became true, when it stopped, and who verified it. This is a patient-safety mechanism, not metadata hygiene — a medication stopped in June must never be retrieved as current in August because its validity interval has closed. Uncertainty is represented explicitly rather than rounded away, and conflict is preserved rather than resolved by fiat: when two family members disagree about a fact, both statements remain, each with its provenance, until an authorised human verifies which is current. Generative retelling — the system putting a memory into words — is permitted only over facts marked verified; anything reported or unverified is spoken with hedging or withheld, and the system never generates fictional personal memories or AI imagery of real people. This is the structural answer to the single most dangerous failure mode in the category: fabricated memories presented as truth.

## 7. Memory and Daily-Life Assistance

Memory assistance is one of the two entry points the problem statement names, and it is the interface through which the person most often meets the system. It should be **contextual external memory**, not a reminder list. The difference is the difference between a system that fires an alarm and one that helps the person act.

A conventional reminder says: “Doctor appointment, 4 PM.” The Personal World Model lets the system say something the person can actually use:

> Standard reminder “Doctor appointment 4 PM.”
>
> Contextual assistance “Today is Tuesday. Your appointment with Dr. Barua is at
>
> 4 o'clock. Anu is taking you — she usually comes after
>
> tea. Shall I remind you again when she is leaving?”
>
> → confirmation captured; if unconfirmed twice, caregiver nudged

Every reminder carries who, what, when, why and — where verified — who is accompanying the person, and asks for a confirmation rather than assuming success. But context must be bounded: the system shows the least that helps, never invents a detail, and adapts rather than repeats. The capabilities and their safety rails:

| **Capability**      | **What the system does**                                               | **Safety rail**                                     |
|---------------------|------------------------------------------------------------------------|-----------------------------------------------------|
| Contextual reminder | Who + what + when + purpose + accompaniment where verified             | No invented details; confirmation captured          |
| People memory       | Relationship and familiar context for “who is this?”                   | Verified sources only; hedge when confidence is low |
| Recent-event recall | Summarise recent events in simple language                             | Time-stamp and source attached                      |
| Orientation         | Day, place, next event — woven in, never quizzed                       | Low cognitive load; no test framing                 |
| Repeated questions  | Answer → reassure → simplify → visual cue → optional caregiver support | Never shame; dignity constraint enforced            |
| Task memory         | Break a task into single steps on request                              | Minimum sufficient assistance (Section 12)          |
| Life memory         | Photos, stories, music, voices, events                                 | Consent and Memory-Firewall access controls         |

### 7.1  Repetition-aware assistance

Repetitive questioning is one of the most exhausting everyday realities of dementia care, and the wrong response — “you already asked me that” — damages the relationship. The system detects repetition of the same intent and entity within a rolling window and **adapts the response** rather than repeating text flatly, escalating modality only when the pattern is persistent and useful. Repetition is treated as a context signal, never as a diagnosis; the repetition count is also one of the cheapest, most language-agnostic longitudinal signals the whole system has, and it is directly meaningful to caregivers (“one or two a day in June, five to seven a day in August”).

> Person: “What time are we leaving?” [4th time in 40 minutes]
>
> n = 1 “The appointment is at 4 o'clock.”
>
> n = 2–3 “It's at 4 o'clock, and Anu is taking you. There's time for tea.”
>
> n ≥ 4 “You're thinking about the appointment — it's at 4, and Anu is
>
> taking you. I'll remind you again at 3.” + a written-note cue,
>
> and a silent note to the caregiver.
>
> NEVER “You already asked me that.”

### 7.2  Daily-life routine (the adaptive day)

Daily-life assistance is where independence is actually kept or lost, so routine is an **adaptive plan, not a fixed timetable of alarms**. It can move, shorten, substitute or skip items in response to context, and it never introduces a medical item a clinician did not author. If the person is still asleep at the usual breakfast time it waits rather than waking them; if fatigue is high it shortens and simplifies; if a routine step has failed three days running it flags an emerging functional change rather than nagging harder. The design intent is that the platform lives inside the person's life instead of forcing the person to manage an app.

## 8. The Adaptive Cognitive Studio

The cognitive-gaming requirement is the heart of the official problem statement, and it receives the deepest treatment — but not as a library of translated puzzles. NICE recommends group cognitive stimulation therapy (CST) for mild-to-moderate dementia and cognitive rehabilitation / occupational therapy to support function \[ESTABLISHED, R1\]; digital CST shows benefits on some cognitive and psychosocial outcomes while remaining heterogeneous and short-term \[PROMISING, R5\]; computerised cognitive training shows moderate memory benefits in MCI and dementia, with tablet delivery tending to perform better \[PROMISING, R7\]. The design implication is a Studio built on CST **principles** — implicit learning, opinions over facts, no failure — delivered as a personalised engine, with claims kept measured and evaluated in pilot.

### 8.1  A compiler, not a catalogue

Two people in scope — a 66-year-old retired Assamese schoolteacher with mild impairment and reading glasses, and an 81-year-old Khasi former jhum farmer with no formal schooling, moderate hearing loss and a matrilineal family — do not differ by a difficulty slider. They need a different activity, in a different modality, in a different language, about different content, at a different time of day. So the Studio is a **Cognitive Stimulation Compiler**: it takes the cognitive target, current ability and fatigue, sensory constraints, language tier, biography and interests, prior engagement and desired duration, and emits a short, personalised activity. The person never has to understand the adaptation; they simply find the activity meets them where they are. Difficulty is targeted to a roughly 75–85% success band — high enough to protect dignity and self-efficacy, low enough to stimulate, and stable enough that the resulting ability trace is usable as a longitudinal signal rather than a flat ceiling \[HYPOTHESIS: the exact band is a pilot question\].

### 8.2  Cognitive domains, grounded in NER life

The Studio spans the cognitive domains below, but the content that fills each template is bound to the person's own culture and biography — this is what makes “culturally inclusive” an engineering property rather than a claim. The same template (“Who is standing beside you here?”) binds to this person's own photograph; “Which festival is this?” binds to this community's calendar. One template set, many cultural bindings.

| **Domain**                  | **NER-grounded activity**                                                        | **Modality**    |
|-----------------------------|----------------------------------------------------------------------------------|-----------------|
| Episodic / autobiographical | “Whose wedding was this?” from family photos; village-event recall               | Picture + voice |
| Semantic                    | Sort local market items — bhut jolokia, khar, bamboo shoot, joha rice            | Picture + touch |
| Working memory              | “Two things for the market — rice and mustard oil” → confirm after a distraction | Voice           |
| Prospective                 | “After tea, we'll water the tulsi — I'll ask you then.”                          | Voice           |
| Attention                   | Find the red flower in the garden photo; count the ducks in the pond             | Picture         |
| Executive / sequencing      | Order the steps of making pitha; plan a market trip; the steps of the loom       | Touch / voice   |
| Language                    | Name the tools; “tell me about this festival”; fluency in the person's language  | Voice + picture |
| Visuospatial                | “Which path goes to the church?” on a familiar-landmark photo set                | Picture         |
| Orientation                 | Day–season–festival anchoring on the agricultural and festival calendar          | Voice           |
| Reminiscence                | Bihu, Borgeet, Khasi hymns, Mizo choral, church hymns; family stories            | Music + voice   |

Reminiscence and music deserve emphasis: music-based intervention has \[PROMISING\] evidence for reducing agitation, melody memory is often preserved late, and occupation-grounded activity (the paddy or jhum cycle, weaving, tea, teaching) restores role identity — the antidote to being “the patient.” Kinship must be pluggable per community: Khasi, Garo and Jaintia societies are matrilineal, and a memory model that hard-codes patrilineal assumptions produces factually wrong, culturally offensive prompts.

### 8.3  Ambient cognitive stimulation — the strongest single idea

Cognitive stimulation should not mean “sit in front of a screen for twenty minutes.” The person's everyday life is itself the richest stimulation substrate, and weaving prompts into what the day already contains is likely the platform's most meaningful differentiator \[HYPOTHESIS, a headline research question\]. Cooking exercises sequencing and semantic memory while preserving a real skill; the walk to the market rehearses the route home (doubling as safe-return practice); a family photograph on the wall exercises episodic memory and starts a conversation; the radio hour becomes music memory and mood regulation. Ambient prompts are generated by the same compiler, rate-limited by the Attention Budget, always skippable, never framed as tests, and flagged “naturalistic” so they are weighted differently from structured sessions in the baseline.

> **The measurement boundary that governs the whole Studio**
>
> **Game performance ≠ cognitive improvement ≠ functional improvement ≠ quality-of-life improvement.** These are separate outcomes in the product and in the research protocol. Improving a game score does not mean dementia has improved, and the system never says or implies that it does. The Studio's honest purpose is stimulation, engagement, meaningful activity, reminiscence, sustained participation and support for function and quality of life.

### 8.4  Therapeutic, not competitive

The dignity constraints are part of the specification. Prohibited by design: leaderboards, ranks, visible scores, streaks, countdown timers, failure sounds, red crosses, “wrong,” comparisons to other users, difficulty labels, and losing progress. Required by design: participation acknowledged before correctness; errorless-learning-style cueing before any correction; repetition with no hint that it is repetition; a graceful exit at any point; a caregiver-visible summary of engagement rather than score; and a session that always ends on a success.

## 9. The Personalization Engine

Personalisation is not a feature bolted onto the Studio; it is a layer the whole platform reads before it does anything. Every engagement, reminder, activity and summary is filtered through what is known about this person, at the level it was recorded, with no inference across attributes. The engine answers eight questions, and the answers together decide what the person actually experiences.

| **Layer**               | **The question it answers**                                           |
|-------------------------|-----------------------------------------------------------------------|
| **Cognitive**           | Which activity type and difficulty are appropriate right now?         |
| **Functional**          | What can the person still do independently, and where is help needed? |
| **Biographical**        | What familiar content is meaningful to this particular person?        |
| **Cultural / language** | What language, examples, names, music and interaction style fit?      |
| **Sensory**             | Can the person hear, see and interact reliably at this moment?        |
| **Contextual**          | What is the current fatigue, routine and engagement context?          |
| **Longitudinal**        | What has actually worked for this person before?                      |
| **Caregiver**           | What support is realistically available today?                        |

The intervention engine then ranks options by evidence strength, safety, intrusiveness, degree of personalisation and expected usefulness — deliberately **not** by engagement. Cognitive stimulation is one intervention class among several the platform can select from: guideline-aligned activity and reminiscence; physical activity prompts (never dosed); social connection; personal music and calming routines; environmental adjustments; functional task support; and caregiver skills at the moment of need. Non-pharmacological options come first, consistent with NICE guidance for distress in dementia \[ESTABLISHED, R1\], and the medical branch — medication and disease-modifying therapy — is visible to the platform but never selected by it. The formal objective the engine maximises is meaningful engagement, independence, wellbeing, human connection and caregiver capacity, minus risk, intrusiveness and caregiver attention consumed, subject to safety, privacy, autonomy, dignity, valid consent and adequate measurement quality. Two consequences are visible in the product: **independence is scored as a gain**, so the system is penalised for doing things the person could still do themselves; and **caregiver attention is a cost**, so an alert must buy more value than the attention it spends.

## 10. Personal Baseline and Measurement Integrity

This section contains the platform's core scientific safeguards, and for NER they are not stylistic preferences but the only defensible way to measure. The two ideas work together: compare the person to themselves, and never trust an observation you cannot certify.

### 10.1  Personal Baseline — compare the person to themselves

The conventional question — “how does this person compare to a population norm?” — is actively harmful in this population. Cognitive instruments are education- and language-sensitive, and NER has the lowest average formal education among people 60+ in India \[ESTABLISHED, R27\] together with widespread dominant-language mismatch. Population-normed scoring therefore systematically mislabels exactly these people. The within-person question — **“how is this person changing relative to themselves?”** — removes the single largest source of measurement bias in this exact region. Importantly, the personal baseline **complements** clinical assessment; it does not replace diagnosis. Clinical assessment, personal baseline, functional observation, caregiver information and context work together, and the baseline's job is to establish what is normal for this particular person across cognitive activity, routine, memory queries and repetition, task completion, engagement, and voluntarily provided signals such as sleep.

At first contact there is no baseline — the cold-start problem. The system handles it honestly: in days 0–3 the CHW and family provide a retrospective baseline through structured informant questions; days 1–14 are an explicit calibration period with higher session frequency, wide item sampling, plain “we are still learning what is usual for her” messaging, and no cognitive alerts above a low informational level (safety events always remain live); from day 15 the rolling within-person baseline is active, and confidence rises with observation count and measurement quality.

### 10.2  Measurement Integrity — certify before you interpret

Before the phrase “performance declined” is allowed to mean anything, the system must certify that the observation was valid. This is the **Measurement Integrity Engine** (the name we adopt over the earlier “Measurement-Quality Engine,” because integrity captures both quality and trustworthiness of the inference). It computes a per-observation quality score and, crucially, **refuses to interpret low-quality data**.

> **Two-name note (canonical, per `CLAUDE.md` §0.3).** *Measurement Integrity* is the **product / human-facing** name for this engine; **Measurement-Quality Engine (MQE)**, with its quality score `q ∈ [0,1]`, is the **system / code** name (it lives in `app/cognition/mq.py`). They are one engine, not two. The same doubling applies to *Contextual Behaviour Support* (product) / **Behaviour Cause-Reasoning Engine** (code), introduced in §11. Both names are correct; never introduce a third. We reviewed the alternative and found none defensible: remote-monitoring and passive-sensing evidence consistently reports weak reference standards, limited external validation, and privacy and usability gaps \[RESEARCH-STAGE, R13\], which is exactly why unvalidated signals must not silently drive alerts.

| **Quality dimension**   | **Checked how**                                                                       | **Effect if poor**                                          |
|-------------------------|---------------------------------------------------------------------------------------|-------------------------------------------------------------|
| Audibility              | Device volume, on-device noise estimate, ASR confidence, repeat-requests              | Downweight; prompt a hearing check; flag for the CHW        |
| Visibility              | Brightness/contrast, font scale, error pattern typical of visual difficulty           | Downweight; prompt a vision check                           |
| Language match          | Session language vs the person's best language; code-switch and comprehension markers | Flag language_mismatch — never counted as cognitive failure |
| Fatigue                 | Time since waking, session-position effect, a two-tap self-report                     | Downweight; end the session                                 |
| Assistance / coaching   | Caregiver-present flag; anomalous latency–accuracy pattern                            | Tag assisted; excluded from the ability estimate            |
| Device / data integrity | Missing sensor windows, power-outage gaps, app version                                | Explicit insufficient-data state — never treated as decline |
| Subject identity        | Session confirmation on shared family devices                                         | Discard if unconfirmed                                      |

This is the mechanism behind one of the platform's most memorable behaviours: when the volume is low, or the hearing aid is unused, or the session ran in the wrong language, the system **declines to score** and explains why — and raises a **measurement** action (“her hearing aid appears unused; performance data is unreliable until this is resolved”) rather than a cognitive alarm. The Clinical Bridge prints a measurement-confidence line on every summary, which is what lets a clinician trust the system's silence as much as its signals. Sensory correction matters as measurement hygiene, not as a cognition claim — the ACHIEVE trial found no significant overall cognitive effect of hearing intervention, with a prespecified higher-risk subgroup suggesting benefit \[MIXED, R22\].

### 10.3  Meaningful change, not a score dashboard

The platform is not a dashboard of scores. A change becomes meaningful only as a product of several factors, so a single bad session can never raise an alarm:

> **Meaningful change**
>
> **deviation × persistence × measurement integrity × context × actionability × safety**
>
> The system distinguishes normal variation, repeated change, functional deterioration, and possible acute change — and none of these is, by itself, a diagnosis. A caregiver-facing alert requires deviation beyond a threshold, persistence over days, adequate quality (bad data cannot raise an alarm), novelty, and a concrete safe action that exists — unless a deterministic safety rule fires first.

## 11. The Change and Context Engine

When a meaningful change is detected — or when distress, withdrawal or agitation is observed — the question is never “what is the cause?” but “what might be contributing, and how confident are we?” The engine that answers this is the **Contextual Behaviour Support Engine**. We adopt this name over the earlier “Behaviour Cause-Reasoning Engine” deliberately: the former promises support and possibility; the latter over-claims causal inference the system cannot and must not make.

### 11.1  Possible contributors, never a cause

Behavioural change in dementia is usually a signal of an unmet need, not a free-standing symptom, and NICE guidance is to assess possible causes — including pain, delirium and inappropriate care — and to try psychosocial and environmental approaches before pharmacological ones \[ESTABLISHED, R1\]. The engine therefore generates **ranked possible contributors** from a fixed clinical taxonomy — physical (pain, constipation, urinary problems, hunger, thirst, fatigue), iatrogenic (a new or changed or missed medication), acute and infective, sensory and environmental, circadian, psychological, and communicative — binds each to the observations that support it, and states explicitly where it has no data. It then offers the least-intrusive safe response from a guideline-aligned checklist, monitors, and escalates when risk or persistence warrants a human. It says “possible contributing factors include…”, never “the cause is…”.

Invisible physical problems are a particular focus, because in dementia they surface indirectly through behaviour. Pain is often uncommunicated and is read as “behaviour,” so the engine surfaces a comfort-change pattern and puts comfort checks first, never asserting “the patient has pain.” Hearing and vision loss masquerade as confusion, withdrawal and inattention, so a sensory-context check runs before any failure is interpreted. Nutrition, hydration and continence are handled as pattern-to-prompt, with dignity built into the phrasing — “Would you like to visit the bathroom before bed?”, learned from the person's own pattern, delivered privately and skippable, never “you are incontinent.”

### 11.2  Acute change and the delirium safety rule

The single most important clinical safety rule in the system is that a sudden deterioration is **never** attributed to “dementia progressing.” Sudden change in a person with dementia may reflect delirium — precipitated by infection, dehydration, a medication effect or hospitalisation — which is often reversible and carries worse outcomes if missed \[ESTABLISHED, R15\]. A dedicated Acute Change Detector watches for a rapid onset (within roughly 72 hours), a multi-domain deviation beyond an acute threshold, and reports of a fluctuating course, new inattention or altered arousal. When these coincide it escalates immediately, bypassing the usual attention budget, with a template that names treatable causes and asks for same-day assessment — and explicitly says it is not a diagnosis.

### 11.3  From deviation to the right human — the escalation ladder

| **Level**             | **Trigger pattern**                                                                                              | **Who is told**                                   |
|-----------------------|------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| L0 — Normal           | Within the person's baseline                                                                                     | Nobody                                            |
| L1 — Informational    | Single-day deviation, low persistence                                                                            | Logged; visible on request                        |
| L2 — Monitor          | 3+ days, single domain, quality OK                                                                               | Caregiver weekly digest                           |
| L3 — Caregiver action | Multi-domain deviation, or a behaviour change with a plausible comfort cause                                     | Caregiver, same day, with a checklist             |
| L4 — Clinical review  | Persistent multi-week change with functional impact; medication concern; repeated falls                          | Caregiver + CHW; teleconsult suggested            |
| L5 — Urgent           | Sudden severe confusion (possible delirium); fall with injury; geofence breach with no contact; crisis statement | Caregiver + CHW + emergency contacts, immediately |

Both kinds of error are stated honestly rather than hidden. False positives (from fatigue, noise, language mismatch, a visitor, a festival week) are attacked with quality gating, a persistence requirement, the attention budget, and a caregiver “this was expected” button that widens the baseline. False negatives (slow uniform decline, low engagement, caregiver under-reporting) are attacked with multi-signal redundancy, explicit low-data warnings and scheduled CHW visits independent of alerts — and the interface states plainly that the absence of an alert is not a clinical clearance.

## 12. The Independence Engine — Minimum Sufficient Assistance

The platform's objective is not maximum assistance; it is **maximum safe independence**. Over-assistance is a real harm: when a caregiver or a system does a task the person could still do, the person loses the ability faster — learned dependence. So the system uses the **lowest level of assistance that enables safe, successful completion**, and escalates only on observed need. We call this Minimum Sufficient Assistance, expressed as an independence gradient.

![](images/fig-03-independence-gradient.png)

Figure 12.1 — The independence gradient. Assistance escalates only when a lower level fails or safety requires it, and de-escalates as the person regains capability.

For a task as ordinary as making tea, the system first reminds, then cues the next step, then guides the sequence, then assists, and involves a caregiver only when the lower-support strategies fail or safety requires it — it does not begin with “let me do it for you.” The same gradient applies to memory retrieval, routines, cognitive activities, navigation and communication. It extends naturally to apraxia, where the person knows the goal but cannot execute the sequence: the platform decomposes the task into single guided steps (pick up the toothbrush; put toothpaste on it; turn on the tap) rather than taking the task over. Computer vision could eventually support this, but the buildable version is guided step sequences, not sophisticated vision. Because independence is scored as a gain in the intervention objective (Section 9), the whole system is structurally biased toward giving the person back as much of the task as they can safely keep — and autonomy is runtime behaviour, not a setting: if the person refuses an activity, the system respects the refusal, offers an alternative or a later retry, and reserves safety escalation for defined risk conditions.

## 13. The Caregiver Copilot

The caregiver is a co-primary user, not a stakeholder, and the deliverable they need is **compression**, not visibility. A caregiver does not want forty charts and thirty alerts; they want to know what happened today, what changed this week, why it might be happening, what to check now, what can wait, what to ask the doctor, and whether any of it is significant — in their own language. The Copilot answers exactly those questions and nothing more.

> TODAY — Aitâ (Mrs. Bora) Tue 8 Sep
>
> Cognition near her usual pattern
>
> Mood quieter than usual
>
> Sleep ↓ 2 wakings (usual: 1)
>
> Meals lunch partly left
>
> Activity ~30% below her own average (3rd day)
>
> Medication ✓ all confirmed
>
> Repeated Qs 6× about Rina's visit
>
> WORTH YOUR ATTENTION
>
> Activity and sleep have both been below her usual pattern for 3 days.
>
> Possible contributors we can see: sleep disruption; the routine change
>
> since Monday. This is not a diagnosis.
>
> WHAT YOU CAN DO NOW
>
> • Check basic comfort: pain, thirst, toilet, constipation, warmth
>
> • Keep this evening quiet and low-light
>
> • Call Rina before dinner — she asked 6 times today
>
> • If this continues past Thursday, or worsens suddenly, contact the AAM
>
> [ Why am I seeing this? ] → 3 observations + confidence + sources

The Copilot's outputs obey the same three-layer contract as the rest of the system — a clearly separated statement of **fact** (with sources and confidence), **hypothesis** (possible contributors, labelled as such, “this is not a diagnosis”), and **action** (a concrete, safe, guideline-aligned next step) — and it never offers a diagnosis, a prognosis or medication advice. It also carries the platform's honesty about accusatory beliefs and other hard moments: when a person accuses a caregiver of hiding their money, the Copilot reassures the caregiver, explains the mechanism without blame, offers practical strategies, and routes to Tele-MANAS (14416) for the caregiver's own support.

### 13.1  The attention budget, and caregiver cognitive load

An alert-happy platform produces a caregiver who ignores alerts — which is worse than no platform, because it manufactures false reassurance. This is a product-induced harm, and we treat it with the seriousness of a clinical one. Alerts are ranked by severity, confidence, actionability, urgency, caregiver preferences and prior usefulness, and interruptions are budgeted — at steady state, at most about one L3-or-above interruption per week plus a weekly digest, with the daily card always available on pull, and L4/L5 bypassing the budget. Suppressed items are never discarded: they are logged, shown in the digest and audited, because a suppression policy without an audit is a missed-alarm generator. Every alert carries three buttons — “Useful,” “Expected — there was a reason,” “Not useful” — and the middle one writes a context annotation (festival, visitor, travel, illness) that widens the household's baseline tolerance, turning alert-tuning from an engineering guess into a per-household learned policy. The explicit co-objective is to reduce the caregiver's remembering, decision, search and repeated-explanation burden — measured as caregiver cognitive load, not app usage.

## 14. The CHW Companion — the NER Unlock

In NER, care is delivered through community health workers — ASHA, ANM and Community Health Officers at Ayushman Arogya Mandirs — and the provider-assisted model is how rural digital health actually works: over 93% of eSanjeevani usage is provider-assisted \[ESTABLISHED, R20\]. A dementia platform that talks only to patients and families is architecturally mismatched to how the region functions. So the CHW is a first-class user. The binding risk is workload: task-shifting and train-the-trainer models support low-resource CST delivery, but Indian evidence shows digital tools can become both support and burden \[PROMISING, R12\], so the platform must **reduce** the CHW's administrative load, not add to it.

| **Stage**                 | **What the CHW Companion does**                                                     | **Design rule**                                |
|---------------------------|-------------------------------------------------------------------------------------|------------------------------------------------|
| Before a visit            | An offline, prioritised queue of households that need attention — not raw analytics | Which households, and why, in one screen       |
| During a visit            | A short, guided, dementia-aware observation and care-task script                    | ≤10 minutes per household; taps and voice only |
| After a visit             | An automatic structured summary                                                     | No duplicate data entry; no parallel register  |
| When connectivity returns | Encrypted sync of only the necessary events                                         | The CHW is a courier, not a reader (sync-mule) |
| Escalation                | Route a concise concern to the authorised care team                                 | The CHW decides whether to book a teleconsult  |

Two roles are distinctive to NER. First, **onboarding**: for non-literate elders and low-resource-language communities, a trusted local person is the only realistic path in. Second, the **sync-mule**: in the 1,841 villages without coverage, the CHW's phone physically carries encrypted, sealed deltas — which it cannot read — to a point with connectivity and uploads them, so a village with no network still contributes to the longitudinal record. The CHW is never asked to be a diagnostic agent or a passive-sensor operator; the whole workflow is designed so that the tool means less unnecessary work, better continuity and clearer escalation. Whether ≤10 minutes per household is achievable within existing duties is the single highest-risk assumption in the rural model, and it is the first question the pilot answers.

## 15. The Clinical Bridge

The clinician does not need ten thousand interactions; they need the five findings that change management, prepared for a fifteen-minute teleconsult. The Clinical Bridge compresses weeks of home observation into structured longitudinal evidence along the three axes the Alzheimer's Association diagnostic guidance requires — function, cognitive-behavioural pattern, and likely underlying context \[ESTABLISHED, R18\] — always with provenance, measurement confidence, and an explicit statement of what it is not.

> LONGITUDINAL SUMMARY — 12 weeks Prepared 8 Sep 2026
>
> FUNCTION (informant + observed)
>
> IADL: money handling now needs help (new since ~July)
>
> ADL: independent; dressing order occasionally prompted
>
> COGNITIVE / BEHAVIOURAL PATTERN
>
> Repeated questions 1–2/day (Jun) → 5–7/day (Aug) [caregiver + system]
>
> Orientation events 0 (Jun) → 3 (Aug) [system]
>
> Activity ↓ ~25% vs personal baseline [session telemetry]
>
> Sleep interruptions 1→3/night (3 wks) [caregiver log]
>
> CONTEXT / POSSIBLE CONFOUNDERS
>
> New antihypertensive started 12 Aug (caregiver-reported)
>
> Hearing aid not in use since ~Jul ← measurement quality reduced
>
> Routine change: daughter travelled 1–14 Aug
>
> MEASUREMENT CONFIDENCE moderate (hearing aid unused; 6 low-audio sessions)
>
> WHAT THIS IS NOT not a diagnosis, a stage, or a cognitive test score
>
> SUGGESTED QUESTIONS FOR THIS CONSULT
>
> 1. Could the 12 Aug medication change be contributing?
>
> 2. Is a delirium/infection screen warranted given the sleep change?
>
> 3. Referral for audiology — hearing-aid non-use?
>
> 4. Is formal cognitive assessment indicated now?

The clinician accepts, corrects or annotates — and those corrections are training signal for the baseline and alert models, so the human-in-the-loop is also the learning loop. The Bridge integrates with India's digital-health rails rather than rebuilding them: it is designed to hand its pack to the provider-assisted eSanjeevani workflow and to attach to the person's ABDM/ABHA record under consent \[R19, R20\]. Where a specialist has already initiated disease-modifying therapy — a narrow, high-monitoring indication for early Alzheimer's \[ESTABLISHED, narrow\] — the platform takes over the logistics (infusion and MRI-monitoring schedules, travel planning, a caregiver watch-list) and escalates any watch-list symptom to the treating specialist, but never interprets a biomarker or adjusts a treatment. Blood-based Alzheimer's biomarkers are increasingly useful in specialist care but are an aid within a comprehensive evaluation, not a standalone test \[ESTABLISHED, specialist setting, R17\]; the platform stores and presents clinician-provided results and never infers a diagnosis from them.

## 16. Bounded Agentic Intelligence

A single model with one prompt cannot simultaneously hold a warm, non-correcting persona for the person, a clinically cautious register for the caregiver, a provenance-strict register for the clinician, hard emergency rules, and different data-access scopes per audience. Attempting it produces exactly the failure WHO warns of for large multimodal models in health — inaccurate, incomplete or biased output, plus automation bias \[R3\]. But the answer is **not** a swarm of thirteen autonomous agents talking to each other, which multiplies the surface for unbounded behaviour. The answer is **one orchestrator + bounded capability modules + a deterministic safety engine**.

The logical capabilities — memory, cognitive activity, routine, contextual behaviour, caregiver, clinical, social, navigation, personalisation, retrieval and escalation — are bounded modules, each with a defined scope, an allowed set of tools, an explicit list of forbidden actions, evidence and confidence requirements, an escalation path, and full auditability. The orchestrator decides which capability should respond, and in what order; the modules never bypass the safety plane. Two rules are structural, not stylistic:

> **Two structural rules for AI in this system**
>
> **The emergency and medication paths are rule-based, not model-based.** No language model stands between a fall and an alert, or decides anything about a medication. Deterministic rules cannot be softened by a model.
>
> **An AI inference is never silently written as a fact.** Retrieval, explanation, ranking and hypothesis generation are AI's proper jobs; asserting a personal fact, claiming a treatment effect from a score, declaring a cause, or making an irreversible care decision are not.

### 16.1  Where AI is used, and where it must not be

The discipline is to use the least complex technology that reliably solves each problem — “AI everywhere” is an architectural failure mode. Reminders and schedules are rules; permissions and consent are a policy engine; audit is deterministic logging; relationships are a graph; temporal change is statistics; activity ranking is rules plus light machine learning; natural-language retrieval, caregiver summarisation and clinical compression use large models under retrieval and evidence constraints; speech uses ASR/TTS with constrained dialogue; and intervention optimisation is research-only, beginning offline under human-defined constraints. For each capability the same questions are answered explicitly: why is AI needed, what exactly does it do, what does it not do, what data does it require, what can go wrong, what deterministic safety gate exists, and what human oversight applies.

| **Capability**       | **AI may**                                   | **AI must not**                                |
|----------------------|----------------------------------------------|------------------------------------------------|
| Memory               | Retrieve and explain in natural language     | Invent, or silently change, a memory           |
| Cognitive Studio     | Rank and select activities; adapt difficulty | Claim a treatment effect from a score          |
| Routine              | Phrase and decompose tasks                   | Alter a medication regimen; override refusal   |
| Contextual behaviour | Generate ranked possible contributors        | Declare a cause or a diagnosis                 |
| Caregiver            | Summarise, prioritise, suggest safe actions  | Make an irreversible care decision             |
| Clinical             | Compress evidence with provenance            | Replace clinician judgement; stage or prognose |
| Personalisation      | Rank safe options                            | Optimise solely for engagement                 |
| Emergency / safety   | (nothing — this path is deterministic)       | Be in the emergency decision path at all       |

## 17. Agentic RAG — the Knowledge Architecture

“Agentic RAG” is used here as an engineering necessity, not a buzzword, because the platform genuinely holds different kinds of knowledge that need different retrieval strategies. Consider a caregiver asking, “Why has Aitâ been more agitated this week?” A naive pipeline — embed the query, search a vector store, prompt a model — fails in five specific ways: it has no notion of this week versus her usual; it cannot traverse relationships; it will happily retrieve a medication stopped in June; it may blend a clinical guideline with a caregiver's note as if both were equally authoritative; and it has no way to say “we don't know.”

The platform separates knowledge into six layers that are never merged unlabelled — clinical evidence (K1), the person's own world (K2), caregiver observations (K3), local NER services and resources (K4), the temporal event history (K5), and research literature for clinician-facing depth (K6) — and routes each query to the right retrieval mode: graph for relationships, temporal for what changed, structured for exact facts, vector for semantic recall, clinical-evidence retrieval by tier, and geospatial for local services. Access to each layer depends on role, consent and purpose, and the Memory Firewall is applied **before** retrieval, not after.

![](images/fig-04-agentic-rag.png)

Figure 17.1 — The Agentic RAG pipeline. The consent scope filter runs before retrieval; conflicts are reported, gaps are named, and generation is bound by the fact/hypothesis/action contract before the Safety Gateway delivers with provenance.

Evidence fusion groups results by claim and attaches source, timestamp, tier and confidence. A conflict-resolution policy applies an explicit hierarchy — for clinical facts, guideline over systematic review over trial over observational; for personal facts, most-recent-verified over reported over unverified — but never silently picks a winner: disagreement is reported. A completeness check then names what has **no** data, so that “we don't know about her bowel pattern, temperature or urinary symptoms” is part of the answer. Only then does generation proceed, under the three-layer fact/hypothesis/action contract, and pass the Safety Gateway. The result for the agitation question is a response that is useful, sourced, bounded, honest about its gaps, and contains no diagnosis and no drug advice — the standard for every clinical-adjacent output in the system.

## 18. NER Language and Cultural Intelligence

Cultural inclusion is the differentiator the problem statement asks for, and it is a clinical variable, not a marketing one. Getting it wrong does not merely reduce appeal — it corrupts measurement: culturally alien items have unknown difficulty and produce failure that looks like agnosia or decline. So “culturally inclusive” cannot mean an English app machine-translated into Assamese, Khasi and Mizo. It means a **cultural ontology per community**: language, dialect and register (how elders are addressed); the kinship system (matrilineal Khasi and Garo differ fundamentally from patrilineal norms); food, crops and cooking sequences; music and folk forms; festivals and the agricultural calendar; places and landmarks; occupations; the objects a 78-year-old actually recognises; and interaction norms — indirectness, honorifics, what is impolite to ask. Item templates reference slots, not values, so one template set produces culturally correct activities across eight-plus communities. The most directly applicable evidence is an Indian participatory-design study of conversational systems for dementia, whose design brief we adopt: kind tone and appreciative language, robustness to local accents and noise, task-based rather than open-ended interaction at greater impairment, and clinic-based familiarisation to build trust \[ESTABLISHED, R11\].

### 18.1  The tiered language strategy

This is the most important engineering-honesty decision in the document, and it separates three things that are routinely conflated: language-technology availability, clinical suitability, and dementia-specific validation. A model that can synthesise a language does not make it clinically ready. So capability is tiered by what can honestly be delivered today, while the corpus that unlocks tomorrow is built in the field.

| **Tier** | **Languages**                                      | **Person-facing capability today**                                                                                       |
|----------|----------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| A        | Assamese, Bengali, Hindi, English, Nepali          | Full voice conversation, voice games, voice reminders (production ASR/TTS via AI4Bharat / Bhashini)                      |
| B        | Bodo, Meitei, Mizo                                 | Voice output (TTS or recorded human voice) + touch/picture input; a small fixed-intent command grammar                   |
| C        | Khasi, Garo, Kokborok, Nyishi, Adi, Nagamese, Pnar | Human-recorded voice packs + picture-first UI + caregiver/CHW-mediated interaction; audio recorded, not transcribed live |

A system that claims Khasi voice AI in 2026 will fail in the field and discredit the whole platform; a system that ships human-recorded Khasi prompts with picture-first interaction today, while building the corpus that makes Khasi ASR possible tomorrow, is both usable now and a genuine research contribution. Code-mixing (Assamese–English, Nagamese–English, Mizo–English) is treated as normal, never as a language error, and elder honorifics — Aitâ, Koka, Kong, Bah, Pi, Nu — are selected per community, never generically. The platform builds on India's public-good language stack (Bhashini, AI4Bharat) and NE-specific models on AIKosh, which keeps it affordable and avoids paid ASR \[R26\].

The interface is designed for low literacy, low digital familiarity, sensory impairment, multilingual use and older adults: voice-first, picture-second, text-last; a single screen with no more than five primary choices; large touch targets; and a layout that never changes, because the one cohort for whom learning a new interface is definitionally hard is this one. Voice and audio are the primary channel, the app is the secondary channel, and the CHW is the human channel.

## 19. Offline-First and Space Technology

For NER, connectivity is a product requirement, not an optimisation — 1,841 villages have no mobile coverage \[ESTABLISHED, R23\]. The architecture is therefore designed as **offline core plus connectivity-enhanced intelligence**: the target is that the person's entire daily experience can run with zero network, while the cloud adds explanation, coordination and clinical output on top.

> **Horizon discipline (canonical, per `CLAUDE.md` §4 and `tech-stack.md` §4).** The offline core described in this section is a **Horizon B/C commitment**, not a Horizon-A deliverable. What we build *now* (Horizon A) is the online, server-side system and the **seams** that make offline non-destructive later: event-sourced writes, idempotency keys, entity versioning, provenance on every fact, and a sync-shaped API. The **local replica and on-device inference come in Horizons B and C** and require no rewrite because the audit/provenance layer we build for safety *is* the event-sourcing foundation for sync. When this document speaks of the daily experience "running offline", read it as the architecture's committed target, delivered by horizon — not as a claim about the current build.

We are explicit that not every advanced capability can ever run offline — open-ended large-model dialogue, full RAG synthesis, clinical compression and model updates require connectivity — and we mark those features with their sync age rather than pretending otherwise.

![](images/fig-05-offline-core.png)

Figure 19.1 — Offline core versus connectivity-enhanced intelligence. The daily experience never depends on the cloud; sync is opportunistic, with a CHW sync-mule for uncovered villages.

Synchronisation is a delta of append-only events, not state, and last-writer-wins is forbidden for clinical facts: a caregiver and a CHW disagreeing about a medication is information to preserve, not a merge error. Every caregiver and clinical view prints “data as of …”, so stale data is never presented as current. In the target architecture, the whole daily experience — activities, personal-memory retrieval, orientation, routine, repetition detection, on-device baseline updates, voice output, geofence evaluation, and the lock-screen emergency and safe-return cards — runs on an entry-level Android device with a pre-downloaded content pack, targeting a shared family phone in the ₹7–12k class. *(This is the Horizon B/C mobile deliverable; the Horizon-A build serves the same experience server-side to the Next.js web client, with the sync seams already in place.)*

### 19.1  Space technology — an honest triage

The listed theme is Space Technology while the category is Software; we treat this as a taxonomy artefact and refuse to fabricate relevance. Naming the difference between forced and reasoned integration is itself a signal of seriousness. Space technology is an enabling layer, never the product identity.

| **Directly useful (deployable)**                                                                                                                                                                           | **Rejected as forced**                                                                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| Satellite-backhauled sync and teleconsults at remote AAM/GP sites — a live dependency in NER, where remote gram panchayats have been connected under BharatNet using ISRO GSAT-11/GSAT-19 capacity \[R24\] | Satellite imagery for cognitive assessment — no plausible mechanism                                       |
| Geospatial care-accessibility modelling (travel-time isochrones to the nearest capable facility) — a dementia care-access deficit map for MDoNER as a planning deliverable                                 | Space-based “monitoring” of elderly individuals — surveillance framing, dignity harm, no added capability |
| GNSS / NavIC-assisted safe-return where cellular positioning is weak — consent-gated                                                                                                                       | Satellite-enabled AI diagnosis — diagnosis is not a connectivity problem                                  |
| Disaster-resilient continuity (floods, landslides, seismic risk) for the emergency card and care plan; satellite hazard feeds tied to routine adaptation                                                   | Blockchain-on-satellite health records — solves nothing here; adds cost and failure modes                 |

One reality check keeps the proposal credible: LEO satellite broadband (Starlink, Eutelsat OneWeb, Jio-SES) is licensed in India but was not commercially live as of mid-2026 \[R25\], so it is a future accelerant, not a design assumption. MindMitra must be fully useful with zero connectivity today; if and when LEO service goes live it upgrades sync frequency and enables video teleconsults in the uncovered Arunachal villages — it does not change the core architecture.

## 20. Trust, Consent, Safeguarding and the Memory Firewall

Privacy and safeguarding are part of the core architecture, not a compliance appendix. A platform that holds a vulnerable person's memories, relationships, location, routines and health observations, and that hands one caregiver total, unaudited control over all of it, is an abuse-enabling artefact — and financial exploitation and elder abuse are recognised risks in dementia \[ESTABLISHED, R21\]. The design axiom is blunt: **the caregiver is not automatically the owner of the person's digital life.**

### 20.1  The Memory Firewall

The Memory Firewall is a product-level policy boundary that decides what may be remembered, retrieved, disclosed, modified or acted upon, for each role and purpose. It combines consent, role-based access, purpose limitation, time-bounded sharing, provenance, audit, revocation, encryption and patient-private zones — and it is evaluated at retrieval time, before any data is fetched. Not all of the person's information is automatically visible to a caregiver; some is private to the person; continence and intimate-care data are private by default; and live location is never a routine query — a caregiver can request a live position only during an active safety event, and that request is itself logged and visible in the person's record. This single design choice converts a surveillance tool into a safety tool.

| **Data class**             | **Person**      | **Primary caregiver**            | **CHW**          | **Clinician** |
|----------------------------|-----------------|----------------------------------|------------------|---------------|
| Life-story memories        | own             | yes                              | —                | —             |
| Person-private notes       | yes             | —                                | —                | —             |
| Routine & activity         | yes             | yes                              | visit-scoped     | summary       |
| Continence / intimate care | yes             | yes                              | if care-relevant | yes           |
| Behaviour observations     | summary         | yes                              | yes              | yes           |
| Medication list            | yes             | yes                              | yes              | yes           |
| Location events            | yes             | events                           | events           | —             |
| Live position              | yes             | only during active L4/L5, logged | —                | —             |
| Financial information      | — not collected | —                                | —                | —             |
| Raw audio / video          | — not collected | —                                | —                | —             |

### 20.2  Consent under changing capacity

Consent is per-purpose (games, memory, location, wearable, clinical sharing, research), independently revocable, and delivered in the person's language. Where capacity is present, it is the person's own informed consent. Where capacity fluctuates, supported decision-making re-affirms consent at each escalation of data scope, and the person's prior expressed wishes are a first-class object. Where capacity is lost, proxy consent operates with audit and constraint: a proxy cannot expand scope beyond what the person previously permitted for non-safety purposes, and expanding a sensitive scope requires a two-key acknowledgement (proxy plus CHW or clinician). At every stage the person's veto on content — “don't show me this” — is honoured. The legal frame is India's Digital Personal Data Protection Act, 2023, the ABDM consent architecture, institutional ethics review, and India data residency \[R28, R19\].

Safeguarding is designed in, not bolted on: an immutable audit log visible to the person and a designated second family member; anomaly detection on caregiver behaviour (repeated attempts to expand scope, disabling the person's veto, suppressing clinician contact) surfaced to the CHW; multi-caregiver disagreement rendered as shared evidence with provenance rather than adjudicated by the system; and a documented pathway to statutory safeguarding channels where abuse is suspected — never an automated accusation. Every outbound message passes a deterministic Safety Gateway that checks role-fit, blocks diagnosis and medication language, requires provenance on every factual clause, labels uncertainty, enforces the fact/hypothesis/action contract, applies a dignity check, routes crisis language to Tele-MANAS and a human, and cannot be softened by the model on the emergency path.

## 21. Everyday Life User Journeys

The clearest test of coherence is whether the pieces work together in a real day. Each journey below follows the same arc — input → system understanding → personalisation → engine → safety check → output → human action → learning — and every one is drawn from the engines already described.

A morning, end to end

At 7:30 the system greets the person by name with the day and weather, and — because it knows her routine — offers to begin, rather than announcing a deviation. During dressing it waits, then offers a single cue (“your blue sweater is on the chair”) before any further step: minimum sufficient assistance in action. Breakfast is offered at her usual time as a question, not a command. A cognitive moment is a family photograph, not a puzzle; when she answers a name wrongly, there is no alarm and the activity simply adapts. Through the afternoon the system notices lower engagement, shorter responses and restlessness after a poor night — checks measurement quality, finds the audio good and the pattern persistent, and does **not** diagnose. It tells the caregiver: a noticeable change from her recent pattern, with poor sleep and possible discomfort as visible contributors, and a request to check how she is feeling. The evening summary is one card: routine complete, meals normal, activity and sleep below her usual for three days, no urgent event.

Twelve scenarios, traced to engines

| **Scenario**                        | **What happens, and which engines act**                                                                                                                                                                                                          |
|-------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 Repeated family question          | Verified relationship retrieval → repetition-aware ladder → pre-committed reminder at n≥4 → repetition count enters the baseline. (Memory, Caregiver)                                                                                            |
| 2 Adaptive cognitive session        | Compiler reads ability, fatigue, time of day → integrity pre-check → within-session scaffolding → ends on a success; performance stored apart from clinical outcomes. (Cognitive Studio)                                                         |
| 3 Poor hearing, not decline         | θ drifts, but 6 of 14 sessions had low audio and the hearing aid is unused → the system refuses to raise a cognitive alert and raises a measurement action + audiology referral. (Measurement Integrity)                                         |
| 4 Persistent baseline deviation     | Deviation → integrity and context checks → within-person comparison → persistence check → a caregiver summary, not a diagnosis. (Baseline, Change)                                                                                               |
| 5 Unusual agitation                 | Ranked possible contributors bound to evidence → least-intrusive support → monitor → escalate only if risk or persistence warrants. (Contextual Behaviour Support)                                                                               |
| 6 Sudden change (possible delirium) | Onset within hours, multi-domain, fluctuating → L5, attention budget bypassed, delirium template → CHW arranges same-day assessment; a UTI is found and treated; the dip is re-baselined, never recorded as progression. (Acute Change Detector) |
| 7 CHW visit, offline village        | Offline prioritised queue → guided ≤10-min visit → local storage → sealed encrypted deltas carried out by sync-mule → uploaded at coverage. (CHW Companion)                                                                                      |
| 8 Preparing for a consult           | 12-week pack assembled with measurement confidence and four prepared questions → handed to eSanjeevani/ABDM → clinician annotates → annotations update the baseline. (Clinical Bridge)                                                           |
| 9 No connectivity for 11 days       | Everything person-facing continues; the event log grows locally; a catch-up digest is marked “gaps present — interpret with care”; no inference is made from the gap. (Offline core)                                                             |
| 10 Patient refuses an activity      | Refusal respected → alternative offered → later retry → no penalty, no safety pathway unless a defined risk condition applies. (Independence, autonomy)                                                                                          |
| 11 Possible wandering               | Geofence exit with no caregiver → gentle route-home guidance + caregiver notified with last-known area → escalation chain → offline safe-return card; never locked in, never shamed. (Safety, rule-based)                                        |
| 12 Conflicting memory               | Two sources disagree → conflict preserved with both provenances → an authorised human verifies → only then is a fact promoted to verified. (PWM provenance)                                                                                      |

## 22. Product Surfaces and What the User Sees

There is one platform with role-specific experiences over a shared intelligence core — not four unrelated apps. The person experiences a single, simple, voice-first application; the architecture beneath it is invisible to them. The caregiver, CHW and clinician each receive a purpose-built surface, and an administrative console handles consent, audit and governance.

![](images/fig-06-product-surfaces.png)

Figure 22.1 — One platform, role experiences. The person sees one app with a few modules and never encounters “agents,” “RAG” or a score.

Inside the person's app, the modules are My Day (orientation, routine, memory answers, activity launch, voice), Cognitive Studio (adaptive activities), Memory & Life (photos, stories, people, events), and Daily Routine. The person never sees agents, retrieval, scores, streaks, notification badges or a settings icon, and the layout never changes. The person's home screen is deliberately spare:

> ┌────────────────────────────────────────────────┐
>
> │ Good morning, Aitâ ☀ 24° │
>
> │ Tuesday, 8 September │
>
> │ │
>
> │ Rina is visiting this afternoon. │
>
> │ │
>
> │ ┌────────┐ ┌────────┐ ┌────────┐ │
>
> │ │ ♫ │ │ ▣ │ │ ✿ │ │
>
> │ │ Songs │ │ Family │ │ Let's │ │
>
> │ │ │ │ photos │ │ do … │ │
>
> │ └────────┘ └────────┘ └────────┘ │
>
> │ ┌────────┐ ┌────────┐ ← big, always │
>
> │ │ ☎ │ │ ● │ in the same │
>
> │ │ Call │ │ Talk │ place │
>
> │ │ Rina │ │ to me │ │
>
> │ └────────┘ └────────┘ │
>
> └────────────────────────────────────────────────┘

The caregiver receives the Copilot (Section 13), the CHW receives the Companion (Section 14), the clinician receives the Bridge (Section 15), and authorised staff use a Trust & Safety console for consent, policy, audit and model/version governance. Each surface shows only what consent and the Memory Firewall permit — one truth, role-specific views. Where the same longitudinal reality is presented to more than one role, the platform is doing what it does best: turning the person's own life into different, appropriate, provenance-carrying views for the different humans who support them.

![](images/fig-07-shared-care.png)

Figure 22.2 — The four roles share one longitudinal care model; each sees only its permitted view.

The *mechanism* that turns one event into these four views — the typed Evidence & Projection Pipeline and the role projection builders — is specified in `tech-stack.md` §13.2. The *visual and interaction design* of each surface, screen by screen, is authoritative in `DESIGN.md` (Parts B–D). The *information contract* — precisely what each role receives, what is withheld, and how a report is governed — is Section 23, next.

## 23. The Four-Role Information Contract

This is the load-bearing section of the whole product, and the one most often skipped: exactly what each of the four humans receives, what is deliberately withheld from them, and how every piece of derived information is governed on its way out. It is the product-level statement of the invariant *one governed evidence base, four purpose-bound projections* (`CLAUDE.md` invariant 12). The *mechanism* is `tech-stack.md` §13.2 (the Evidence & Projection Pipeline) and §19.1 (the Firewall over derived information); the *interface* is `DESIGN.md` Parts B–D. This section is the contract those two implement.

### 23.1  Why four roles receive different information

The four roles are not four audiences for one report. They hold four different responsibilities, and information follows responsibility:

| Role | Responsibility | Therefore receives | The question its first screen answers |
|---|---|---|---|
| **Person** | To live their day with dignity and as much independence as is safe | Companionship, orientation, memory assistance, cognitive experiences from their own life, reminders, encouragement | *"What can I help you do right now?"* |
| **Caregiver** | To act — or to know they need not | **Compressed change**: what happened, what changed, whether to act, what can wait | *"How is she today? What changed? Do I need to do anything?"* |
| **CHW** | To prepare a visit and decide on escalation | **Operational context**: what changed since the last visit, what to check, whether to refer | *"What do I need to know before this visit, and what should I check?"* |
| **Clinician** | To interpret, diagnose, prescribe, decide | **Longitudinal evidence with provenance**: what changed, when, how persistent, how trustworthy, what confounds it, what is unknown | *"What changed since the last review, and how trustworthy is it?"* |

They receive **different derived information because they hold different responsibilities — never different truths**. Two projections of the same evidence may differ in detail, register and completeness; they may never contradict each other. A caregiver projection may *omit* what a clinician sees, but it may not *assert* something the clinician's projection denies.

### 23.2  What is deliberately withheld from each

Withholding is a designed act, not an omission, and it is enforced by the Memory Firewall's `project()` decision over derived artefacts (`tech-stack.md` §19.1), not by prompt discipline.

| Role | Never receives | Why |
|---|---|---|
| **Person** | Scores, alerts about themselves, medical framing, statistics, "you failed", any test framing | Dignity; the person is never made to feel measured or diagnosed |
| **Caregiver** | Unrestricted private memories, raw telemetry, every game interaction, raw model state, speculative AI conclusions, surveillance-like streams, continence detail in a shared family view | Compression, not visibility; the caregiver is not automatically the owner of the person's digital life |
| **CHW** | Every interaction, irrelevant personal memories, unrestricted clinical records, unnecessary sensitive data, raw AI reasoning | Operational relevance; visit-scoped, not household-surveillance |
| **Clinician** | Opaque AI scores, raw telemetry as the *entry point*, any diagnostic conclusion generated by the system | Evidence-first, never a black-box verdict; the clinician integrates, the system does not |
| **Researcher** | Life-story content (excluded unconditionally), and anything without a separate research consent | The research boundary is one-way and governed; some data never leaves the person's scope |

### 23.3  From one interaction to four projections — the governed path

A single event never becomes one generic report copied to everybody. It becomes a `CertifiedObservation`, and from that, separate role projections — each independently authorised, safety-gated and audited (`tech-stack.md` §13.2):

```
RAW INTERACTION  →  STRUCTURED EVENT  →  [MEASUREMENT INTEGRITY GATE]  →  CERTIFIED OBSERVATION
   →  PERSONAL MODEL UPDATE  →  MEANINGFUL-CHANGE / NEED ENGINE  →  CONTEXT + PROVENANCE
   →  [MEMORY FIREWALL: project(role, purpose, consent, time)]  →  ROLE-SPECIFIC PROJECTION
   →  [SAFETY GATEWAY: 10 checks + fact/hypothesis/action]  →  DELIVERY POLICY (class + budget)
   →  DELIVERY  →  ACKNOWLEDGEMENT  →  AUDIT
```

**The forbidden shortcut** — `raw event → LLM → everyone gets a report` — does not exist in the architecture, and neither does `game score → cognitive score → diagnosis`. There is no shorter path than the one above, and none may be added.

**Worked example — one completed memory activity, third comparable session in a fortnight showing more assistance used:**

| Role | Projection | Delivery |
|---|---|---|
| **Person** | *"You did well with that one. Would you like to try another?"* — no change in framing, no hint of assessment | in-session |
| **Caregiver** | *"Activities are being completed. She has been using a little more help with names this fortnight. Nothing to do right now — worth mentioning at the next visit."* | weekly digest, **not** an interruption |
| **CHW** | Added to the next visit checklist: *"Ask about names / word-finding; confirm hearing-aid use."* | visit prep, no push |
| **Clinician** | *"Three comparable sessions over 14 days show increased assistance requirement relative to her own baseline; measurement confidence moderate (2 of 3 had reduced audio). Caregiver reports no change. No clinical interpretation offered."* | since-last-review pack, no notification |

Same evidence; four registers; no contradiction; one governed source. And if the same sessions had `q < q_min` (volume down, wrong language), **no projection is generated for any role** — a measurement action goes to the caregiver and CHW, and the clinician's pack records the gap.

### 23.4  The report taxonomy

Every report type the platform produces, with its governance attributes. Reports are **derived views, not frozen documents** (`tech-stack.md` §18.1): each carries provenance and an expiry, and disappears if its evidence is revoked. **Delivery class** is the notification behaviour (`tech-stack.md` §22.1); it is orthogonal to the L0–L5 escalation level. `INSUFF →` states what happens when evidence is insufficient.

**Person-facing** (never medicalised; never derived from the baseline as a comparison):

| Report | Trigger | Min. evidence | AI? | Delivery | INSUFF → |
|---|---|---|---|---|---|
| Session feedback | end of activity | the session itself | phrasing | in-session | warm neutral close |
| Daily orientation | on open / request | calendar + routine | phrasing | in-flow, no notification | states what is known |
| "What happened today" | evening / pull | the day's episodes | summarise | pull | "a quiet day" |
| Contextual reminder | scheduled | a confirmed future event | rules | spoken, in-flow | not fired |
| Encouragement | specific true success | one verified success | phrasing | in-session | omitted (never faked) |

**Caregiver-facing:**

| Report | Trigger | Min. evidence | Human review | Delivery class | INSUFF → |
|---|---|---|---|---|---|
| Daily care summary | scheduled | day's certified observations | no | `NO_NOTIFICATION`, on pull | "some data missing today" |
| Weekly digest | scheduled | the week | no | `INFORMATIONAL` | states gaps; no interpolation |
| Meaningful-change alert | change engine (L3) | deviation × persistence × quality | no (rules) | `ACTION_REQUIRED` | **not generated** |
| Assistance-needed insight | support-need engine | certified pattern | no | `ACTION_REQUIRED` | not generated |
| Behavioural-context insight | Contextual Behaviour Support | contributors bound to evidence | no | `ACTION_REQUIRED` | contributors + explicit "no data on" list |
| **Measurement action** | MQE gate failure | *the failure itself* | no | `INFORMATIONAL` | *is itself the insufficiency output* |
| Safety alert / escalation | deterministic rules | the safety event | no | `URGENT` / `EMERGENCY`, budget-bypassing | fires regardless |
| "Nothing needs attention" | absence of the above | a normal day | no | `NO_NOTIFICATION` | **is** the output |
| Consult-prep pack | request / appointment | ≥ some certified evidence | clinician later | `INFORMATIONAL` | pack states its own gaps |

**CHW-facing:**

| Report | Trigger | Min. evidence | Delivery class | INSUFF → |
|---|---|---|---|---|
| Visit-preparation brief | scheduled visit | since-last-visit changes | `INFORMATIONAL` | "no reliable data since last visit" (itself a finding) |
| Changes since last visit | change engine | certified change | `INFORMATIONAL` | states the gap |
| Function / routine summary | scheduled | routine confirmations | `NO_NOTIFICATION` | — |
| Unresolved needs / follow-up | follow-up register | prior visit | `INFORMATIONAL` | — |
| Referral / escalation suggestion | ladder (L4) | persistent change | `ACTION_REQUIRED` | not generated |
| Clinical communication packet | CHW decision | the assembled evidence | on demand | carries its own confidence line |
| Household flag (L5) | delirium / safety rule | the acute pattern | `URGENT`, bypassing | fires |

**Clinician-facing** (all `NO_NOTIFICATION` except L5 — the clinician is never alerted below L5):

| Report | Trigger | Min. evidence | INSUFF → |
|---|---|---|---|
| Since-last-review summary | review / clinician opens | window of certified observations | renders with a low-confidence banner + gaps section |
| Meaningful-change summary | change engine | deviation × persistence × quality | not generated; the gap is stated |
| **Measurement-quality report** | always attached | the quality scores | *is* the insufficiency output |
| Functional / cognitive trajectory | scheduled | ≥ n certified observations | trend suppressed below n; "insufficient observations" |
| Behaviour & context summary | Contextual Behaviour Support | contributors + evidence | contributors + "no data on" list |
| Caregiver / CHW observations | informant entries | the entries | labelled informant-only |
| **Contradictions register** | conflict detection | ≥ 2 conflicting sources | — |
| Confidence / provenance summary | always attached | provenance envelopes | — |
| Unresolved questions | completeness check | the completeness pass | — |
| L5 clinical-relevance alert | delirium / acute change | the acute pattern | `URGENT`, bypassing |

**The rule that runs through every row:** a report that cannot meet its minimum evidence at adequate measurement quality is **not fabricated to fill the slot** — it either states its own gap or is not generated, and where the gap is itself actionable (a measurement action), *that* is the output.

### 23.5  The canonical information-sharing matrix

This extends §20.1's ten-class table to the full set of information classes, with default visibility, consent requirement, purpose binding, sensitivity, retention and notification eligibility. It is the single source of truth for the Memory Firewall's `evaluate()` (raw data) and, combined with §23.4, for `project()` (derived information). *Legend: ✅ permitted · ⛔ denied · △ conditional (guard named) · — not collected. "Notif?" = may this class ever drive a notification to that role.*

| Information class | Person | Primary CG | Secondary CG | CHW | Clinician | Research | Default | Consent | Sensitivity | Retention | Notif? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Personal memories (life-story) | ✅ own | ✅ | ✅ | ⛔ | ⛔ | ⛔ | private-to-circle | per-purpose | high | until withdrawn | no |
| Family relationships | ✅ | ✅ | ✅ | △ care | ✅ summary | ⛔ | care-circle | onboarding | medium | until withdrawn | no |
| Activity completion | ✅ | ✅ | ✅ | △ visit | ✅ summary | de-id | care-circle | games | low | rolling | no |
| Activity **performance** | ⛔ score | ✅ trend | △ trend | △ visit | ✅ per-domain | de-id | derived-only | games | medium | rolling | no (person) |
| Assistance level | ⛔ | ✅ | △ | ✅ | ✅ | de-id | care-circle | games | medium | rolling | caregiver only |
| Response latency (raw) | ⛔ | ⛔ | ⛔ | ⛔ | △ drill-down | de-id | system-internal | games | low | rolling | no |
| Cognitive-domain observations | ⛔ number | ✅ plain | △ | ✅ | ✅ | de-id | derived-only | games | medium | longitudinal | no (person) |
| **Measurement quality** | ⛔ | △ context | ⛔ | ✅ | ✅ | de-id | system + clinical | — | low | longitudinal | measurement action |
| Routine | ✅ | ✅ | ✅ | △ visit | ✅ summary | de-id | care-circle | memory | low | rolling | caregiver |
| Sleep (reported) | ✅ | ✅ | △ | ✅ | ✅ | de-id | care-circle | memory | medium | rolling | no |
| Behaviour observations | summary | ✅ | ✅ summary | ✅ | ✅ | de-id | care-circle | memory | medium | longitudinal | caregiver/CHW |
| Emotional / engagement obs. | ⛔ | ✅ summary | △ | △ | ✅ | de-id | derived-only | memory | high | rolling | no |
| Location events | ✅ | ✅ events | events | events | ⛔ | ⛔ | care-circle | location | high | short | no |
| **Live position** | ✅ | △ **active L4/L5, logged** | ⛔ | ⛔ | ⛔ | ⛔ | denied | location | very high | event-only | safety only |
| Medication list | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ | care-circle | clinical share | high | until changed | no |
| Appointments | ✅ | ✅ | ✅ | △ | ✅ | ⛔ | care-circle | memory | medium | until past | reminder |
| Care plan | ✅ summary | ✅ | ✅ | ✅ | ✅ | ⛔ | care-circle | care coord | medium | current | no |
| Caregiver observations | summary | ✅ own | △ | ✅ | ✅ | de-id | care-circle | care coord | medium | longitudinal | no |
| CHW observations | summary | ✅ shared | ⛔ | ✅ own | ✅ | de-id | operational | care coord | medium | longitudinal | no |
| Clinical observations / notes | plain summary | ✅ shared summary | ⛔ | △ relevant | ✅ own | ⛔ | clinical | clinical share | high | per record | no |
| Continence / intimate care | ✅ | △ **not in shared view** | ⛔ | △ care-relevant | ✅ | ⛔ | private-by-default | care coord | very high | current | no |
| Person-private notes | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | person-only | self | very high | until deleted | no |
| Alerts | ⛔ | ✅ | △ digest | △ | △ L5 | ⛔ | derived | — | medium | per policy | yes (by class) |
| Reports / projections | ⛔ | ✅ role view | △ role view | ✅ role view | ✅ role view | ⛔ | derived, role-scoped | — | inherits sources | expiry per §18.1 | by class |
| Generated hypotheses | ⛔ | ✅ labelled | △ | ✅ labelled | ✅ labelled | ⛔ | derived, hedged | — | medium | with report | no |
| Safety events | ✅ | ✅ | △ | ✅ | △ relevant | ⛔ | care-circle | safety | high | retained | yes (L4/L5) |
| Sensitive / intimate info | ✅ | △ | ⛔ | △ | ✅ | ⛔ | private-by-default | explicit | very high | current | no |
| Research data | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | △ **separate consent** | denied | research | varies | study term | no |
| **Financial information** | — | — | — | — | — | — | **never collected** | — | — | — | — |
| **Raw audio / video** | — | — | — | — | — | — | **never collected** | — | — | — | — |

Two rules are absolute and structural, not policy toggles: **financial data and raw audio/video are never collected**, so they cannot leak; and **live position** is available to the primary caregiver only during an active L4/L5 safety event, and that access is itself logged into the person's record. This single design choice is what converts a potential surveillance tool into a safety tool.

## 24. The Core MVP — Narrow but Deep

The MVP proves the central thesis without pretending to be a full clinical platform. It is deliberately **narrow in scope and deep in each capability** — the opposite of a long feature list shipped shallowly. It is buildable on an entry-level Android device using India's public-good language stack, and it is small enough to evaluate in a nine-month, three-district pilot.

![](images/fig-08-mvp-phases.png)

Figure 23.1 — What ships in the MVP, what waits for the platform phases, and what stays fenced in the research frontier. Nothing speculative blocks the buildable core.

The ten MVP capabilities, and what each defers:

| **MVP capability**                            | **Ships now**                                                                   | **Deferred**                       |
|-----------------------------------------------|---------------------------------------------------------------------------------|------------------------------------|
| **Personal World Model**                      | Identity, relationships, biography, preferences, routines, provenance           | Full passive digital twin          |
| **Memory & daily life**                       | Contextual reminders, repetition-aware answers, orientation, task decomposition | Always-on ambient capture          |
| **Adaptive Cognitive Studio**                 | 4–6 activity families, adaptive difficulty, ambient prompts, reminiscence       | A large generated game marketplace |
| **Personal Baseline + Measurement Integrity** | Within-person baseline; validity and confounder checks                          | Clinical-grade digital biomarkers  |
| **Contextual Behaviour Support**              | Rules-only v1 with guideline-aligned checklists; Acute Change Detector (L5)     | Full agentic behaviour reasoning   |
| **Caregiver Copilot**                         | Daily card, weekly digest, high-value alerts, attention budget                  | Complex multi-family optimisation  |
| **Offline core**                              | Cached memory, activity, routine, events; Tier-A voice + one Tier-C voice pack  | Full offline frontier-model parity |
| **Consent + Memory Firewall**                 | Consent objects, role scoping, audit, patient-private zones                     | Federated learning                 |
| **CHW Companion (light)**                     | Onboarding, visit script, sync-mule                                             | Full care-network coordination     |
| **Emergency + safe-return card**              | Offline, lock-screen                                                            | Home-sensor integration            |

> **MVP acceptance criterion**
>
> A person and caregiver should be able to use the system for a realistic week **without understanding the AI**. It should remember accurately, personalise activities, assist routines, explain meaningful changes cautiously, and reduce the caregiver's information-search effort — and it should demonstrably **refuse** to score bad data and **refuse** to say “she has dementia.”

## 25. The Future Platform — Phase 2, 3 and Research

The advanced capabilities are sequenced so that nothing unvalidated ever reaches a user as fact, and nothing speculative blocks the buildable core. The distinction between product and research is strict: emerging or heterogeneous evidence is not converted into clinical claims, and research modules run in shadow — computed and stored, never shown — until measurement reliability and then validity are established.

| **Stage**            | **Capabilities**                                                                                                                                                                         | **Validation gate**                                                                   |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| Phase 2 (platform)   | Full Agentic RAG; richer Caregiver Copilot; Clinical Bridge + ABDM/eSanjeevani; geofence safety; social orchestration; Tier-B constrained voice                                          | Prospective cohort; caregiver-burden, alert-utility and clinician-agreement endpoints |
| Phase 3 (multimodal) | Multimodal speech; optional wearable and passive routine sensing (opt-in); the NER low-resource-language interaction corpus                                                              | Measurement reliability and validity study; no clinical claims released               |
| Research frontier    | Speech / language biomarkers; passive digital phenotyping; personal cognitive-state estimation; personalised intervention policy (rules → bandits → safe offline RL); federated learning | Sequenced discipline: measurement → reliability → validity → association → utility    |
| Clinical validation  | Powered evaluation of change-detection utility; a caregiver-outcome trial                                                                                                                | Peer-reviewed publication; regulatory positioning as clinical decision support        |

Two research directions are worth naming because they are where the platform's science lives, and because both are explicitly fenced. The first is **personal cognitive-state estimation** — inferring a latent per-person state from longitudinal observations and context, with uncertainty and missingness, rather than predicting a disease label. The second is a **personalised intervention policy** — learning which intervention works for this person, in this context — which begins as deterministic rules, becomes per-person statistics, and only much later, under ethics approval and human-defined safety constraints, explores contextual bandits and safe offline reinforcement learning over a whitelisted action set. There is a hard rule: no unrestricted online reinforcement learning on this population, in any phase, under any framing.

## 26. Solution Traceability

Every capability traces back to a stated problem and forward to a measurable benefit and a validation method. The table below is the compressed audit trail from the official problem statement to the mechanism, the AI and non-AI roles, the safety boundary, the benefit and how it will be tested.

| **Problem**                         | **Mechanism**                                                            | **AI role / boundary**                             | **Benefit → validation**                                  |
|-------------------------------------|--------------------------------------------------------------------------|----------------------------------------------------|-----------------------------------------------------------|
| Memory decline                      | Personal Memory Graph + repetition-aware, context-rich reminders         | Retrieval & explanation; no fabrication            | Independence → recall/task study                          |
| Confusion; delirium risk            | Continuous orientation + Acute Change Detector                           | Rule-based emergency path; no progression language | Safer response → delirium detect vs confirmed             |
| Anxiety, behaviour                  | Predictable routine + Contextual Behaviour Support (comfort-first)       | Possible contributors; no causal claim             | Better response → caregiver/clinician adjudication        |
| Cannot monitor continuously         | Personal Baseline + Measurement Integrity + Attention Budget             | Quality models; exclude invalid data               | Lower load → burden + alert-utility + false-positive rate |
| Cannot engage; apathy               | Cognitive Stimulation Compiler + ambient stimulation + cultural ontology | Adaptive ranking; no medical claim                 | Engagement → adherence + validated outcomes               |
| No neurology / therapy access       | Clinical Bridge compression into eSanjeevani/ABDM                        | Evidence compression; human review                 | Continuity → clinician utility + consult time             |
| Social isolation                    | Social orchestration to humans; human-contact metric                     | Facilitate, never substitute                       | Connection → human-contact events/week                    |
| Geography, 1,841 uncovered villages | Offline core + CHW sync-mule + satellite-backhauled AAM sync             | Local inference; sync-age shown                    | Reach → offline continuity days; CHW time                 |
| Cultural inclusivity                | Pluggable cultural ontology + tiered language + Tier-C human voice       | Slot-binding, not translation                      | Fit → comprehension, acceptability, equity spread         |
| Caregiver overload / abuse risk     | Caregiver Copilot + Memory Firewall + audit                              | Compression; scope enforced before retrieval       | Protection → scope-attempt audit; usefulness              |

## 27. Validation and Success Criteria

Success is not AI accuracy and it is not app engagement. The platform is measured by what it enables humans to do — and by an outcome hierarchy in which every level matters more than the one before it. Digital cognitive stimulation and remote monitoring are promising but not mature enough to justify claims from engagement metrics alone \[PROMISING/RESEARCH-STAGE, R5, R13\], so validation is prospective, user-centred and outcome-oriented.

> **The outcome hierarchy**
>
> 1 Engagement — does the person use it?
>
> 2 Cognitive participation — are they meaningfully engaging?
>
> 3 Daily function — can they keep doing meaningful activities?
>
> 4 Independence — does assistance preserve autonomy?
>
> 5 Caregiver burden — is the caregiver less overwhelmed?
>
> 6 Care continuity — are important changes communicated?
>
> 7 Quality of life — is the person's lived experience better?
>
> The north star sits above the whole ladder: **meaningful independence + quality of life + caregiver sustainability** — never app minutes or game scores.

The distinctive metrics — the honest test of whether the platform did what this document claims — are the ones a conventional product would not measure: meaningful engagement (voluntary initiation and neutral-or-positive affect, not sessions completed); assistance-level reduction on an activity of daily living; human-contact events per week (with AI-only interaction share treated as a **risk** indicator, not a success metric); L3-plus alerts per person per week and their caregiver-rated usefulness; the quality-gate and language-mismatch rates; unsafe recommendations and privacy incidents (target zero for both); CHW time per household (must stay ≤10 minutes); and an equity spread that requires no literacy, gender, language-tier or rural stratum to fall below half of the best-performing stratum. A model that works only for literate Assamese-speaking men in a city has failed this problem statement even if its aggregate numbers look good.

### 27.1  The honest evidence-gap register

Some claims we would like to make are not yet ours to make. We state them as hypotheses and will not pitch numbers we have not measured.

| **Claim we would like to make**                     | **Status**     | **What would justify it**                                |
|-----------------------------------------------------|----------------|----------------------------------------------------------|
| Personalised stimulation beats generic stimulation  | \[HYPOTHESIS\] | Randomised comparison on adherence + cognitive endpoints |
| Ambient stimulation improves adherence              | \[HYPOTHESIS\] | Randomised or crossover comparison                       |
| Personal baseline detects meaningful change earlier | \[HYPOTHESIS\] | Prospective cohort with clinician-adjudicated change     |
| Measurement-integrity gating reduces false alerts   | \[HYPOTHESIS\] | Ablation: gated vs ungated alerting on the same data     |
| The platform improves cognition                     | Not claimed    | A powered RCT — not an SIH-timeframe claim               |
| The platform detects dementia                       | Never claimed  | Out of scope by design                                   |

## 28. Research Opportunities

Because the integration layer this document describes is genuinely under-built and under-studied, several of its components are publishable research contributions in their own right — pursued only after the platform establishes measurement reliability, safety, usefulness and cultural fit. The strongest open questions:

| **\#** | **Research question**                                                                                    | **Type**           |
|--------|----------------------------------------------------------------------------------------------------------|--------------------|
| 1      | Does compiler-personalised stimulation outperform fixed programmes on adherence and outcomes?            | RCT                |
| 2      | Does ambient, life-integrated stimulation outperform structured sessions on adherence and distress?      | Crossover          |
| 3      | Does within-person baseline detection identify meaningful change earlier than periodic assessment?       | Prospective cohort |
| 4      | Does measurement-integrity gating reduce false alerts without increasing missed events?                  | Ablation           |
| 5      | Does culturally-generated (vs translated) content improve engagement and measurement validity?           | Within-subject     |
| 6      | Can repetition-question rate serve as a validated, language-agnostic, offline-computable marker?         | Validation         |
| 7      | Does evidence-grounded agentic RAG reduce caregiver information burden versus a chatbot baseline?        | RCT                |
| 8      | Can an offline-first architecture deliver clinically useful longitudinal data in uncovered villages?     | Implementation     |
| 9      | Does an elder-abuse-resistant permission model reduce inappropriate access without harming coordination? | Mixed-methods      |
| 10     | What is the actual prevalence, presentation and care pathway of dementia in each NER state?              | Epidemiology       |

The flagship data asset is a **NER low-resource-language dementia interaction corpus** (Khasi, Garo, Mizo, Meitei, Kokborok, Nyishi, Nagamese) — collected under separate explicit research consent, with community ownership and a right to withdraw, and contributed as a public good to Bhashini/AIKosh where communities agree. It is the resource that makes Tier-C voice AI possible for exactly the communities the problem statement is written for, and it is essentially absent today. Life-story content never leaves the person's scope and is excluded from all research exports; video, continuous audio and financial records are architecturally never collected; annotators are recruited from the language communities themselves, and every model evaluation is disaggregated by language, literacy, gender, age band and rural/urban.

### 28.1  The NER pilot

Phase 1 is 30 person–caregiver dyads across three districts — Assam (both valleys), Tripura and Sikkim — chosen for connectivity feasibility, language-tier coverage and the low-education test case, with at least 40% of participants having no formal schooling. It runs for twelve weeks with a regional medical college or NEIGRIHMS-class institution providing baseline and endpoint assessment and adjudicating “meaningful change,” an ethics committee, a community advisory group including a person living with dementia and a family caregiver, and a data-protection and safeguarding lead. Its first questions are the load-bearing ones: will people in these settings actually use it, and by which modality; **can a CHW sustain it within ten minutes per household**; does the Measurement Integrity Engine reduce spurious signals; do caregivers find the alerts useful; does the sync-mule work; and do families accept the Memory Firewall's deliberate friction — because if they reject it, the answer is to preserve the protection without the friction, not to quietly remove the protection. The scale-up path follows the proven Karnataka and Kerala state-dementia templates toward an NER Brain Health Initiative across the eight states, with MDoNER as convener.

## 29. Final Solution Summary

The whole system reduces to a single conceptual loop, and the final arrow is the point of it: the platform continuously learns the person, not the disease.

![](images/fig-09-intelligence-loop.png)

Figure 28.1 — The single conceptual loop. Human action generates new evidence that updates the Personal World Model, and the cycle repeats.

It solves four connected problems at once, with a fifth layered on for the North East. The person's internal model of their world is becoming unreliable — answered by the Personal World Model, memory assistance, cognitive stimulation and scaffolding. Everyday life becomes progressively harder — answered by contextual assistance, adaptive routine, functional support and the Independence Engine. The caregiver becomes an overloaded external brain — answered by the Caregiver Copilot, shared longitudinal intelligence and the attention budget. Healthcare sees only fragmented snapshots — answered by the personal baseline, measurement integrity, meaningful-change detection and the CHW and clinical bridges. And NER adds geography, connectivity, language, culture and access — answered by offline-first operation, culturally grounded personalisation, voice, the CHW workflow, and a consent-based path into India's digital-health ecosystem.

What makes it fundamentally different from a dementia game app is not a longer feature list; it is the closed-loop intelligence layer connecting memory, everyday activity, cognitive stimulation, personal baseline, caregiver support and clinical continuity — while preserving human agency at every step. Its most important output is not an AI answer but **better human action**: the right reminder for the person, the one thing that changed for the caregiver, the household that needs a visit for the CHW, and a usable longitudinal story for the clinician.

> **What we deliberately refuse to build**
>
> No autonomous diagnosis, staging or prognosis · no autonomous medication changes · no autonomous financial control · no fabricated personal memories or AI images of real people · no unrestricted caregiver access · no default always-on surveillance · no AI “therapist” claiming clinical authority · no alert firehose · no claim that a game score is cognitive recovery · no generic translated game library as “cultural inclusion” · no wearables or IoT for their own sake · no dependence on satellite broadband that is not yet live.

Stated once, plainly: **a consent-aware, offline-capable, evidence-grounded platform that learns a person's everyday world and trusted baseline, provides adaptive memory assistance and cognitive stimulation drawn from their own life, preserves meaningful independence, reduces caregiver cognitive load, detects potentially meaningful change cautiously, and connects the right evidence to the right human at the right time.** And in one more human sentence: we are not building an AI that takes care of a person with dementia — we are building an intelligent layer around the person that helps them stay oriented, engaged, independent and connected for longer, and helps the humans who care for them understand and support them better. The measure of success is not how much of the app the person uses; it is how much of their own life they keep.

References

*Sources verified during preparation. Evidence tiers are assigned in the text where each source is used; the platform distinguishes source-derived fact, design inference, proposed behaviour and research hypothesis throughout.*

**Guidelines and policy**

**R1.** NICE. Dementia: assessment, management and support for people living with dementia and their carers (NG97). National Institute for Health and Care Excellence.

**R2.** WHO. Risk reduction of cognitive decline and dementia: WHO guidelines, second edition, 15 July 2026 — up to 45% of dementia risk attributable to modifiable factors.

**R3.** WHO. Ethics and governance of artificial intelligence for health (2021); guidance for large multi-modal models (2024).

**R16.** US FDA. Clinical Decision Support Software guidance — CDS should expose its basis, inputs, methods, validation and patient-specific information for independent professional review.

**R18.** Alzheimer's Association. DETeCD-ADRD clinical practice guideline — diagnosis characterises functional impairment, cognitive-behavioural syndrome and likely underlying pathology.

**Interventions and digital-health evidence**

**R5.** Efficacy of digital cognitive stimulation therapy for people with dementia: systematic review and meta-analysis. BMC Geriatrics, 2026.

**R6.** Desai R, et al. Effectiveness of cognitive stimulation therapy (CST) for mild-to-moderate dementia. Ageing Research Reviews, 2024.

**R7.** Chan ATC, et al. Computerised cognitive training for memory functions in MCI or dementia: systematic review and meta-analysis. npj Digital Medicine, 2024.

**R8.** Music therapy and agitation in dementia: systematic review and meta-analysis, 2026.

**R9.** Network meta-analysis of non-pharmacological caregiver interventions for behavioural and psychological symptoms — multicomponent interventions highest-ranked.

**R10.** Effects of digital psychological interventions for family caregivers of people with dementia: systematic review and meta-analysis, 2026.

**R15.** Delirium superimposed on dementia in hospitalised older adults: systematic review and meta-analysis; non-pharmacological delirium prevention.

**R17.** US FDA clearance of the first blood test used in diagnosing Alzheimer's disease (2025), explicitly not a standalone screening/diagnostic test; Alzheimer's Association blood-based biomarker guidance.

**R22.** ACHIEVE trial — hearing intervention versus health education to reduce cognitive decline: no significant overall difference, prespecified higher-risk subgroup suggests benefit.

**India and NER context**

**R4.** Lee J, Meijer E, Langa KM, et al. Prevalence of dementia in India: national and state estimates from a nationwide study (LASI-DAD). Alzheimer's & Dementia, 2023 — 7.4% of adults 60+, ≈8.8 million.

**R11.** Lima MR, et al. Cultural Feasibility of Conversational Robots for Dementia Care in India: Participatory Design Study. J Particip Med, 2025 — ~90% diagnosis-and-care gap; tone, accent and noise findings.

**R12.** Caregivers' experiences, challenges and needs in caring for people with dementia in India: scoping review, 2024.

**R27.** Government of India (MoSPI/NSO). Elderly in India 2021 — lowest average years of formal education among 60+: Sikkim 6.2, Mizoram 6.3.

**R28.** Government of India: NPHCE; National Mental Health Programme / DMHP; Tele-MANAS (14416); Digital Personal Data Protection Act, 2023.

**R29.** Analyses of India's National Tele Mental Health Programme — ~38% household digital literacy; ~0.3 psychiatrists per 100,000 against a WHO minimum near 3.

**Health-system, infrastructure and language technology**

**R19.** National Health Authority. Ayushman Bharat Digital Mission (ABHA) — consent-based sharing, federated storage, APIs.

**R20.** eSanjeevani National Telemedicine Service — AB-HWC provider-assisted hub-and-spoke via Ayushman Arogya Mandirs; provider-assisted model \>93% of usage.

**R13.** Advancing remote monitoring for patients with Alzheimer disease and related dementias: systematic review, 2025 — weak reference standards, validation, privacy and usability gaps.

**R14.** AI-driven speech biomarkers in dementia: systematic review — substantial risk of bias; low-resource-language evidence essentially absent.

**R21.** Elder abuse and neglect of persons with dementia: systematic review and meta-analysis; financial exploitation among older people living with dementia: scoping review.

**R23.** The Sentinel (Assam), April 2026 — 1,841 of 45,934 NER villages without mobile coverage as of February 2026; state-wise breakdown; BharatNet service-readiness.

**R24.** BharatNet satellite connectivity for remote NER gram panchayats using ISRO GSAT-11 / GSAT-19 capacity where terrestrial fibre was infeasible.

**R25.** Coverage of Starlink, Eutelsat OneWeb and Jio-SES Indian licences (2026) — authorised but not commercially live as of mid-2026; spectrum and clearance outstanding.

**R26.** Bhashini / AI4Bharat (IndicConformer, IndicTTS, IndicTrans2) and AIKosh NE-specific models (NE-Embed, NE-SpeechEmbed, NE-OCR) for Khasi, Garo, Mizo, Meitei, Bodo, Nyishi, Kokborok and others.

> **Closing note on intellectual honesty**
>
> This document contains established facts, promising evidence, research-stage capabilities and design hypotheses — and it labels which is which. Several claims common in comparable proposals are absent deliberately: we do not claim to detect dementia, to slow decline, to predict progression, or to hold NER-specific prevalence figures. We do claim that the integration layer described here is genuinely missing, is buildable offline on an entry-level Android device, is testable in a 30-dyad pilot within nine months, and is worth building for the eight states this problem statement was written for.

