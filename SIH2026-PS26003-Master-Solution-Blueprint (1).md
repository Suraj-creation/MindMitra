# MindMitra — A Personalised, Culturally-Adaptive Dementia Life-Assistance and Cognitive Care Ecosystem for the North Eastern Region

**Master Solution Blueprint**

| Field | Detail |
|---|---|
| Problem Statement ID | **26003** |
| Title | AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER) |
| Organisation / Department | Ministry of Development of North Eastern Region (MDoNER) |
| Category | Software |
| Theme (as listed) | Space Technology |
| Event | Smart India Hackathon 2026 |
| Document type | Research analysis → solution architecture → product strategy → implementation & validation roadmap |
| Version / Date | v1.1 — 31 August 2026 (adds Part VIII deep-dive appendices) |

---

## Contents

**PART I — PROBLEM**
0. How to read this document (evidence tiers) · 1. Executive Summary · 2. Official Problem Statement and Interpretation · 3. First Principles: Why Dementia Is a Systemic Problem · 4. Complete Problem Taxonomy (A–G) · 5. Hidden Problems and Causal Loops · 6. NER-Specific Problem Landscape

**PART II — EVIDENCE AND GAPS**
7. Literature Review and Evidence Map · 8. Existing Solutions vs Remaining Gaps · 9. Solution Philosophy

**PART III — SOLUTION**
10. Overall Product Vision · 11. Cognitive Gaming Platform (Adaptive Cognitive Stimulation Engine) · 12. Personalised Memory System and Personal Memory Graph · 13. The Other Surfaces (Companion, Dinacharya, Caregiver Copilot, CHW Companion, Clinical Bridge, Social, Transitions, Brain Health)

**PART IV — INTELLIGENCE ARCHITECTURE**
14. Agentic AI Architecture · 15. Personal Baseline and Change Detection Engine · 16. Digital Phenotyping · 17. Multimodal AI and Personal Cognitive State Model · 18. Local Language and Cultural Intelligence · 19. Space Technology Integration (Honest Triage) · 20. Safety Layer and Minimum Necessary Sensing · 21. Alerting, Attention Budget and Escalation · 22. Behaviour Cause-Reasoning Engine

**PART V — TRUST**
23. Privacy, Security, Consent and the Memory Firewall · 24. Responsible AI and the Safety Gateway · 25. Failure Mode Analysis

**PART VI — ENGINEERING**
26. Offline-First and Edge Architecture · 27. Data Architecture and Agentic RAG · 28. Product UX, Journeys and Example AI Interactions · 29. Full Technical Architecture, MVP and Roadmap (incl. SIH 36-hour prototype scope)

**PART VII — PROOF**
30. Validation Framework · 31. NER Pilot Design · 32. Open Research Questions and Dataset Strategy · 33. What Not To Build · 34. Final Critical Evaluation (Red Team) · 35. Final Unified Architecture and Solution Summary

**PART VIII — DEEP-DIVE APPENDICES**
A. Intervention Engine and Evidence-Mapped Intervention Library · B. Care Plan Compiler · C. Personalised Intervention Policy (rules → bandits → safe offline RL) and the Do-No-Harm Objective · D. Clinical Change Context Engine, Treatment-Journey Coordinator and the Multimodal Clinical Evidence Graph · E. Sensitive and Deferred Modules (financial safety, driving, continence dignity, family disagreement) · F. Ten Technological Planes — Alternative Architecture View · G. Information Architecture: Public Site, Patient, Caregiver, Clinician Surfaces · H. Metric Dictionary (product, clinical, research, safety)

**REFERENCES**
36. Research References

**Key tables:** problem taxonomy (§4) · hidden problems (§5) · NER state-wise connectivity (§6.2) · language tiers (§6.3, §18.2) · state challenge matrix (§6.5) · evidence map (§7.1) · existing-solution gaps (§8) · cognitive domain × NER activity families (§11.3) · agent register (§14.2) · escalation ladder (§15.5) · space-tech triage (§19) · role-scope matrix (§23.3) · automation classification (§24.1) · failure modes (§25) · MVP scoring (§29.3) · validation metrics (§30.1) · research questions (§32.1) · red-team review (§34)

---

## 0. How to read this document

### 0.1 Evidence tiers (used throughout, mandatory)

Every substantive claim in this blueprint carries one of five tags. This is not decoration — it is the mechanism that keeps an ambitious system honest.

| Tag | Meaning | What we are allowed to build on it |
|---|---|---|
| **[ESTABLISHED]** | Strong clinical/scientific evidence; reflected in guidelines (WHO, NICE, Alzheimer's Association) | Core product decisions, clinical claims |
| **[PROMISING]** | Real evidence exists (RCTs, meta-analyses) but limited, heterogeneous, or short-term | Product features, with measured claims and in-pilot evaluation |
| **[RESEARCH-STAGE]** | Technically demonstrated, not clinically validated; reference standards weak | Research module, shadow mode, never user-facing as fact |
| **[EXPERIMENTAL]** | Conceptual / future possibility | Roadmap only |
| **[ASSUMPTION]** | Our design premise; requires validation in the NER pilot | Must be listed as a pilot hypothesis |

### 0.2 A rule that governs the whole system

> **AI detects, retrieves, summarises, personalises, prioritises and assists. Clinicians diagnose, prescribe and decide. The person and family retain agency.**

Nothing in the following ~60 pages overrides that sentence.

### 0.3 Naming caveat (an early act of cultural honesty)

We use **MindMitra** (*mitra* = companion) as a working codename. *Mitra* is legible across the Indo-Aryan languages (Assamese, Bengali, Bodo, Nepali, Hindi) — but **not** across Khasi, Garo, Mizo, Meitei, Nyishi, Kokborok or Nagamese, which belong to different language families entirely. A platform that claims cultural inclusivity cannot ship one Indic name to eight states. **Deliverable P0-N1: per-state name and voice persona co-designed with local partners.** This document keeps the codename only for internal consistency.

---

## 1. Executive Summary

### 1.1 What the problem statement asks, and what it actually requires

MDoNER asks for an *AI-based cognitive gaming and memory assistance platform* for elderly dementia patients in NER. Taken literally, that is a games app plus reminders. Taken seriously, the background paragraph in the statement itself describes **six different failing systems**: cognitive decline in the person; anxiety and social isolation; caregivers who cannot monitor or engage continuously; absent specialist neurology and cognitive therapy; geography and infrastructure; and the absence of affordable, culturally inclusive digital therapeutics.

A games app solves roughly one-eighth of what is written in the statement.

Our position: **cognitive gaming and memory assistance are the correct entry point, and a wholly insufficient endpoint.** They are the two things a person with dementia will actually *open*, in a region where nobody will install a "care management system". They are the Trojan horse for the thing that is genuinely missing — a continuous, personalised intelligence layer shared between the person, the family caregiver, the community health worker and the clinician.

### 1.2 The reframe in one sentence

> Dementia is not primarily memory loss. It is the **progressive failure of a person's internal model of their own world** — who they are, where they are, what happens next, who can be trusted — which forcibly transfers that model onto a caregiver who has no training, no tools, no rest and no reliable channel to a clinician, inside a health system that sees the person for twenty minutes every few months, in terrain where those twenty minutes may cost a full day's travel.

The product, therefore, is **not an app the person lives inside. It is an intelligence layer that lives inside the person's life.**

### 1.3 What we propose to build

**Eight surfaces over five engines, one data spine, offline-first, voice-first, in the person's own language and culture.**

```
SURFACES   1 Companion (person)        5 Caregiver Copilot
           2 Cognitive Studio (games)  6 CHW Companion (ASHA/ANM/CHO)   ← NER-critical
           3 Memory Vault (life story) 7 Clinical Bridge
           4 Dinacharya (daily life)   8 Care Network (navigation/coordination)

ENGINES    A Personal World Model + Personal Memory Graph
           B Adaptive Cognitive Stimulation Compiler
           C Personal Baseline + Change-Detection Engine (with Measurement-Quality gating)
           D Behaviour Cause-Reasoning Engine
           E Agentic Orchestration + Evidence-Grounded Agentic RAG

SPINE      Consent & Memory Firewall · Provenance envelope on every fact ·
           Temporal event store · Graph DB · Vector store · Audit log ·
           Edge runtime + delta sync · Safety Gateway · Attention Budget
```

### 1.4 The five ideas we believe are genuinely novel and defensible

| # | Idea | Why it is not marketing language |
|---|---|---|
| 1 | **Personal-baseline-first, not population-norm-first** | NER elderly have the **lowest formal education in India** (Sikkim 6.2 yrs, Mizoram 6.3 yrs among 60+). Population-normed cognitive scores are systematically biased against low-education, non-dominant-language populations. Comparing a person to *themselves* removes the single largest source of measurement bias in this exact region. |
| 2 | **Measurement-Quality Engine gating every inference** | Before "performance declined" is allowed to mean anything, the system must certify the person could *hear*, *see*, *understand the language*, and was not fatigued or coached. This turns a well-known confounder (sensory impairment mimicking cognitive decline) into an explicit computed variable. No dementia product we found does this. |
| 3 | **Ambient Cognitive Stimulation compiled from the person's own life** | Cooking, the walk to the market, festival songs, family photographs and paddy/jhum-cycle knowledge become the therapy substrate — not a translated Western puzzle library. This is the only formulation of "culturally inclusive" that survives contact with a 78-year-old non-literate Khasi grandmother. |
| 4 | **Community-Health-Worker as a first-class user, not an afterthought** | India's rural digital health actually works through the provider-assisted hub-and-spoke model (>93% of eSanjeevani usage). A dementia platform that talks only to patients and families is architecturally mismatched to how NER health delivery functions. |
| 5 | **Elder-abuse-resistant permission architecture ("Memory Firewall")** | Default caregiver omnipotence over a vulnerable person's data, location and money is a *safeguarding hazard*, not a feature. Role-scoped, audited, time-bounded, consent-derived access — designed as a primary requirement, not a compliance appendix. |

### 1.5 What we explicitly refuse to build

Autonomous dementia diagnosis · always-on audio/video surveillance · autonomous medication changes · AI "therapist" claiming clinical authority · autonomous financial control · AI-generated (fabricated) personal memories · unrestricted caregiver access · an alert firehose · a generic translated game library.

### 1.6 The honest position on Space Technology

The theme label appears to be a taxonomy artefact — this is a Software-category health problem. Rather than force it, §19 triages space technology into *directly useful* (geospatial care-accessibility modelling, NavIC/GNSS-assisted safe-return, satellite-backhauled telehealth at existing VSAT-connected sites, disaster-resilient continuity), *potentially useful* (LEO broadband — **licensed but not commercially live in India as of mid-2026**), and *forced* (satellite imagery for cognition, space-based "monitoring" of elderly people). We name the third category and refuse it.

---

## 2. Official Problem Statement and Interpretation

### 2.1 As transcribed

> **Background:** The North Eastern Region (NER) is witnessing a gradual rise in age-related cognitive disorders such as dementia and memory loss among the elderly population. Many families in remote and rural areas face challenges in accessing specialized neurological care, cognitive therapy, and long-term elderly support services due to limited healthcare infrastructure and geographical barriers.
>
> Elderly patients suffering from dementia often experience memory decline, confusion, anxiety, and social isolation, while caregivers face difficulties in continuous monitoring and engagement. There is limited availability of affordable and culturally inclusive digital therapeutic solutions tailored for elderly individuals in the North-Eastern Region.

### 2.2 Surface requirements → what each actually implies

| # | Stated | What it actually requires (deep reading) |
|---|---|---|
| 1 | Rise in dementia and memory loss | Not just prevalence — a **~90% diagnosis and care gap** in India means most people in scope are *undiagnosed*. The platform must be useful **before** a diagnosis exists, and must never fabricate one. |
| 2 | Memory decline | Episodic, working, semantic **and prospective** memory failure. Prospective ("remember to do X later") is the one that breaks daily life and is most tractable digitally. |
| 3 | Confusion | Disorientation in time/place/situation **and** delirium — which is frequently mistaken for dementia progression and is often reversible. Confusing the two is a clinical safety failure. |
| 4 | Anxiety | Frequently a *response* to incomprehensible environments, unmet physical needs, and being corrected. Treat as signal, not symptom label. |
| 5 | Social isolation | Compounded in NER by out-migration of working-age children. The AI must **route to humans**, not substitute for them. |
| 6 | Caregivers cannot monitor continuously | The real problem is not lack of data — it is **caregiver cognitive load**. The deliverable is information *compression*, not dashboards. |
| 7 | Difficulty in engagement | Generic content fails. Engagement is a *personalisation* problem, and apathy in dementia requires **interest-driven activation**, not exhortation. |
| 8 | Limited neurological care access | Implies the platform's clinical output must be **compressed longitudinal evidence** usable in a 15-minute teleconsult, not raw logs. |
| 9 | Limited cognitive therapy access | Cognitive Stimulation Therapy is guideline-recommended but delivery-constrained. Digital + caregiver-mediated delivery is the substitution path. |
| 10 | Limited long-term elderly support | Requires care-navigation to NPHCE/AAM/DMHP/Tele-MANAS resources, not just clinical summaries. |
| 11 | Geographical barriers | Offline-first is a **correctness requirement**, not an optimisation. |
| 12 | Limited healthcare infrastructure | Design for the CHO/ASHA/ANM tier as the delivery unit. |
| 13 | Affordability | Runs on a ₹7–12k Android device, shared family device, ≤2 GB RAM tier; no mandatory wearable; no mandatory subscription for the patient tier. |
| 14 | Cultural inclusivity | Content, language, *and* interaction norms, kinship terms, food, festivals, geography, music. Not translation. |
| 15 | NER-specific | Eight states, radically different language families, connectivity, and health infrastructure. **Not one market.** |

### 2.3 The 12 things the statement does not say but which will determine success

1. Most people in scope have **no diagnosis** and may resist the label (stigma).
2. The person may have **no awareness of impairment** (anosognosia) — creating an autonomy-versus-safety conflict the software will be caught inside.
3. **Pain is invisible** in dementia and presents as "behaviour".
4. **Hearing and vision loss masquerade as cognitive decline** — and NER elderly have low access to audiology/optometry.
5. **Delirium** superimposed on dementia is common, dangerous, and reversible.
6. The caregiver is often an **older spouse**, herself frail, or a **daughter-in-law** with no decision authority in the household.
7. Working-age children are frequently **out-migrated**, so care coordination is *inter-city*, not intra-household.
8. **Polypharmacy** and fragmented prescriptions across visits create real medication risk.
9. **Financial exploitation and elder abuse** are documented risks in dementia — and a badly designed platform *amplifies* them.
10. **Alert fatigue** will kill adoption faster than any technical failure.
11. **Sikkim and Mizoram elderly have the lowest average years of formal education in India** — literacy-dependent and population-normed designs will fail here specifically.
12. In many NER communities, **the language of care is not the language of the state**, and not one of the 22 scheduled languages.

---

## 3. First Principles — Why Dementia Is a Systemic Problem

### 3.1 Disease vs syndrome vs consequence

The single most common design error in dementia technology is collapsing these layers.

```
DISEASE (pathology)          Alzheimer's · vascular · Lewy body · frontotemporal ·
                             Parkinson's disease dementia · mixed (common in older age)
        ↓ damages specific neural systems, differently per disease
COGNITIVE IMPAIRMENT         memory · attention · language · executive · visuospatial ·
                             praxis · gnosis · orientation · processing speed
        ↓ expressed through a body, a home, a language, a culture
FUNCTIONAL IMPAIRMENT        ADLs (bathe, dress, eat, toilet, groom)
                             IADLs (cook, shop, money, transport, medication, phone)
        ↓ interacts with unmet needs, environment, comorbidity, pain, sensory loss
BEHAVIOURAL & PSYCHOLOGICAL   agitation · apathy · depression · anxiety · psychosis ·
SYMPTOMS (BPSD)               sleep/circadian disruption · wandering · repetition
        ↓
SOCIAL CONSEQUENCE           role loss · isolation · stigma · identity erosion
        ↓
CAREGIVER CONSEQUENCE        burden · sleep loss · guilt · employment disruption ·
                             becoming the person's "external brain"
        ↓
HEALTH-SYSTEM CONSEQUENCE    episodic assessment · fragmented records · delayed diagnosis ·
                             preventable crises and hospitalisations
```

**[ESTABLISHED]** Alzheimer's disease accounts for an estimated 60–70% of dementia cases; more than 57 million people live with dementia worldwide, with nearly 10 million new diagnoses each year (WHO, 2026).

Two design consequences follow immediately:

- **There is no single "dementia model".** Build a *disease-agnostic assistance layer* first, then personalise on diagnosis, stage, cognitive phenotype, functional phenotype and comorbidity.
- **A single score is not a representation of a person.** MMSE-style numbers compress away everything that determines what help is actually useful today.

### 3.2 Why the same disease produces different lives

| Modifier | Effect on experience | Effect on our design |
|---|---|---|
| Disease type | FTD → behaviour/language first; LBD → visual hallucinations, fluctuation; vascular → stepwise | Stage- and phenotype-adaptive intervention selection (§11, §12) |
| Stage | Early = planning & independence; moderate = scaffolding & safety; advanced = comfort & communication | Stage-adaptive surface (§13.6) |
| Education & literacy | Strong education gradient in dementia prevalence estimates; literacy determines interface viability | **Voice-first, picture-first; personal baseline over population norms** |
| Language | Non-dominant language → apparent comprehension failure that is really a language mismatch | Tiered language strategy (§18) |
| Sensory ability | Hearing/vision loss mimics inattention, withdrawal, confusion | **Measurement-Quality Engine** (§15.4) |
| Comorbidity & polypharmacy | Cognition fluctuates with BP, sugar, infection, drugs | Change-in-context, not change-in-isolation (§15) |
| Environment | Familiar home = competence; unfamiliar hospital = collapse | Transition support (§13.8) |
| Caregiver context | Frail spouse vs out-migrated son vs paid attendant | Multi-caregiver, role-scoped model (§23) |
| Prior identity | Teacher, farmer, weaver, musician, ASHA, soldier | **Life-Story Graph as therapy substrate** (§12) |

### 3.3 The reversible-cause principle (a hard clinical safety rule)

Cognitive symptoms can be worsened or mimicked by medication effects, depression, delirium, infection, dehydration, thyroid disease, B12 deficiency, sleep disorders, head injury, alcohol, and sensory loss. **[ESTABLISHED]**

> **Rule CS-1:** No observed cognitive or behavioural change may ever be presented to a user as "dementia progressing". The system's permitted output is: *"This differs from this person's own recent pattern. These contextual factors coincide. Persistent or sudden change merits clinical assessment."*

This single rule is enforced structurally in §15 (Change Engine), §22 (Behaviour Reasoning) and §24 (Safety Gateway) — not left to prompt discipline.

---

## 4. Complete Problem Taxonomy

Framework applied throughout: **PROBLEM → ROOT CAUSE → DAILY MANIFESTATION → CAREGIVER EXPERIENCE → RISK → EXISTING INTERVENTION → LIMITATION → AI OPPORTUNITY → AI PROHIBITION.**

### 4.A Cognitive problems

| Problem | Root cause | Manifests as | Caregiver experiences | Risk | AI opportunity | AI must NOT |
|---|---|---|---|---|---|---|
| Episodic memory | Hippocampal/medial temporal damage | Forgets recent events, conversations, where things are | Repeats everything; feels unheard | Missed appointments, medication error | Personal Memory Graph with contextual reconstruction (§12) | Assert an uncertain memory as fact |
| Working memory | Prefrontal/attentional networks | Loses multi-step instructions | Frustration; "she isn't listening" | Task abandonment, unsafe half-done tasks | One-instruction-at-a-time interaction + external scaffolding | Overload with lists |
| Semantic memory | Anterior temporal degradation | Loses word meanings, object knowledge | Conversation breaks down | Social withdrawal | Picture+word co-presentation; familiar-object vocabulary | "Correct" the person publicly |
| **Prospective memory** | Cue-dependent retrieval failure | Forgets to *do* things later | Becomes the alarm clock | Missed meds/appointments | **Adaptive, context-carrying reminders** (what/when/why/who/where + confirmation) | Fire an alarm and assume success |
| Attention | Distractibility, reduced sustained attention | Drifts mid-task | Endless re-prompting | Kitchen/road hazards | Fatigue-aware session length; distraction-minimal UI | Interpret drift as decline without quality gating |
| Executive dysfunction | Frontal-subcortical circuits | Cannot plan/sequence/switch | Takes over the task entirely | **Learned dependence** | **Task Decomposition Agent** with *minimum sufficient* scaffolding | Do the whole task for the person by default |
| Apraxia | Loss of learned motor programmes | Knows the goal, cannot execute | Assumes refusal or laziness | Hygiene, nutrition decline | Multimodal step-by-step: demo + voice + confirm | Assume vision-detected step = clinical truth |
| Agnosia | Recognition failure despite intact vision | Sees the cup, doesn't know it's for drinking | Alarm, grief | Dehydration, misuse of objects | Context-aware object/person cueing | Facial recognition of visitors by default |
| Language / anomia | Temporo-parietal language networks | Word-finding, naming, comprehension | Guessing games, exhaustion | Cannot report pain | Adaptive speech rate/vocabulary/language; picture support | Treat one bad conversation as a biomarker |
| Visuospatial | Parietal/occipital | Misjudges distance, gets lost indoors | Constant supervision | Falls, wandering | Familiar-route cues, high-contrast UI | Route-lock the person |
| Orientation | Distributed | Wrong day, wrong place, wrong era | Repeated correction conflict | Distress, unsafe exits | **Continuous, gentle orientation woven into every interaction** | Quiz the person on the date |
| Repetition loops | Failure to encode the answer | Same question 6× in an hour | Fatigue → irritability → guilt | Relationship damage | **Repetition-aware response** (§12.4) — answer + reassure + pre-commit next reminder | Simply repeat the same answer flatly |
| Learning new info | Encoding failure | Cannot learn new device/UI | Abandons the app | Non-adoption | Zero-learning UI; interface never changes layout | A/B test layouts on this cohort |

### 4.B Behavioural and psychological problems — treated as *signals*, not labels

**[ESTABLISHED]** NICE guidance for distress in dementia is to first assess possible causes — including pain, delirium and inappropriate care — and to offer psychosocial and environmental approaches before pharmacological ones.

This makes a *classifier* the wrong architecture. The right architecture is a **cause-reasoning engine**.

```
OBSERVED: "agitation ↑ around 19:30, three evenings running"

CANDIDATE CONTRIBUTORS (ranked, each with evidence + confidence)
├─ Physical      pain · constipation · urinary retention/UTI · hunger · thirst ·
│                fatigue · overheating · itching · dental pain
├─ Iatrogenic    new medication · dose change · missed dose · withdrawal
├─ Acute         infection · dehydration · delirium  ← ESCALATION PRIORITY
├─ Sensory/env   noise · glare · poor light · crowding · unfamiliar visitor · relocation
├─ Circadian     poor sleep last night · daytime napping · evening light drop
├─ Psychological fear · boredom · loss of control · being corrected · loneliness
└─ Communicative unmet need the person cannot express
```

| Symptom | Commonly misread as | Under-recognised driver | Design response |
|---|---|---|---|
| Agitation / aggression | "Personality change" | Pain, UTI, delirium, overstimulation, being corrected | Cause-Reasoning Engine + comfort checklist + escalation rule |
| Apathy | Laziness, depression | Reduced initiation, not reduced desire | **Interest-driven activation** from Life-Story Graph ("your evening songs" not "do you want to play a game?") |
| Anxiety | Trait anxiety | Not knowing what happens next | Predictable routine + orientation + "what's next" always visible |
| Sundowning | Random | Circadian + fatigue + light | Daily Rhythm Model; low-stimulation evening protocol |
| Sleep disruption | Nuisance | Bidirectional with cognition, agitation, caregiver sleep | Rhythm baseline; caregiver sleep is a first-class metric |
| Wandering | Escape attempt | Goal-directed behaviour with lost navigation | Safe-return, not confinement (§20) |
| Psychosis / hallucination | To be argued with | Disease-specific (esp. LBD), or delirium | Never confirm, never argue: acknowledge → ensure safety → redirect → escalate |
| Loneliness | Inevitable | Reversible with human contact | **Social orchestration to humans** (§13.7) |
| Anosognosia | Denial | Impaired awareness of deficit | Supported decision architecture, not command-and-restrict |

### 4.C Physical and functional problems (never siloed from cognition)

| Domain | Cognitive interaction | What the platform tracks (with consent) | Escalation trigger | Prohibition |
|---|---|---|---|---|
| ADL decline | Apraxia + executive | Task completion, assistance level | Sustained step-loss | Never auto-take-over |
| IADL decline | Executive + memory | Cooking, money, medication, transport | New failure in a previously intact IADL | Never remove capability silently |
| Falls / mobility | Visuospatial + gait | Optional accelerometer/fall event; caregiver-reported near-misses | Any fall; gait change | Not a diagnosis of frailty |
| Pain | Cannot self-report | Behaviour change from baseline; caregiver-observed grimace/guarding | Behaviour change + reduced intake | Never "the patient has pain" |
| Hearing / vision | **Mimics cognitive decline** | Audio clarity, font/contrast setting, documented impairment | Repeated low-quality interactions | Never interpret a failed task without quality gating |
| Nutrition / hydration | Forgetting, apraxia, dysphagia | Missed meals, meal duration, fluid prompts accepted, refusal patterns | Weight/intake trend down | Never prescribe a diet |
| Dysphagia | Advanced disease | Caregiver-reported coughing on food, meal-time lengthening | Any suspected aspiration | Never assess swallow safety |
| Continence | Memory + navigation + dressing | Routine pattern only, private-by-default | New nocturnal incontinence | Never label; never expose to non-essential roles |
| Polypharmacy | Comorbidity | Medication list reconciliation, adherence signal, duplicate-entry flags for **human** review | Conflicting lists across visits | **Never change a medication** |

### 4.D Safety problems and privacy-preserving responses

| Hazard | Naive solution | Privacy-preserving design |
|---|---|---|
| Wandering / getting lost | Always-on GPS tracking | **Event-based geofence**: on-device location, alert only on threshold breach; consented; audited; "safe return" card with local-language identity + contacts |
| Falls | Camera in every room | Optional wrist accelerometer; on-device detection; single event uploaded, no continuous stream |
| Unsafe cooking / appliances | Smart-home takeover | Environmental sensor *prompts* (e.g. gas/smoke), caregiver alert; no autonomous control of the person's home |
| Medication error | AI dosing | Reconciliation + reminders + questions-for-clinician; pharmacist/clinician decides |
| Financial exploitation | AI controls accounts | Education + "ask a trusted person" flow + optional caregiver-visible unusual-activity prompt. **No account control. Ever.** |
| Elder abuse / neglect | Give caregiver everything | **Memory Firewall** (§23): role-scoped access, immutable audit, patient-private zones, multi-caregiver checks |
| Emergency + cannot communicate | Continuous monitoring | On-device offline emergency card (identity, language, conditions, allergies, contacts, ABHA) accessible without network |
| Delirium in hospital | Assume progression | **Acute Change Detector** prioritising clinical evaluation (§15.6) |

### 4.E Social problems

Role loss, friendship attrition, communication breakdown, family conflict about "how bad it is", stigma, embarrassment, cultural disconnection, identity erosion. **[PROMISING]** Digital interventions to reduce isolation and loneliness in dementia show potential but heterogeneous evidence.

**Design stance:** technology's job is *matchmaking and lubrication of human contact* (§13.7), and preservation of cultural participation — never companionship substitution. Metric: **human-contact events**, not app-session minutes.

### 4.F Caregiver problems — a co-primary user, not a stakeholder

**[ESTABLISHED]** Indian evidence documents caregiver burden, stress, poor caregiver health, inadequate respite, insufficient dementia information, and major gaps in rural home-based support; nationally representative Indian data associate greater caregiving responsibility with worse caregiver stress and mental health.

| Caregiver problem | What they actually need | Our module |
|---|---|---|
| Becoming the "external brain" | Offload memory to a system that remembers *for* the dyad | Personal Memory Graph |
| Constant vigilance | Trustworthy, sparse alerting | **Attention Budget** (§21.3) |
| Information overload | "What should I do right now?" — not 200 pages | Caregiver Copilot |
| Not knowing if a change matters | Baseline-relative significance + confidence | Change Engine |
| Behavioural episodes | A checklist in the moment, in their language | Behaviour Cause-Reasoning Engine |
| Clinician communication gap | 1-page longitudinal summary + prepared questions | Clinical Bridge |
| Guilt & decision fatigue | Options, trade-offs, prior stated preferences — not verdicts | Decision Support Agent |
| Family coordination (out-migrated children) | Shared truth + task assignment across cities | Care Network |
| Sleep loss, burnout, own health | Respite planning, escalation to Tele-MANAS/DMHP | Care Navigation |
| No training | Micro-learning delivered *at the moment of need* | Copilot + CHW |

### 4.G Health-system problems

Specialist scarcity (India has roughly **0.3 psychiatrists per 100,000** against a WHO-recommended minimum of ~3 — a tenfold deficit); episodic 15–20-minute assessments; fragmented records; no standardised home observations; diagnosis delay inside a **~90% diagnosis-and-care gap**; referral complexity; near-absent cognitive-therapy and rehabilitation capacity in rural districts; transportation cost that exceeds consultation cost.

**Design consequence:** the clinical deliverable is a **Clinical Compression Engine** — 100,000 observations → the 5 findings that change management — delivered inside the eSanjeevani/AAM hub-and-spoke workflow the region already uses.

---

## 5. Hidden Problems (causally connected, not in the statement)

| # | Hidden problem | Root cause | Consequence if ignored | Design response |
|---|---|---|---|---|
| H1 | **World-model degradation** | Distributed cognitive failure | Reminders "work" but the person still cannot act | Personal World Model; every reminder carries what/when/why/who/how-back |
| H2 | **Repetition loops** | Encoding failure | Caregiver burnout; relationship damage | Repetition-aware response + pre-committed next reminder |
| H3 | **Anosognosia → autonomy/safety conflict** | Impaired self-awareness | Software becomes a controlling authority; person rejects it | Assist → explain → negotiate → escalate. Never command → restrict |
| H4 | **Caregiver as external brain** | Progressive offload | Unsustainable single point of failure | Make the *system* the shared external memory |
| H5 | **Pain invisibility** | Communication failure | Untreated pain read as "behaviour" and sedated | Comfort-change detector; behaviour-change language only |
| H6 | **Sensory loss mistaken for cognitive decline** | Untreated hearing/vision loss | False decline signal → false alarm → distrust | **Measurement-Quality Engine** |
| H7 | **Delirium mistaken for progression** | No acute-change discrimination | Missed reversible emergency | Acute Change Detector, highest escalation priority |
| H8 | **Learned dependence** | Caregiver over-assistance | Faster functional loss | Optimise *minimum sufficient assistance*; independence as a KPI |
| H9 | **Alert fatigue** | Naive anomaly detection | Alerts ignored → real event missed | Attention Budget with persistence + confidence + safety gates |
| H10 | **Excessive surveillance normalised** | "More data is better" | Dignity violation; family conflict; abuse vector | Minimum Necessary Sensing; event-based; on-device |
| H11 | **Platform becomes an abuse instrument** | Caregiver = data owner by default | Financial/psychological abuse enabled | Memory Firewall, audit, patient-private zones |
| H12 | **Cultural mismatch of content** | Translated Western assets | Non-engagement mistaken for apathy/decline | Cultural ontology per community; local content co-creation |
| H13 | **Language mismatch read as comprehension failure** | Dominant-language ASR/TTS | Misclassified cognitive deficit | Tiered language strategy + language-mismatch flag |
| H14 | **Low-education bias in cognitive scoring** | Population norms | Systematic mislabelling in NER | Personal baseline; no population percentile shown to users |
| H15 | **No longitudinal baseline exists at first contact** | Cold start | Weeks of uninterpretable data | Structured 14-day calibration + caregiver-elicited retrospective baseline (§15.2) |
| H16 | **Shared family device / shared identity** | Rural device reality | Data attribution errors | Voice+PIN light identity; per-session subject confirmation |
| H17 | **Out-migration of caregivers** | Regional labour migration | Care is remote and asynchronous | Multi-caregiver, multi-city coordination as default, not exception |
| H18 | **Stigma delays help-seeking** | Community beliefs | Late presentation | Positioning as "brain health & memory support"; family-level education; no diagnostic labels in the UI |
| H19 | **Loss of purpose / meaningful activity** | Role loss | Depression, apathy, faster decline | Meaningful-activity engine grounded in prior occupation and culture |
| H20 | **Hallucinated medical advice** | LLM over-generation | Direct patient harm | Evidence hierarchy + provenance + Safety Gateway + refusal templates |
| H21 | **Model drift & silent degradation** | Data shift over months | Quiet loss of validity | Drift monitors, shadow evaluation, versioned baselines |
| H22 | **Fabricated "memories"** | Generative fill-in | Identity harm; family distress | Memory provenance status: `verified / reported / unverified`. Generative text may *retell* only verified facts |
| H23 | **AI emotional dependency** | Companionship framing | Displaces human contact | Companion actively routes to humans; measures human-contact events |
| H24 | **Power & device reality** | Outage, charging, sharing | Silent data gaps read as decline | Data-gap-aware inference; explicit "insufficient data" state |
| H25 | **Consent capacity changes over time** | Progressive impairment | Consent becomes fiction | Staged, re-affirmed, proxy-with-audit consent model (§23.2) |

### 5.1 The causal loops that make dementia a systems problem

```
LOOP A  Cognition → dependence → burden
  cognitive decline → ADL difficulty → caregiver takes over → burden ↑ →
  less time for engagement → less activity → faster functional loss ─┐
                                                                      └→ back to top

LOOP B  Sleep
  poor sleep → daytime fatigue → worse cognition & agitation → less daytime activity →
  more napping → worse sleep ─┐ (and: caregiver sleep loss → less patience → more conflict)

LOOP C  Isolation
  language difficulty → conversation avoided → withdrawal → loneliness →
  depression/apathy → less activity → further withdrawal ─┐

LOOP D  Distress
  confusion → fear → agitation → caregiver control response → conflict →
  more fear → more agitation ─┐

LOOP E  Physical
  pain → agitation & poor sleep → worse cognition → less mobility →
  deconditioning → more pain ─┐

LOOP F  Trust (system-level, ours to avoid creating)
  noisy alerts → caregiver distrust → alerts ignored → real event missed →
  distrust confirmed → abandonment ─┐
```

**This changes the AI objective.** We are not optimising "predict dementia". We are optimising:

> **Identify which harmful loop is currently active, and intervene at its weakest, safest, least intrusive link.**

---

## 6. NER-Specific Problem Landscape

### 6.1 What the data actually supports (and where it does not)

**Prevalence.** **[ESTABLISHED]** The LASI/LASI-DAD nationwide study estimates dementia prevalence at **7.4% among adults aged 60+ in India (≈8.8 million people)**, with significant age and education gradients, higher prevalence in women and in rural areas, and substantial cross-state variation (Lee et al., *Alzheimer's & Dementia*, 2023).

**[ASSUMPTION / limited evidence]** For the North East, the same study reports a grouped estimate for **"NE states excluding Assam" of ≈7.35% (95% CI 5.29–9.41), n = 1,124**, with the population base including Sikkim but the prevalence estimate excluding it. **This is a single grouped estimate across seven highly heterogeneous states with wide confidence intervals.**

> **Reliable state-level, community-based dementia prevalence and incidence evidence for individual NER states is limited.** We will not disaggregate this figure per state, and we will not present regional counts as precise. Generating NER-specific epidemiological evidence is itself a research contribution (§32, RQ-11).

**Ageing structure — a counter-intuitive and important finding.** NER is demographically *younger* than peninsular India: old-age dependency ratio ≈13 for the North East versus ~20 in southern India, and Assam has among the country's lowest elderly population shares (≈8.2% in 2021). **This matters because it inverts a common assumption:** NER's dementia challenge is driven less by current elderly share and more by (a) rapid future ageing, (b) an extremely thin care-service base, and (c) out-migration removing the traditional caregiving generation.

**Education — the design-determining variable.** Average years of formal education among persons aged 60+ is **lowest in India in Sikkim (6.2 years) and Mizoram (6.3 years)** (Elderly in India, 2021). Because dementia prevalence estimates show a strong education gradient, and because most cognitive instruments are education-sensitive:

> **[ESTABLISHED premise → design rule]** In NER, population-normed cognitive scoring is a bias-amplifier. Personal-baseline change detection is not a stylistic preference; it is the methodologically correct choice for this population.

**Functional disability.** **[PROMISING]** A community-based study of rural elderly in Dibrugarh, Assam found **43.7% with functional disability**, rising sharply with age and multimorbidity (≥5 morbidities associated with ~20× odds). Dementia support in NER must therefore assume high baseline physical comorbidity, not an otherwise-well older adult.

**Diagnosis gap.** **[ESTABLISHED]** Indian dementia research describes a **~90% gap in diagnosis and care** (Lima et al., *J Particip Med*, 2025). Our platform must be valuable pre-diagnosis.

### 6.2 Connectivity: the constraint that dictates architecture

**[ESTABLISHED — Government/press data, February 2026]** Of **45,934 villages** across the eight North Eastern states, **1,841 remain entirely without mobile network coverage**.

| State | Total villages | Villages with mobile coverage | **Uncovered** | 5G-served villages | Implication for us |
|---|---|---|---|---|---|
| Arunachal Pradesh | 5,993 | 4,817 | **1,176** | 600 | Hardest case in India-scale terms; assume **offline-primary**, CHW-mediated sync |
| Assam | 26,429 | 26,266 | **163** | 3,718 | Coverage good, *quality* variable; 5G in only ~14% of villages |
| Manipur | 2,612 | — | **189** | — | Coverage plus civil-disruption risk; resilience-first |
| Meghalaya | 7,100 | — | **141** | — | Highest village count after Assam; dispersed hamlets |
| Nagaland | 1,535 | — | **107** | — | Terrain-limited; village-council delivery model |
| Mizoram | 867 | — | **52** | — | Concentrated settlement; strong community institutions |
| Tripura | 937 | — | **7** | — | Near-saturated; best early pilot for connected features |
| Sikkim | 461 | — | **6** | — | Near-saturated; **lowest elderly education in India** |
| **NER total** | **45,934** | — | **1,841** | — | Offline-first is mandatory, not optional |

Supporting infrastructure context: **[ESTABLISHED]** ~2,17,805 gram panchayats were service-ready under BharatNet nationally as of February 2026, with the Amended BharatNet Programme extending FTTH on demand; historically, remote NER gram panchayats were connected via **satellite broadband using ISRO's GSAT-11/GSAT-19 capacity** where terrestrial fibre was infeasible — a real, existing space-technology dependency in exactly our target geography.

**Digital literacy.** **[PROMISING]** Analyses of India's National Tele Mental Health Programme note that only ~38% of Indian households are digitally literate, and that app/video features risk being captured by already-advantaged urban users while audio channels remain the accessible default. **Design consequence: voice and audio are the primary channel; the app is the secondary channel; the CHW is the human channel.**

### 6.3 Language: eight states, at least four language families

| Language | Family | State relevance | Realistic 2026 AI support | Our tier |
|---|---|---|---|---|
| Assamese | Indo-Aryan | Assam | **[ESTABLISHED]** ASR (AI4Bharat IndicConformer), TTS, MT via Bhashini; Assam–Bhashini MoU (Nov 2025) covers Assamese & Bodo | **Tier A** — full voice |
| Bengali | Indo-Aryan | Tripura, Assam (Barak) | Strong ASR/TTS/MT | **Tier A** |
| Nepali | Indo-Aryan | Sikkim, Darjeeling-adjacent | Scheduled language; moderate support | **Tier A/B** |
| Hindi / English | — | Cross-region, clinicians | Strong | **Tier A** |
| Bodo | Tibeto-Burman | Assam (BTR) | Scheduled; Bhashini expansion underway; ASR thin | **Tier B** |
| Meitei / Manipuri | Tibeto-Burman | Manipur | Scheduled; text resources exist (Meitei Mayek + Bengali script), ASR thin | **Tier B** |
| Mizo | Tibeto-Burman | Mizoram | **[RESEARCH-STAGE]** NE-specific embeddings/OCR emerging (e.g. AIKosh-listed NE-OCR ~90.7% char. accuracy on printed Mizo); ASR limited | **Tier B/C** |
| Khasi, Pnar | Austroasiatic | Meghalaya | Low-resource; NE-Embed/NE-SpeechEmbed cover Khasi/Pnar for retrieval **[RESEARCH-STAGE]**; production ASR limited | **Tier C** |
| Garo | Tibeto-Burman | Meghalaya | Low-resource | **Tier C** |
| Kokborok | Tibeto-Burman | Tripura | Low-resource | **Tier C** |
| Nyishi, Adi, Apatani, Wancho, Nagamese, Chakma | Various | Arunachal, Nagaland, Tripura | Very low-resource; Nagamese is a contact language | **Tier C** |

**[ESTABLISHED]** Bhashini currently supports ~36 Indian languages and is the national public-good language stack; AIKosh hosts NE-specific NER, embedding, speech-embedding and OCR models for Khasi, Garo, Mizo, Meitei, Bodo, Nyishi, Kokborok, Pnar, Nagamese and others.

**[ESTABLISHED]** The India participatory-design study of conversational systems for dementia (29 stakeholders: people living with dementia, caregivers, professionals; SCARF, Chennai) found people with dementia *were* willing to converse with conversational agents, saw benefit for daily tasks, loneliness and cognitive engagement, and identified three specific adaptation needs: **kind tone and appreciative language; better recognition of local accents and noisy settings; and introducing prototypes in local clinics to build familiarity.** Notably, task-based interaction was preferred at greater cognitive impairment, and open-ended questioning risked provoking anxiety.

This is the most directly applicable evidence available to this problem statement, and it shapes §18 and §28.

### 6.4 Health-system assets we should build *into*, not around

| Asset | What it gives us |
|---|---|
| **Ayushman Arogya Mandirs (AAM/HWC)** + Community Health Officers | The physical and human delivery point closest to the village |
| **eSanjeevani** (AB-HWC provider-assisted, hub-and-spoke) | **[ESTABLISHED]** >93% of usage is the provider-assisted model → our clinical output must fit *that* workflow, not a direct-to-patient one |
| **ABDM / ABHA** | Longitudinal identity and record interoperability |
| **NPHCE** | Elderly-care programme platform for geriatric services and district-level capacity |
| **DMHP / Tele-MANAS (14416)** | Escalation path for caregiver mental health and BPSD support |
| **ASHA / ANM / AWW** | Trusted last-mile human relationship; the only realistic onboarding channel in Tier-C language communities |
| **Bhashini / AI4Bharat / AIKosh** | National language stack and NE-specific models |
| **State institutions** (e.g. NEIGRIHMS Shillong, AIIMS Guwahati, Assam Medical College, regional medical colleges) | Clinical partnership, ethics review, validation |
| Karnataka Brain Health Initiative & Kerala State Initiative on Dementia | **Proven Indian templates** for state-level dementia programmes to adapt — not reinvent |

### 6.5 State-wise challenge and strategy matrix

| State | Dominant constraint | Language strategy | Delivery strategy | Pilot suitability |
|---|---|---|---|---|
| Assam | Scale + Barak/Brahmaputra linguistic split + tea-garden populations | Assamese, Bengali, Bodo, Hindi | AAM + medical-college hub; largest cohort | **Phase-1 primary** |
| Tripura | Near-full coverage; Bengali + Kokborok | Bengali (A), Kokborok (C) | Connected-feature validation site | **Phase-1 primary** |
| Sikkim | Smallest population, near-full coverage, **lowest elderly education in India** | Nepali (A/B) | Ideal low-literacy voice-first test | **Phase-1 primary** |
| Meghalaya | Khasi/Garo low-resource; dispersed hamlets | Khasi/Garo (C) — caregiver-mediated + audio corpus building | Church/village-council + NEIGRIHMS | **Phase-2** |
| Mizoram | Mizo low-resource; strong community institutions | Mizo (B/C) | Village-council + YMA-type community structures | **Phase-2** |
| Nagaland | Terrain; Nagamese contact language; many tribal languages | Nagamese + English + tribal (C) | Village-council-led | **Phase-2** |
| Manipur | Connectivity + civil disruption risk | Meitei (B), Hindi/English | Resilience-first, fully offline-capable build | **Phase-3** |
| Arunachal Pradesh | **1,176 uncovered villages**; extreme dispersion; many languages | English/Hindi + Nyishi/Adi (C) | **Offline-primary, CHW-carried sync**; satellite-backhauled AAM sites | **Phase-3** |

---

## 7. Literature Review and Evidence Map

### 7.1 Technology-by-technology evidence classification

| Technology / intervention | Evidence tier | What the evidence says | How we use it |
|---|---|---|---|
| **Cognitive Stimulation Therapy (group, original protocol)** | **[ESTABLISHED]** | NICE recommends group CST for mild–moderate dementia; meta-analysis of the original 14-session protocol reports benefit on global cognition, language, working memory, depression, neuropsychiatric symptoms, communication and self-reported QoL | Our activity design mirrors CST *principles* (implicit learning, opinions over facts, no failure) rather than inventing "brain games" |
| **Digital CST** | **[PROMISING]** | 2026 systematic review/meta-analysis (BMC Geriatrics) finds digital CST improves cognitive performance and aspects of psychosocial functioning in people with dementia, while noting limited and heterogeneous evidence and the need for longer-term data | Core of Cognitive Studio; claims kept measured; in-pilot evaluation mandatory |
| **Computerised cognitive training** | **[PROMISING]** | Meta-analyses report benefits on memory outcomes in MCI/dementia with moderate effects; ICT-based cognitive support pooled ~d 0.39–0.50 with small-study bias signals; tablet-based delivery tended to perform better; barriers = digital literacy, usability, privacy, lack of caregiver support | Tablet-class UI; caregiver co-participation designed in |
| **Reminiscence therapy / life-story work** | **[ESTABLISHED→PROMISING]** | Guideline-supported as a personalised activity approach; strong fit for identity preservation | Memory Vault + reminiscence activities |
| **Music-based intervention for agitation** | **[PROMISING]** | Meta-analysis reports significant reduction in agitation with moderate effect size | Evening low-stimulation protocol; personal playlists |
| **Structured exercise** | **[PROMISING]** | Meta-analyses support benefit for cognition, physical function and/or QoL, with variable effects by strategy | Routine module prompts; never prescriptive dosing |
| **Multicomponent caregiver interventions** | **[ESTABLISHED→PROMISING]** | Network meta-analysis of caregiver interventions ranks multicomponent approaches highest for reducing BPSD and caregiver reactions | Justifies orchestration over single-feature apps |
| **Digital / telehealth caregiver interventions** | **[PROMISING]** | Meta-analyses report reduced caregiver burden, improved self-efficacy and QoL; adherence better with personalisation, human contact and interactivity | Caregiver Copilot design + mandatory human-in-loop (CHW) |
| **Conversational agents / social robots in dementia** | **[PROMISING → RESEARCH-STAGE]** | India participatory study (n=29) shows willingness and perceived benefit, plus explicit needs on tone, local accents, noise, clinic familiarisation; a dementia-caregiver chatbot pilot found feasibility with the chatbot as most-used feature | Companion voice agent designed to those findings; **no clinical authority** |
| **Remote / passive monitoring** | **[RESEARCH-STAGE]** | Systematic reviews show expanding research across behavioural, physiological and environmental signals, but flag weak reference standards, limited external validation, usability, empathy and privacy gaps | Optional, event-based, consented; **research module** |
| **Speech / language biomarkers** | **[RESEARCH-STAGE]** | Substantial research activity in AI-driven speech biomarkers with significant bias and methodological limitations; low-resource-language evidence essentially absent | Longitudinal *candidate* signal only; shadow mode; never shown as a score |
| **Multimodal AI for dementia** | **[RESEARCH-STAGE]** | Reviews find multimodal generally outperforms single-modality, but external validation and generalisation remain major problems; dataset bias significant | Uncertainty-aware fusion; research plane |
| **Digital phenotyping / passive digital markers** | **[RESEARCH-STAGE]** | Promising for earlier detection and longitudinal monitoring; small datasets, inconsistent reference standards, weak real-world validation | Explicitly research; measurement science first (§16) |
| **Blood biomarkers (p-tau217 etc.)** | **[ESTABLISHED, specialist setting]** | FDA cleared a blood-based test to *aid* Alzheimer's diagnosis in symptomatic adults in specialised care, explicitly **not** a standalone screening/diagnostic test; Alzheimer's Association guidance permits triage/substitution roles within comprehensive clinical evaluation | Referenced in Clinical Bridge as *clinician-owned* evidence; never inferred by us |
| **Anti-amyloid therapies (lecanemab, donanemab)** | **[ESTABLISHED, narrow indication]** | Can slow decline in appropriately selected people with **early** Alzheimer's; substantial monitoring requirements (e.g. FDA's 2025 update to MRI monitoring for lecanemab following serious/fatal ARIA events) | Treatment-Journey Coordination only where a specialist has initiated therapy |
| **Non-pharmacological delirium prevention** | **[PROMISING]** | Multicomponent non-pharmacological interventions show evidence for reducing delirium occurrence, with certainty varying by context | Acute Change Detector + hospital-transition playbook |
| **Hearing intervention and cognition** | **[MIXED]** | The ACHIEVE RCT found no significant overall difference, with a prespecified subgroup suggesting benefit in higher-risk participants | Justifies sensory screening as *measurement hygiene*, not as a cognition claim |
| **WHO risk reduction (multidomain)** | **[ESTABLISHED]** | WHO guidelines 2nd edition (15 July 2026): up to **45%** of dementia risk attributable to modifiable factors — tobacco, alcohol, social isolation, physical inactivity, air pollution, NCDs incl. hypertension and diabetes; adds environmental risk and tailored multidomain interventions; advises against routine vitamin supplementation for prevention | Brain-Health layer (§13.9); framed as *risk reduction*, never "prevention guaranteed" |
| **Federated learning / privacy-preserving ML** | **[RESEARCH-STAGE for this use case]** | Technically mature in principle; unproven at NER field scale | Roadmap Phase 4 |
| **Agentic RAG / knowledge graphs for care** | **[EXPERIMENTAL→RESEARCH-STAGE]** | No clinical validation for dementia care orchestration | Our primary *research contribution* claim (§32) |
| **VR / AR / MR** | **[RESEARCH-STAGE, low NER fit]** | Evidence early; cost, comfort, motion sensitivity, device availability | **Explicitly out of scope** |
| **Cognitive digital twin** | **[EXPERIMENTAL]** | Conceptually attractive, no validated instantiation | Reframed as "Personal Cognitive State Model" with explicit uncertainty (§17) |

### 7.2 WHO / national policy alignment table

| Source | Relevant content | Our alignment |
|---|---|---|
| WHO risk-reduction guidelines, 2nd ed. (2026) | Multidomain risk reduction; cognitive and social engagement; NCD management; environmental risk | Brain-Health layer; cognitive + social engagement as core, not garnish |
| WHO ethics & governance of AI for health; LMM guidance | Warns on inaccurate/biased/incomplete outputs, automation bias, privacy, cybersecurity; emphasises autonomy, safety, transparency, accountability, equity | §23–§25 built directly on these principles |
| NICE NG97 | Assess causes (pain, delirium, inappropriate care) before treating distress; psychosocial/environmental first; group CST; cognitive rehabilitation/OT for function; personalised activity | Behaviour Cause-Reasoning Engine; activity personalisation |
| Alzheimer's Association DETeCD-ADRD | Diagnosis must characterise functional impairment, cognitive-behavioural syndrome, and likely underlying pathology | Clinical Bridge structures evidence along exactly these three axes |
| FDA Clinical Decision Support framing | CDS should expose basis, inputs, methods, validation and patient-specific information for independent professional review | Provenance-first clinical outputs; no opaque scores |
| India: NPHCE, NMHP/DMHP, Tele-MANAS, Ayushman Bharat/ABDM | Existing programme rails for elderly and mental health care | Integration targets, not competitors |
| Indian state precedents (Karnataka Brain Health Initiative; Kerala State Initiative on Dementia) | State dementia action plans covering screening, caregiver training, dementia-friendly services | Template for an **NER Brain Health Initiative** (§31) |

---

## 8. Existing Solutions vs Remaining Gaps

### 8.1 Category analysis

| Category (illustrative examples) | Solves | Does not solve | Why adoption fails | NER fit |
|---|---|---|---|---|
| Brain-training / cognitive-game apps (consumer) | Engagement for literate, motivated, self-directed users | Dementia-stage adaptation; caregiver need; cultural grounding; clinical usefulness | Requires literacy, self-motivation, and English/Hindi; competitive framing shames the user | **Poor** |
| Clinical digital CST programmes | Guideline-aligned therapy delivery | Continuous life assistance; safety; caregiver copiloting | Facilitator-dependent; cost; language | Fair (needs adaptation) |
| Reminder / medication apps | Prospective memory partially | Context ("why", "who", "how do I get back"); confirmation of completion | Alarms without context are ignored; no adaptive timing | Fair |
| Caregiver education portals / helplines | Knowledge; emotional support | "What do I do *now*, for *this* person?" | Generic content; no personalisation; no longitudinal picture | Fair (Tele-MANAS is a real asset) |
| GPS trackers / wander alarms | Locating after an event | Consent, dignity, false alarms, causes of wandering | Perceived as surveillance; abandoned | Fair with redesign |
| Remote monitoring / smart-home platforms | Event detection | Interpretation; caregiver load; privacy; validation | Cost, installation, connectivity, intrusiveness | **Poor** |
| AI companions / social robots | Conversation, loneliness reduction potential | Local language and accent; noise robustness; cost; clinical safety | Hardware cost; accent/noise failure; dependency risk | **Poor as hardware; promising as software voice agent** |
| EMR / teleconsult platforms (eSanjeevani) | Access to a clinician | Longitudinal home observations; dementia-specific structure | Not designed for cognitive longitudinal data | **Good — integrate, don't replace** |
| Speech-biomarker research tools | Research signal extraction | Clinical validity; low-resource languages | Not deployable as clinical claims | Research only |

### 8.2 The white spaces (what nobody is actually delivering)

| # | White space | Why it is genuinely open |
|---|---|---|
| W1 | **Integration layer across person + caregiver + CHW + clinician** in one longitudinal model | Evidence supports components individually; the *orchestration* is unvalidated and unbuilt |
| W2 | **Personal-baseline change detection with explicit measurement-quality gating** | Almost all products compare to norms or to nothing; none certify measurement validity first |
| W3 | **Culturally *generated* (not translated) cognitive stimulation for NER communities** | No NER cultural asset library exists for cognitive care |
| W4 | **Offline-first dementia intelligence** (baseline, games, memory retrieval, safety card working with zero connectivity) | Products assume cloud |
| W5 | **Low-resource-language dementia interaction and speech corpora** (Khasi, Garo, Mizo, Meitei, Kokborok, Nyishi) | Datasets essentially absent — a first-mover research asset |
| W6 | **Elder-abuse-resistant permission architecture** in an eldercare platform | Sector default is caregiver omnipotence |
| W7 | **Clinical compression for a 15-minute rural teleconsult** | Clinical dashboards are built for specialists with time |
| W8 | **Behaviour cause-reasoning (vs emotion classification)** with provenance and uncertainty | Products classify; clinicians need contributor hypotheses |
| W9 | **CHW-facing dementia tooling** integrated with AAM/NPHCE workflow | Practically nonexistent |
| W10 | **Attention-budgeted alerting with formal false-positive accounting** | Alert design is rarely treated as a safety-critical subsystem |

---

## 9. Solution Philosophy

Ten principles. Each is testable, and each has a corresponding architectural mechanism.

| # | Principle | Mechanism |
|---|---|---|
| 1 | **Assist the life, don't capture the user** | Ambient stimulation; no engagement-maximising loops; no streaks/leaderboards |
| 2 | **Minimum sufficient assistance** | Task Decomposition Agent escalates scaffolding only on observed failure; independence is a KPI |
| 3 | **Compare the person to themselves** | Personal Baseline Engine; no population percentiles in the UI |
| 4 | **Never interpret data you cannot trust** | Measurement-Quality Engine gates every inference |
| 5 | **Facts, hypotheses and actions are separate objects** | Three-layer output contract enforced at the Safety Gateway |
| 6 | **Provenance or silence** | Every fact carries source, timestamp, validity interval, confidence, verification status |
| 7 | **Attention is the scarcest resource in the system** | Attention Budget; escalation ladder L0–L5 |
| 8 | **The caregiver is not automatically the owner** | Memory Firewall; audit; patient-private zones |
| 9 | **Route to humans** | Social orchestration; human-contact metrics; CHW in the loop |
| 10 | **Works when nothing works** | Offline-first core: games, memory retrieval, routine, orientation, emergency card |

---

## 10. Overall Product Vision

### 10.1 Positioning statement

> **MindMitra is a personalised, culturally-adaptive, offline-first cognitive care and daily-life assistance ecosystem for elderly people living with memory decline in the North East, and an intelligent care copilot for the families, community health workers and clinicians who support them.**
>
> It engages the person through cognitive activities and memories drawn from their **own** life, language and culture; it assists their day; it learns what is normal **for them**; it detects meaningful change and explains the possible context behind it; it compresses months of home observation into evidence a clinician can act on in fifteen minutes — while keeping diagnosis, prescription and decision-making firmly with qualified professionals and dignity firmly with the person.

### 10.2 Why each element is necessary (mapped to the official statement)

| Element | Official statement anchor | Necessity argument |
|---|---|---|
| Cognitive gaming | "cognitive therapy" access gap | The one thing that gets opened voluntarily; guideline-aligned CST principles; digital CST has **[PROMISING]** evidence |
| Memory assistance | "memory decline", "confusion" | Directly addresses the stated symptom; also the mechanism that reduces repetition-driven caregiver burnout |
| Daily-life assistance | "long-term elderly support services" | Where independence is actually lost or preserved |
| Caregiver copilot | "caregivers face difficulties in continuous monitoring and engagement" | Explicitly in the statement; strongest evidence base of any component |
| Longitudinal intelligence | "limited access to specialized neurological care" | Converts absence of specialists into better use of the few available |
| Agentic AI | implicit | Multiple problems require *different* reasoning under one orchestrator; single chatbot cannot maintain safety boundaries per domain |
| Agentic RAG with provenance | implicit | The only way to give evidence-grounded guidance without hallucinating medicine |
| Local language & culture | "culturally inclusive" | Determines engagement, comprehension, dignity, trust, adherence — and prevents misclassifying language mismatch as decline |
| Offline-first | "geographical barriers", "limited infrastructure" | **1,841 NER villages have no mobile coverage** |
| Healthcare integration | "limited healthcare infrastructure" | AAM/eSanjeevani/ABDM already exist; parallel systems die |
| Affordability | "affordable" | ₹7–12k Android tier; no mandatory wearable; public-good language stack (Bhashini) instead of paid ASR |
| Space technology | listed theme | Only where it genuinely helps (§19) |

### 10.3 The eight surfaces

| # | Surface | Primary user | Core job | Offline? | MVP? |
|---|---|---|---|---|---|
| 1 | **Companion** | Person with dementia | Orientation, conversation, memory answers, activity launch | **Full** | ✅ |
| 2 | **Cognitive Studio** | Person (+ caregiver co-play) | Adaptive, culturally-grounded cognitive stimulation | **Full** | ✅ |
| 3 | **Memory Vault** | Family + person | Life-story graph; reminiscence; "who is this?" | **Full (read)** | ✅ |
| 4 | **Dinacharya** | Person + caregiver | Adaptive routine, reminders, task scaffolding | **Full** | ✅ |
| 5 | **Caregiver Copilot** | Family caregiver | "What happened / what changed / what do I do now" | Partial | ✅ (core) |
| 6 | **CHW Companion** | ASHA / ANM / CHO | Structured home visit, onboarding, sync mule, escalation | **Full** | ✅ (light) |
| 7 | **Clinical Bridge** | Doctor / specialist | 1-page longitudinal evidence + prepared questions | Online | Phase 2 |
| 8 | **Care Network** | Family + CHW + facility | Navigation, coordination, multi-city task sharing | Partial | Phase 2 |

---

## 11. Cognitive Gaming Platform — the Adaptive Cognitive Stimulation Engine

This is the heart of the official problem statement and receives the deepest treatment.

### 11.1 Why a game *library* is the wrong artefact

Two people in scope:

| | Person A | Person B |
|---|---|---|
| Age | 66 | 81 |
| Education | Graduate, retired schoolteacher | No formal schooling, retired jhum farmer |
| Language | Assamese (Tier A) | Khasi (Tier C) |
| Stage | Mild | Moderate |
| Sensory | Reading glasses | Moderate hearing loss |
| Interests | Bihu songs, gardening, teaching | Church choir, weaving, cattle |

A shared "memory card game" is not personalisation with a difficulty slider. It is the wrong *activity*, in the wrong *modality*, in the wrong *language*, about the wrong *content*, at the wrong *time of day*.

So we build a **compiler, not a catalogue**.

### 11.2 The Cognitive Stimulation Compiler

```
INPUTS                                     COMPILER                    OUTPUT
─────────────────────────────────────      ──────────────────────      ──────────────────────
Cognitive profile (7 domains, per-domain   1. Goal selection            TODAY'S SESSION PLAN
  ability estimate + uncertainty)             (weakest-but-trainable    ├─ activity 1 (domain,
Stage + phenotype                              + strengths to preserve)  │   template, difficulty,
Functional goals (what the person             ↓                          │   scaffolding, duration)
  actually wants to keep doing)            2. Modality selection        ├─ activity 2
Sensory profile (audio/visual/motor)          (voice / picture / touch  ├─ ambient prompt(s)
Language tier + preferred language              / physical / dyadic)     └─ session budget & exit
Cultural ontology (community assets)          ↓                              conditions
Life-Story Graph (people, places,          3. Content binding
  songs, foods, festivals, occupation)        (bind template slots to
Recent performance (last 14 sessions)           THIS person's content)
Fatigue & mood signal                         ↓
Time of day + caregiver availability       4. Difficulty targeting
Engagement history (what they chose            (target ~75–85% success)
  voluntarily vs abandoned)                    ↓
Measurement-quality history                5. Scaffolding level
                                              ↓
                                           6. Safety & dignity filter
                                              (no failure framing, no
                                               time pressure, no test framing)
```

**Difficulty targeting.** We use a lightweight, on-device ability-tracking model per cognitive domain — an Elo/Bayesian-update scheme over item difficulty, not a fixed level ladder:

```
θ_d(t+1) = θ_d(t) + K · q · (observed − expected)
  θ_d      ability estimate in domain d
  expected = σ(θ_d(t) − b_i)          b_i = calibrated difficulty of item i
  q        = measurement-quality weight ∈ [0,1]   ← low-quality trials barely move θ
  K        decays with number of observations (stability over time)
```

Target success band **75–85%**: high enough to protect dignity and self-efficacy, low enough to be stimulating. This band is also what makes the resulting θ series usable as a longitudinal signal instead of a ceiling-saturated flat line.

**[ASSUMPTION]** The 75–85% band is our design choice and a pilot hypothesis (§30).

### 11.3 Cognitive domains × NER-grounded activity families

| Domain | Activity family | Concrete NER-grounded instantiations | Modality | Offline |
|---|---|---|---|---|
| **Episodic / autobiographical memory** | Life-story recall | "Whose wedding was this?" from family photos; "which year did we move to Jorhat?"; village-event recall | Picture + voice | ✅ |
| **Semantic memory** | Familiar-category sorting | Sort *local* market items: bhut jolokia, khar, bamboo shoot, joha rice; sort by "grows / bought / cooked" | Picture + touch | ✅ |
| **Working memory** | Short-span carry tasks | "Remember two things for the market: rice and mustard oil" → confirm after distraction | Voice | ✅ |
| **Prospective memory** | Intention rehearsal | "After tea, we will water the tulsi. I'll ask you then." | Voice | ✅ |
| **Attention** | Selective/sustained search | Find the red flower in the garden photo; count the ducks in the pond | Picture | ✅ |
| **Executive function** | Sequencing & planning | Order the steps for making *pitha*; plan a market trip; order the steps of the loom | Touch drag / voice | ✅ |
| **Language** | Naming, fluency, description | Name the tools; "tell me about this festival"; category fluency in *their* language | Voice + picture | ✅ |
| **Visuospatial** | Spatial relations & routes | "Which path goes to the church?" on a familiar landmark photo set | Picture | ✅ |
| **Orientation** | Time/place/situation anchoring | Day–season–festival anchoring using the agricultural and festival calendar | Voice | ✅ |
| **Processing speed** | Gentle timed recognition | Familiar-face recognition with *no visible timer* (timing measured, never displayed) | Touch | ✅ |
| **Praxis / sequencing (functional)** | Real-task scaffolding | Tea-making, dressing order, phone-call steps | Voice + demo | ✅ |
| **Social cognition** | Emotion & intention reading | Family photo emotion reading; "what should we say to the guest?" | Picture + voice | ✅ |

**Culture-specific activity families (the actual differentiator):**

| Family | Content source | Why it works |
|---|---|---|
| **Music reminiscence** | Bihu, Borgeet, Khasi hymns, Mizo choral, Sikkimese/Nepali folk, Manipuri Nat, Kokborok folk, church hymns | Music-based intervention has **[PROMISING]** evidence for agitation; melody memory is often preserved late |
| **Festival calendar** | Bihu, Wangala, Behdienkhlam, Chapchar Kut, Losar, Yaoshang, Hornbill, Kharchi Puja | Powerful orientation + identity anchor |
| **Local geography** | Village landmarks, market, church/namghar/temple, river, road home | Doubles as **safe-return rehearsal** |
| **Occupational memory** | Paddy/jhum cycle, tea plucking, weaving/loin-loom, fishing, cattle, teaching, ASHA work | Restores role identity — the antidote to "the patient" |
| **Food & kitchen** | Local dishes, ingredient sorting, cooking sequences | Highest-frequency real-world executive task |
| **Kinship terms** | Community-specific kinship (matrilineal Khasi/Garo structures differ fundamentally from patrilineal norms) | Getting kinship wrong destroys credibility instantly |
| **Dyadic family games** | Grandchild-and-elder photo naming, storytelling relay | Converts therapy time into relationship time |

> **Design note on matriliny:** Khasi, Garo and Jaintia societies are matrilineal. A memory graph that hard-codes patrilineal kinship, inheritance and residence assumptions will produce factually wrong, culturally offensive prompts. Kinship is therefore a **pluggable ontology per community**, not a fixed schema (§27.3).

### 11.4 Therapeutic, not competitive — the dignity constraints

**Prohibited by design:** leaderboards, ranks, scores shown to the person, streaks, countdown timers, failure sounds, red X marks, "wrong!", "you failed", comparisons to other users, difficulty labels ("easy/hard"), losing progress.

**Required by design:** participation acknowledged before correctness; errorless-learning-style prompting (cue before correction); repetition without any indication that it is repetition; graceful exit at any point; caregiver-visible summary of *engagement* rather than *score*; session end always on a success.

### 11.5 Ambient Cognitive Stimulation — the strongest single product idea

The person should not have to "go and play". Cognitive stimulation should be woven into what the day already contains.

| Everyday moment | Ambient prompt | Domain exercised | Simultaneous benefit |
|---|---|---|---|
| Morning tea | "Would you like your usual tea? Shall we make it together — what comes first?" | Executive, praxis | ADL independence |
| Cooking | "Which ingredient comes next?" | Sequencing, semantic | Real-task retention |
| Garden / courtyard | "Can you find the yellow flower today?" | Attention, visuospatial | Light physical activity |
| Walk | "Which turn takes us home?" | Spatial memory | **Safe-return rehearsal** |
| Family photo on the wall | "Who is standing beside you here?" | Episodic, faces | Identity + conversation |
| Radio / music hour | "Do you remember this song? Who used to sing it at Bihu?" | Music memory, autobiographical | Mood regulation |
| Market day | "We need rice and mustard oil — two things." | Working, prospective | IADL practice |
| Evening | "Tell me one thing from today." | Episodic encoding | Sleep-hygiene wind-down |
| Grandchild's call | "Shall we tell her about the loom you made?" | Narrative, social | Human connection |

Ambient prompts are (a) generated by the compiler, (b) rate-limited by the Attention Budget, (c) always skippable, (d) never framed as tests, (e) logged with a "naturalistic" flag so they are weighted differently in the baseline model than structured sessions.

**[ASSUMPTION → RQ-2]** Ambient stimulation improves adherence and reduces test-anxiety versus structured sessions alone. This is one of our headline research questions.

### 11.6 Session architecture (offline runtime)

```
SESSION START
  ├─ subject confirmation (shared device safety)
  ├─ orientation micro-moment (day, weather, what's next)   ← always, never a quiz
  ├─ measurement-quality pre-check
  │    audio volume OK? · screen brightness/contrast OK? · language confirmed?
  │    caregiver present? · time since waking · self-reported tiredness (2 taps)
  ├─ compiler → session plan (2–4 activities, 8–20 min total)
  ├─ per-activity loop
  │    present → observe (latency, errors, hesitation, abandonment, help requests)
  │    → adapt scaffolding within-session → celebrate participation
  ├─ fatigue watchdog: 2 consecutive quality drops OR abandonment → wind down early
  ├─ end on success + a warm close in the person's language
  └─ write session record (local) → queue delta for sync
```

Everything above runs with zero network. Content packs (photos, audio, item banks) are pre-downloaded per person, typically 80–250 MB, refreshed opportunistically.

---

## 12. Personalised Memory System and Personal Memory Graph

### 12.1 Why a vector store alone fails

The question *"Who is Rina?"* requires: the entity, its **relationship** to the person, the **most recent** relevant event, an associated **photo**, and a **retrieval policy** that knows what is reassuring versus distressing to say. That is graph + temporal + vector + policy, not nearest-neighbour text search.

### 12.2 Graph schema (core entities and edges)

```
NODES
  Person(self) · Person(family/friend/caregiver/clinician) · Place · Event ·
  Photo · AudioClip · Song · Object · Occupation · Story · Routine ·
  Preference · Festival · Medication · Appointment · CarePlan ·
  Observation · Session · Alert · EvidenceSource

EDGES  (all time-scoped)
  RELATED_TO{kinship_type, ontology_id}   LIVES_IN      WORKED_AS
  VISITED{when}                           DEPICTS       SUNG_AT
  PREFERS{strength}                       PART_OF_ROUTINE{time_window}
  OCCURRED_AT{when}                       CARES_FOR{role, scope}
  PRESCRIBED{valid_from, valid_to}         OBSERVED_BY{source}
```

### 12.3 The provenance envelope — attached to **every** fact

```json
{
  "fact_id": "f_8817",
  "subject": "person:self",
  "predicate": "RELATED_TO",
  "object": "person:rina",
  "value": { "kinship_type": "granddaughter", "ontology": "khasi_matrilineal_v1" },
  "source": { "type": "caregiver", "actor": "caregiver:anu", "channel": "onboarding" },
  "created_at": "2026-07-02T10:14:00+05:30",
  "valid_from": "2026-07-02", "valid_to": null,
  "last_verified": "2026-08-20",
  "confidence": "high",
  "verification_status": "verified",
  "visibility": ["person", "primary_caregiver", "secondary_caregiver"],
  "clinical_relevance": false,
  "audit_ref": "log:2026-07-02:0143"
}
```

Three consequences:
1. **Temporal correctness.** A superseded medication is never retrieved as current — `valid_to` closes it. This is a patient-safety mechanism, not metadata hygiene.
2. **No fabricated memories.** Generative retelling is permitted **only** over facts with `verification_status: verified`. Anything `reported` or `unverified` is spoken with hedging or withheld. *(Answers H22.)*
3. **Firewall enforcement.** `visibility` is evaluated at retrieval time, per requesting role.

### 12.4 Repetition-aware memory retrieval

```
Person: "What time are we leaving?"          [4th time in 40 minutes]

Naive:      "4 PM."
MindMitra: "You're thinking about the appointment — it's at 4 o'clock, and Anu is
             taking you. There's time for tea first. I'll remind you again at 3."
```

Mechanism:

```
utterance → intent + entity resolution
          → memory retrieval (graph + temporal)
          → REPETITION DETECTOR (same intent+entity, rolling window)
          → response policy:
               n = 1      plain answer
               n = 2–3    answer + reassurance + orientation anchor
               n ≥ 4      answer + reassurance + PRE-COMMITTED next reminder
                          + (if caregiver present) silent caregiver note:
                            "asked 4× — consider a written note on the door"
          → NEVER: "you already asked me that"
```

Repetition **counts** are also one of the most tractable longitudinal signals in the whole system: they are cheap, offline-computable, language-agnostic in structure, and directly meaningful to caregivers ("1–2/day in May → 5–7/day in August").

### 12.5 Life-Story Graph construction (Memory Vault onboarding)

| Step | Who | Method | Output | Time |
|---|---|---|---|---|
| 1 | Family (often out-migrated children) | Guided web/mobile flow: upload 20–60 photos; tag people/places/events with voice, not typing | Seed entities + photo bindings | 30–60 min |
| 2 | Family | 12 structured life-story prompts (childhood, work, marriage, migration, festivals, songs, proudest moment, daily rituals) recorded as **audio in the family's own voices** | Story nodes + audio clips | 20–40 min |
| 3 | CHW / ASHA | Home visit: verify household, routine, medications, sensory aids, safety hazards; capture village landmarks | Routine + safety + place nodes | 45 min |
| 4 | Person | Low-pressure conversation with Companion, seeded from the graph | Preferences, corrections, engagement signals | ongoing |
| 5 | System | Compiler binds content into activities; caregiver reviews and can correct anything | Personalised activity pool | continuous |

**Ethical guardrails:** family may not delete the person's own contributions; the person can mark any memory "don't show me this"; distressing content (bereavements, trauma) is flagged `sensitive` and excluded from spontaneous prompts by default; **no AI-generated imagery of real people, ever.**

---

## 13. The Other Surfaces

### 13.1 Companion (patient surface)

- **Voice-first**, picture-second, text-last. Single-screen. Never more than 5 primary choices.
- Every interaction opens with a gentle orientation anchor (name, day, weather, next event) — woven in, never quizzed.
- Task-based interaction is the default; open-ended questioning is used sparingly, consistent with the India participatory-design finding that open-ended prompts can provoke anxiety and that task-based interaction is preferred at greater impairment.
- Tone requirements taken directly from the same study: **kind tone, appreciative language**, no correction, no time pressure.
- Fixed layout for life. No redesigns, no A/B tests, no feature discovery prompts.

### 13.2 Dinacharya (adaptive daily routine)

Not alarms — **adaptive routine with context and confirmation**:

```
Standard reminder:   "Doctor appointment 4 PM."

Dinacharya:          "Today is Tuesday. Your appointment with Dr. Barua is at 4 o'clock.
                      Anu will take you — she usually comes after tea.
                      Shall I remind you again when she is leaving?"
                      → confirmation captured → if unconfirmed twice, caregiver nudged
```

Adaptive rules: if the person is still asleep at the usual breakfast time, wait rather than wake; if fatigue is high, shorten and simplify; if the caregiver is absent, escalate differently; if a routine step has failed three days running, flag it as an emerging functional change rather than nagging harder.

### 13.3 Caregiver Copilot

The deliverable is **compression**, not visibility.

```
TODAY — Aitâ (Mrs. Bora)                                    Tue 8 Sep

Cognition       near her usual pattern
Mood            quieter than usual
Sleep           ↓  2 wakings (usual: 1)
Meals           lunch partly left
Activity        ~30% below her own average (3rd day)
Medication      ✓ all confirmed
Orientation     1 unusual moment (asked about her father, 11:40)
Repeated Qs     6× about Rina's visit

WORTH YOUR ATTENTION
Activity and sleep have both been below her usual pattern for 3 days.
Possible contributors we can see: sleep disruption; the routine change since Monday.
This is not a diagnosis.

WHAT YOU CAN DO NOW
• Check basic comfort: pain, thirst, toilet, constipation, warmth
• Keep this evening quiet and low-light
• Call Rina before dinner — she asked 6 times today
• If this pattern continues past Thursday, or gets suddenly worse, contact the AAM

[Why am I seeing this?]  → 3 independent observations + confidence + sources
```

Copilot must answer, in the caregiver's language: *What happened today? What changed this week? Why might this be happening? What should I check? What can wait? What should I ask the doctor? Is this significant?*

### 13.4 CHW Companion (ASHA / ANM / CHO) — the NER unlock

| Capability | Why it matters here |
|---|---|
| Structured home-visit script (dementia-aware, 10 min) | Standardised home observation is the single biggest missing input to rural dementia care |
| Onboarding assistance | The only realistic path for non-literate elders and Tier-C language communities |
| **Sync mule** | In the 1,841 uncovered villages, the CHW's phone physically carries encrypted deltas to coverage |
| Escalation triage | CHW decides whether to book an eSanjeevani teleconsult at the AAM |
| Caregiver coaching cards | Micro-training delivered by a trusted local person, not an app notification |
| Sensory screening prompts | Basic hearing/vision checks that prevent months of invalid measurement |
| Workload realism | Hard cap: ≤10 minutes per household visit; no data entry beyond taps and voice |

### 13.5 Clinical Bridge

Output for a 15-minute teleconsult, structured along the three axes the Alzheimer's Association diagnostic guideline requires (function, cognitive-behavioural syndrome, likely underlying disease):

```
LONGITUDINAL SUMMARY — 12 weeks                     Prepared 8 Sep 2026

FUNCTION (informant + observed)
  IADL: money handling now needs help (new since ~July)
  ADL: independent; dressing order occasionally prompted

COGNITIVE / BEHAVIOURAL PATTERN
  Repeated questions   1–2/day (Jun) → 5–7/day (Aug)     [caregiver log + system count]
  Orientation events   0 (Jun) → 3 (Aug)                  [system]
  Naming/word-finding  caregiver-reported increase         [informant only]
  Activity             ↓ ~25% vs personal baseline         [session telemetry]
  Sleep                interruptions 1→3/night (last 3 wks)[caregiver log]

CONTEXT / POSSIBLE CONFOUNDERS
  New antihypertensive started 12 Aug (caregiver-reported)
  Hearing aid not in use since ~Jul  ← measurement quality reduced
  Routine change: daughter travelled 1–14 Aug

MEASUREMENT CONFIDENCE   moderate (hearing aid unused; 6 sessions with low audio quality)

WHAT THIS IS NOT
  This is not a diagnosis, a stage, or a cognitive test score.

SUGGESTED QUESTIONS FOR THIS CONSULT
  1. Could the 12 Aug medication change be contributing?
  2. Is a delirium/infection screen warranted given the sleep change?
  3. Referral for audiology — hearing aid non-use?
  4. Is formal cognitive assessment indicated now?

EVIDENCE  [system telemetry ▸]  [caregiver log ▸]  [CHW visit notes ▸]
```

Clinician actions: accept / correct / annotate. **Clinician corrections are training signal** for the baseline and alert models — the human-in-the-loop is also the learning loop.

### 13.6 Stage-adaptive behaviour

| Stage | Companion emphasis | Games emphasis | Caregiver emphasis |
|---|---|---|---|
| Pre-diagnosis / MCI | Brain-health, routine, engagement | Broad domains, self-directed, harder | Education, risk reduction, when to seek assessment |
| Mild | Orientation, prospective memory, independence | Adaptive multi-domain, autobiographical | Planning, legal/financial preparation, driving conversation |
| Moderate | Heavy scaffolding, memory answers, safety | Short, familiar, high-scaffold, dyadic | Behaviour support, safety, respite |
| Advanced | Comfort, sensory, music, presence | Music/sensory reminiscence only | Nutrition/hydration, comfort, palliative coordination, dignity |

### 13.7 Social Connection Layer

Not an AI friend. A **social orchestrator**: notices contact gaps against the person's own pattern, proposes the call, dials it, prepares a conversation seed for the relative ("she was talking about the loom today"), records a shared voice note, and counts **human-contact events** as the metric of success. If the person leans on the Companion instead of people, that is treated as a *risk signal*, not engagement growth.

### 13.8 Care transitions

Home → AAM → district hospital → home is where information dies. The transition playbook: pre-visit summary + medication list + communication needs card; in-visit caregiver notes; post-discharge conversion of instructions into Dinacharya routines + a 14-day heightened-vigilance window for delirium.

### 13.9 Brain-Health layer (risk reduction)

Aligned to WHO 2026: physical activity, tobacco/alcohol, cardiometabolic management, hearing, social and cognitive engagement, air-pollution exposure (relevant in NER given indoor biomass cooking), and tailored multidomain support. Framed strictly as **risk reduction**, never "prevents dementia". Extends the platform's addressable population to spouses and adult children — who are also the caregivers.

---

## 14. Agentic AI Architecture

### 14.1 Why not one chatbot

A single model with one prompt cannot simultaneously hold: a warm, non-correcting persona for the person; a clinically cautious register for the caregiver; a provenance-strict register for the clinician; hard-coded safety rules for emergencies; and different data-access scopes per audience. Attempting it produces exactly the failure modes WHO warns about for large multimodal models in health — inaccurate, incomplete or biased output, plus automation bias.

We therefore use **bounded agents with explicit tool access, explicit memory scope, and explicit prohibitions**, behind an orchestrator, behind a Safety Gateway.

### 14.2 Agent register

| Agent | Responsibility | Inputs | Tools | Memory scope | Hard boundaries | Failure mode | Escalation |
|---|---|---|---|---|---|---|---|
| **A1 Cognitive Coach** | Select/adapt activities; maintain per-domain ability estimates | Cognitive profile, recent sessions, fatigue, quality flags | Compiler, item bank, θ-update | Cognitive + preference + culture | No clinical interpretation; no scores to user | Over-difficult → frustration | Fatigue watchdog → wind down; 3 low-quality sessions → CHW flag |
| **A2 Memory Agent** | Answer "who/what/when" from the graph; orientation; repetition handling | Utterance, graph, temporal store | Graph query, temporal filter, vector search | Person-visible facts only | Never state `unverified` facts as fact; no distressing content spontaneously | Wrong-person answer | Uncertainty phrasing → caregiver verification task |
| **A3 Routine Agent** | Adaptive reminders, confirmations, task scaffolding | Routine model, calendar, presence, fatigue | Scheduler, TTS, confirmation loop | Routine, appointments, meds (read-only) | **Never alter a medication regimen** | Nagging loop | 2 unconfirmed → caregiver nudge |
| **A4 Behaviour Reasoning** | Generate ranked *possible contributors* to observed change | Behaviour obs, sleep, meals, meds events, environment, history | Cause taxonomy, baseline query, evidence retrieval | Care-data scope | **No diagnosis**; no drug suggestions | Spurious causal story | Acute pattern → L5 |
| **A5 Safety Agent** | Wandering, falls, emergency, sudden change | Geofence events, fall events, inactivity, caregiver reports | Rules engine (not LLM), alerting, emergency card | Safety scope | **Deterministic rules only for emergencies**; no LLM in the emergency path | False alarm / missed alarm | Direct L4–L5, bypasses Attention Budget |
| **A6 Social Agent** | Detect contact gaps; propose and facilitate human contact | Contact history, family availability, person's pattern | Call/dial, voice note, conversation seed | Social scope | Never substitute itself for a person | Encourages dependency | Sustained AI-only interaction → caregiver note |
| **A7 Caregiver Copilot** | Compress, explain, recommend safe actions, prepare questions | All observations, baseline, guidelines | Agentic RAG, summariser, checklist library | Caregiver scope | No diagnosis; no prognosis; no medication advice | Overwhelming or falsely reassuring | Uncertainty → "seek assessment" |
| **A8 Clinical Preparation** | Build the longitudinal evidence pack | 4–12 weeks of everything + confounders | RAG (medical corpus), compression, provenance renderer | Clinical scope | No interpretation beyond "differs from own baseline" | Misleading summary | Clinician correction loop |
| **A9 Care Navigation** | Find and route to real local services | Location, need, service registry, NPHCE/AAM/Tele-MANAS directory | Geospatial query, directory, booking handoff | Non-clinical | No unverified facility claims | Stale directory | CHW verification workflow |
| **A10 Decision Support** | Present options, trade-offs, prior stated preferences | Care history, values, functional status, clinician input | RAG, options template | Caregiver + clinical (read) | **Never chooses** | Framing bias | Always ends with "discuss with clinician/family" |
| **A11 Knowledge/RAG** | Retrieve, rank, cite, resolve conflicts | Query + scope | Hybrid retrieval, evidence hierarchy | Corpus-scoped | Never mixes personal and medical corpora without labels | Hallucination | Refusal template |
| **A12 Personalisation** | Maintain the Personal World Model | All events | Graph writer, ontology binder | Full (write, audited) | No inference written as `[stated]` | Drift, stale facts | Periodic caregiver verification prompts |
| **A13 Escalation** | Own the L0–L5 ladder and the Attention Budget | All agent outputs | Alert policy, notification | Alert scope | Cannot suppress an L5 | Alert fatigue / suppression | Weekly audit of suppressed items |

### 14.3 Orchestrator policy

```
EVENT / UTTERANCE / TICK
   ↓
1  IDENTITY & SCOPE      who is speaking? which subject? which role? which visibility scope?
   ↓
2  URGENCY TRIAGE        deterministic rules first. Emergency keywords, fall event,
                         geofence breach, acute-change pattern → A5/A13 immediately.
                         (No LLM stands between a fall and an alert.)
   ↓
3  MEASUREMENT QUALITY   is the incoming observation trustworthy enough to reason on?
                         if not → collect, tag low-quality, do not infer
   ↓
4  INTENT ROUTING        which agent(s) own this? (may be several, sequenced)
   ↓
5  RETRIEVAL PLAN        graph? temporal? vector? medical corpus? local services?
                         scope-filtered before retrieval, not after
   ↓
6  AGENT EXECUTION       bounded tools, bounded memory, bounded output contract
   ↓
7  EVIDENCE FUSION       facts / hypotheses / actions separated; confidence attached
   ↓
8  SAFETY GATEWAY        §24 checks: provenance present? diagnosis language absent?
                         medication advice absent? uncertainty stated? role-appropriate?
   ↓
9  ATTENTION BUDGET      does this need to interrupt a human right now? (§21)
   ↓
10 DELIVER + AUDIT       response + immutable log entry (agent, inputs, sources, decision)
```

**Design rule:** the emergency path and the medication path are **rule-based, not model-based**. LLM reasoning is used for language, retrieval, explanation and hypothesis generation — never as the final authority on a safety-critical branch.

---

## 15. Personal Baseline and Change Detection Engine

### 15.1 The paradigm shift

| Conventional | MindMitra |
|---|---|
| "How does this person compare to a population norm?" | **"How is this person changing relative to themselves?"** |
| Assessment every 6–12 months | Continuous, low-burden observation |
| One score | Multi-domain state estimate with uncertainty |
| Education/language bias baked in | Bias largely cancelled by within-person comparison |

For NER specifically — lowest elderly education in India, dominant-language mismatch, low literacy — this is not a stylistic choice. It is the only defensible measurement strategy.

### 15.2 Cold start (answers H15)

```
Day 0–3     CHW + family: retrospective baseline elicitation
            structured informant questions: "compared to a year ago, how is she with…"
            → coarse prior on each domain + functional status + routine + sensory status
Day 1–14    Calibration period. Higher session frequency, wide item-difficulty sampling,
            explicit "we are still learning what is usual for her" messaging.
            NO alerts above L2 generated from cognitive telemetry in this window
            (safety events excepted — those are always live).
Day 15+     Rolling personal baseline active. Confidence rises with observation count
            and measurement quality.
```

### 15.3 Baseline model

For each tracked signal *s* we maintain a robust rolling location and scale, and a deviation score:

```
Signals tracked (all optional, all consented, all quality-weighted)
  cognitive     θ per domain · response latency · error type mix · help requests
  memory        repeated-question rate · orientation events
  language      utterance length · lexical diversity · pause ratio   [RESEARCH-STAGE]
  routine       adherence rate · meal events · medication confirmation
  activity      session count/duration · voluntary initiation · steps (if wearable)
  sleep         caregiver-reported wakings · (wearable estimate if present)
  social        human-contact events · call duration
  behaviour     caregiver-logged agitation/apathy/anxiety episodes
  safety        geofence events · falls · near-misses

Deviation      z_s(t) = ( x_s(t) − median_s(w) ) / (1.4826 · MAD_s(w))     w = 28-day window
Quality gate   z_s only enters reasoning if q_s(t) ≥ q_min
Composite      D(t) = Σ_s ω_s · clip(|z_s(t)|) · q_s(t)      ω = domain weights
Persistence    P = consecutive days with z_s beyond threshold
```

### 15.4 Measurement-Quality Engine (a core novelty)

Before any deviation is allowed to mean anything, the engine computes a per-observation quality score:

| Quality dimension | Checked how | Effect if poor |
|---|---|---|
| **Audibility** | Device volume, ambient noise estimate (on-device), ASR confidence, repeat-request count | Downweight; prompt hearing check; flag for CHW |
| **Visibility** | Brightness/contrast setting, font scale, time-of-day light, error pattern typical of visual difficulty | Downweight; prompt vision check |
| **Language match** | Session language vs person's stated best language; code-switch rate; comprehension-failure markers | **Flag `language_mismatch` — never counted as cognitive failure** |
| **Fatigue** | Time since waking, session-position effect, 2-tap self-report, caregiver note | Downweight; end session |
| **Assistance / coaching** | Caregiver-present flag; anomalous latency-accuracy pattern | Tag `assisted`; excluded from ability estimate |
| **Device / data integrity** | Missing sensor windows, power outage gaps, app version | Explicit `insufficient data` state, **never** treated as decline |
| **Subject identity** | Session confirmation on shared devices | Discard if unconfirmed |

Output: `q ∈ [0,1]` plus a human-readable reason. The Clinical Bridge prints **Measurement Confidence** on every summary. This is what allows a clinician to trust the system's silence as much as its signals.

### 15.5 From deviation to action — the escalation ladder

| Level | Name | Trigger pattern | Who is told | Example |
|---|---|---|---|---|
| **L0** | Normal | Within baseline | Nobody | Ordinary variation |
| **L1** | Informational | Single-day deviation, low persistence | Logged only; visible on request | One missed session |
| **L2** | Monitor | 3+ days, single domain, quality OK | Caregiver weekly digest | Activity ↓ 3 days |
| **L3** | Caregiver action | Multi-domain deviation OR behaviour change with plausible comfort cause | Caregiver, same day, with checklist | Agitation + sleep ↓ + meal ↓ |
| **L4** | Clinical review | Persistent multi-week change with functional impact; medication concern; repeated falls | Caregiver + CHW; teleconsult suggested | 3 wks: repetition ↑, IADL loss, sleep ↓ |
| **L5** | Urgent | **Sudden severe confusion change (possible delirium)**; fall with injury; geofence breach with no contact; suicidal or crisis statement | Caregiver + CHW + emergency contacts immediately; Attention Budget bypassed | Acute-onset disorientation over hours |

### 15.6 Acute Change Detector (delirium safety)

**[ESTABLISHED]** Sudden deterioration in a person with dementia may reflect delirium — often precipitated by infection, dehydration, medication or hospitalisation — rather than disease progression, and it carries worse outcomes if missed.

```
IF  onset window ≤ 72 h
AND deviation magnitude ≥ acute threshold (multi-domain)
AND (fluctuating course OR new inattention OR altered arousal reported)
THEN  L5.  Message template:
      "This change appeared suddenly. Sudden changes like this can have treatable
       causes — including infection, dehydration or a medication effect. Please seek
       medical assessment today. This is not a diagnosis."
NEVER  attribute a sudden change to dementia progression.
```

### 15.7 False positives and false negatives — stated honestly

| | Cause | Cost | Mitigation | Residual risk |
|---|---|---|---|---|
| **False positive** | Fatigue, noise, language mismatch, device gap, visitor disruption, festival week, caregiver change | Alert fatigue → distrust → abandonment (Loop F) | Quality gating; persistence requirement; Attention Budget; caregiver "this was expected" feedback button that updates the baseline | Non-zero; we will measure and publish the false-alert rate per level |
| **False negative** | Slow-onset uniform decline; low engagement so few observations; caregiver under-reports; person masks | Missed deterioration → late presentation | Multi-signal redundancy; explicit low-data warnings; scheduled CHW visits independent of alerts; never let "no alert" read as "all well" | Non-zero; the UI states *"absence of an alert is not a clinical clearance"* |

**[ASSUMPTION]** Target: ≤1 caregiver-facing L3+ alert per person per week at steady state; ≥70% of L3+ alerts rated "useful" by caregivers. Pilot hypothesis (§30).

---

## 16. Digital Phenotyping — a Research Module, Clearly Fenced

**[RESEARCH-STAGE]** Reviews of passive digital markers and remote monitoring for dementia consistently report the same limitations: small datasets, inconsistent reference standards, limited external validation, weak real-world evidence, usability and privacy concerns. Speech-biomarker reviews additionally report substantial risk of bias — and evidence for **low-resource languages is effectively absent**.

Therefore:

| We will | We will not |
|---|---|
| Collect (with consent) interaction telemetry, session performance, repetition counts, routine adherence | Present any digital-phenotype output as a diagnosis, stage, or cognitive score |
| Run speech/language analysis in **shadow mode** — computed, stored, not shown | Show speech-derived indices to caregivers or patients |
| Build the first NER low-resource-language dementia interaction corpus (§32) | Claim detection performance without prospective validation |
| Publish measurement reliability before any clinical utility claim | Deploy a phenotype model into an alert path pre-validation |

**Sequenced research discipline:** measurement → reliability (test-retest) → validity (against clinician assessment) → longitudinal association → clinical utility. We do not skip a step to get a demo.

---

## 17. Multimodal AI and the Personal Cognitive State Model

### 17.1 Modality contribution and honest cost

| Modality | Contributes | Tier | NER-specific risk | Decision |
|---|---|---|---|---|
| Text/LLM | Language generation, summarisation, retrieval | ESTABLISHED (as tooling) | Hallucination; poor low-resource fluency | Yes, gated |
| ASR | Voice-first access for non-literate users | ESTABLISHED for Tier A; thin for B/C | Accent + noise failure (named explicitly in the India study) | Yes, tiered (§18) |
| TTS | Delivery to non-readers | ESTABLISHED Tier A/B | Robotic prosody reduces warmth | Yes; human-recorded voice for Tier C |
| Touch telemetry | Latency, hesitation, error type | RESEARCH-STAGE as marker | Device variance | Yes, as feature; not as claim |
| Photo/vision (static, on-device) | Object/scene cueing; photo tagging | RESEARCH-STAGE | Bias on local objects/faces | Limited, opt-in, on-device |
| Wearable accelerometer | Falls, activity, sleep proxy | PROMISING (falls detection); RESEARCH-STAGE (sleep staging) | Cost; non-wear | Optional add-on |
| Ambient/home sensors | Door, motion, gas | PROMISING for events | Cost, install, intrusiveness | Optional, event-based |
| Video / face recognition | — | — | **Surveillance and dignity harm** | **No** |
| Gait analysis (camera) | — | RESEARCH-STAGE | Same | **No** |

### 17.2 Uncertainty-aware fusion

Never this:

```
speech 80 + game 70 + sleep 60  →  "cognitive score 70"
```

Instead this:

```
domain estimate with uncertainty and missingness, per source, per quality
  game telemetry     θ_memory = −0.4 σ    conf 0.91   n=34 sessions
  repetition count   +2.1 σ               conf 0.88   caregiver + system
  speech markers     inconclusive         conf 0.34   [SHADOW ONLY]
  sleep (reported)   −1.6 σ               conf 0.62   caregiver log, 3 gaps
  → state estimate presented as: direction + magnitude + confidence + what's missing
```

### 17.3 Personal Cognitive State Model (the honest version of a "digital twin")

We reject "cognitive digital twin" as a claim — it implies simulation of a brain. **[EXPERIMENTAL]** We build instead a **Personal Cognitive State Model**:

```
z_t = P( cognitive / functional / behavioural state | X_1:t , Q_1:t )
      X = observations   Q = measurement quality
```

What it legitimately supports: *"which activity suits this person today?"*, *"has this changed beyond her usual variation?"*, *"what is missing from our picture?"* — with uncertainty. What it must never output: a brain age, a stage, a diagnosis, or a prognosis.

---

## 18. Local Language and Cultural Intelligence

### 18.1 Translation is not localisation

```
WRONG   English content → machine translation → Assamese/Khasi/Mizo strings

RIGHT   Cultural ontology per community
        ├─ language + dialect + register (how elders are addressed)
        ├─ kinship system (matrilineal Khasi/Garo ≠ patrilineal norms)
        ├─ food, crops, cooking sequences
        ├─ music, hymns, folk forms
        ├─ festivals and the agricultural calendar
        ├─ places, landmarks, sacred sites, market days
        ├─ occupations (jhum, tea, weaving, fishing, cattle, teaching)
        ├─ objects a 78-year-old actually recognises
        └─ interaction norms (indirectness, honorifics, humour, what is impolite to ask)
```

The India participatory-design study is our design brief here: **kind tone, appreciative language, robustness to local accents and noise, clinic-based familiarisation.**

### 18.2 The tiered language strategy (the practical answer to a hard constraint)

| Tier | Criterion | Person-facing capability | How we deliver | Longitudinal language analysis |
|---|---|---|---|---|
| **A** — Assamese, Bengali, Hindi, English, Nepali | Production ASR + TTS + MT available (AI4Bharat / Bhashini) | Full voice conversation, voice games, voice reminders | Bhashini/IndicConformer-class ASR + TTS on device where possible, cloud fallback | Enabled (shadow) |
| **B** — Bodo, Meitei, Mizo | Scheduled/partially resourced; ASR thin | Voice **output** (TTS or recorded human voice) + touch/picture input; limited command-grammar ASR (30–60 fixed intents) | Recorded human voice packs for all core prompts; constrained-grammar ASR | Disabled |
| **C** — Khasi, Garo, Kokborok, Nyishi, Adi, Nagamese, Pnar, Chakma | Low-resource; no production ASR | **Human-recorded voice packs + picture-first UI + caregiver/CHW-mediated interaction**; audio is *recorded and stored*, not transcribed live | Community voice-artist recordings (one-time, ~600–900 prompts per language); NE-specific retrieval models (AIKosh NE-Embed/NE-SpeechEmbed) for search over recorded content | Disabled; **corpus collection with consent** |

> **This tiering is the most important engineering-honesty decision in the document.** A system that claims Khasi voice AI in 2026 will fail in the field and discredit the whole platform. A system that ships *human-recorded Khasi prompts with picture-first interaction today*, while building the corpus that makes Khasi ASR possible tomorrow, is both usable now and a genuine research contribution.

### 18.3 Code-switching and register

NER speech is heavily code-mixed (Assamese–English, Nagamese–English, Mizo–English). Design responses: mixed-script and mixed-language item banks; ASR configured for code-mixed decoding in Tier A; never treating a code-switch as a language error; elder-appropriate honorifics (*Aitâ*, *Koka*, *Mei*, *Pi*, *Nu*) selected per community, never generically.

### 18.4 Why cultural personalisation is a clinical variable, not a marketing one

| Effect | Mechanism |
|---|---|
| **Engagement** | Apathy in dementia responds to *interest*, not instruction. Familiar content is the only reliable activation key. |
| **Comprehension** | Unfamiliar objects/scenes produce failure that looks like agnosia. |
| **Dignity** | Being addressed correctly, in one's own language, about one's own life, is the difference between a patient and a person. |
| **Trust and adherence** | The India study links acceptance directly to tone and cultural fit. |
| **Measurement validity** | Culturally alien items have unknown difficulty → corrupt ability estimates → false decline signals. |

---

## 19. Space Technology Integration — Honest Triage

The problem statement lists the theme as *Space Technology* while the category is *Software*. We treat this as a taxonomy artefact and refuse to fabricate relevance. Three buckets:

### 19.1 Directly useful

| Application | Concrete use in MindMitra | Evidence / status |
|---|---|---|
| **Satellite-backhauled connectivity at existing remote sites** | Sync points for CHW-carried data and teleconsults at AAMs/GPs served by satellite links. **[ESTABLISHED]** Remote NER gram panchayats have been connected under BharatNet using ISRO **GSAT-11/GSAT-19** capacity where fibre was infeasible — this is a live dependency in exactly our geography, not a hypothetical | Existing infrastructure |
| **Geospatial care-accessibility modelling (GIS)** | Compute real travel-time isochrones from villages to AAM / district hospital / neurology-capable facility across NER terrain; use it to (a) prioritise pilot districts, (b) set per-village offline-autonomy requirements, (c) give MDoNER a **dementia care-access deficit map** as a planning deliverable | Standard, deployable |
| **GNSS/NavIC-assisted safe return** | On-device positioning for geofence and safe-return guidance where cellular positioning is weak; NavIC improves availability in Indian terrain | Deployable; consent-gated |
| **Disaster-resilient continuity** | NER faces floods, landslides and seismic risk. Satellite-linked continuity for the emergency card, medication list and care plan when terrestrial networks fail | Deployable at facility tier |
| **Satellite weather/hazard feeds** | Flood/landslide/heatwave advisories tied into routine adaptation and caregiver alerts for a frail cohort | Deployable via IMD/ISRO feeds |

### 19.2 Potentially useful — with a reality check

**LEO satellite broadband (Starlink, Eutelsat OneWeb, Jio-SES/Orbit Connect).** **[ESTABLISHED as of mid-2026]** All three hold Indian licences/authorisations; **none has launched commercial service**, with spectrum assignment and security clearance outstanding, and TRAI consultation on satellite spectrum pricing issued in April 2026.

> **Architectural consequence:** LEO broadband is a **future accelerant, not a design assumption.** MindMitra must be fully useful with zero connectivity today. If and when LEO service goes live, it upgrades sync frequency and enables video teleconsults in the 1,176 uncovered Arunachal villages — it does not change the core architecture. Any SIH proposal that *depends* on LEO service in NER during 2026–27 is proposing something that cannot currently be switched on.

### 19.3 Forced — and explicitly rejected

| Proposed | Why we refuse |
|---|---|
| Satellite imagery for cognitive assessment | No plausible mechanism. Pure theme-chasing. |
| Space-based "monitoring" of elderly individuals | Surveillance framing; dignity harm; no added capability over on-device sensing. |
| Satellite-enabled AI diagnosis | Diagnosis is not a connectivity problem. |
| Blockchain-on-satellite health records | Solves nothing here; adds cost and failure modes. |

Saying this out loud is itself a differentiator: evaluators can tell forced integration from reasoned integration.

---

## 20. Safety Layer and Minimum Necessary Sensing

### 20.1 The sensing philosophy

> **Collect the minimum necessary data. Derive the maximum useful context.**

**[RESEARCH-STAGE evidence base]** Remote-monitoring reviews explicitly flag the tension between extensive monitoring and practicality, empathy, privacy and usability. Our default is therefore *no passive sensing at all*; every sensor is an opt-in, per-purpose, revocable addition.

| Tier | What | Purpose | Consent | Retention |
|---|---|---|---|---|
| **T0 — always (no sensors)** | App interaction telemetry, session performance, caregiver-entered observations | Personalisation, baseline | Onboarding consent | 24 months, then aggregate |
| **T1 — opt-in, device-only** | On-device coarse location for geofence **events only** | Wandering safety | Separate explicit consent; person-informed | Events only, 90 days |
| **T2 — opt-in wearable** | Accelerometer → fall events, activity, sleep proxy | Falls, rhythm | Separate consent + wear comfort check | Events + daily aggregates |
| **T3 — opt-in home sensors** | Door, motion, gas/smoke | Night exits, unsafe cooking | Household consent | Events only |
| **T4 — never** | Continuous audio recording, video, face recognition of visitors, keystroke content, financial account access | — | — | — |

**Location design detail:** raw traces never leave the device. The device evaluates geofences locally and emits *events* (`left_safe_zone`, `returned`, `no_movement_90min`). A caregiver cannot ask "where is she right now?" as a routine query; they can request a live position only during an **active L4/L5 safety event**, and that request is logged and visible to the person's record. This single design choice converts a surveillance tool into a safety tool.

### 20.2 Wandering: safe return, not confinement

```
EVENT: geofence exit, 18:40, no caregiver present
  ↓
1  Companion (gentle, in her language): "It's getting dark. Shall I show you the way home?"
   → familiar-landmark route guidance (offline map pack + rehearsed route from games)
2  Simultaneously: caregiver notified with last known area + direction
3  T+5 min no return → secondary caregiver + CHW
4  T+15 min → emergency contacts; offline SAFE RETURN CARD auto-displayed on screen:
   name · village · languages spoken · "I have memory difficulty" ·
   two phone numbers · key medical notes · ABHA ID
5  Every step logged. Person is never locked in, never shamed, never told they "escaped".
```

### 20.3 Emergency card (works fully offline)

Identity, photograph, languages understood, one-line communication guidance ("speak slowly, one question at a time"), key conditions, allergies, current medications, two contacts, AAM/CHW contact, ABHA ID. Accessible from the lock screen without authentication — because an unconscious person cannot unlock a phone.

---

## 21. Alerting, Attention Budget and Escalation

### 21.1 The failure we are engineering against

An alert-happy dementia platform produces a caregiver who ignores alerts. That is worse than no platform, because it manufactures false reassurance. Loop F in §5.1 is a *product-induced* harm, and we treat it with the same seriousness as a clinical harm.

### 21.2 Alert eligibility function

```
Alert(e) fires only if ALL hold:
  deviation      |z| ≥ τ_level
  persistence    P ≥ p_level                    (except L5)
  quality        q ≥ q_min                      (bad data cannot raise an alarm)
  novelty        not substantially duplicative of an alert in the last 7 days
  actionability  a concrete, safe caregiver action exists
  safety         OR: safety-rule override (L5 always fires)
```

### 21.3 Attention Budget

| Recipient | Budget at steady state | Bypass conditions |
|---|---|---|
| Person | 0 alerts (never alarmed about their own data) | none |
| Primary caregiver | ≤1 L3+ interruption/week; 1 weekly digest; daily card available **on pull** | L4/L5 |
| Secondary caregiver | weekly digest only | L4/L5 |
| CHW | ≤5 flagged households per visit cycle | L5 |
| Clinician | pre-consult pack only | L5 with clinical relevance |

Suppressed items are not discarded: they are logged, shown in the weekly digest, and **audited** — because a suppression policy without an audit is a missed-alarm generator.

**Delivery classes (orthogonal to the L0–L5 ladder).** The escalation level says what the *evidence means*; the **delivery class** says how it *reaches a human*, per recipient (specified in `tech-stack.md` §22.1). The classes are `EMERGENCY · URGENT · ACTION_REQUIRED · REVIEW_WHEN_CONVENIENT · INFORMATIONAL · NO_NOTIFICATION`, and `NO_ACTION_REQUIRED` ("nothing needs attention") is a valid, first-class output. One L3 event can be `ACTION_REQUIRED` for the caregiver, `INFORMATIONAL` for the CHW and `NO_NOTIFICATION` for the clinician — the same evidence, three different notification behaviours, from one governed source. The Attention Budget above constrains the interrupting classes only; `INFORMATIONAL` and `NO_NOTIFICATION` update the relevant views silently. L5 always fires and always bypasses the budget.

### 21.4 Caregiver feedback loop

Every alert carries three buttons: **"Useful" / "Expected — this had a reason" / "Not useful"**. "Expected" writes a context annotation (festival, visitor, travel, illness) that the baseline model uses to widen tolerance. This converts alert-tuning from an engineering guess into a per-household learned policy — and gives us the honest false-positive rate for §30.

---

## 22. Behaviour Cause-Reasoning Engine

### 22.1 Architecture

```
OBSERVE        caregiver log entry / detected deviation / person's own statement
   ↓
CONTEXTUALISE  time of day · since when · what changed in the environment ·
               who is present · what happened before · previous similar episodes
   ↓
BASELINE       is this outside her own pattern? by how much? with what confidence?
   ↓
CANDIDATE GENERATION (taxonomy-driven, not free-form LLM speculation)
               physical · iatrogenic · acute/infective · sensory/environmental ·
               circadian · psychological · communicative
   ↓
EVIDENCE BINDING   each candidate gets: supporting observations, timestamps, sources,
                   and an explicit "we have no data on this" where true
   ↓
RANK           by evidence strength × prior likelihood × severity-if-true
   ↓
SAFE ACTION    from a curated, guideline-aligned checklist library (NICE-aligned:
               assess causes incl. pain, delirium and inappropriate care;
               psychosocial/environmental measures first)
   ↓
SAFETY GATEWAY three-layer output contract, no diagnosis, no drugs
   ↓
ESCALATE?      acute pattern → L5; persistent → L4
```

### 22.2 The three-layer output contract (enforced, not stylistic)

Every behaviour output must be renderable as exactly these three labelled blocks:

```
FACT         "Sleep interruptions rose from ~1 to ~3 per night over the last 7 days.
              Lunch was partly left on 3 of 4 days. Activity is ~30% below her usual."
              [sources: caregiver log · session telemetry]  [confidence: moderate]

HYPOTHESIS   "Several things could contribute: disrupted sleep; discomfort or pain;
              constipation or a urinary problem; the routine change since Monday.
              We cannot tell which from here. This is not a diagnosis."

ACTION       "Now: check pain, thirst, toilet, constipation, warmth. Keep this evening
              quiet and dim. Offer her usual evening songs.
              If it continues past Thursday — or worsens suddenly — contact the AAM.
              Sudden severe confusion needs same-day medical attention."
```

A response that cannot be decomposed into fact / hypothesis / action is **blocked** by the Safety Gateway. This is the single most effective anti-hallucination control in the system, because it forces every clause to declare its epistemic status.

### 22.3 Psychosis and delusions — a specific policy

Never confirm the false belief; never argue against it. Sequence: **acknowledge the feeling → ensure immediate safety → redirect to a grounded, comforting activity → log → escalate if new, frightening, escalating, or accompanied by acute confusion.** Accusatory delusions directed at a caregiver additionally trigger a caregiver-support card, because these episodes are among the most distressing and abuse-risk-elevating events in dementia care.

---

## 23. Privacy, Security, Consent and the Memory Firewall

### 23.1 Why this section is load-bearing, not compliance boilerplate

**[ESTABLISHED]** Financial exploitation and elder abuse are recognised risks for people living with dementia, and psychological and financial abuse are prominent categories. A platform that hands one caregiver total, unaudited control over a cognitively impaired person's data, location, routine and finances is an abuse-enabling artefact.

> **Design axiom: the caregiver is not automatically the owner of the person's digital life.**

### 23.2 Consent architecture under progressive incapacity

| Stage | Consent model | Mechanism |
|---|---|---|
| Capacity present | **Person's own informed consent**, in their language, delivered verbally with a recorded confirmation and a plain-language one-pager for the family | Consent objects are per-purpose (games / memory / location / wearable / clinical sharing / research), independently revocable |
| Capacity fluctuating | **Supported decision-making** — re-affirmation at each escalation of data scope; person's prior expressed wishes recorded as a first-class object | "Advance preferences" node in the graph |
| Capacity lost | **Proxy consent with audit and constraint** — proxy cannot expand scope beyond what the person previously permitted for non-safety purposes; safety-critical scopes have a documented override with mandatory logging and CHW visibility | Two-key rule: expanding sensitive scope requires proxy **plus** CHW/clinician acknowledgement |
| Any stage | **Person's veto on content** — "don't show me this" always honoured, at every capacity level | Content-level suppression flags |

Legal frame: India's **Digital Personal Data Protection Act, 2023** (consent, purpose limitation, data-fiduciary duties, children/guardianship provisions), **ABDM** consent architecture and ABHA-linked records, and institutional ethics review for the pilot. Data residency: India.

### 23.3 The Memory Firewall

```
                              DATA
        ┌──────────────┬───────────┴────────┬──────────────┬──────────────┐
        ↓              ↓                    ↓              ↓              ↓
  Person-private   Life-story /       Care/routine     Clinical      Safety/location
  (journal, "do    memories           observations     summaries     events
   not show me")
        │              │                    │              │              │
        └──────────────┴──────── PERMISSION LAYER ─────────┴──────────────┘
                       (purpose × role × time-bound × consent object)
                                        ↓
                                 ACCESS POLICY
                                        ↓
                                  AGENT SANDBOX
                     (each agent sees only its declared scope)
                                        ↓
                             RESPONSE + IMMUTABLE AUDIT
```

Role-scope matrix:

| Data class | Person | Primary caregiver | Secondary caregiver | CHW | Clinician | Researcher (consented) |
|---|---|---|---|---|---|---|
| Life-story memories | ✅ own | ✅ | ✅ | ⛔ | ⛔ | ⛔ |
| Person-private notes | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Routine & activity | ✅ | ✅ | ✅ | ✅ visit-scoped | ✅ summary | de-identified |
| Continence / intimate care | ✅ | ✅ | ⛔ default | ✅ if care-relevant | ✅ | ⛔ |
| Behaviour observations | summary | ✅ | ✅ summary | ✅ | ✅ | de-identified |
| Medication list | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ |
| Location events | ✅ | ✅ events | events | events | ⛔ | ⛔ |
| **Live position** | ✅ | **only during active L4/L5, logged** | ⛔ | ⛔ | ⛔ | ⛔ |
| Clinical notes from clinician | summary in plain language | ✅ shared summary | ⛔ | ✅ relevant | ✅ | ⛔ |
| Financial information | — | — | — | — | — | — (**not collected**) |
| Raw audio/video | — | — | — | — | — | — (**not collected**) |

Additional safeguarding mechanisms: immutable audit log visible to the person and to a designated second family member; anomaly detection on *caregiver* behaviour (e.g. repeated attempts to expand scope, disabling of the person's veto, suppression of clinician contact) surfaced to the CHW; multi-caregiver disagreement rendered as *shared evidence with provenance* rather than adjudicated by the system; a documented pathway to statutory safeguarding channels where abuse is suspected — never an automated accusation.

**The Firewall governs *derived* information, not only raw data.** The matrix above scopes raw data classes; but what the caregiver, CHW and clinician actually receive are *insights, reports, notifications and packets derived from* that data. The Memory Firewall therefore has a second decision surface, `project()`, over derived artefacts (specified in `tech-stack.md` §19.1; the full derived-information matrix is `Solution.md` §23.5). Two rules make it sound: **(1) sensitivity union** — a derived artefact carries the union of its sources' sensitivity and can never be more visible than its least-visible input (a digest that touches continence data inherits continence's guards); **(2) re-evaluation at delivery** — consent is re-checked when the artefact is delivered, not only when it was generated, so a revocation between the two withholds it. A consequence for the UI: a role's **navigation is generated from `project()`**, so an unauthorised destination does not exist in the tree rather than appearing greyed-out (`DESIGN.md` §B2).

### 23.4 Security baseline

At-rest encryption on device (Android Keystore-backed) and server; TLS in transit; per-person key scoping; no PII in logs or telemetry; de-identification pipeline for research exports (k-anonymity thresholds + free-text scrubbing); signed content packs; app integrity checks; role-based server access with break-glass logging; documented retention and deletion (person or proxy can export and delete; safety and audit logs retained per statutory minimum with justification shown).

---

## 24. Responsible AI and the Safety Gateway

### 24.1 Automation classification — every capability placed in exactly one bucket

| Bucket | Capabilities |
|---|---|
| **Safe automation (AI acts)** | Reminders and confirmations · activity selection and difficulty adaptation · memory retrieval of *verified* facts · orientation prompts · repetition-aware answers · summarisation and compression · deviation detection · alert prioritisation · service directory lookup · content translation within a tier · session logging |
| **Human approval required (caregiver/CHW confirms)** | Adding or correcting a memory fact · changing sensing scope · sharing data with a new party · escalating to family beyond primary caregiver · marking a behaviour episode resolved · changing routine structure |
| **Clinical review required** | Any statement about cognitive change with clinical relevance · medication reconciliation discrepancies · suspected delirium · fall with injury · new functional loss · treatment-journey steps · anything entering the medical record |
| **Prohibited autonomy (never, in any version)** | Diagnosing dementia or any disease · staging · prognosis · prescribing, changing or stopping medication · declaring someone unfit to drive · controlling finances or accounts · overriding the person's stated refusal · deleting the person's own content · continuous recording · autonomous emergency medical decisions · generating fictional personal memories · claiming to be a human or a clinician |

### 24.2 Safety Gateway checks (every outbound message, every role)

```
1  ROLE FIT             is this register/content appropriate for this recipient?
2  DIAGNOSIS FILTER     block: "has dementia", "is progressing", "stage X", "Alzheimer's"
                        allow: "differs from her own recent pattern"
3  MEDICATION FILTER    block any dose/drug/stop/start advice → route to clinician
4  PROVENANCE CHECK     every factual clause traceable to a source with a timestamp
5  UNCERTAINTY CHECK    hypotheses labelled; confidence stated; "we don't know" permitted
6  THREE-LAYER CONTRACT decomposable into FACT / HYPOTHESIS / ACTION (§22.2)
7  DIGNITY CHECK        no failure framing, no infantilising language, no correction of the person
8  CRISIS CHECK         self-harm/crisis language → crisis protocol + Tele-MANAS 14416 + human
9  EMERGENCY OVERRIDE   deterministic safety rules cannot be softened by the model
10 LOG                  agent, inputs, retrieved sources, gateway verdict → immutable audit
```

### 24.3 Anti-hallucination stack

| Layer | Control |
|---|---|
| Retrieval | Scope-filtered before retrieval; personal and medical corpora never merged unlabelled |
| Evidence hierarchy | guideline > systematic review/meta-analysis > RCT > observational > hypothesis > AI inference. The model cannot promote a lower tier. |
| Grounding requirement | Medical guidance must cite a corpus document; ungrounded → refusal template |
| Refusal templates | "I don't have reliable information about that. This is a question for the doctor — shall I add it to your list for the next consult?" |
| Temporal validity | `valid_to` closes superseded facts (prevents old-medication answers) |
| Verification status | Only `verified` facts may be asserted plainly |
| Shadow evaluation | Adversarial red-team suites run per release: fabricated-memory probes, medication-advice bait, diagnosis bait, code-switch confusion, distress escalation |

---

## 25. Failure Mode Analysis (we attack our own design)

| # | Failure | Consequence | Mitigation | Residual risk |
|---|---|---|---|---|
| F1 | LLM hallucinates medical advice | Direct harm | Grounding requirement, medication filter, refusal templates, red-team suite | Low but non-zero → clinician-facing disclaimer + reporting channel |
| F2 | Wrong-person memory answer | Distress, distrust | Verification status; hedged phrasing when confidence < high; caregiver verification tasks | Moderate early; declines with graph maturity |
| F3 | Fabricated memory | Identity harm | Generative retelling restricted to `verified` facts; no AI imagery of real people | Low |
| F4 | False reassurance ("all normal") | Missed deterioration | UI states absence of alert ≠ clearance; scheduled CHW visits independent of alerts | **Accepted and disclosed** |
| F5 | Alert storm | Distrust, abandonment | Attention Budget; persistence; quality gating; feedback loop | Managed; measured in pilot |
| F6 | Missed deterioration (slow, uniform) | Late presentation | Multi-signal redundancy; low-data warnings; periodic informant questionnaires | **Accepted and disclosed** |
| F7 | ASR failure on Tier B/C language or accent | Misread as cognitive failure | **Language-mismatch flag**; Tier C avoids live ASR entirely | Low by design |
| F8 | Cultural misfit of content | Disengagement read as apathy/decline | Community co-creation; engagement-vs-content diagnostics; content-level opt-out | Moderate → mitigated by co-design |
| F9 | Sensor failure / non-wear | Data gap read as decline | Explicit `insufficient data` state; never infer from absence | Low |
| F10 | Connectivity loss for weeks | Stale clinical picture | Full offline core; CHW sync mule; sync-age shown on every clinical view | Low |
| F11 | Shared device, wrong subject | Corrupted baseline | Session subject confirmation; anomaly detection on interaction fingerprint | Low |
| F12 | Power outage / device loss | Data loss | Local encrypted store + opportunistic backup; graph re-derivable from family upload | Moderate |
| F13 | Caregiver misuse of access | Privacy/abuse harm | Memory Firewall, audit visible to person + second family member, scope-expansion anomaly flags | **Reduced, not eliminated** — safeguarding pathway documented |
| F14 | Over-monitoring normalised | Dignity harm | Minimum Necessary Sensing; periodic consent review; sensing "off" is a valid steady state | Moderate; requires governance |
| F15 | Person rejects the system | Non-adoption | Voice-first, zero-learning UI, dignity constraints, CHW-mediated introduction and clinic familiarisation (per India study) | Moderate — primary adoption risk |
| F16 | Game frustration | Distress, refusal | 75–85% success band, fatigue watchdog, always end on success, no timers/scores | Low |
| F17 | AI dependency / displaced human contact | Isolation deepens | Social orchestration to humans; human-contact metric; dependency signal flagged | Moderate |
| F18 | Delirium mistaken for progression **by the system** | Missed emergency | Acute Change Detector at L5; prohibited progression language | Low by design |
| F19 | Pain missed | Untreated suffering | Comfort-change detector; comfort checklist first in every behaviour output | Moderate |
| F20 | Sensory loss uncorrected for months | Systematic measurement error | Measurement-Quality Engine + CHW screening prompts + audiology/optometry referral path | Moderate (service availability is the binding constraint, not detection) |
| F21 | Model drift | Silent validity loss | Drift monitors on input distributions and alert rates; versioned baselines; periodic clinician-agreement re-check | Moderate |
| F22 | Data breach | Serious privacy harm | Encryption, minimisation (no audio/video/financial data), India residency, penetration testing, incident plan | Low-moderate |
| F23 | Clinician overload from summaries | Non-use | One page maximum; 5-finding cap; clinician can set what they want to see | Moderate |
| F24 | CHW workload rejection | Programme failure | ≤10 min/household; taps and voice only; integrated into existing visit schedule; no parallel register | **High risk — must be validated in Phase 1** |
| F25 | Family conflict amplified by data | Relationship harm | Shared evidence with provenance; system never adjudicates; no "who is right" framing | Moderate |
| F26 | Stigma from being "a dementia app" user | Non-adoption; social harm | Positioned as memory and brain-health support; no diagnostic labels in the person-facing UI; discreet notifications | Moderate |
| F27 | Scope creep into surveillance under pressure from a well-meaning family | Slow erosion of the core principle | T4 "never" list is architecturally absent, not toggled off; governance review for any sensing change | Managed by governance |

---

## 26. Offline-First and Edge Architecture

> **Horizon B/C commitment (canonical, per `CLAUDE.md` §4 and `tech-stack.md` §4).** This section describes the **target** offline architecture, delivered by horizon. It is **not** the Horizon-A build. Horizon A (now) is online and server-side: the intelligence layer runs in the FastAPI monolith and is served to the Next.js web client, and the **seams** that make offline non-destructive later — event-sourced writes, idempotency keys, entity versioning, provenance on every fact, a sync-shaped API — are built now because safety requires them anyway. The **zero-connectivity guarantees below become "non-negotiable" for the Horizon B/C mobile/edge client**, not for the current web build.
>
> | Horizon | What "offline" means | Status |
> |---|---|---|
> | **A (now)** | Online, server-side; the web client caches its last-fetched state and shows a **sync-age** chip; no inference offline; no inference is drawn from a connectivity gap | **Build now** |
> | **B (offline-capable)** | Local replica + append-only event log + delta sync on the Expo mobile client; the guarantees in §26.1 apply here | Seams now, engine later |
> | **C (edge)** | On-device inference, local RAG, CHW encrypted sync-mule for the 1,841 uncovered villages | Future; no rewrite |

### 26.1 What must work with zero connectivity (the Horizon B/C guarantee)

*The following is the acceptance list for the Horizon B/C client. In Horizon A the same functions run server-side and are served online; the "Offline?" column is the future target, not the current web build.*

| Function | Offline? (Horizon B/C target) | How |
|---|---|---|
| Cognitive activities (all 12 domains) | **Full** | Local item bank + pre-downloaded content pack (80–250 MB) |
| Personal memory retrieval ("who is Rina?") | **Full** | On-device graph replica (SQLite + local vector index) |
| Orientation, routine, reminders, confirmations | **Full** | Local scheduler + rule engine |
| Task decomposition / scaffolding | **Full** | Local templates bound to the person's routine |
| Repetition detection | **Full** | Local rolling counters |
| Personal baseline update | **Full** | On-device incremental statistics |
| Voice output (all tiers) | **Full** | On-device TTS (Tier A/B) or recorded human voice packs (Tier B/C) |
| Voice input | **Tier A partial** | On-device small ASR for a constrained intent set; cloud for open dialogue |
| Emergency card + safe-return card | **Full** | Local, lock-screen accessible |
| Geofence evaluation | **Full** | On-device, offline map pack |
| Caregiver daily card | **Full (local pair)** | Generated locally, syncs later |
| Open-ended LLM conversation | ⛔ | Requires connectivity; Companion degrades gracefully to task-based interaction — which the India study found is *preferred* at higher impairment anyway |
| Clinical Bridge pack, care navigation, family coordination | ⛔ | Online features, clearly marked with sync age |

### 26.2 Device tiers

| Tier | Spec | Capability |
|---|---|---|
| **D1 — Shared family Android phone** (₹7–12k, 2–3 GB RAM, Android 11+) | Baseline target | Full offline core; TTS; constrained ASR; picture activities |
| **D2 — Low-cost tablet** (₹10–18k, 8–10") | Preferred for the person | Best game/photo experience; large touch targets |
| **D3 — Caregiver phone** | Any modern Android/iOS | Copilot, coordination |
| **D4 — CHW phone** | Existing government/personal device | CHW Companion + sync mule |
| **D5 — AAM facility device** | Existing AAM computer/tablet | Clinical Bridge, teleconsult, bulk sync |
| Optional | ₹2–4k BLE band | Falls/activity/sleep proxy — never required |

### 26.3 Synchronisation

```
LOCAL              append-only encrypted EVENT LOG (session, observation, confirmation,
                   correction, alert, consent change) + materialised local views

SYNC MODEL         delta sync of events, not state. Last-writer-wins is forbidden for
                   clinical facts; conflicts are preserved with both provenances and
                   surfaced for human resolution (a caregiver and a CHW disagreeing about
                   a medication is information, not a merge error).

TRANSPORT          opportunistic: any Wi-Fi/cellular window → compressed batch upload
                   (target < 200 KB/day/person excluding media)
                   media (photos/audio) sync only on unmetered connections

CHW SYNC MULE      for uncovered villages: CHW device pairs over local Wi-Fi Direct /
                   Bluetooth, receives encrypted sealed deltas it cannot read, carries
                   them to coverage, uploads. End-to-end encrypted to the server;
                   the CHW is a courier, not a reader.

SYNC AGE           every caregiver and clinical view prints "data as of <timestamp>".
                   Stale data is never presented as current.
```

### 26.4 Edge inference budget

| Model | Size target | Runs where |
|---|---|---|
| Constrained-intent ASR (Tier A) | 40–120 MB quantised | Device |
| TTS (Tier A/B) | 30–80 MB | Device |
| Item-difficulty / ability update | negligible | Device |
| Baseline statistics + change detection | negligible | Device |
| Repetition & intent classification (small) | 20–60 MB | Device |
| Fall detection (if wearable) | negligible | Device/band |
| Open dialogue LLM, RAG synthesis, clinical compression, speech-marker research models | — | Cloud |

Design consequence: **the person's daily experience never depends on the cloud.** The cloud adds explanation, coordination and clinical output.

---

## 27. Data Architecture and Agentic RAG

### 27.1 Polystore design (different semantics, different stores)

| Store | Holds | Why |
|---|---|---|
| **Graph DB** | People, places, events, objects, relationships, kinship, care roles | Relationship traversal is the core query pattern for memory assistance |
| **Temporal / time-series store** | Sessions, telemetry, sleep, activity, adherence, alerts, quality scores | Baselines and change detection are inherently time-indexed |
| **Vector store** | Story text, caregiver notes, guideline chunks, service descriptions, recorded-audio embeddings (NE-SpeechEmbed-class for Tier C) | Semantic recall over unstructured content, including *audio without transcription* |
| **Relational DB** | Identity, consent objects, permissions, medications, appointments, care plans | Transactional integrity and auditability |
| **Object storage** | Photos, audio, voice packs, content packs | Media, signed and versioned |
| **Append-only audit log** | Every access, agent action, consent change, alert, suppression | Safeguarding and accountability |

### 27.2 Core entity models (abbreviated)

```
Person            id · display_name · honorific · languages[tier] · sensory_profile ·
                  cultural_community_id · abha_ref? · consent_refs[]
Caregiver         id · relationship · role{primary|secondary|paid|remote} · scope_refs[]
CHW               id · facility_ref · coverage_area
MemoryFact        (provenance envelope, §12.3)
CognitiveProfile  domain → {theta, sigma, n_obs, last_updated, quality_mean}
FunctionalProfile adl[] · iadl[] · assistance_level · last_verified_by
RoutineItem       label · time_window · flexibility · confirmation_required · adaptive_rules
GameSession       id · plan · items[] · per_item{latency, correct, help_used, abandoned} ·
                  quality{q, reasons[]} · assisted_flag · naturalistic_flag
Observation       type · value · source{person|caregiver|chw|clinician|device} ·
                  timestamp · confidence · visibility[]
BehaviourEpisode  onset · description · context_tags[] · candidate_contributors[] ·
                  actions_taken[] · outcome
Medication        name · dose_text · valid_from · valid_to · source · reconciliation_status
Appointment       facility · clinician · datetime · transport_plan · prep_pack_ref
SafetyEvent       type · timestamp · location_event_only · response_chain[] · resolution
Alert             level · triggers[] · evidence_refs[] · recipients[] · feedback · suppressed?
ConsentObject     purpose · granted_by · capacity_context · granted_at · revoked_at? ·
                  scope · two_key_ack?
EvidenceSource    type{guideline|review|rct|observational|caregiver|telemetry|clinician} ·
                  citation · retrieved_at · tier
AgentAction       agent · inputs_hash · tools_used · sources[] · gateway_verdict · output_hash
```

### 27.3 Cultural ontology as a pluggable module (answers the matriliny problem)

```
CulturalOntology {
  id: "khasi_v1",
  kinship_system: "matrilineal",
  kinship_terms: { mother's_sister: "…", maternal_uncle: "…", youngest_daughter_role: "…" },
  residence_norm: "matrilocal_tendency",
  honorifics_for_elders: { female: "Kong/Mei", male: "Bah/Kpa" },
  festival_calendar: [ "Behdienkhlam", "Shad Suk Mynsiem", … ],
  food_lexicon: [ "jadoh", "tungrymbai", … ],
  music_forms: [ "Khasi hymns", "duitara", … ],
  occupations: [ "jhum cultivation", "broom grass", "weaving", … ],
  landmark_types: [ "presbyterian church", "market (iew)", "sacred grove (law kyntang)" ],
  interaction_norms: { correction: "avoid_direct", questioning: "task_based_preferred" }
}
```

Item templates reference **slots**, not values: `"Who is standing beside you here?"` binds to the person's own photo; `"Which festival is this?"` binds to the community's calendar. One template set, eight-plus cultural bindings. This is what makes "culturally inclusive" an engineering property rather than a claim.

### 27.4 Data-source → intelligence mapping

| Source | Signal | Feeds | Constraint |
|---|---|---|---|
| Game telemetry | θ per domain, latency, error types | Cognitive baseline, compiler | Quality-weighted |
| Repetition counters | Question-repetition rate | Memory baseline, caregiver summary, clinical pack | Offline-computable |
| Routine confirmations | Adherence, prospective-memory proxy | Functional baseline, alerts | Confirmation ≠ completion (disclosed limitation) |
| Caregiver observations | Behaviour, sleep, meals, pain signs | Behaviour engine, clinical pack | Informant bias acknowledged |
| CHW visit records | Function, safety, sensory, household | Functional baseline, escalation | Periodic, low-frequency |
| Optional wearable | Falls, activity, sleep proxy | Safety, rhythm model | Opt-in; non-wear handled |
| Location events | Geofence exits | Safety agent only | Never routine query |
| Clinician annotations | Ground truth-ish labels | Model calibration, agreement metrics | The learning loop |
| Speech/audio | Language markers | **Research plane only** | Shadow; consented; no live transcription in Tier C |

### 27.5 The Agentic RAG problem statement

A caregiver asks: **"Why has Aitâ been more agitated this week?"**

Naive RAG (`query → vector search → LLM`) fails in five specific ways: it has no notion of *this week versus her usual*; it cannot traverse relationships; it will happily retrieve a medication that was stopped in June; it may blend a NICE guideline sentence with a caregiver's WhatsApp note as if both were equally authoritative; and it has no mechanism to say "we don't know".

### 27.6 Knowledge layers (never merged unlabelled)

| Layer | Content | Retrieval mode | Authority |
|---|---|---|---|
| **K1 Medical knowledge** | WHO guidelines, NICE NG97, Alzheimer's Association guidance, systematic reviews, Indian clinical practice guidelines, NPHCE/DMHP operational documents | Vector + metadata filter by evidence tier | Highest for clinical guidance |
| **K2 Person knowledge** | Life-story graph, routines, preferences, medications, appointments, care plan | Graph + temporal | Highest for "about this person" |
| **K3 Caregiver knowledge** | Observations, notes, concerns, incidents, questions | Vector + temporal | Informant evidence, labelled as such |
| **K4 Local knowledge** | NER facilities, AAM/CHC/DH directory, specialists, transport, Tele-MANAS, support groups, language resources | Geospatial + structured | Operational |
| **K5 Temporal event knowledge** | Everything time-stamped: today, this week, this month, 6 months ago | Time-window retrieval | Essential for "what changed" |
| **K6 Research knowledge** | Peer-reviewed literature for clinician-facing depth | Vector + evidence tier | Clinician surface only |

### 27.7 Retrieval and fusion pipeline

```
                             QUERY (+ role, + subject, + scope)
                                        ↓
                        1  INTENT & TEMPORAL PARSE
                    ("why" + "this week" + subject=self + role=caregiver)
                                        ↓
                        2  SCOPE FILTER (Memory Firewall applied BEFORE retrieval)
                                        ↓
        ┌──────────────────┬────────────┴─────────────┬─────────────────────┐
        ↓                  ↓                          ↓                     ↓
   GRAPH RETRIEVAL   TEMPORAL RETRIEVAL        VECTOR RETRIEVAL      GEOSPATIAL
   (people, care     (7-day + 28-day baseline   (caregiver notes,     (services,
    roles, routine    windows; valid_from/to     guideline chunks)     travel time)
    structure)        honoured strictly)
        └──────────────────┴────────────┬─────────────┴─────────────────────┘
                                        ↓
                        3  EVIDENCE FUSION
                        · group by claim
                        · attach source, timestamp, tier, confidence
                        · detect conflicts (caregiver says X, telemetry says Y)
                                        ↓
                        4  CONFLICT RESOLUTION POLICY
                        · clinical facts: guideline > review > RCT > observational
                        · personal facts: most recent verified > reported > unverified
                        · never silently pick a winner: disagreement is REPORTED
                                        ↓
                        5  COMPLETENESS CHECK
                        · which candidate contributors have NO data? say so explicitly
                                        ↓
                        6  GENERATION under the three-layer contract (§22.2)
                                        ↓
                        7  SAFETY GATEWAY (§24.2) → deliver + audit
```

### 27.8 Worked example (full trace)

```
CAREGIVER: "Why has Aitâ been more agitated this week?"

SCOPE          role=primary_caregiver → K2,K3,K5 full; K1 guideline-tier; K4 yes; K6 no
GRAPH          routine structure, who was present, care roles, recent visitors
TEMPORAL       7-day vs 28-day baseline:
                 agitation episodes  0.3/day → 1.6/day     q=0.85
                 sleep wakings       1.1 → 2.9/night        q=0.71 (caregiver-reported)
                 lunch left          1/14 days → 3/4 days   q=0.90
                 activity            −31% vs baseline       q=0.88
                 bathroom prompts    +2/night               q=0.66
                 medication events   new drug 12 Aug        q=1.00 (caregiver-entered)
                 routine change      daughter away 1–14 Aug q=1.00
VECTOR (K1)    NICE NG97: assess causes incl. pain, delirium, inappropriate care;
               psychosocial/environmental interventions first
VECTOR (K3)    caregiver note 26 Aug: "held her side while standing"
COMPLETENESS   no data on: bowel pattern, temperature, urinary symptoms, dental pain
CONFLICT       none material
OUTPUT (three-layer, gateway-passed):

  FACT — Agitation episodes are up from about one every three days to about 1.6 a day
  over the last week. Sleep wakings rose from ~1 to ~3 a night. She left part of lunch
  on 3 of the last 4 days and her activity is about 30% below her own usual level.
  You noted on 26 August that she held her side while standing. A new medicine was
  started on 12 August. Rina was away 1–14 August.
  [sources: caregiver log · session telemetry · your medication entry]
  [confidence: moderate — sleep data is from your notes, not measured]

  HYPOTHESIS — Several things could be contributing, and we cannot tell which from here:
  discomfort or pain (your note about her side); a urinary or bowel problem; disrupted
  sleep; the routine change while Rina was away; or an effect of the new medicine.
  We have no information about her bowel pattern, temperature, or urinary symptoms.
  This is not a diagnosis.

  ACTION — Today: check pain, thirst, toilet, constipation, warmth, and her teeth.
  Keep this evening quiet and dimly lit and play her usual songs.
  Please write down whether she has any burning or urgency when passing urine.
  Ask the AAM about the medicine started on 12 August — I have added that question to
  your consult list. If she becomes suddenly much more confused, drowsy or feverish,
  seek medical help the same day.
```

That output is *useful*, *sourced*, *bounded*, *honest about its gaps*, and contains no diagnosis and no drug advice. That is the standard for every clinical-adjacent response in the system.

---

## 28. Product UX, Journeys and Example AI Interactions

### 28.1 Four interfaces, one truth — the information contract

"One truth, four interfaces" is not a matter of tone; it is a governed contract in which one event becomes four separately-authorised, separately-safety-gated projections that **differ in detail and register but never contradict each other** (the mechanism is `tech-stack.md` §13.2; the full information contract and report taxonomy is `Solution.md` §23; the interface design is `DESIGN.md` Parts B–D). The four roles receive different information because they hold **different responsibilities, not different truths**.

| | Person | Caregiver | CHW | Clinician |
|---|---|---|---|---|
| **Responsibility** | live the day with dignity | act, or know they need not | prepare a visit, decide on escalation | interpret, diagnose, decide |
| **First screen answers** | *"What can I help you do now?"* | *"How is she? What changed? Do I act?"* | *"What do I check on this visit?"* | *"What changed since last review, how trustworthy?"* |
| **Receives** | companionship, orientation, memory help, experiences from her own life | compressed change, action cards, "nothing needs attention" | visit brief, changes since last visit, referral suggestion | since-last-review evidence with provenance + confidence + confounders + gaps |
| Primary modality | **Voice + pictures** | Text + trends | Structured taps | Compressed evidence |
| Density | ≤5 choices, one screen | One card + drill-down | Checklist | One page, 5 findings |
| Language | Their best language/tier | Their language | Their language | Clinical English/Hindi + local |
| **Deliberately withheld** | scores, alerts about herself, diagnostic terms, timers, statistics | raw logs, every interaction, population percentiles, raw model state, speculative conclusions | anything not visit-relevant, unrestricted clinical records, raw AI reasoning | opaque AI scores, raw telemetry as the entry point, any system-generated diagnosis |
| **Notification eligibility** | **none** (never alerted about her own data) | `ACTION_REQUIRED` + digests; L4/L5 bypass budget | ≤5 flagged households/cycle; L5 bypass | **none below L5** |
| Always shows | Day, next event, a warm greeting | Sync age, confidence, "why am I seeing this" | Time-to-complete estimate | Provenance + measurement confidence + "what this is not" |

Delivery is governed by the **delivery classes** of §21.3, which are orthogonal to the L0–L5 escalation ladder: the same L3 event is `ACTION_REQUIRED` for the caregiver, `INFORMATIONAL` for the CHW and `NO_NOTIFICATION` for the clinician.

### 28.2 Person's home screen (D2 tablet)

```
┌────────────────────────────────────────────────┐
│                                                │
│   Good morning, Aitâ                     ☀ 24° │
│   Tuesday, 8 September                         │
│                                                │
│   Rina is visiting this afternoon.             │
│                                                │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│   │    ♫     │  │    ▣     │  │    ✿     │    │
│   │  Songs   │  │  Family  │  │ Let's do │    │
│   │          │  │  photos  │  │something │    │
│   └──────────┘  └──────────┘  └──────────┘    │
│                                                │
│   ┌──────────┐  ┌──────────┐                  │
│   │    ☎     │  │    ●     │   ← big, always  │
│   │   Call   │  │  Talk    │      in the same │
│   │  Rina    │  │  to me   │      place       │
│   └──────────┘  └──────────┘                  │
│                                                │
└────────────────────────────────────────────────┘
No score. No streak. No notification badge. No settings icon.
Layout never changes. Ever.
```

### 28.3 Twelve end-to-end journeys with agent/data traces

**J1 — Onboarding a newly identified elderly person (Meghalaya, Khasi, Tier C)**
ASHA identifies memory concerns during a routine visit → CHW Companion structured 10-min script (function, safety, sensory, routine, household) → family (son in Bengaluru) completes Memory Vault upload remotely: 34 photos, 8 recorded life-story audios in Khasi, kinship tagged with `khasi_v1` matrilineal ontology → device provisioned with Khasi human-recorded voice pack + picture-first UI → 14-day calibration begins, alerts capped at L2 → Day 15: personal baseline live. *Agents: A12, A1, A2. Stores: graph, object, relational (consent).*

**J2 — Personalised cognitive session (Assam, Assamese, mild stage)**
Compiler reads θ (memory −0.3σ, attention −0.9σ), fatigue moderate, 16:30, caregiver present → plan: 6-min Bihu song reminiscence, 5-min family-photo naming, 4-min market-list working memory → within-session scaffolding increases after two hesitations on naming → ends on a success + "you remembered all four names of the market things." *Agents: A1, A2. Quality gate: audio OK, language match confirmed.*

**J3 — Forgotten appointment**
Dinacharya fires context-rich reminder → no confirmation → second reminder at T+20 with a different phrasing and a photo of the doctor → still unconfirmed → caregiver nudge (not an alarm) → caregiver confirms transport → routine updated; the non-confirmation is logged as an L1 informational event, not decline. *Agents: A3, A13.*

**J4 — Repeated question**
Six identical questions in 40 minutes → repetition-aware ladder (§12.4) → at n≥4 a pre-committed reminder is scheduled and a silent caregiver note suggests a written note on the door → repetition count enters the memory baseline and the clinical pack. *Agents: A2, A7.*

**J5 — Unusual agitation** → the full trace in §27.8. *Agents: A4, A11, A7, A13. Escalation L3.*

**J6 — Declining game performance**
θ_memory drifts −0.8σ over 12 days → Measurement-Quality Engine reports 6 of 14 sessions had low audio quality and the hearing aid has been flagged unused since July → **the system does not raise a cognitive alert.** It raises a *measurement* action: "her hearing aid appears unused; performance data is unreliable until this is resolved" → CHW audiology referral prompt → after correction, re-baseline. *This is the Measurement-Quality Engine earning its place.*

**J7 — "What changed this week?"** → weekly digest: 3 changes, each with sources, confidence, and one recommended action; explicit statement of what has *not* changed (reassurance is also information).

**J8 — Preparing for a doctor's appointment**
Caregiver taps "prepare for consult" → Clinical Bridge assembles the 12-week pack (§13.5) with measurement confidence and the four prepared questions → shared to the AAM via eSanjeevani-compatible attachment/ABDM record → clinician annotates → annotations update baseline weights and the caregiver receives a plain-language version of the outcome. *Agents: A8, A11.*

**J9 — Remote Arunachal village, no coverage for 11 days**
Everything person-facing continues: games, memories, routine, orientation, geofence, emergency card. Local event log grows to ~1.9 MB. CHW visits on day 11, pairs over Bluetooth, receives sealed encrypted deltas (unreadable to her), returns to the block HQ, uploads. Caregiver in Guwahati receives an 11-day catch-up digest clearly marked *"data as of 11 days: gaps present; interpret with care."* *No inference is made from the gap itself.*

**J10 — Family reminiscence**
Grandchild visits, opens Memory Vault dyadic mode → 1987 Shillong photograph → recorded story in the grandmother's brother's voice plays → grandmother corrects a detail → correction saved as `verified` with her as source (the person is an authoritative source about her own life) → new verified fact becomes usable in future activities.

**J11 — Possible wandering**
18:40 geofence exit, no caregiver present → §20.2 chain executes → she is found by a neighbour at 18:52 using the last-known-area information; safe-return card had already displayed on her screen. Post-event: the route she took becomes a rehearsal route in her orientation activities, and the exit time informs the evening low-stimulation protocol.

**J12 — Sudden change from baseline (possible delirium)**
Onset within 14 hours: severe disorientation, new inattention, fluctuating arousal, refused breakfast → Acute Change Detector → **L5, Attention Budget bypassed** → caregiver + secondary caregiver + CHW notified simultaneously with the delirium template → CHW arranges same-day AAM assessment → UTI identified and treated → after recovery, the system explicitly re-baselines and annotates the episode so the dip is **not** recorded as progression. *This journey is the clearest illustration of why we separated "change" from "progression".*

### 28.4 Example dialogues (deliberately imperfect)

**Person ↔ Companion (Assamese, rendered in English)**

> **Aitâ:** Where is my mother?
> **Companion:** You're thinking about your mother. Would you like to tell me about her? I have a photograph of her here — from Nagaon, I think.
> **Aitâ:** She used to make the best pitha.
> **Companion:** Pitha. Was it til pitha or ghila pitha?
> **Aitâ:** Til. Always til.
> **Companion:** Til pitha. Shall we look at her photograph together?

*Note what did not happen: no "your mother passed away in 1998", no lie either. Acknowledge the feeling, redirect to a grounded, verified memory. The bereavement fact exists in the graph flagged `sensitive` and is not volunteered.*

**Person ↔ Companion — ASR failure handled honestly (code-switched)**

> **Aitâ:** Moi kalike... the thing... eta kaam ase, kintu mon poranahi.
> **Companion:** I didn't catch all of that — sorry. Was it something you need to do today?
> **Aitâ:** Hoy. Something at the bank.
> **Companion:** Something at the bank. I don't have a bank appointment written down. Shall I make a note so Rina can check?
> **Aitâ:** Yes.
> **Companion:** Done. I've written: *"Something at the bank — Aitâ mentioned it Tuesday morning."*

*The AI does not pretend to understand, does not invent a bank appointment, and converts uncertainty into a task for a human.*

**Caregiver ↔ Copilot**

> **Caregiver:** She keeps accusing me of hiding her money. Am I doing something wrong?
> **Copilot:** No — this is one of the hardest and most common experiences in dementia care, and it is not a judgement of you. When something can't be found and the memory of where it went is gone, an explanation gets built, and it often lands on the person who is closest.
> What helps: don't argue the accusation, and don't try to prove it wrong. Acknowledge the feeling ("that's upsetting — let's look together"), then look together, then move to something else.
> Two practical things: keep a small, agreed "money place" and check it together at the same time each day; and if she has a purse she likes to hold, a decoy purse with small notes often reduces the distress.
> Do you want me to note this for the next consult? Accusatory beliefs that are new, frightening or escalating are worth a clinician knowing about.
> I'd also gently say: this is exhausting. Tele-MANAS (14416) has counsellors who support caregivers, in your language. Would you like the details?

**Clinician ↔ Clinical Bridge**

> **Clinician:** Is this Alzheimer's progression?
> **Bridge:** I can't answer that — I don't diagnose or stage, and nothing here should be read as pathology. What I can give you is what changed and what might confound it.
> Over 12 weeks: question-repetition rose from 1–2/day to 5–7/day; orientation events 0→3; money handling now needs assistance (new since ~July); session performance −25% versus her own baseline; caregiver-reported sleep interruptions 1→3/night in the last 3 weeks.
> Confounders on record: an antihypertensive started 12 August (caregiver-reported, not verified against a prescription); hearing aid unused since ~July; a 2-week caregiver absence in August.
> **Measurement confidence: moderate** — 6 of 14 sessions in this window had low audio quality, which affects the performance figures specifically.
> Prepared questions from the family are attached. Would you like the raw telemetry, the caregiver log, or the CHW visit notes?

**CHW ↔ CHW Companion**

> **CHW:** I have 40 minutes and four households in Mawlai.
> **Companion:** Two need a full visit, two are routine.
> **Priority — Mrs. Lyngdoh:** sleep and activity below her usual for 6 days; the family hasn't opened the app in 5 days. Suggested: 10-min check, comfort screen, ask about the hearing aid, confirm the medicine list.
> **Priority — Mr. Sangma:** one fall reported last week, no injury. Suggested: 8-min home hazard check (the checklist is ready) and a balance-referral question for the CHO.
> **Routine — two households:** confirm the medicine list, ask the three caregiver-wellbeing questions.
> That's about 34 minutes including walking. Shall I open Mrs. Lyngdoh's visit?

---

## 29. Full Technical Architecture, MVP and Roadmap

### 29.1 The complete stack

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ HUMAN LAYER    Person  ⟷  Family caregivers  ⟷  CHW (ASHA/ANM/CHO)  ⟷  Clinician │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ EXPERIENCE LAYER                                                              │
│  Companion (voice/picture, offline)   Cognitive Studio (offline)              │
│  Memory Vault      Dinacharya         Caregiver Copilot                       │
│  CHW Companion (offline + sync mule)  Clinical Bridge     Care Network         │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ INTERACTION & LANGUAGE LAYER                                                  │
│  Tier-A ASR/TTS (Bhashini / AI4Bharat IndicConformer class)                    │
│  Tier-B constrained-grammar ASR + TTS                                         │
│  Tier-C human-recorded voice packs + NE retrieval embeddings                   │
│  Cultural ontology binder · code-switch handling · accessibility engine        │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ AGENTIC LAYER            ORCHESTRATOR (§14.3)                                 │
│  A1 Cognitive · A2 Memory · A3 Routine · A4 Behaviour · A5 Safety(rules) ·     │
│  A6 Social · A7 Caregiver · A8 Clinical · A9 Navigation · A10 Decision ·       │
│  A11 RAG · A12 Personalisation · A13 Escalation                               │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ INTELLIGENCE ENGINES                                                          │
│  Cognitive Stimulation Compiler   Personal Baseline & Change Engine           │
│  Measurement-Quality Engine       Behaviour Cause-Reasoning Engine            │
│  Intervention Engine              Attention Budget & Escalation Ladder        │
│  Personal Cognitive State Model (uncertainty-aware)                           │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ AGENTIC RAG (§27.5–27.8)                                                      │
│  Intent+temporal parse → scope filter → graph|temporal|vector|geo retrieval → │
│  evidence fusion → conflict policy → completeness check → generation          │
│  K1 Medical · K2 Person · K3 Caregiver · K4 Local NER · K5 Temporal · K6 Research │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ PERSONAL WORLD MODEL                                                          │
│  Static (identity, biography) · Slow (cognitive/functional profile) ·         │
│  Dynamic (mood, sleep, activity) · Events · Derived (deviation, risk, trends) │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ DATA SPINE   Graph DB · Temporal store · Vector store · Relational ·          │
│              Object storage · Append-only audit log                           │
│              Provenance envelope on every fact (§12.3)                        │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ TRUST & SAFETY LAYER (cross-cutting, cannot be bypassed)                      │
│  Consent objects · Memory Firewall · Role scoping · Safety Gateway ·          │
│  Deterministic emergency rules · Audit · Encryption · DPDP-2023 compliance    │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ EDGE / CLOUD SPLIT                                                            │
│  EDGE: games · memory retrieval · routine · orientation · baseline stats ·    │
│        geofence · TTS · constrained ASR · emergency card                       │
│  SYNC: append-only delta, opportunistic, CHW sync mule, conflict preservation │
│  CLOUD: open dialogue LLM · RAG synthesis · clinical compression ·            │
│         research models (shadow) · coordination · directories                  │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────────────────┐
│ INTEGRATION      ABDM/ABHA · eSanjeevani (AAM hub-and-spoke) · NPHCE ·        │
│                  DMHP / Tele-MANAS 14416 · Bhashini · AIKosh models ·          │
│                  GIS/NavIC · IMD hazard feeds · state health departments      │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 29.2 Indicative technology choices

> **Superseded — `tech-stack.md` is authoritative for all technology choices (`CLAUDE.md` §0.2).** This blueprint fixed the *problem*, the *evidence* and the *architecture shape*; the concrete stack was settled later, and where the two disagree, `tech-stack.md` wins. The table below is retained as the historical indicative view, annotated with what superseded it. The load-bearing changes:
>
> | This blueprint said | Superseded by (`tech-stack.md`) | Why |
> |---|---|---|
> | Person/caregiver app: **Kotlin / Flutter, offline-first** | **Next.js web is the first-class client, built now**; Expo/React Native is the future mobile (Horizon B) — §6, §7 | "Web first"; the surfaces are dashboard-shaped; offline is a horizon, not a day-one constraint |
> | Graph: **Neo4j or Apache AGE** | **Postgres edge tables + recursive CTEs** — §9 | The PWM is small and shallow (1–3 hops); AGE is not on Neon; no polyglot at MVP |
> | Temporal: **TimescaleDB** | **Plain Postgres temporal tables** — §9 | Low per-person volume; Timescale is not on Neon |
> | Object: **generic S3-compatible** | **Backblaze B2 (S3 API), images + text only** — §12 | Free allowance; no video/audio pipeline exists |
> | Local store / on-device speech (Kotlin app) | **Horizon B/C** — §21; Horizon A is server-side | Do not build the offline engine into Horizon A |
>
> `FastAPI`, `pgvector`, and "explicit state machine + tool-calling LLM, not free-form loops" carry forward unchanged. The current horizon-A build runs the whole intelligence layer **server-side, online**, with the offline seams (event-sourcing, idempotency, versioning) in place.

*Historical indicative table (see the supersession note above before implementing anything from it):*

| Layer | Choice (indicative, historical) | Rationale (at time of writing) |
|---|---|---|
| Person/caregiver app | Android-native (Kotlin) or Flutter, offline-first | Low-end device performance; background scheduling reliability |
| Local store | SQLite + SQLCipher; local vector index (e.g. sqlite-vec / FAISS-lite); append-only event table | Small footprint, transactional, encryptable |
| On-device speech | Bhashini/AI4Bharat models where licensable; ONNX/TFLite quantised | Public-good stack; cost; data minimisation |
| Backend | Python (FastAPI) services; event-sourced ingestion | Team familiarity; ML ecosystem |
| Graph | Neo4j or Apache AGE (Postgres extension) | AGE reduces operational surface if Postgres is already present |
| Temporal | TimescaleDB (Postgres) | One database engine to operate |
| Vector | pgvector | Same |
| Object | S3-compatible, India region, signed content packs | Cost, residency |
| Orchestration | Explicit state machine + tool-calling LLM; **not** free-form agent loops | Auditability; bounded behaviour |
| Observability | Structured audit log + drift monitors + alert-rate dashboards | Safety-critical monitoring |

### 29.3 MVP prioritisation (scored)

Score = Impact(1–5) × Feasibility(1–5) × NER-relevance(1–5) ÷ Risk(1–5)

| Feature | I | F | N | R | Score | Verdict |
|---|---|---|---|---|---|---|
| Offline adaptive cognitive activities (6 domains) | 5 | 5 | 5 | 1 | **125** | **MVP** |
| Personal Memory Graph + "who/what/when" answers | 5 | 4 | 5 | 2 | **50** | **MVP** |
| Context-rich adaptive reminders + confirmation | 5 | 5 | 5 | 1 | **125** | **MVP** |
| Orientation woven into every interaction | 4 | 5 | 5 | 1 | **100** | **MVP** |
| Repetition-aware responses + counters | 5 | 5 | 4 | 1 | **100** | **MVP** |
| Caregiver daily card + weekly digest | 5 | 5 | 5 | 2 | **62** | **MVP** |
| Personal baseline (cognitive + routine + repetition) | 5 | 4 | 5 | 2 | **50** | **MVP** |
| Measurement-Quality Engine (v1) | 5 | 4 | 5 | 1 | **100** | **MVP** |
| Tier-A voice (Assamese/Bengali/Nepali/Hindi/English) | 5 | 4 | 5 | 2 | **50** | **MVP** |
| Tier-C human-recorded voice pack (1 language) | 5 | 4 | 5 | 1 | **100** | **MVP** |
| Emergency + safe-return card (offline) | 5 | 5 | 5 | 1 | **125** | **MVP** |
| Consent + Memory Firewall v1 + audit | 5 | 4 | 4 | 1 | **80** | **MVP** |
| CHW Companion (light: onboarding + visit script + sync mule) | 5 | 3 | 5 | 2 | **37** | **MVP** |
| Behaviour Cause-Reasoning Engine + checklists | 5 | 3 | 5 | 3 | **25** | **MVP (rules-only v1)** |
| Agentic RAG over K1+K2+K3+K5 | 4 | 3 | 4 | 3 | **16** | Phase 2 |
| Clinical Bridge pack + ABDM/eSanjeevani handoff | 5 | 2 | 5 | 3 | **17** | Phase 2 |
| Geofence safety events | 4 | 3 | 4 | 3 | **16** | Phase 2 |
| Social orchestration (call facilitation) | 4 | 4 | 4 | 2 | **32** | Phase 2 |
| Tier-B constrained ASR (Bodo/Meitei/Mizo) | 4 | 2 | 5 | 2 | **20** | Phase 2 |
| Wearable falls/activity/sleep | 3 | 3 | 3 | 3 | **9** | Phase 3 |
| Speech/language markers (shadow) | 3 | 2 | 4 | 4 | **6** | Phase 3, research |
| Home IoT sensors | 2 | 2 | 2 | 4 | **2** | Phase 4 or never |
| VR/AR | 2 | 2 | 1 | 4 | **1** | **Never (this programme)** |
| Autonomous diagnosis | — | — | — | — | — | **Prohibited** |

### 29.4 Roadmap

| Phase | Duration | Deliverables | Validation gate |
|---|---|---|---|
| **P0 — Foundations** | 0–3 mo | Domain ontologies (cognitive, functional, caregiver-need, intervention, safety, evidence hierarchy); cultural ontology v1 for 2 communities; item bank v1 with difficulty calibration plan; ethics approvals; partner MoUs (state health dept, medical college, ARDSI-type NGO, 2 NGO/community partners); Khasi + Assamese voice-pack recording | Ethics clearance; ontology expert review |
| **P1 — MVP field build** | 3–9 mo | All MVP rows above; 2 languages full (Assamese Tier A, one Tier C); offline core; CHW Companion light | **Usability & feasibility study, n=30 dyads**, 3 districts; CHW time-per-household ≤10 min; adoption ≥60% at 8 weeks |
| **P2 — Agentic platform** | 9–18 mo | Agentic RAG; Caregiver Copilot full; Clinical Bridge + ABDM/eSanjeevani; geofence safety; social orchestration; Tier-B languages; 4 languages total | **Prospective cohort, n=150–250 dyads**, 4 states; caregiver burden + alert-utility + clinician-agreement endpoints |
| **P3 — Multimodal & research plane** | 18–30 mo | Optional wearable; speech markers in shadow; passive routine sensing (opt-in); NER speech/interaction corpus v1; 6–8 languages | Measurement reliability & validity study; **no clinical claims released** |
| **P4 — Clinical validation** | 30–48 mo | Powered evaluation of change-detection utility; caregiver-outcome RCT; federated learning pilot | Peer-reviewed publication; regulatory positioning as CDS |
| **P5 — NER scale** | 48+ mo | 8 states; NPHCE/state-programme integration; NER Brain Health Initiative on the Karnataka/Kerala template | Programme adoption; cost-per-dyad targets |

### 29.5 SIH 36-hour prototype scope (what to actually demo)

A hackathon jury needs a working artefact, not the whole roadmap. Build exactly this:

| Build | Demo moment |
|---|---|
| Offline Android app: 4 activity types bound to *uploaded family photos and one recorded family voice*, with live θ adaptation | Judge uploads a photo, plays, sees difficulty adapt |
| Personal Memory Graph (small): 20 nodes, "who is X?" answered with relationship + recent event + photo | Ask "who is Rina?" — get the contextual answer, not a search result |
| Repetition-aware response ladder | Ask the same question 4× — watch the response change and a caregiver note appear |
| Measurement-Quality demo | Turn the volume down / switch language → app **refuses to score** and explains why. *This is the single most memorable 20 seconds of the demo.* |
| Personal baseline + one L3 alert with the three-layer output | Inject 3 days of synthetic decline → caregiver card appears with FACT/HYPOTHESIS/ACTION |
| Acute change → L5 delirium template | Inject a 12-hour severe change → L5 fires and explicitly says "not progression, seek care today" |
| Aeroplane-mode proof | Turn off all connectivity; everything above still works |
| One Tier-C voice pack (even 30 recorded prompts) | Show the same flow in Khasi with human-recorded voice |
| CHW screen with a prioritised 3-household list | Show the sync-mule handoff animation |

Two safeties to demo explicitly: the app refusing to give medication advice, and the app refusing to say "she has dementia".

---

## 30. Validation Framework

### 30.1 Metrics

| Family | Metric | Instrument / method | Target (pilot) |
|---|---|---|---|
| **Engagement** | Sessions/week; voluntary initiation rate; abandonment rate; 8-week retention | Telemetry | ≥4 sessions/wk; ≥40% voluntary; retention ≥60% |
| **Cognitive** | Within-person θ trajectory; standardised measure at 0/12/24 wks (education-appropriate, locally validated instrument administered by a clinician) | Clinical assessment | Feasibility of measurement first; effect estimation only in P4 |
| **Function / independence** | ADL/IADL assistance level; **assistance-level reduction** (our distinctive KPI) | Informant scale + CHW | No worsening beyond expected; assistance-level stable or improved on ≥1 IADL |
| **Agency** | **Self-correction rate** (hesitations resolved by the person after a `WAIT`, without a cue); **intervention restraint** (assistance actions offered ÷ hesitations observed); **honoured-refusal rate** (`DECLINE`/`REST` that produced no alert, no penalty and no projection — target 100%); voluntary initiation share | Session telemetry + assistance-policy decision log (tech-stack §18.2) | Self-correction rate stable or rising; intervention restraint falling over 8 weeks; honoured-refusal 100% |
| **Wellbeing / QoL** | Validated dementia QoL scale; mood observations | Clinician/informant | Feasibility + direction |
| **Social** | **Human-contact events/week** (not app minutes) | Telemetry + caregiver log | ≥3/wk; upward trend |
| **Caregiver** | Burden scale; self-efficacy; sleep; time-saved self-report; decision confidence | Validated scales | Burden not worse; self-efficacy improved |
| **Alerting** | L3+ alerts/person/week; **caregiver-rated usefulness**; false-positive rate; "expected" rate | In-app 3-button feedback | ≤1/wk; ≥70% useful |
| **Clinical utility** | Clinician-rated usefulness of the pack; agreement with clinician judgement of "meaningful change"; consult-time change | Clinician survey + timing | ≥70% rated useful |
| **Measurement science** | Test-retest reliability of θ; proportion of sessions quality-gated; language-mismatch rate | Telemetry | Reliability reported before any claim |
| **Safety** | Missed-event reports; unsafe recommendations (target **zero**); privacy incidents (target **zero**); delirium episodes detected vs confirmed | Incident register + chart review | Zero unsafe recommendations |
| **System** | Offline continuity days; sync latency; ASR WER per language; crash rate; battery/day; data/day | Telemetry | ≥14 days offline; <200 KB/day |
| **Equity** | Adoption by literacy, gender, language tier, urban/rural | Stratified analysis | No tier below 50% of best tier |

### 30.2 Honest evidence-gap register

| Claim we would like to make | Current status | What would justify it |
|---|---|---|
| Personalised stimulation beats generic stimulation | **[ASSUMPTION → RQ-1]** | Randomised comparison, adherence + cognitive endpoints |
| Ambient stimulation improves adherence | **[ASSUMPTION → RQ-2]** | Randomised or crossover comparison |
| Personal baseline detects meaningful change earlier than periodic assessment | **[ASSUMPTION → RQ-3]** | Prospective cohort with clinician-adjudicated change events |
| Agentic orchestration reduces caregiver cognitive load | **[ASSUMPTION → RQ-4]** | Burden/workload instruments + task-time measurement |
| Cultural personalisation improves engagement | **[ASSUMPTION → RQ-5]** | Within-subject content-source comparison |
| Measurement-quality gating reduces false alerts | **[ASSUMPTION → RQ-7]** | Ablation: gated vs ungated alerting on the same data |
| Speech markers add clinical value in NER languages | **[RESEARCH-STAGE]** | Corpus → reliability → validity → utility (years, not months) |
| The platform improves cognition | **Not claimed** | Powered RCT; not an SIH-timeframe claim |
| The platform detects dementia | **Never claimed** | Out of scope by design |

**We will not publish or pitch numbers we have not measured.** Where a figure appears in this document without a citation, it is labelled `[ASSUMPTION]` and is a hypothesis for §31.

---

## 31. NER Pilot Design

### 31.1 Structure

| Parameter | Specification |
|---|---|
| Sites (Phase 1) | 3 districts across **Assam** (Brahmaputra + Barak valley), **Tripura**, **Sikkim** — chosen for connectivity feasibility, language-tier coverage (A + A + A/B), and the low-education test case (Sikkim) |
| Phase 2 additions | Meghalaya (Khasi/Garo Tier C), Mizoram, Nagaland |
| Phase 3 additions | Manipur, Arunachal Pradesh (the offline-primary extreme case) |
| Participants (P1) | 30 person–caregiver dyads; 60/40 rural/urban; ≥40% with no formal schooling; ≥40% female caregivers who are spouses |
| Inclusion | Age ≥60; caregiver-reported memory/cognitive concern **or** clinician-identified cognitive impairment; identified primary caregiver; consent (person's own where capacity permits, proxy with audit otherwise); access to at least one Android device in the household |
| Exclusion | Acute unstable illness; no caregiver; unable to engage in any modality; declines consent |
| Duration | 12 weeks (P1); 24–52 weeks (P2) |
| Clinical involvement | Regional medical college / NEIGRIHMS-class institution: baseline and endpoint assessment, adjudication of "meaningful change", ethics oversight |
| CHW involvement | 2–3 ASHA/ANM per district + CHO at the AAM; onboarding, monthly visits, sync mule, escalation triage |
| Governance | Ethics committee; community advisory group per site including a person living with dementia and a family caregiver; data-protection officer; safeguarding lead |
| Devices | Person: refurbished/entry tablet on loan; caregiver: own phone; CHW: own phone; AAM: existing facility device |
| Cost model to test | Target ≤₹250/dyad/month recurring at scale (compute + support), device amortised or state-supplied |

### 31.2 Phase-1 primary questions

1. Will people with dementia in these settings actually use it — and which modality wins by literacy and language tier?
2. **Can a CHW sustain it within ≤10 minutes per household?** (Highest-risk assumption in the entire design — F24.)
3. Does the Measurement-Quality Engine meaningfully reduce spurious signals versus an ungated baseline?
4. Do caregivers find the alerts useful, and what is the true false-positive rate?
5. Does the sync-mule model actually work in villages without coverage?
6. Do families accept the Memory Firewall constraints, or do they experience them as obstruction?

Question 6 matters more than it looks: our safeguarding architecture deliberately makes some things harder for caregivers. If families reject it, we must find a design that preserves the protection without the friction — not quietly remove the protection.

### 31.3 Scale-up path

Pilot (3 districts) → district saturation with NPHCE integration → state programme partnership on the **Karnataka Brain Health Initiative / Kerala State Initiative on Dementia** template → **NER Brain Health Initiative** across eight states with MDoNER as convener, states as implementers, and a regional research consortium owning validation.

---

## 32. Open Research Questions and Dataset Strategy

### 32.1 Research questions

| RQ | Question | Type | Contribution if answered |
|---|---|---|---|
| RQ-1 | Does compiler-personalised cognitive stimulation outperform fixed programmes on adherence and cognitive/functional outcomes? | RCT | Core intervention science |
| RQ-2 | Does **ambient** stimulation embedded in daily life outperform structured sessions on adherence and distress? | Crossover | Novel intervention modality |
| RQ-3 | Does personal-baseline change detection identify clinician-adjudicated meaningful change earlier than periodic assessment? | Prospective cohort | Measurement science |
| RQ-4 | Does agentic orchestration reduce caregiver cognitive load and decision time? | RCT / workload study | Human-AI collaboration |
| RQ-5 | Does culturally-generated content (vs translated) improve engagement and measurement validity? | Within-subject | **The core NER claim** |
| RQ-6 | Can longitudinal interaction signals improve clinician assessment in low-resource-language populations? | Cohort | Digital phenotyping in LMIC settings |
| RQ-7 | Does measurement-quality gating reduce false alerts without increasing missed events? | Ablation | **Novel and directly testable** |
| RQ-8 | Does evidence-grounded agentic RAG reduce caregiver information burden and error versus FAQ/chatbot baselines? | RCT | Applied AI safety |
| RQ-9 | Can an offline-first architecture deliver clinically useful longitudinal data in villages without mobile coverage? | Implementation study | **Directly answers MDoNER's constraint** |
| RQ-10 | Does an elder-abuse-resistant permission model reduce inappropriate data access without harming care coordination? | Mixed-methods | Safeguarding informatics — essentially unstudied |
| RQ-11 | **What is the actual prevalence, presentation and care pathway of dementia in each NER state?** | Epidemiology | Fills a real, acknowledged evidence gap |
| RQ-12 | Can repetition-question rate serve as a validated, language-agnostic, offline-computable longitudinal marker? | Validation | Cheap, scalable, novel |
| RQ-13 | How do matrilineal kinship structures (Khasi/Garo) change caregiving patterns and platform design requirements? | Qualitative | Genuinely unexamined |
| RQ-14 | What is the minimum sensing set that achieves acceptable safety detection at acceptable dignity cost? | Design study | Ethics-by-measurement |

### 32.2 Dataset strategy

| Dataset | Collect? | Purpose | Consent & constraints |
|---|---|---|---|
| Cognitive activity interaction logs | ✅ | Item difficulty calibration, ability modelling, baseline | Onboarding consent; de-identified for research |
| Repetition and orientation events | ✅ | RQ-12 | Same |
| Caregiver structured observations | ✅ | Behaviour engine, baselines | Same |
| CHW visit records | ✅ | Functional trajectory | Programme consent |
| **NER low-resource-language speech corpus** (Khasi, Garo, Mizo, Meitei, Kokborok, Nyishi, Nagamese) | ✅ **flagship asset** | Enable Tier-C ASR/TTS; contribute to Bhashini/AIKosh public goods | Separate explicit research consent; community ownership agreement; **right to withdraw**; no re-identification; publish as an open public good where communities agree |
| Culturally-relevant image/audio asset library | ✅ | Activity content | Community co-creation with attribution and compensation |
| Life-story content | ✅ (private) | Personalisation | **Never leaves the person's scope**; excluded from all research exports |
| Speech recordings for markers | ⚠️ opt-in | RQ-6 | Separate consent; shadow only; no live transcription for Tier C |
| Clinical outcome data | ✅ via partners | Validation | Institutional ethics; ABDM-compliant |
| Video, continuous audio, financial records | ⛔ **never** | — | Architecturally absent |
| Synthetic data | ✅ | Development, testing, demos, cold-start item calibration | Clearly labelled; never used for validation claims |
| Federated learning | Phase 4 | Model improvement without raw data movement | Research-stage; evaluate before adopting |

**Annotation and bias discipline:** annotators recruited from the language communities themselves; inter-annotator agreement reported; performance disaggregated by language, literacy, gender, age band and urban/rural in every model evaluation. A model that works only for literate Assamese-speaking men in Guwahati has failed this problem statement even if its aggregate metrics look good.

---

## 33. What Not To Build (and why)

| Not building | Why not |
|---|---|
| **Autonomous dementia diagnosis / staging** | No validated basis; direct harm from false positives and false negatives; regulatory exposure; and it is not what is missing — clinicians are missing *context*, not opinions |
| **A "cognitive score" shown to anyone** | Population-normed scores are biased in this exact population; a single number destroys the information that makes it useful |
| **Always-on audio or video** | Dignity harm; abuse vector; enormous data cost; adds little over event-based sensing |
| **Face recognition of visitors** | Surveillance creep; consent impossible for third parties |
| **Autonomous medication changes or dosing advice** | Clinician/pharmacist domain; polypharmacy risk is real and serious |
| **AI "therapist"** | Claims clinical authority it cannot hold; dependency risk; Tele-MANAS and DMHP exist and should be used |
| **Autonomous financial control or transaction blocking** | Financial exploitation risk cuts both ways; a platform with account control is an abuse instrument |
| **AI-generated personal memories or images of real people** | Identity harm, family distress, epistemic corruption of the graph |
| **Generic translated game library** | Precisely the failure the problem statement is complaining about |
| **Gamification (streaks, leaderboards, ranks, timers)** | Manufactures failure experiences for people already losing capability |
| **Notification-maximising engagement design** | Directly creates the alert-fatigue harm we identified as Loop F |
| **VR / AR headsets** | Cost, comfort, motion sensitivity, device availability; no NER fit |
| **Unrestricted caregiver access by default** | The safeguarding argument in §23.1 |
| **A parallel health record** | ABDM exists; parallel records fragment care and die |
| **Dependence on LEO satellite broadband** | Licensed but not commercially live in India as of mid-2026 (§19.2) |
| **Anything requiring the person to learn a new interface** | The one cohort for whom learning new interfaces is definitionally hard |

---

## 34. Final Critical Evaluation — Red-Teaming Our Own Proposal

We asked ourselves 26 hostile questions. The answers below include three places where the critique **changed the design**.

| # | Challenge | Honest answer |
|---|---|---|
| 1 | Are we solving a real problem? | Yes — and the caregiver half is arguably more evidence-supported than the patient half. |
| 2 | Are we solving the *official* problem? | Yes. Cognitive gaming and memory assistance are the MVP core, not an afterthought (§11, §12, §29.3). |
| 3 | Are we overengineering? | **Partly — and we cut.** Original drafts included home IoT, VR, gait analysis, financial monitoring and a full digital-twin. All removed or pushed to research. MVP is 14 features. |
| 4 | Are we under-solving caregiver problems? | No — Copilot is MVP, and caregiver burden is a primary endpoint. |
| 5 | Ignoring medical reality? | No: reversible causes, delirium, polypharmacy, sensory loss, dysphagia and treatment-monitoring are all explicit, all clinician-owned. |
| 6 | Ignoring psychological needs? | Partly initially — we had underweighted **apathy**. Fixed: interest-driven activation is now a first-class design pattern (§4.B, §11.5). |
| 7 | Ignoring social needs? | No — human-contact events is a KPI; the AI is barred from substituting for people. |
| 8 | Ignoring safety? | No — and the emergency path is deliberately rule-based, not model-based. |
| 9 | Ignoring NER constraints? | This is where we invested most: 1,841 uncovered villages, four language families, lowest elderly education in India, CHW-centred delivery. |
| 10 | Forcing AI where simple tech is better? | **Yes, in one place, now fixed.** Emergency detection and escalation are rules; the door-sensor/geofence logic is arithmetic. LLMs do language, not safety decisions. |
| 11 | Forcing space technology? | We refuse three forced integrations by name (§19.3) and disclose that LEO broadband is not live. |
| 12 | Are the games meaningful? | They are CST-principled, personally-bound and offline. **[PROMISING]**, not proven — RQ-1 and RQ-5 exist precisely because we cannot claim more. |
| 13 | Is personalisation genuinely deep? | Eight layers (biological, cognitive, functional, behavioural, biographical, cultural, environmental, longitudinal) with a pluggable cultural ontology. Yes — but it depends on onboarding effort we must prove families will invest (P1 test). |
| 14 | Technically feasible? | MVP: yes, on entry Android with public-good language models. Phase 3–4 multimodal: harder, and correctly deferred. |
| 15 | Is the data obtainable? | Interaction and caregiver data: yes. Low-resource speech corpora: yes but slow and requires community agreements. Clinical outcome data: only via institutional partnership. |
| 16 | Is clinical validation possible? | Yes in stages; a powered RCT is a P4 activity with partner institutions, not an SIH deliverable. |
| 17 | Is the system safe? | Safer than the sector default because of the Safety Gateway, the three-layer contract, the Memory Firewall and rule-based emergencies. Not risk-free — see §25. |
| 18 | Could it cause harm? | Yes: false reassurance (F4), missed slow decline (F6), caregiver misuse (F13), dependency (F17). All disclosed, none fully eliminated. |
| 19 | Could elderly users actually use it? | Voice-first, picture-first, five choices, zero learning, never-changing layout, kind tone per the India study. This is our single biggest adoption risk and P1's first question. |
| 20 | Could caregivers sustain it? | Attention Budget caps interruptions at ~1/week; the value proposition is *fewer* decisions, not more data. |
| 21 | Works in low connectivity? | The person's entire experience is offline; CHW sync mule covers the 1,841-village case. |
| 22 | Could it scale across NER? | Architecturally yes. The binding constraints are Tier-C language assets and CHW workload — both named, both tested in P1. |
| 23 | What makes it novel? | Measurement-quality-gated personal-baseline detection; compiled ambient culturally-grounded stimulation; elder-abuse-resistant permissions; CHW-mediated offline dementia intelligence. |
| 24 | Strong research contribution? | RQ-3, RQ-5, RQ-7, RQ-9, RQ-11, RQ-12, RQ-13 are all genuinely open and publishable. |
| 25 | Strong product? | Yes, if the CHW model holds. If it does not, the product becomes family-only and its rural reach drops sharply — we should know this within Phase 1, not Phase 4. |
| 26 | Strong SIH prototype? | §29.5 gives a 36-hour build whose most memorable moment is the system **refusing** to score — which is exactly the right thing for a jury to remember. |

### 34.1 Three design changes forced by this critique

1. **Emergency and medication paths were removed from LLM control** and made deterministic (Challenge 10).
2. **Apathy was promoted from a symptom in a list to a design pattern** — interest-driven activation replaced "do you want to play?" everywhere (Challenge 6).
3. **Scope was cut hard**: home IoT, VR, gait, financial monitoring and full digital-twin removed from the product line; digital phenotyping fenced into a research plane with no path into alerts before validation (Challenge 3).

### 34.2 The honest weaknesses we are carrying forward

- **CHW workload is the load-bearing assumption of the entire rural model.** If ≤10 minutes per household is not achievable within existing ASHA/ANM duties, the offline model degrades to family-only and rural reach falls.
- **Tier-C languages have no voice AI, and we are substituting human recordings.** That is honest and usable, but it is manual, per-language, and slow.
- **We cannot currently claim any cognitive benefit.** Digital CST evidence is **[PROMISING]**, not settled, and none of it was generated in NER.
- **Region-specific epidemiology is thin.** We refuse to manufacture NER prevalence numbers, which means our impact case rests on national data plus a single wide-confidence-interval regional estimate.
- **Safeguarding cannot be solved in software.** The Memory Firewall reduces the abuse surface; it does not remove it. Human safeguarding pathways remain essential.

---

## 35. Final Unified Architecture and Solution Summary

### 35.1 The single conceptual loop

```
                              PERSON
                                 │
                    UNDERSTAND THE PERSON
        (identity · biography · language · culture · kinship · routine ·
         sensory ability · function · preferences · caregivers)
                                 ↓
                    PERSONAL WORLD MODEL
                                 ↓
                    ENGAGE  ← cognitive activities · memories · music ·
                              ambient prompts · human contact
                                 ↓
                    OBSERVE  ← interaction · routine · repetition ·
                              caregiver reports · CHW visits · (optional sensors)
                                 ↓
                    CERTIFY THE OBSERVATION
        (Measurement-Quality Engine: could she hear, see, understand,
         was she rested, was it her, was there data at all?)
                                 ↓
                    LEARN WHAT IS NORMAL FOR HER
                          (Personal Baseline)
                                 ↓
                    DETECT MEANINGFUL CHANGE
        (deviation × persistence × quality × actionability × safety)
                                 ↓
                    EXPLAIN POSSIBLE CONTEXT
        (Behaviour Cause-Reasoning: physical · iatrogenic · acute ·
         sensory · circadian · psychological · communicative)
                                 ↓
                    CHOOSE THE LEAST INTRUSIVE SAFE INTERVENTION
        (Intervention Engine, guideline-aligned, non-pharmacological first)
                                 ↓
                    INFORM ONLY WHO NEEDS TO KNOW
                     (Attention Budget · L0–L5 ladder)
                     ↓              ↓              ↓
                 PERSON        CAREGIVER      CHW → CLINICIAN
                     ↓              ↓              ↓
                    ACTION TAKEN BY HUMANS
                                 ↓
                    NEW EVIDENCE (including clinician corrections)
                                 ↺
                    PERSONAL WORLD MODEL
```

The final arrow is the point: **the system continuously learns the person, not the disease.**

### 35.2 Problem → solution → benefit traceability (condensed)

| Official problem | Root cause | Our mechanism | Who benefits | Evidence tier | Key risk |
|---|---|---|---|---|---|
| Memory decline | Episodic/prospective memory failure | Personal Memory Graph + repetition-aware retrieval + context-rich reminders | Person, caregiver | PROMISING | Wrong-fact assertion (F2) |
| Confusion | Orientation failure; also delirium | Continuous orientation + **Acute Change Detector** | Person, caregiver, clinician | ESTABLISHED (delirium importance) | Missed delirium (mitigated at L5) |
| Anxiety | Unpredictability, unmet needs | Predictable routine + Behaviour Cause-Reasoning + comfort-first checklists | Person, caregiver | ESTABLISHED (NICE approach) | Spurious causal stories (F1) |
| Social isolation | Role loss, out-migration | Social orchestration to humans; human-contact KPI | Person, family | PROMISING | Dependency (F17) |
| Cannot monitor continuously | No trustworthy home observation | Personal Baseline + Measurement-Quality gating + Attention Budget | Caregiver, clinician | ASSUMPTION → RQ-3/RQ-7 | Alert fatigue (F5) |
| Cannot engage | Generic content, apathy | Cognitive Stimulation Compiler + Ambient Stimulation + cultural ontology | Person | PROMISING → RQ-1/RQ-2/RQ-5 | Cultural misfit (F8) |
| No neurology access | Specialist scarcity | Clinical Bridge compression into eSanjeevani/ABDM workflow | Clinician, family | ASSUMPTION → validation | Clinician overload (F23) |
| No cognitive therapy | Delivery capacity | Digital + caregiver-mediated CST-principled activities | Person | PROMISING | Over-claiming benefit |
| No long-term support | Fragmented services | Care Navigation to NPHCE/AAM/DMHP/Tele-MANAS | Family | ESTABLISHED (programmes exist) | Stale directory (F—) |
| Geography | Terrain, 1,841 uncovered villages | Offline-first core + CHW sync mule + satellite-backhauled AAM sync | All | ESTABLISHED (constraint) | CHW workload (F24) |
| Affordability | Cost | Entry Android, no mandatory wearable, public-good language stack | All | — | Device availability |
| Cultural inclusivity | Translation-only products | Pluggable cultural ontology + tiered language strategy + human-recorded Tier-C voice | Person, family | ASSUMPTION → RQ-5 | Tier-C asset creation cost |

### 35.3 Final positioning

> **MindMitra is not a dementia game app.**
>
> It is a **shared intelligence layer between a person losing their internal model of the world, a family becoming that model by force, a community health worker who is the only regular clinical contact for a hundred kilometres, and a clinician with fifteen minutes and no history.**
>
> It reaches the person through the two things they will actually open — activities built from their own life, and a memory that answers their questions without shaming them. It reaches the family by turning noise into one clear card a week. It reaches the health system by turning three months of home life into one page a doctor can act on. And it does all of this offline, in the person's own language, in a way that cannot quietly become surveillance.
>
> **The measure of success is not how much the person uses the app. It is how much of their own life they keep.**

---

# PART VIII — DEEP-DIVE APPENDICES

These appendices develop five ideas that the main body references but does not fully specify, plus three alternative views of the same architecture. They are separated out so that the main body stays readable as a decision document while these remain available as build specifications.

---

## Appendix A. Intervention Engine and Evidence-Mapped Intervention Library

### A.1 Why games alone are the wrong unit of intervention

§11 argues that a game *library* is the wrong artefact and replaces it with a compiler. The same argument applies one level higher: **cognitive stimulation is one intervention class among seven**, and the platform's real job is to select from all seven according to the person's current state, the likely cause of any problem, and the strength of the evidence behind each option.

```
                              PATIENT STATE
                    (cognitive · functional · behavioural ·
                     social · environmental · caregiver capacity)
                                    ↓
                            IDENTIFIED PROBLEM
                       (from §15 change detection or
                        §22 behaviour cause-reasoning)
                                    ↓
                       RANKED POSSIBLE CONTRIBUTORS
                                    ↓
                  CANDIDATE INTERVENTIONS (library, A.2)
                     each carrying its own evidence tier
                                    ↓
                    PERSONALISATION FILTER (8 layers, §18/§11)
                  language · culture · stage · sensory · fatigue ·
                  interests · caregiver availability · device
                                    ↓
                         SAFETY FILTER (§24 Gateway)
                 non-pharmacological first · no drug advice ·
                 no diagnosis · dignity constraints
                                    ↓
                        DELIVERED ACTION + LOGGED
                                    ↓
                  OUTCOME TRACKING (did it help, for this person?)
                                    ↓
                     PERSONAL INTERVENTION POLICY (Appendix C)
```

### A.2 The library, with evidence tier attached to every entry

Nothing enters this library without an evidence tag, and the tag travels with the recommendation into the caregiver's screen.

| Class | Interventions | Evidence tier | Guideline anchor | Delivery in MindMitra |
|---|---|---|---|---|
| **Cognitive** | Cognitive Stimulation Therapy principles; reminiscence; structured cognitive activities; cognitive rehabilitation / OT-informed goal work | **[ESTABLISHED]** (group CST, cognitive rehab/OT for function) → **[PROMISING]** (digital delivery) | NICE NG97 recommends group CST for mild–moderate dementia; considers cognitive rehabilitation/OT to support functional ability | Cognitive Studio (§11); Memory Vault reminiscence (§12) |
| **Physical** | Walking; aerobic activity; strength; balance; mobility work | **[PROMISING]** — meta-analyses support benefit for cognition, physical function and/or QoL, effects vary by strategy | WHO risk-reduction guidelines (2nd ed., 2026) | Dinacharya prompts; never dosed or prescribed |
| **Social** | Family calls; group participation; community and church/village events; meaningful conversation | **[PROMISING]** | WHO 2026 (social engagement); unmet-needs reviews (companionship) | Social orchestration (§13.7); human-contact KPI |
| **Emotional / sensory** | Personal music; reminiscence; calming routines; familiar objects; low-stimulation evening protocol | **[PROMISING]** — meta-analysis reports significant reduction in agitation from music-based intervention, moderate effect size | NICE NG97 (psychosocial first for distress) | Evening protocol; personal playlists |
| **Environmental** | Lighting; noise reduction; clear pathways; orientation cues; familiar-object placement | **[ESTABLISHED as guideline practice]** | NICE NG97 (environmental approaches before pharmacological) | Caregiver checklists; CHW home-hazard walkthrough |
| **Functional** | Task decomposition; compensatory aids; environmental modification; minimum-sufficient-assistance coaching | **[ESTABLISHED→PROMISING]** | NICE NG97 (cognitive rehabilitation / OT) | Task Decomposition Agent (§4.A, §13.2) |
| **Caregiver** | Psychoeducation; skills training; communication strategies; behaviour-management training; respite coordination | **[ESTABLISHED→PROMISING]** — network meta-analysis of caregiver interventions ranks **multicomponent** approaches highest for reducing BPSD and caregiver reactions | Multicomponent caregiver-intervention evidence | Caregiver Copilot micro-learning at moment of need; CHW coaching cards |
| **Medical** | Pharmacological treatment; symptom management; disease-modifying therapy | **[ESTABLISHED, clinician-owned]** | Specialist guidelines | **Coordination only — never selection.** Platform tracks schedule, monitoring and questions (Appendix D.2) |

### A.3 The Care Intervention Graph (medical and non-medical coexisting)

```
                             PROBLEM
                                │
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
   MEDICAL                 NON-DRUG                ENVIRONMENT
   (clinician)             (platform-deliverable)   (household)
        │                       │                       │
   medication            CST · reminiscence         lighting
   symptom tx            exercise · music           noise
   biomarker-guided tx   social · routine           routine structure
   monitoring            functional rehab           familiar objects
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ↓
                       OUTCOME TRACKING
                (per-person, per-context, Appendix C)
```

**The platform coordinates the whole graph. It selects only from the middle and right branches.** The left branch is visible to it, and it may prepare questions and track adherence and monitoring schedules — it may never populate that branch itself.

---

## Appendix B. Care Plan Compiler — "Today's Care Plan"

### B.1 What it is

§11.2 describes a compiler that produces *today's cognitive session*. The Care Plan Compiler is the same idea applied to the whole day, and it is what makes the platform a life-assistance layer rather than an activity app.

**Inputs**

```
diagnosis (if any) · stage · cognitive profile (θ per domain) ·
functional profile (ADL/IADL assistance levels) · preferences and interests ·
cultural ontology · language tier · sensory profile ·
last night's sleep (reported or measured) · today's fatigue signal ·
medication schedule · appointments · caregiver availability windows ·
clinician's care plan (if present) · weather/hazard feed · festival calendar
```

**Output — one adaptive day, not a fixed timetable**

```
07:30  Wake · orientation moment (day, weather, who is coming)
08:00  Breakfast prompt
09:00  Medication confirmation
10:00  15-min walk (weather permitting; hazard feed checked)
11:00  Cognitive session — compiled by §11.2 (memory + attention, 14 min)
13:00  Lunch · hydration prompt
15:00  Family photograph activity (dyadic if grandchild present)
17:00  Evening tea · call to Rina (contact gap = 4 days vs her usual 2)
19:00  Dinner
20:00  Low-stimulation protocol · personal playlist
21:00  Bathroom prompt · sleep preparation
```

### B.2 The adaptation rules that make it a plan rather than a schedule

| Condition | Adaptation |
|---|---|
| Still asleep at usual breakfast time | Wait; do not wake; shift the chain, do not drop items |
| Fatigue signal high | Shorten cognitive session, raise scaffolding, move activity earlier |
| Poor sleep last night | Skip the demanding domain entirely; substitute music reminiscence |
| Caregiver absent this afternoon | Move dyadic activities; avoid tasks that need supervision; notify caregiver of the shift |
| Rain / landslide / heat advisory | Replace the walk with indoor movement; never prompt an unsafe outing |
| Festival week | Widen baseline tolerance (§21.4); substitute festival-linked activities; expect routine disruption |
| Two consecutive low-quality sessions | Stop compiling cognitive sessions; raise a **measurement** action, not a cognitive one (§15.4) |
| Agitation episode logged in the last 12 h | Comfort-first day: reduce stimulation, keep the routine identical, no new content |
| Appointment tomorrow | Insert preparation: pack list, transport confirmation, Clinical Bridge pack generation |

### B.3 Why this is safe

The Care Plan Compiler never introduces a *medical* item that a clinician did not author. It can move, shorten, substitute and skip. It cannot add a medication, change a dose, or set a clinical target. Every plan is a suggestion the person or caregiver can override in one tap, and overrides are learning signal (Appendix C), not friction to be designed away.

---

## Appendix C. Personalised Intervention Policy — and the Do-No-Harm Objective

### C.1 The question worth answering

Population evidence tells us that music helps agitation *on average*. It does not tell us that music helps **this** person, **this** evening, when she is tired and her daughter is away. The intervention that works varies by person and by context, and the platform is in a position to learn that — carefully.

```
Observed pattern space (illustrative, learned per person)

  When tired            music reminiscence  >  puzzle activity
  When engaged          memory task         >  passive video
  When agitated         quiet routine + caregiver contact  >  any activity
  When lonely           family call         >  AI conversation
  When it rained        indoor sequencing   >  cancelled walk (no substitution)
```

### C.2 The staged learning path — and why we do not start with RL

| Stage | Method | When | Why not sooner |
|---|---|---|---|
| **1. Rules + clinical constraints** | Deterministic policy from the intervention library, guideline-anchored, plus per-person statistics (what she has accepted before) | **MVP** | Nothing else is defensible before we have measurement reliability |
| **2. Per-person statistics** | Acceptance rates, completion rates, mood-after signals by context bucket; simple ranking | Phase 2 | Needs ~8–12 weeks of quality-gated data per person |
| **3. Contextual bandits** | Constrained exploration over a *whitelisted* action set, with clinician-set no-go contexts | Phase 3, research protocol | Requires ethics approval, safety monitoring, and an interpretable action space |
| **4. Safe offline RL** | Policy learned from logged data only, with pessimistic value estimation and hard constraint sets | Phase 4, research only | Online exploration on vulnerable people is not acceptable |

> **Hard rule:** no unrestricted online reinforcement learning on this population, in any phase, under any framing. Exploration is bounded to a whitelisted, clinically vetted action set, and every exploratory choice is logged and reviewable.

### C.3 The objective function — what we are actually maximising

The single most common design failure in consumer health software is optimising engagement. For this population that is actively harmful: it rewards keeping a cognitively impaired person on a screen, and it rewards alerting a caregiver more often than necessary.

```
        WRONG        maximise( engagement )

        RIGHT        maximise(  meaningful engagement
                              + independence
                              + wellbeing
                              + human connection
                              + caregiver capacity )
                     −        ( risk
                              + intrusiveness
                              + caregiver attention consumed )

        subject to   clinical safety  ∧  privacy  ∧  autonomy
                     ∧  dignity  ∧  valid consent
                     ∧  measurement quality ≥ q_min
```

Two consequences that are visible in the product:

- **Independence is scored as a gain, so the system is penalised for doing things the person could still do themselves.** This is the formal expression of the minimum-sufficient-assistance principle (§9, principle 2).
- **Caregiver attention is a cost term.** An alert must buy more value than the attention it spends. That is the Attention Budget (§21.3) expressed as arithmetic rather than as a guideline.

---

## Appendix D. Clinical Change Context Engine, Treatment-Journey Coordinator, Evidence Graph

### D.1 Clinical Change Context Engine — the reversible-cause triage that runs before any interpretation

Rule CS-1 (§3.3) forbids the system from calling any change "progression". This is the machinery that enforces it. Every detected change is routed through this triage **before** it is allowed to reach a caregiver or a clinical summary.

```
OBSERVED CHANGE
      ↓
Is the measurement trustworthy?          ── no ──▶ MEASUREMENT ACTION (§15.4)
      ↓ yes                                        (not a cognitive finding)
Onset: hours/days, or weeks/months?
      ↓ hours-days                       ─────────▶ ACUTE PATH → L5 (§15.6)
      ↓ weeks-months                                delirium / infection /
                                                    dehydration / drug effect
Is it persistent, or a single dip?       ── single ─▶ L1 informational
      ↓ persistent
Any acute illness reported?              ── yes ───▶ escalate for assessment
      ↓ no
Sleep changed?  Pain signs?  New or changed medication?
Sensory aids in use?  Environment/routine changed?  Mood?
      ↓ (each answered from the record, with "no data" stated explicitly)
CONTEXTUALISED CHANGE STATEMENT
"differs from her own recent pattern; these factors coincide; these are unknown"
      ↓
Only a clinician may convert this into a trajectory interpretation.
```

### D.2 Treatment-Journey Coordinator (only where a specialist has already acted)

Disease-modifying therapy is a narrow, high-monitoring indication. **[ESTABLISHED, narrow]** Anti-amyloid therapies can slow decline in appropriately selected people with **early Alzheimer's disease** — not all dementias — and carry substantial monitoring requirements; the FDA updated MRI-monitoring recommendations for lecanemab in 2025 following serious/fatal ARIA events.

For a person already under specialist care, the platform's role is logistics and vigilance, never selection:

```
diagnosis (clinician) → eligibility (clinician) → biomarker confirmation (clinician)
        ↓
PLATFORM TAKES OVER THE LOGISTICS
   infusion / dose schedule tracking
   MRI monitoring schedule + reminders + travel planning (NER: travel is the hard part)
   symptom watch-list the caregiver actually understands, in their language
   caregiver education on what to report urgently
   specialist-visit preparation packs
        ↓
ANY WATCH-LIST SYMPTOM → escalate to the treating specialist. Never interpret. Never adjust.
```

This is genuinely valuable in NER because the binding constraint on such therapy is not the drug — it is the **repeat travel to a monitoring-capable facility**, which is exactly the kind of coordination the platform can shoulder.

### D.3 The Multimodal Clinical Evidence Graph (long-term, clinician-facing)

The temptation is to fuse everything into one number. The correct structure keeps modalities **separate, labelled and separately uncertain**, and lets the clinician do the integration.

```
                              PERSON
                                 │
   ┌──────────────────┬──────────┴──────────┬────────────────────┐
   ↓                  ↓                     ↓                    ↓
DIGITAL           CLINICAL              BIOMARKERS           FUNCTIONAL /
PHENOTYPE         ASSESSMENT            (clinician-owned)     INFORMANT
[RESEARCH-STAGE]  [ESTABLISHED]         [ESTABLISHED,         [ESTABLISHED]
                                         specialist setting]
 session θ         history/exam           p-tau217 / amyloid    ADL / IADL
 repetition rate   cognitive testing      imaging               caregiver report
 routine adherence functional exam                             CHW observation
 sleep (reported)
 speech markers (shadow only)
   │                  │                     │                    │
   └──────────────────┴──────────┬──────────┴────────────────────┘
                                 ↓
                      EVIDENCE GRAPH — never collapsed
             each node: source · date · tier · confidence · missingness
                                 ↓
                        CLINICIAN INTEGRATION
                                 ↓
                    DIAGNOSIS / STAGE / TREATMENT
                        (human, always human)
```

Uncertainty-aware presentation, not score fusion:

```
   WRONG   speech 80 + game 70 + sleep 60 → "cognitive score 70"

   RIGHT   game telemetry     θ_memory −0.4σ   conf 0.91   n = 34 sessions
           repetition count            +2.1σ   conf 0.88   system + caregiver
           speech markers        inconclusive  conf 0.34   [SHADOW ONLY]
           sleep (reported)            −1.6σ   conf 0.62   3 days missing
           → direction + magnitude + confidence + what is missing
```

---

## Appendix E. Sensitive and Deferred Modules

Four capabilities that are genuinely useful, genuinely requested by families, and genuinely dangerous if built the obvious way. Each is specified here with its constraints so that a later team does not reinvent it carelessly.

### E.1 Financial Safety Layer — **deferred to Phase 4, and permanently bounded**

**[ESTABLISHED]** Financial exploitation is a recognised vulnerability for people living with dementia; scoping-review evidence highlights cognitive impairment, missed warning signs, unclear professional responsibilities and fragmented safeguarding.

| May be built (eventually) | Never built |
|---|---|
| Scam-awareness education in the person's language, at their reading/listening level | Account access of any kind |
| An "ask a trusted person" button that routes an unfamiliar request to a designated contact | Transaction blocking or approval by the platform |
| Family-configured *advisory* prompt on unusual activity, where a bank already provides a feed and the person consented | Autonomous spending limits |
| Documentation support for legal/financial planning conversations early in the disease | Any AI judgement about financial capacity |

**Why deferred:** a platform that touches money in a household where elder financial abuse is a live risk becomes an instrument in that risk. The safeguarding architecture (§23.3) must be field-proven first. **No financial data is collected in MVP through Phase 3.**

### E.2 Driving and mobility — **information, never verdict**

**[ESTABLISHED]** Meta-analytic evidence shows people with dementia are substantially more likely to fail performance-based road tests, even at mild stages. This makes driving one of the most consequential and most conflict-laden topics in dementia care.

```
PLATFORM MAY:  log caregiver-reported near-misses, getting-lost events,
               navigation difficulty, unusual route deviation (consented);
               surface these as evidence for a clinical conversation;
               prepare the questions the family cannot bring themselves to ask;
               offer transport-alternative planning (this is the real unmet need)

PLATFORM MAY NEVER:  declare anyone unfit to drive · disable a vehicle ·
                     notify a licensing authority · rank driving risk
```

Fitness to drive is a clinical and legal determination. The platform's contribution is that the conversation happens **earlier, with evidence, and with a transport plan already prepared** — which is what actually makes the decision acceptable to the person.

### E.3 Continence and intimate care — the dignity-first design

**[ESTABLISHED]** Urinary incontinence is common in dementia and is a major driver of caregiver burden, loss of dignity, social withdrawal and institutionalisation.

The whole design decision is in the phrasing and the visibility scope:

```
NEVER    "You are incontinent."   "Accident logged."   dashboard tile "Continence"
ALWAYS   "Would you like to visit the bathroom before bed?"
         learned from her own pattern (e.g. usually ~21:30), delivered privately,
         audible to no one else in the room, skippable without comment
```

Scope: continence data is **private-by-default** (§23.3) — visible to the person and primary caregiver, to the CHW only where care-relevant, to the clinician on the clinical summary, and to nobody else. It never appears in a shared family view. This is the clearest case in the whole system where a technically trivial feature is entirely determined by dignity constraints.

### E.4 Family disagreement — shared evidence, never adjudication

A recurring and underestimated problem: one adult child says "she's fine, you're overreacting"; another says "she has changed enormously". In NER this is sharpened by out-migration — the sibling who visits twice a year sees a step change that the co-resident caregiver has adapted to gradually.

The platform's response is **not** to decide who is right.

```
WHAT THE SYSTEM PRESENTS (to both, identically)

  Caregiver A observations         12 entries, Jun–Aug   [informant]
  Caregiver B observations          3 entries, Aug       [informant, remote]
  Her own statements                as recorded          [person]
  Routine adherence                 measured             [system]
  Session performance vs her own baseline                [system, quality-gated]
  CHW visit findings                2 visits             [professional]
  Clinician annotations             1                    [clinical]

  Each with source, date, confidence, and what is missing.
  No aggregate verdict. No "who is more accurate" ranking.
```

This is one of the highest-value and least-recognised uses of provenance: families argue less when they are looking at the same dated evidence, and the system does not have to be the referee to be useful.

---

## Appendix F. Ten Technological Planes — an alternative view of the same architecture

§29.1 presents the architecture as a runtime stack. For planning, staffing and phasing it is more useful to see it as ten planes, because each plane maps to a distinct skill set and a distinct validation activity.

```
PLANE 10 — CLINICAL / COMMUNITY NETWORK       AAM · eSanjeevani · NPHCE · DMHP · referral
────────────────────────────────────────────
PLANE  9 — COPILOTS                            caregiver · CHW · clinician
────────────────────────────────────────────
PLANE  8 — AGENTIC ORCHESTRATION               13 agents + orchestrator + escalation ladder
────────────────────────────────────────────
PLANE  7 — EVIDENCE + AGENTIC RAG              K1–K6 knowledge layers · provenance · policy
────────────────────────────────────────────
PLANE  6 — PERSONAL WORLD MODEL                identity · memory graph · routines · culture
────────────────────────────────────────────
PLANE  5 — LONGITUDINAL STATE ENGINE           baseline · change points · measurement quality
────────────────────────────────────────────
PLANE  4 — MULTIMODAL PERCEPTION               touch · speech · activity · sleep · reports
────────────────────────────────────────────
PLANE  3 — INTERVENTION ENGINE                 CST · reminiscence · music · exercise · social
────────────────────────────────────────────
PLANE  2 — EXPERIENCE                          patient · caregiver · CHW · clinician surfaces
────────────────────────────────────────────
PLANE  1 — TRUST / SAFETY / PRIVACY            consent · firewall · gateway · audit · encryption
────────────────────────────────────────────
```

| Plane | Owner discipline | Phase it lands | Its validation question |
|---|---|---|---|
| 1 Trust/Safety | Security + ethics + legal (DPDP 2023, ABDM) | P0–P1, never "finished" | Zero privacy incidents; zero unsafe recommendations |
| 2 Experience | HCI + accessibility + local-language design | P1 | Can a non-literate 78-year-old use it unaided? |
| 3 Intervention | Clinical (OT, psychology, geriatrics) + game design | P1 | Are the activities guideline-consistent and culturally real? |
| 4 Perception | Mobile + speech engineering | P1 (touch), P3 (speech) | Reliability per language tier and device tier |
| 5 Longitudinal state | Statistics / measurement science | P1 (v1), P3 (full) | Test–retest reliability before any claim |
| 6 World model | Knowledge engineering + community co-design | P1 | Is the kinship/cultural ontology correct per community? |
| 7 Evidence RAG | ML engineering + clinical librarianship | P2 | Grounding rate; hallucination rate under red-team suite |
| 8 Orchestration | Systems engineering | P2 | Are agent boundaries provably enforced? |
| 9 Copilots | Product + clinical | P1 (caregiver), P2 (clinician) | Rated usefulness; alert utility ≥70% |
| 10 Network | Health-systems and government partnership | P2–P5 | Does it fit the AAM workflow without a parallel register? |

**Planning consequence:** planes 1, 2, 3, 5 and 6 must be built by the same small team in Phase 1 because they are inseparable in the field. Planes 7–10 are additive. Plane 4's speech component is deliberately last, because it is the one most likely to fail quietly in NER conditions.

---

## Appendix G. Information Architecture — Public Site and Four Surfaces

### G.1 Public-facing site: hide the machinery

The website that a family, a CHW or a district health officer sees must not expose the architecture. Six doors, in plain language, in the state's languages.

| Door | Label (English) | Behind it |
|---|---|---|
| Landing | *Helping older people live more independently, safely and meaningfully* | What it is, who it is for, what it does **not** do (explicit) |
| Person | **My Day** | Companion, activities, memories — demo mode with sample content |
| Caregiver | **Today** | Copilot preview; how alerting works; what you will and won't be told |
| Memory | **My Life** | Memory Vault; how families contribute photos and voices |
| Activities | **Let's Do Something** | Cognitive Studio; ambient stimulation explained without jargon |
| Care | **Care Plan** | Routine, coordination, family roles, CHW involvement |
| Health | **My Health Journey** | Clinical Bridge; what a doctor receives; explicit "this is not a diagnosis" |
| Trust | **Your Data, Your Rules** | Consent model, Memory Firewall, what is never collected — in plain language |

The last door is not a legal page. In a product whose core promise is that it will not become surveillance, the privacy model is a **feature to be marketed**, and it belongs in the primary navigation.

### G.2 Clinician dashboard — trajectory with provenance

```
PATIENT TRAJECTORY — 3 months                       data as of 8 Sep 2026

                    Jun        Jul        Aug        Sep
Repetition rate     ──────────╱──────────╱────────╱      ↑  (1–2/d → 5–7/d)
Session θ (memory)  ──────────────╲──────────╲            ↓  −25% vs own baseline
IADL assistance     ────────────────────╲                 ↓  money handling (new, ~Jul)
Sleep (reported)    ──────────────────────────╲           ↓  1 → 3 wakings
Orientation events  ───────────────╱────────╱             ↑  0 → 3
Activity            ─────────────────╲──────╲             ↓

RECENT CHANGES THAT MATTER (max 5)
 1. Repetition rate rose ~3× over 12 weeks          [system + caregiver log]
 2. New IADL assistance need: money handling        [informant, ~Jul]
 3. Sleep interruptions up, last 3 weeks            [caregiver log]

POSSIBLE CONFOUNDERS ON RECORD
 • Antihypertensive started 12 Aug (caregiver-reported, unverified vs prescription)
 • Hearing aid unused since ~Jul  → measurement quality reduced
 • Caregiver absent 1–14 Aug (routine disruption)

MEASUREMENT CONFIDENCE   moderate  (6 of 14 sessions low audio quality)
WHAT THIS IS NOT         not a diagnosis · not a stage · not a cognitive test score

[ system telemetry ▸ ]  [ caregiver log ▸ ]  [ CHW visit notes ▸ ]  [ annotate ▸ ]
```

### G.3 "Why am I seeing this?" — explanation without chain-of-thought

Every alert is one tap from its own justification. The explanation is an **evidence summary**, not a reasoning transcript — showing the model's internal deliberation would be both misleading and unverifiable.

```
WHY THIS ALERT

Three independent observations:
  • activity below her own 14-day pattern (3 days running)   [system]
  • sleep interruptions up from ~1 to ~3 per night           [your notes]
  • you reported she seemed withdrawn on 6 Sep               [your notes]

Measurement confidence: good (audio and language checks passed)

Nothing here indicates an emergency.

Suggested: comfort check, keep this evening quiet,
           contact the AAM if it continues past Thursday.

[ This was expected — there was a reason ]   [ Useful ]   [ Not useful ]
```

That third row is the learning loop (§21.4). It is also the honest admission that our thresholds are a starting guess that each household will correct.

---

## Appendix H. Metric Dictionary

One table so that nobody has to reconstruct definitions later. **Bold** entries are the ones we consider distinctive; a metric with no instrument is not a metric.

| # | Metric | Definition | Instrument | Family |
|---|---|---|---|---|
| 1 | **Meaningful engagement** | Sessions with voluntary initiation, completion without distress, and a positive or neutral affect signal — *not* sessions completed | Telemetry + 2-tap affect check | Person |
| 2 | Voluntary initiation rate | Share of sessions the person opened without a prompt | Telemetry | Person |
| 3 | Abandonment rate | Sessions exited before the first activity completes | Telemetry | Person |
| 4 | Frustration signal | Rapid repeated errors + early exit + help requests in one session | Telemetry (composite) | Person |
| 5 | Cognitive-domain coverage | Distinct domains exercised per 14 days | Compiler log | Person |
| 6 | **Assistance-level reduction** | Any IADL/ADL where required assistance decreases or holds steady over 12 weeks | Informant scale + CHW | Person |
| 7 | **Human-contact events** | Calls, visits and voice-note exchanges with real people per week | Telemetry + caregiver log | Social |
| 8 | AI-only interaction share | Proportion of interaction that is with the Companion rather than people — **a risk indicator, not a success metric** | Telemetry | Social |
| 9 | Quality of life | Validated dementia QoL instrument at 0/12/24 weeks | Clinician/informant | Person |
| 10 | Caregiver burden | Validated burden scale | Clinician-administered | Caregiver |
| 11 | Caregiver self-efficacy | Validated scale | Self-report | Caregiver |
| 12 | Caregiver sleep | Reported wakings and total sleep | Self-report | Caregiver |
| 13 | Decision confidence | "I know what to do when she is distressed" (Likert, repeated) | Self-report | Caregiver |
| 14 | Time saved | Self-reported minutes/day on coordination and recall tasks | Self-report | Caregiver |
| 15 | **L3+ alerts per person per week** | Interruptions actually delivered | Alert log | Alerting |
| 16 | **Alert usefulness rate** | Share of L3+ alerts rated "Useful" | In-app 3-button feedback | Alerting |
| 17 | **"Expected" rate** | Share rated "there was a reason" — drives baseline widening | In-app feedback | Alerting |
| 18 | False-positive rate | Alerts with no corroborated basis on caregiver/CHW review | Review register | Alerting |
| 19 | Suppression audit rate | Share of suppressed items later judged should-have-fired | Weekly audit | Alerting |
| 20 | **Quality-gate rate** | Share of sessions excluded from inference for measurement quality | Quality engine | Measurement |
| 21 | **Language-mismatch rate** | Sessions flagged as run in a non-optimal language | Quality engine | Measurement |
| 22 | θ test–retest reliability | Stability of ability estimate across close-in-time sessions | Statistical | Measurement |
| 23 | Repetition-rate reliability | Stability and informant agreement of the repetition counter | Statistical + informant | Measurement |
| 24 | Clinician-rated pack usefulness | Was the Clinical Bridge pack useful in this consult? | Post-consult survey | Clinical |
| 25 | Clinician agreement | Agreement with the system on "was this a meaningful change?" | Adjudication | Clinical |
| 26 | Consult-time change | Minutes spent, and share of time on history reconstruction | Timing study | Clinical |
| 27 | Delirium episodes flagged vs confirmed | L5 acute-change events against chart-confirmed delirium | Chart review | Clinical safety |
| 28 | **Unsafe recommendations** | Any output containing diagnosis, drug advice, or an unsafe action — **target zero** | Red-team + incident register | Safety |
| 29 | Privacy incidents | Unauthorised access, scope violation, breach — **target zero** | Audit log + register | Safety |
| 30 | Scope-expansion attempts | Caregiver attempts to widen data scope, and their outcomes | Audit log | Safeguarding |
| 31 | Offline continuity days | Longest period fully functional without connectivity | Telemetry | System |
| 32 | Sync age at clinical view | Age of the newest data when a clinician opens a pack | Telemetry | System |
| 33 | Data per person per day | Bytes synced excluding media | Telemetry | System |
| 34 | ASR word error rate by language | Per Tier-A/B language, in-field noise conditions | Benchmark | System |
| 35 | CHW time per household | Minutes per dementia household per visit — **must stay ≤10** | CHW app timing | Implementation |
| 36 | **Equity spread** | Adoption and outcome gap across literacy, gender, language tier, rural/urban — no stratum below 50% of the best | Stratified analysis | Equity |

**Rule for this table:** any figure quoted from it in a pitch, paper or report must state the instrument and the sample. Metrics 1, 6, 7, 15–17, 20–21, 28, 35 and 36 are the ones we consider the honest test of whether this platform did what this document claims it will do.

---

## 36. Research References

Sources verified during preparation of this document. Evidence tiers as assigned in §7.

**Epidemiology and India context**
1. Lee J, Meijer E, Langa KM, et al. *Prevalence of dementia in India: National and state estimates from a nationwide study.* Alzheimer's & Dementia. 2023;19:2898–2912. doi:10.1002/alz.12928 (PMID 36637034). India 60+ prevalence 7.4%, ≈8.8 million; NE-states-excluding-Assam grouped estimate ≈7.35% (95% CI 5.29–9.41, n=1,124). Correction published 2025 (PMID 40693452).
2. Lima MR, Srinivasan N, Daniels S, Vaitheswaran S, Vaidyanathan R. *Cultural Feasibility of Conversational Robots for Dementia Care in India: Participatory Design Study.* J Particip Med. 2025;17:e80457. doi:10.2196/80457 (PMID 41197121). n=29 stakeholders; ~90% diagnosis-and-care gap; tone, local-accent and noise findings.
3. Government of India, MoSPI/NSO. *Elderly in India 2021.* Lowest average years of formal education among 60+: Sikkim 6.2, Mizoram 6.3.
4. UNFPA India. *India Ageing Report* — north-eastern region old-age dependency ratio ≈13 vs southern ≈20.
5. Community-based study of functional disability among rural elderly, Dibrugarh, Assam — 43.7% functional disability (PMC7955953).
6. STRiDE India situation report; ARDSI *Dementia in India* reports; Karnataka Brain Health Initiative; Kerala State Initiative on Dementia.
7. Indian caregiving evidence: India scoping review of caregiver experiences and needs (PMID 39734191); nationally representative dementia caregiving study (PMID 40371675).

**Guidelines and policy**
8. WHO. *Risk reduction of cognitive decline and dementia: WHO guidelines, second edition.* 15 July 2026. ISBN/item 9789240123557. Up to 45% of dementia risk attributable to modifiable factors.
9. WHO news release, 15 July 2026: *New WHO guidelines: up to 45% of dementia risk could be prevented or delayed.*
10. WHO. *Ethics and governance of artificial intelligence for health* (2021) and *guidance for large multi-modal models* (2024).
11. NICE NG97. *Dementia: assessment, management and support for people living with dementia and their carers.*
12. Alzheimer's Association. *DETeCD-ADRD clinical practice guideline* (PMID 39713942); *Blood-based biomarkers guideline* (PMID 40729527).
13. US FDA. Clearance of the first blood test used in diagnosing Alzheimer's disease (2025) — explicitly not a standalone screening/diagnostic test; FDA drug-safety communication on additional/earlier MRI monitoring for lecanemab (2025); FDA Clinical Decision Support guidance.
14. Government of India: NPHCE operational guidelines; National Mental Health Programme / DMHP; Tele-MANAS (14416); Ayushman Bharat Digital Mission (ABHA); Digital Personal Data Protection Act, 2023.

**Interventions and digital health evidence**
15. *Efficacy of digital cognitive stimulation therapy for people with dementia: a systematic review and meta-analysis.* BMC Geriatrics, 2026. doi:10.1186/s12877-026-07180-9. Improvements in cognitive performance and aspects of psychosocial functioning; evidence limited and heterogeneous.
16. Desai R, Leung WG, Fearn C, John A, Stott J, Spector A. *Effectiveness of cognitive stimulation therapy (CST) for mild to moderate dementia.* Ageing Research Reviews, 2024. doi:10.1016/j.arr.2024.102312.
17. Chan ATC, et al. *Computerized cognitive training for memory functions in MCI or dementia: systematic review and meta-analysis.* npj Digital Medicine. 2024;7. doi:10.1038/s41746-023-00987-5.
18. Alam A, Rabbani MG, Prybutok VR. *Effectiveness, adoption determinants and implementation challenges of ICT-based cognitive support for older adults with MCI and dementia (2015–2025).* Healthcare. 2025;13:1421. Pooled d≈0.49 (trim-and-fill 0.39); barriers: digital literacy, usability, privacy, lack of caregiver support.
19. Network meta-analysis of non-pharmacological caregiver interventions for BPSD (PMID 40639204) — multicomponent interventions highest-ranked.
20. Digital psychological interventions for family caregivers of people with dementia: systematic review and meta-analysis (PMID 41505195).
21. Adherence to online interventions for family caregivers of people with dementia: meta-analysis (PMID 38735829) — personalisation, human contact and interactivity associated with adherence.
22. Music therapy and agitation in dementia: systematic review and meta-analysis (PMID 41046571).
23. Exercise strategies for people with cognitive impairment and dementia: systematic review and meta-analysis (PMID 38692156).
24. Delirium superimposed on dementia in hospitalised older adults: systematic review and meta-analysis (PMID 34648761); non-pharmacological delirium prevention (PMID 41911321).
25. Pain in dementia — barriers and facilitators to pain management: systematic review (PMID 36634886).
26. Polypharmacy consequences in people living with dementia: systematic review and meta-analysis (PMID 39654286).
27. Remote monitoring for Alzheimer disease and related dementias: systematic review (PMID 40367504) — privacy, usability, empathy and validation gaps.
28. Passive digital markers for ADRD: systematic evidence review (PMID 37249252).
29. AI-driven speech biomarkers: systematic review and meta-analysis (PMID 41062257); multimodal AI for Alzheimer diagnosis: systematic review (PMID 41883140).
30. Unmet needs in people affected by dementia: scoping review of reviews (PMID 40696903).
31. Elder abuse and neglect of persons with dementia in community settings: systematic review and meta-analysis (PMID 40552876); financial exploitation among older people living with dementia: scoping review (PMID 41163334).
32. ACHIEVE trial: hearing intervention versus health education to reduce cognitive decline (PMID 37478886).
33. Stigma and help-seeking in dementia: systematic review and thematic synthesis (PMID 40564556); dementia literacy in South and Southeast Asia: systematic review (PMID 40736228).

**NER infrastructure, connectivity and language technology**
34. The Sentinel (Assam), 13 April 2026: *1,841 villages in Northeast India still without mobile network coverage as of February 2026* — state-wise breakdown; 45,934 total villages; BharatNet 2,17,805 GPs service-ready as of February 2026; 24,263 towers commissioned under 4G Saturation.
35. Department of Telecommunications / Digital Bharat Nidhi (USOF): BharatNet and Amended BharatNet Programme; NER uncovered-village mobile schemes.
36. BharatNet satellite connectivity for remote NER gram panchayats using ISRO **GSAT-11 / GSAT-19** capacity (BBNL/TCIL/Hughes India).
37. Business Standard, 23 June 2026; Communications Today, 11 June 2026; Forbes India, 25 June 2026: Starlink, Eutelsat OneWeb and Jio-SES hold Indian licences but **none had launched commercial service as of June 2026**; spectrum assignment and security clearance outstanding; TRAI consultation on satellite spectrum (April 2026); Telecommunications (Authorisation) Rules, 2026.
38. Bhashini / Digital India Bhashini Division — national language platform (~36 Indian languages); Assam Government–Bhashini MoU for Assamese, Bodo and indigenous languages (November 2025).
39. AI4Bharat (IIT Madras) — IndicConformer ASR (incl. Assamese), IndicTrans2, IndicTTS, IndicLID; Shrutilipi corpus.
40. AIKosh (IndiaAI) model listings for Northeast Indian languages — NortheastNER, NE-Embed, NE-SpeechEmbed, NE-OCR (Mizo printed-text character accuracy ≈90.68%) covering Khasi, Garo, Mizo, Meitei, Bodo, Nyishi, Kokborok, Pnar, Nagamese, Wancho, Chakma.

**Health system and telemedicine**
41. C-DAC / MoHFW: *eSanjeevani National Telemedicine Service* — AB-HWC provider-assisted hub-and-spoke model via Ayushman Arogya Mandirs; >344 million patients served as of March 2025.
42. *Adoption and utilization of India's eSanjeevani national telemedicine service.* Oxford Open Digital Health, 2025 — >163 million consultations Nov 2019–Sep 2023; provider-assisted AB-HWC model >93% of usage.
43. IMPRI analysis of Tele-MANAS (June 2026) — ~38% of Indian households digitally literate; ~0.3 psychiatrists per 100,000 against a WHO-recommended minimum of ~3.

---

### Closing note on intellectual honesty

This document contains **[ESTABLISHED]** facts, **[PROMISING]** evidence, **[RESEARCH-STAGE]** capabilities, **[EXPERIMENTAL]** ideas and **[ASSUMPTION]** hypotheses — and it labels which is which. Several attractive claims that appear in comparable proposals are absent here deliberately: we do not claim to detect dementia, to slow decline, to predict progression, or to have NER-specific prevalence figures. We do claim that the integration layer described above is genuinely missing, is buildable offline on an entry-level Android device, is testable in a 30-dyad pilot within nine months, and is worth building for the eight states this problem statement was written for.
