# DESIGN.md — The MindMitra UX/UI Operating System

**Authority rank 3** (see `CLAUDE.md` §0.2). This document is authoritative for user experience, information architecture, screens, states, the design system, and accessibility. Where another document describes a surface, this one wins. Where this one implies a technology, `tech-stack.md` wins.

**Status key used throughout:** `MVP` · `PHASE 2` · `PHASE 3` · `FUTURE` · `NEVER`.

**Read before writing any component.** Do not improvise visual decisions. If a decision is not here, it is a gap in this document — raise it, do not invent it locally.

---

## Contents

**Part A — Philosophy and people** · A1 What we are designing · A2 The anti-slop charter · A3 The four people · A4 The element test
**Part B — Information architecture** · B1 One person, four surfaces · B2 Permission-aware navigation · B3 The complete screen inventory
**Part C — The four experiences** · C1 Person · C2 Caregiver · C3 CHW · C4 Clinical
**Part D — The report visual grammar** · D1 The Evidence Block · D2 Confidence, provenance, uncertainty · D3 "This is not a diagnosis" · D4 Refusal and insufficiency
**Part E — Cross-cutting UX systems** · E1 Real-time · E2 Notification and alert · E3 Action cards · E4 Timeline · E5 Consent, firewall, privacy · E6 The complete state catalogue
**Part F — The design system** · F1 Foundations · F2 Semantic tokens · F3 Type · F4 Space, radius, elevation · F5 Motion · F6 Icons, illustration, photography · F7 Components · F8 Data visualisation
**Part G — Accessibility, language, culture** · G1 Accessibility criteria · G2 Localisation and multilingual layout · G3 Low literacy and voice-first · G4 Cultural adaptation
**Part H — Practice** · H1 Web to mobile · H2 Responsive · H3 Testing methodology · H4 Usability acceptance criteria

---
---

# PART A — PHILOSOPHY AND PEOPLE

## A1. What we are designing

MindMitra is **one longitudinal cognitive-care system centred on one person**, experienced by four humans with four different responsibilities. It is not a games app, not a dashboard product, and not four apps that happen to share a database.

The design consequence is stated once and applies everywhere:

> **The four surfaces are not four skins on one screen. They are four different products, built from one governed evidence base, and they are allowed to look nothing like each other.**

A person with dementia and a neurologist do not need the same interface any more than they need the same information. Attempting to unify them produces a dashboard the person cannot use and a toy the clinician will not trust.

### A1.1 What the product must feel like

| It must communicate | It must never communicate |
|---|---|
| Trust, calm, humanity, dignity | Cleverness, novelty, technological ambition |
| Familiarity, warmth, cultural belonging | Institutional coldness, generic globalism |
| Clarity, safety, continuity, simplicity | Urgency-by-default, surveillance, assessment |

The person should feel: *"This knows me, helps me, remembers with me, and helps me stay independent."*
Never: *"An AI is evaluating me."*

The caregiver should feel: *"Someone reliable is watching with me, and will tell me when it matters — and only then."*
Never: *"There is a wall of things I am failing to keep up with."*

### A1.2 The three rules that generate most of the design

1. **Compression is the deliverable.** For caregiver, CHW and clinician, the product's value is *what it leaves out*. A screen that shows everything has done no work.
2. **Every element must earn its place.** See A4.
3. **The person is never told they are being measured.** Measurement is a by-product of a meaningful experience, never its stated purpose. No scores, no streaks, no progress bars, no "assessment" language, ever — this is a safety and dignity constraint, not a preference.

---

## A2. The anti-slop charter

MindMitra must not look like a modern AI SaaS product. This is not taste; a dementia-care platform that looks like a startup landing page will not be trusted by a district health officer, a CHW, or a 78-year-old's family.

### A2.1 Banned outright

| Banned | Because |
|---|---|
| Gradient meshes, glowing purple/blue "AI" palettes | Signals technology-first; alien to the context |
| Glassmorphism, frosted panels, heavy blur | Reduces contrast; actively harmful for ageing vision |
| Animated blobs, particles, decorative motion | Consumes attention that must go to content; distressing at cognitive load |
| Giant "AI-powered" hero sections; robot imagery | We are barred from marketing AI as the product |
| Dashboard-card-grid syndrome (12 tiles, no hierarchy) | Defeats compression; makes the caregiver do the triage |
| Decorative charts; charts without a question | Every chart answers a named clinical question or is deleted |
| Chatbot-first interfaces | Open-ended prompts provoke anxiety at higher impairment (Blueprint §13.1) |
| Fake metrics, "AI insights" counters, vanity statistics | The product's own metric dictionary bans un-instrumented numbers |
| Excessive rounded containers; cards inside cards inside cards | Visual noise; no information gain |
| Dense tables on any person-facing surface | Unusable for the primary user |
| Generic stock photography of "happy seniors" | Cultural falseness; the opposite of what we promise |
| Dark futuristic medical dashboards | Reads as monitoring, not care |
| Notification badges on the person's surface | The person is never alerted about their own data |
| Leaderboards, streaks, ranks, timers, scores, confetti | Prohibited by the Studio's dignity constraints |

### A2.2 What we take inspiration from instead

Mature clinical information systems (for the clinician's density and provenance discipline); accessible public-service design (for plain language and legibility); editorial information design (for hierarchy and restraint); calm technology (for the notification philosophy); culturally grounded storytelling (for the person's surface). We copy no existing product.

### A2.3 The visual thesis

**Warm, printed, and quiet.** Ink on warm paper, not glass on gradient. Generous type, generous space, few colours, no decoration, strong hierarchy, and colour used only to mean something. A page should look like it was set by someone who cared about being read, not by someone who cared about looking modern.

---

## A3. The four people

Each carries goals, fears and frictions. Design against the fears as hard as for the goals.

### A3.1 The person (primary participant)

*Aitâ, 78, Assamese, moderate impairment, reading glasses, hearing aid she sometimes forgets, a shared family tablet.*

| Goals | Fears / frictions |
|---|---|
| Know what day it is and what happens next | Being tested, and failing in front of family |
| Recognise the people who matter | Being treated as a patient, not a person |
| Keep doing things herself — tea, dressing, the walk to the market | Being watched; losing control of her own information |
| Stay connected to family who have migrated | An interface that changed since yesterday |
| Feel useful and known | Being corrected ("you already asked me that") |

**Design implications:** one decision at a time; layout that never changes; large targets; voice first, picture second, text last; no navigation depth beyond two levels; participation acknowledged before correctness; graceful exit always available; every session ends on a success.

### A3.2 The caregiver (co-primary user)

*Anu, 47, daughter, works, sleeps badly, is the external memory for two households.*

| Goals | Fears / frictions |
|---|---|
| Know quickly whether today is fine | Missing something that mattered |
| Know what changed, and whether to act | Being buried in alerts and learning to ignore them |
| Know what can wait | Being blamed, or feeling incompetent |
| Have something useful to tell the doctor | Becoming a data-entry clerk |
| Be told when nothing is wrong | Surveillance guilt — "am I spying on my mother?" |

**Design implications:** attention budget is the organising principle; the first screen answers three questions in under ten seconds; progressive disclosure everywhere; *"nothing needs attention"* is a designed, positive state; every alert is one tap from "why am I seeing this?"; every alert offers *Useful / Expected / Not useful*.

### A3.3 The CHW (ASHA / ANM / CHO)

*Ban, 34, covers 4 villages, 40 minutes for four households, an entry-level phone, intermittent coverage, already carries three registers.*

| Goals | Fears / frictions |
|---|---|
| Know which households need her today, and why | The app becoming another register to fill |
| Walk in already knowing what changed | Data entry that duplicates paper work |
| Have a short, clear script | Losing work when the network drops |
| Know when to escalate, and to whom | Being asked to make clinical judgements |
| Finish in ten minutes per household | Being measured on app usage |

**Design implications:** visit-centric, not dashboard-centric; a queue, not analytics; every screen shows a time estimate; taps and voice only, never typing paragraphs; works with a stale cache and says so; sync state always visible; the ≤10-minute budget is rendered, not implied.

### A3.4 The clinician

*Dr Barua, 15 minutes per teleconsult, no history, sceptical of algorithmic claims — correctly.*

| Goals | Fears / frictions |
|---|---|
| Know what changed since the last review | Being handed an opaque score |
| Know how far to trust it | Being nudged toward a conclusion |
| See confounders before conclusions | Wading through telemetry to find the story |
| Know what is *not* known | Liability for a system's inference |
| Spend the consult on decisions, not history reconstruction | Alert noise in a clinical inbox |

**Design implications:** evidence-first, never raw-data-first; `SUMMARY → CHANGE → EVIDENCE → CONTEXT → SOURCE → RAW` drill-down; measurement confidence and "what this is not" on every view; contradictions and gaps shown, never smoothed; annotate/correct is a first-class action; the clinician is never notified except at L5.

---

## A4. The element test

Applied to every card, chart, badge, animation, metric and sentence before it ships.

```
1  WHOSE question does this answer?          → name the role, or delete it
2  What DECISION does it change?             → none? make it pull-only, or delete it
3  Could this be one line instead?           → then it is one line
4  Does it carry evidence, or just assert?   → unsourced claims do not ship
5  Does it add urgency it hasn't earned?     → red is reserved; see F2.4
6  Would the person feel measured by it?     → then it never reaches their surface
7  Does the motion aid comprehension?        → no? remove it
8  Does the metric have an instrument?       → no instrument, no metric (Blueprint App. H)
```

Failing any one of these is sufficient grounds for deletion. The default answer to "should we also show…" is **no**.

---
---

# PART B — INFORMATION ARCHITECTURE

## B1. One person, four surfaces

```
                        ┌──────────────────────────┐
                        │      PUBLIC SITE         │  hides the machinery
                        └────────────┬─────────────┘
                                     │ sign in
        ┌──────────────┬─────────────┼─────────────┬──────────────┐
        ▼              ▼             ▼             ▼              ▼
    PERSON         CAREGIVER        CHW        CLINICIAN      TRUST & SAFETY
   "My Day"        "Today"       "Caseload"   "Caseload"      (admin console)
   voice-first     compression   visit-centric evidence-first  consent · audit
        └──────────────┴─────────────┼─────────────┴──────────────┘
                                     ▼
                    ONE PERSON · ONE GOVERNED EVIDENCE BASE
              (Firewall.project decides what each surface may hold)
```

Each surface is entered through **one primary question**, and that question is the home screen. Nothing else competes with it.

| Surface | Home screen | The question it answers |
|---|---|---|
| Person | **My Day** | *What can I help you do right now?* |
| Caregiver | **Today** | *How is she today? What changed? Do I need to do anything?* |
| CHW | **Caseload** | *Who needs my attention, why, and what should I check?* |
| Clinician | **Caseload → Patient** | *What changed since the last review, and how trustworthy is it?* |

## B2. Permission-aware navigation

Navigation is **generated from `Firewall.project()`**, never authored as a static menu with hidden items (`tech-stack.md` §19.1.4).

**Rules:**
1. **Absent, not disabled.** An unauthorised destination does not exist in the tree. No greyed-out tabs — a greyed-out "Life Story" tab tells a CHW that life-story data exists and they are excluded, which is itself a disclosure.
2. **Re-checked at render and at fetch.** A route present in the tree still re-authorises on data fetch; a stale tree never grants access.
3. **Explained when it matters.** Where a person or caregiver would reasonably expect an item, the surface may show a *neutral* explanation on demand — "Some of your mother's information is private to her" — never a list of what is hidden.
4. **Depth caps by role.** Person: 2 levels. Caregiver: 3. CHW: 3. Clinician: 5 (the drill-down chain is the point).
5. **Position is stable.** For the person, primary actions occupy fixed screen positions permanently. No reordering by recency, no personalised menus, no A/B tests, ever.

## B3. The complete screen inventory

Each screen: purpose · the question it answers · what it must never show · phase.

### B3.1 Public site — six doors, plain language, state languages

The public site's job is to **hide the machinery**. No architecture diagrams, no "agentic", no "RAG", no model names.

| Screen | Question it answers | Never shows | Phase |
|---|---|---|---|
| **Landing** | What is this, who is it for, what does it *not* do? | AI branding; a hero claim about outcomes; "revolutionary" | `MVP` |
| **How it works** | What actually happens, in one page, in plain language | Architecture diagrams; agent names; jargon | `MVP` |
| **For the person** | What her day looks like with it | Screenshots implying testing or scoring | `MVP` |
| **For families** | What a caregiver is told, and what they are *not* told | Promises of total visibility | `MVP` |
| **For health workers** | How it fits an existing ASHA/ANM/CHO workload | Anything implying extra work | `PHASE 2` |
| **For clinicians** | What a doctor receives, and its explicit limits | Any diagnostic claim | `PHASE 2` |
| **Your data, your rules** | Consent model, Memory Firewall, what is never collected | Legalese; this is a **feature page**, in primary nav | `MVP` |
| **Culture & language** | Language tiers, honesty about what is and is not supported today | Claiming Tier-C ASR we do not have | `MVP` |
| **Evidence & limitations** | What is established, promising, research-stage; what we do not claim | Cherry-picked results; unlabelled claims | `MVP` |
| **About / partners** | Who is accountable | — | `PHASE 2` |

> The "Your data, your rules" door sits in the **primary** navigation. In a product whose core promise is that it will not become surveillance, the privacy model is the marketing.

### B3.2 Person surface — "My Day"

Twelve screens maximum, for life. Depth ≤ 2.

| Screen | Question it answers | Never shows | Phase |
|---|---|---|---|
| **Welcome / sign-in** | Is this me? (on a shared family device) | Passwords typed by the person; PIN pressure | `MVP` |
| **My Day** (home) | What day is it, what happens next, what can I do now? | Scores, badges, streaks, notification counts, settings icon | `MVP` |
| **Companion** | Can I just talk to someone? | Open-ended interrogation; correction; "you already asked" | `MVP` |
| **Activities** ("Let's do something") | What shall we do? | Difficulty labels; a catalogue grid; "recommended for you" | `MVP` |
| **Activity player** | *(no chrome — the activity is the screen)* | Timers, scores, red X, "wrong", progress bars, comparison | `MVP` |
| **Memory** ("Who is…?") | Who is this person, what is this place? | Unverified facts stated plainly; sensitive facts unprompted | `MVP` |
| **My Life** | Photos, songs, stories, people | Anything marked sensitive without her initiating it | `MVP` |
| **Routine** ("My day's shape") | What comes next, what have I done? | A missed-item tally; failure framing | `MVP` |
| **Orientation card** | Where am I, what day, who is coming? | Quiz framing of any kind | `MVP` |
| **Reminders** | What did you want to tell me? | A badge count; an inbox | `MVP` |
| **Help / Call** | How do I reach a person? | Any friction between her and a human | `MVP` |
| **My privacy** | Who can see my things? | Complexity; more than three choices at once | `PHASE 2` |
| **Emergency / safe-return card** | *(lock-screen; always available)* | — | `MVP` |

**Never on this surface, at any phase:** a settings gear, a profile editor, a notification centre, a search field, any number describing her, any word from the clinical register.

### B3.3 Caregiver surface

| Screen | Question it answers | Never shows | Phase |
|---|---|---|---|
| **Today** (home) | How is she? What changed? Do I need to do anything? | More than one "worth your attention" item; more than three actions | `MVP` |
| **Person overview** | Who is she, right now, in summary | A cognitive score; a stage; a percentile | `MVP` |
| **Changes** | What has moved from her own usual pattern, and how confident are we? | Population comparison; trend lines without confidence | `MVP` |
| **Activities** | Is she engaging? What helped? | Scores, per-session telemetry, accuracy | `MVP` |
| **Routine** | What is her day's shape? What is slipping? | A compliance scoreboard | `MVP` |
| **Care tasks** | What do I need to do, and by when? | An unbounded to-do list | `MVP` |
| **Alerts** | What have I been told, and what did I do about it? | Unresolved noise; suppressed items hidden | `MVP` |
| **Reports** | Daily card, weekly digest, consult prep | A report builder; export-everything | `MVP` |
| **Timeline** | What has happened over time? | Raw event log | `PHASE 2` |
| **Family & care network** | Who else is involved, and what do they see? | Ability to expand her scope silently | `PHASE 2` |
| **Consent & access** | What have I been granted, and by whom? | Any self-service scope expansion | `MVP` |
| **Communication** | Messages between the care team | A social feed | `PHASE 3` |
| **Settings** | Language, contact preferences, alert preferences | Anything that can disable a safety path | `MVP` |

### B3.4 CHW surface

Built for a field phone, an intermittent network, and 40 minutes.

| Screen | Question it answers | Never shows | Phase |
|---|---|---|---|
| **Caseload** (home) | Who needs me today, why, and how long will it take? | Analytics; charts; households sorted by anything but need | `MVP` |
| **Attention queue** | Which households are flagged, and on what evidence? | More than five flagged per cycle (the budget) | `MVP` |
| **Person profile** | Who is this household, in one screen? | Full clinical record; life-story content | `MVP` |
| **Visit preparation** | What do I need to know before I knock? | Anything not relevant to *this* visit | `MVP` |
| **Visit workflow** | What do I ask, check, record — in order? | Free-text-heavy forms; anything over 10 minutes | `MVP` |
| **Changes since last visit** | What moved, and how trustworthy is it? | Clinical interpretation | `MVP` |
| **Daily-life context** | How is the household actually functioning? | Surveillance-grade detail | `MVP` |
| **Caregiver context** | Is the caregiver coping? Do they need support? | Judgement framing; a burden score | `PHASE 2` |
| **Follow-up** | What did I promise, what is outstanding? | — | `MVP` |
| **Escalation / referral** | Should this go to a CHO or a teleconsult, and with what? | A diagnostic suggestion | `MVP` |
| **Notes** | What did I observe? | Mandatory long-form typing | `MVP` |
| **Sync state** | What have I got, what am I carrying, what is uploaded? | Silent failure | `MVP` |

### B3.5 Clinical surface

| Screen | Question it answers | Never shows | Phase |
|---|---|---|---|
| **Caseload** | Which of my patients has something to review? | An alert inbox; anything below L5 as a notification | `PHASE 2` |
| **Patient overview** | Who is this person, and what is the shape of their record? | A composite score of any kind | `PHASE 2` |
| **Since last review** (the primary artefact) | What changed, when, how persistent, how trustworthy? | A conclusion; a stage; a trajectory claim | `PHASE 2` |
| **Timeline** | How did this unfold? | Undated or unsourced events | `PHASE 2` |
| **Functional & cognitive evidence** | What are the per-domain trends against her own baseline? | Fused scores; population norms | `PHASE 2` |
| **Measurement quality** | How much of this can I trust, and why? | Confidence without its reasons | `PHASE 2` |
| **Behaviour & context** | What behavioural change occurred, with what possible contributors? | A stated cause | `PHASE 2` |
| **Caregiver observations** | What did the family report, and when? | Informant data laundered as measured | `PHASE 2` |
| **CHW observations** | What did the health worker find? | — | `PHASE 2` |
| **Contradictions** | Where do sources disagree? | A silently resolved winner | `PHASE 2` |
| **Provenance** | Where did each claim come from? | Model reasoning transcripts | `PHASE 2` |
| **Unresolved questions** | What is not known? | Gaps hidden by smoothing | `PHASE 2` |
| **Clinical notes & annotation** | Can I correct, confirm, add? | Edit-in-place on the derived record | `PHASE 2` |
| **Reports / consult pack** | What do I take into the fifteen minutes? | An unbounded export | `PHASE 2` |
| **Access history** | Who has seen this person's record? | — | `PHASE 3` |

### B3.6 Trust & Safety console (`PHASE 2`)

Consent administration · Memory-Firewall policy review · audit search · safeguarding queue (scope-expansion anomalies) · model and prompt version governance · safety-KPI dashboard (unsafe recommendations, quality-gate rate, language-mismatch rate, alert usefulness, suppression audit). Restricted role; every view is itself audited.

---
---

# PART C — THE FOUR EXPERIENCES

## C1. The person's experience

### C1.1 The governing shape

The home screen answers *"What can I help you do right now?"* — not *"Which feature would you like to open?"*

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   Good morning, Aitâ                        ☀ 24°  │
│   Tuesday, 8 September                             │
│                                                    │
│   Rina is visiting this afternoon.                 │
│                                                    │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│   │     ♫     │  │     ▣     │  │     ✿     │     │
│   │   Songs   │  │  Family   │  │  Let's do │     │
│   │           │  │  photos   │  │ something │     │
│   └───────────┘  └───────────┘  └───────────┘     │
│                                                    │
│   ┌───────────┐  ┌───────────┐   ← always here,   │
│   │     ☎     │  │     ●     │      always this   │
│   │   Call    │  │  Talk     │      size, always  │
│   │   Rina    │  │  to me    │      this order    │
│   └───────────┘  └───────────┘                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

*This layout is canonical here; Blueprint §28.2 and Solution §22 cross-reference this section rather than restating it.*

**No score. No streak. No badge. No settings icon. No search. The layout never changes.**

### C1.2 Specification

| Property | Rule |
|---|---|
| Choices per screen | ≤ 5 primary, ≤ 3 preferred |
| Target size | ≥ 72 × 72 px on the person's surface (well above the 48 px platform minimum) |
| Base type | ≥ 22 px body, ≥ 32 px primary actions; scales to 200% without reflow loss |
| Modality order | Voice → picture → text. Every action is speakable and tappable. |
| Reading level | Short sentences, one idea each, no clauses. Present tense. Her name and honorific, always. |
| Navigation depth | ≤ 2. There is always exactly one way back, in one fixed place. |
| Confirmation | Every consequential action confirms once, in plain words, with the safe option first |
| Error recovery | There is no dead end. Every failure offers "try again", "do something else", or "talk to me". |
| Repetition | Repeating a question is never acknowledged as repetition. The answer adapts; the framing never scolds. |
| Refusal | "No" is honoured immediately, with an offer of an alternative or a later retry. No re-ask in the same session. |

### C1.3 Activity completion UX

**Participation is acknowledged before correctness.** The sequence is fixed:

```
finish → warm acknowledgement of participation → a specific, true, positive detail
       → optional "would you like another?" → graceful exit always available
```

- Never a score, percentage, star rating, or time.
- Never "wrong", never a red X, never a failure sound.
- Errorless cueing: a cue arrives *before* she can err, not after she fails.
- **Every session ends on a success.** If the last item was hard, the engine adds one she will get.
- Skipping mid-activity is a first-class, unpenalised action, available at all times, in the same place.

### C1.4 Adaptive difficulty UX

Difficulty adapts continuously and is **completely invisible**. The person never sees a level, a label, a slider, or a change announcement. The visible consequence of adaptation is only that things feel about right — the 75–85% success band expressed as an experience, not a number.

If the run of difficulty needs to drop, it drops silently mid-session. If fatigue is detected, the session shortens and closes warmly — never "you seem tired".

### C1.5 Orientation UX

Orientation is **woven, never quizzed**. Day, place and next event appear as ambient statements at the top of every screen and as the opening line of every voice interaction. There is no "what day is it?" prompt anywhere in the person-facing product.

### C1.6 Personal memory & My Life UX

- Photographs are large and uncropped; people are named with their relationship, not just a name ("Rina — your daughter").
- **Only `verified` facts are stated plainly.** `reported` / `unverified` facts are spoken with hedging ("I think this may be…") or withheld. This is rendered as a visible hedge in the copy, not a metadata badge.
- Sensitive entities (bereavement, trauma) are **never volunteered**. They appear only if she opens them herself, and then gently.
- She is an authoritative source about her own life: a correction she makes is saved as `verified` with her as the source. The interaction is "thank you", never "that's incorrect".
- No AI-generated imagery or audio of real people, ever, under any framing.

### C1.7 Person-facing "reports"

The person receives **no medicalised report of any kind**. What she may receive:

| Type | Example | Trigger |
|---|---|---|
| Session feedback | *"You did well with that one. Would you like to try another?"* | end of activity |
| Daily orientation | *"Today is Tuesday. Rina is coming this afternoon."* | on open, and on request |
| What happened today | *"You listened to Bihu songs and we looked at photographs from Nagaon."* | evening, on pull |
| Reminder | *"Your appointment with Dr Barua is at four. Anu is taking you."* | scheduled, context-rich |
| Encouragement | *"You remembered all four things from the market list."* | only when specifically true |
| Meaningful-life summary | *"You told me about til pitha today. I saved it."* | on request |

Never: performance framed as progress, comparison to last week, or anything derived from her baseline.

---

## C2. The caregiver's experience

### C2.1 The attention-budget home screen

The first screen must be understandable in **under ten seconds**. It answers three questions in a fixed order and shows *one* thing worth attention.

```
┌───────────────────────────────────────────────────────────┐
│  TODAY — Aitâ                       Tuesday 8 Sep · 14:20 │
│                                     data as of 12 min ago │
│───────────────────────────────────────────────────────────│
│                                                           │
│   Doing well                                              │
│   Nothing needs your attention today.                     │
│                                                           │
│───────────────────────────────────────────────────────────│
│   ONE THING TO KNOW                                       │
│   The evening routine was different yesterday.            │
│                                                   [ Why ] │
│───────────────────────────────────────────────────────────│
│   WHAT YOU CAN DO                                         │
│   Check whether anything disrupted the evening.           │
│                                                           │
│                              [ View context ]  [ Not now ]│
└───────────────────────────────────────────────────────────┘
```

**Not:** 25 cards, 12 charts, 17 insights, 46 notifications.

**Rules:**
- **Never more than one "worth your attention" item.** If two qualify, the delivery policy ranks and defers the second.
- **Never more than three suggested actions**, each concrete and safe.
- *"Nothing needs your attention"* is a **designed, positive state** with the same visual weight as an alert — reassurance is information.
- Everything else is on **pull**: the daily detail card, activities, routine, timeline.
- **Sync age is always visible.** Stale data is never presented as current.

### C2.2 Progressive disclosure ladder

```
STATUS ("Doing well")
  → ONE THING ("Evening routine was different")
    → WHY ("3 observations · moderate confidence · sources")
      → EVIDENCE (the observations, dated, sourced)
        → CONTEXT (what coincided; what is unknown)
          → DETAIL (routine view, activity view)
```

Each rung is one tap. **No rung is skippable upward** — a caregiver never lands in raw detail without the story.

### C2.3 The caregiver report family

| Report | Trigger | Frequency | Delivery class | Insufficient evidence → |
|---|---|---|---|---|
| Daily care summary | scheduled | daily, **on pull** | `NO_NOTIFICATION` | shows what is known + "some data missing today" |
| Weekly care digest | scheduled | weekly | `INFORMATIONAL` | states gaps; never interpolates |
| Meaningful-change alert | change engine, L3 | ≤1/week steady state | `ACTION_REQUIRED` | not generated |
| Routine deviation | 3-day rule | as arising | `REVIEW_WHEN_CONVENIENT` | not generated |
| Activity participation | scheduled | weekly | `INFORMATIONAL` | "quiet week — limited data" |
| Assistance-needed insight | support-need engine | as arising | `ACTION_REQUIRED` | not generated |
| Behavioural-context insight | Contextual Behaviour Support | as arising | `ACTION_REQUIRED` | possible contributors listed *with* the "no data on" list |
| **Measurement action** | MQE gate failure | as arising | `INFORMATIONAL` | *this is itself the insufficiency output* |
| Safety alert | deterministic rules | as arising | `URGENT` / `EMERGENCY` | fires regardless — safety rules do not require evidence sufficiency |
| Escalation notification (L4/L5) | ladder | as arising | `URGENT`, budget-bypassing | fires |
| Upcoming care task | care plan | daily | `INFORMATIONAL` | — |
| Missed routine | routine engine | as arising | `REVIEW_WHEN_CONVENIENT` | — |
| Consult preparation pack | caregiver request / appointment | on demand | `INFORMATIONAL` | pack states its own gaps prominently |
| **"Nothing needs attention"** | absence of the above | daily | `NO_NOTIFICATION` | **is** the output |

### C2.4 Copy discipline

Second person, plain language, her mother's name and honorific. No clinical register. No hedging so heavy it becomes useless. Never "the patient". Never "detected an anomaly". Never a percentage without its instrument.

---

## C3. The CHW's experience

### C3.1 Visit-centric, not dashboard-centric

The CHW home is a **queue with reasons and time estimates**, not analytics.

```
┌────────────────────────────────────────────────────────┐
│  CASELOAD — Mawlai                    ◱ synced 2 h ago │
│                                       4 households · ~34 min│
│────────────────────────────────────────────────────────│
│  NEEDS A VISIT                                         │
│                                                        │
│  ▸ Mrs. Lyngdoh                              ~10 min   │
│    Sleep and activity below her usual for 6 days.      │
│    Family has not opened the app in 5 days.            │
│    Check: comfort · hearing aid · medicine list        │
│                                                        │
│  ▸ Mr. Sangma                                 ~8 min   │
│    One fall reported last week, no injury.             │
│    Check: home hazards (checklist ready) · balance     │
│                                                        │
│  ROUTINE                                     ~16 min   │
│  ▸ 2 households — confirm medicines, 3 wellbeing Qs    │
│────────────────────────────────────────────────────────│
│  ⬤ 3 sealed records waiting to upload                  │
└────────────────────────────────────────────────────────┘
```

### C3.2 Rules

- **Prioritised by need, never by anything else.** No sorting by name, recency, or engagement.
- **≤5 flagged households per cycle** (the attention budget), rendered as a fact, not enforced silently.
- **Every item carries a time estimate**, and the screen totals them against the CHW's stated available time.
- **Every flag carries its reason and its confidence** in one line — she must never have to open a screen to learn why a household is flagged.
- **Low-bandwidth first:** text before images; images only on demand; no charts on the caseload; assets cached.
- **Offline is normal, not an error.** A stale cache renders with a calm sync-age chip, never a red banner. Work continues; records queue.
- **Sync state is always visible** and always specific ("3 sealed records waiting"), never a spinner.
- **No typing paragraphs.** Structured taps, chips, and voice notes.
- The CHW is **never asked for a clinical judgement**. Escalation is "route this to a CHO / book a teleconsult", never "is this dementia progressing?".

### C3.3 The visit workflow

```
PREPARE (before knocking)      → what changed · what to check · what I promised last time
DURING  (guided, ≤10 min)      → observation script · comfort/sensory screen · medicine confirm
                                  · caregiver wellbeing (3 questions) · one open voice note
AFTER   (automatic)            → structured summary generated; no re-entry
DECIDE                         → close · follow up · escalate/refer  (with the packet pre-built)
SYNC                           → queued, sealed, uploaded at coverage
```

A visible **elapsed-time indicator** runs during the visit — supportive, not punitive: it helps her hold the ten-minute budget she is accountable for.

### C3.4 The CHW report family

| Report | Trigger | Delivery class | Insufficient evidence → |
|---|---|---|---|
| Visit-preparation brief | scheduled visit / queue entry | `INFORMATIONAL` | states what is unknown; suggests what to ask |
| Household status | on open | `NO_NOTIFICATION` | — |
| Changes since last visit | change engine | `INFORMATIONAL` | "no reliable data since last visit" (an actionable finding in itself) |
| Function / routine summary | scheduled | `NO_NOTIFICATION` | — |
| Caregiver support signal | consented wellbeing responses only | `REVIEW_WHEN_CONVENIENT` | not generated |
| Unresolved needs | follow-up register | `INFORMATIONAL` | — |
| Behaviour context summary | Contextual Behaviour Support | `INFORMATIONAL` | contributors + explicit gaps |
| Participation summary | activity engine | `NO_NOTIFICATION` | — |
| Follow-up checklist | visit close | `INFORMATIONAL` | — |
| Referral / escalation suggestion | ladder L4 | `ACTION_REQUIRED` | not generated |
| Clinical communication packet | CHW decision | on demand | packet carries its own confidence line |
| Visit outcome update | visit close | `NO_NOTIFICATION` | — |
| **Household flag (L5)** | delirium / safety rule | `URGENT`, bypassing | fires |

---

## C4. The clinician's experience

### C4.1 Evidence-first, drill-down always downward

The clinician's entry point is the **Since Last Review** artefact — never a table, never a chart wall, never raw telemetry.

```
┌──────────────────────────────────────────────────────────────────┐
│  SINCE LAST REVIEW — Mrs. B.            12 weeks · prepared 8 Sep │
│                                          data as of 8 Sep 09:40  │
│──────────────────────────────────────────────────────────────────│
│  WHAT THIS IS NOT                                                │
│  Not a diagnosis · not a stage · not a cognitive test score       │
│──────────────────────────────────────────────────────────────────│
│  FUNCTION                                     informant + observed│
│    IADL  money handling now needs help        new since ~Jul  ▸  │
│    ADL   independent; dressing order prompted                 ▸  │
│                                                                  │
│  COGNITIVE / BEHAVIOURAL PATTERN                                 │
│    Repeated questions   1–2/day → 5–7/day     caregiver+system ▸ │
│    Orientation events   0 → 3                 system           ▸ │
│    Activity             ↓ ~25% vs own baseline session data    ▸ │
│    Sleep interruptions  1 → 3/night (3 wks)   caregiver log    ▸ │
│                                                                  │
│  CONTEXT / POSSIBLE CONFOUNDERS                                  │
│    New antihypertensive 12 Aug           caregiver-reported    ▸ │
│    Hearing aid unused since ~Jul         → measurement reduced ▸ │
│    Daughter travelled 1–14 Aug           routine disruption    ▸ │
│                                                                  │
│  MEASUREMENT CONFIDENCE   ◒ moderate                             │
│    6 of 14 sessions low audio — affects the performance figures  │
│                                                                  │
│  NOT KNOWN                                                       │
│    bowel pattern · temperature · urinary symptoms · dental pain   │
│                                                                  │
│  QUESTIONS PREPARED BY THE FAMILY                            (4) ▸│
│──────────────────────────────────────────────────────────────────│
│  [ accept ]   [ correct ]   [ annotate ]      [ evidence ▸ ]     │
└──────────────────────────────────────────────────────────────────┘
```

### C4.2 The drill-down contract

```
SUMMARY  →  CHANGE  →  EVIDENCE  →  CONTEXT  →  SOURCE  →  RAW OBSERVATION
```

Five levels, always in this order, always available, **never required**. The clinician is never forced to inspect raw data to understand the longitudinal story — but can always reach it in five taps, and every level shows its provenance.

### C4.3 Rules

- **Never a fused score.** Modalities stay separate, separately labelled, separately uncertain (Blueprint App. D.3). Direction + magnitude + confidence + what is missing — never one number.
- **Confounders appear before conclusions**, on the same screen, at the same weight.
- **Contradictions are shown, never resolved silently.** Where caregiver report and telemetry disagree, both are presented with provenance and the disagreement is named.
- **Missingness is content.** "Not known" is a rendered section, not an omission.
- **"What this is not" is a fixed component** at the top of every clinical artefact.
- **Annotation is first-class.** Accept / correct / annotate is always in reach; a correction becomes a new highest-authority observation and never edits the derived record.
- **No notifications below L5.** The clinician's caseload updates silently; a clinical inbox is not a place to spend an alert budget.

### C4.4 The clinical report family

| Report | Trigger | Delivery class | Insufficient evidence → |
|---|---|---|---|
| Since-last-review summary | review scheduled / clinician opens | `NO_NOTIFICATION` | renders with an explicit low-confidence banner and a gaps section |
| Longitudinal clinical bridge pack | consult prep | on demand | same |
| Meaningful-change summary | change engine | `NO_NOTIFICATION` | not generated; the gap is stated instead |
| **Measurement-quality report** | always attached | `NO_NOTIFICATION` | *is* the insufficiency output |
| Functional trajectory | scheduled | `NO_NOTIFICATION` | trend suppressed below n; "insufficient observations" shown |
| Behaviour & context summary | Contextual Behaviour Support | `NO_NOTIFICATION` | contributors + "no data on" list |
| Intervention/activity exposure | scheduled | `NO_NOTIFICATION` | — |
| Adherence/support context | routine confirmations | `NO_NOTIFICATION` | confirmation ≠ completion, disclosed on the view |
| Caregiver observations | informant entries | `NO_NOTIFICATION` | labelled informant-only |
| CHW observations | visit records | `NO_NOTIFICATION` | — |
| **Contradictions register** | conflict detection | `NO_NOTIFICATION` | — |
| Confidence & provenance summary | always attached | `NO_NOTIFICATION` | — |
| Unresolved questions | completeness check | `NO_NOTIFICATION` | — |
| Timeline | on demand | `NO_NOTIFICATION` | — |
| Clinician annotation record | clinician action | `NO_NOTIFICATION` | — |
| **L5 clinical relevance** | delirium / acute change | `URGENT`, bypassing | fires |

---
---

# PART D — THE REPORT VISUAL GRAMMAR

Every derived statement in MindMitra — caregiver alert, CHW brief line, clinical finding — renders through **one component family** so that a reader learns the grammar once and can then read any output anywhere.

## D1. The Evidence Block

The canonical component. Six slots, fixed order, each visually distinct. Slots with no content are **omitted, never faked**.

```
┌─────────────────────────────────────────────────────────────┐
│ ▌ FACT                                                      │  left rule, ink
│   Five orientation difficulties were recorded over 14 days.  │  strongest weight
│                                                             │
│   SOURCE   3 activity sessions · caregiver observation      │  small caps, muted
│   WHEN     26 Aug – 8 Sep                                   │
│   CONFIDENCE  ◒ Moderate                                    │  glyph + word
│─────────────────────────────────────────────────────────────│
│ ▌ CONTEXT                                                   │  left rule, muted
│   4 of the observations occurred after the evening routine   │
│   changed on 26 August.                                     │
│─────────────────────────────────────────────────────────────│
│ ▌ POSSIBLE EXPLANATION                                      │  left rule, dashed
│   This may be associated with the routine change.           │  italic-adjacent
│   ⓘ This is not a diagnosis.                                │  fixed component
│─────────────────────────────────────────────────────────────│
│ ▌ WHAT WE DON'T KNOW                                        │  optional
│   No information about sleep quality in this period.        │
│─────────────────────────────────────────────────────────────│
│ ▌ ACTION                                                    │  left rule, action tone
│   Consider discussing the recent routine change at the next  │  bounded, concrete
│   care interaction.                                          │
└─────────────────────────────────────────────────────────────┘
                                          [ Why am I seeing this? ]
```

### D1.1 Mapping to the three-layer contract

| Contract layer | Evidence Block slots | Visual treatment |
|---|---|---|
| **FACT** | FACT + SOURCE + WHEN + CONFIDENCE | Solid left rule, ink colour, heaviest weight. Never rendered without a source. |
| **HYPOTHESIS** | CONTEXT + POSSIBLE EXPLANATION + WHAT WE DON'T KNOW | **Dashed** left rule, muted colour, lighter weight. Always carries the disclaimer component. |
| **ACTION** | ACTION | Solid left rule in the action tone, with affordances attached. |

**The visual difference between fact and hypothesis is structural, not decorative.** A reader must be able to tell them apart at a glance, without reading — that is the anti-hallucination control expressed in the interface.

### D1.2 Hard rules

1. A FACT slot **cannot render** without SOURCE and WHEN. The component throws in development and withholds in production.
2. A POSSIBLE EXPLANATION slot **cannot render** without the disclaimer component.
3. Confidence is **never** a bare percentage. Word + glyph, with the reason one tap away.
4. Register varies by role; **the facts do not**. The same underlying fact may be phrased for a caregiver or a clinician, but never restated with a different value.
5. Every block is one tap from **"Why am I seeing this?"** (E5.2).

## D2. Confidence, provenance and uncertainty semantics

### D2.1 Confidence

Three levels only. More granularity implies precision we do not have.

| Level | Glyph | Word | Meaning | Treatment |
|---|---|---|---|---|
| High | ● | High | Multiple trustworthy sources; quality gates passed | Full weight |
| Moderate | ◒ | Moderate | Adequate but caveated (fewer observations, one quality flag) | Full weight + reason shown |
| Low | ○ | Low | Present but weak | **Hedged copy**; the reason is shown inline, not on demand |
| — | ⊘ | Insufficient | Below the measurement gate | **The claim is not made at all**; see D4 |

Colour is **never** the only carrier — glyph and word always accompany it (G1).

### D2.2 Provenance

Every fact carries a source chip. Chips are typographic, not colourful — they inform, they do not decorate.

| Source | Chip | Assertion right |
|---|---|---|
| Person-stated | `she said` | Authoritative about her own life |
| Caregiver-reported | `family` | Reported — hedged unless confirmed |
| CHW-observed | `health worker` | Observed |
| Clinician-verified | `clinician` | **Highest authority**; asserted plainly |
| System-observed | `activity` / `routine` | Observed, quality-gated |
| Document-derived | `record` | Reported or verified |
| AI-inferred | `suggested` | **Never asserted as fact.** Always hedged, always labelled. |

**`verification_status` drives the copy, not just the chip.** A `reported` fact renders as "Anu reported that…", never as "She…". This is enforced in the component, so an unhedged unverified claim cannot be rendered.

### D2.3 Uncertainty in copy

| Situation | Rendered as |
|---|---|
| Verified, high confidence | Plain declarative |
| Reported, unconfirmed | "Anu reported that…" |
| Two sources disagree | Both statements, both chips, plus "These accounts differ." **Never a merged sentence.** |
| Inferred | "This may be…" + `suggested` chip + disclaimer |
| Unknown | An explicit "What we don't know" slot |
| Cannot be measured | D4 |

## D3. "This is not a diagnosis"

A **component**, not a sentence someone remembered to type.

```
ⓘ This is not a diagnosis.
```

- Attached automatically to every HYPOTHESIS-layer slot, every behavioural-contributor list, and every clinical artefact header ("What this is not: not a diagnosis · not a stage · not a cognitive test score").
- Rendered in the muted tone at the same size as the body — **never** as fine print, never dismissible, never collapsed.
- Never styled as a warning (no red, no ⚠). It is a statement of scope, not a hazard.
- The clinical variant is a fixed block at the **top** of the artefact, above the findings, because it frames how everything below is read.

## D4. Refusal, insufficiency and human-review states

These are the states most products hide. In MindMitra they are the states that earn trust, so they are designed with the same care as the success path.

### D4.1 Measurement insufficiency (the signature state)

When `q < q_min`, the system **refuses to score, and says why**. This is rendered as a first-class, calm, non-alarming panel — not an error.

```
┌─────────────────────────────────────────────────────────┐
│ ⊘  We are not able to measure this reliably             │
│                                                         │
│    The last 6 sessions had very low audio, and the      │
│    hearing aid appears to have been unused since July.  │
│                                                         │
│    Performance information is on hold until this is      │
│    checked. This is not a sign of decline.              │
│                                                         │
│    WHAT WOULD HELP                                      │
│    Check whether the hearing aid is working and in use.  │
│                                                         │
│                       [ Mark as checked ]  [ Ask a CHW ]│
└─────────────────────────────────────────────────────────┘
```

**Tone rules:** neutral, never red, never an error icon, never "failed". The explicit sentence *"This is not a sign of decline"* is required — without it, the refusal reads as bad news.

### D4.2 Refusal (the system declining to answer)

Used for diagnosis requests, medication advice, and ungrounded claims.

```
I can't answer that — I don't diagnose, and nothing here should be
read as a conclusion about a condition.

What I can give you is what changed and what might explain it.

                                     [ Show what changed ]
```

Rules: state the boundary in one sentence; **never apologise repeatedly**; always offer the nearest thing the system *can* do; never explain the refusal in terms of model limitations or policy. On a crisis trigger, the refusal is replaced by the crisis path (E6.9).

### D4.3 Human review pending

For anything L4/L5 or low-confidence that requires a person before it is acted on.

```
◐ Waiting for a health worker to review
  Sent 8 Sep 14:20 · Mrs. Ban (ASHA, Mawlai)
  You do not need to do anything yet.
```

The last line is required. A pending state that leaves the reader uncertain whether to act has failed.

---
---

# PART E — CROSS-CUTTING UX SYSTEMS

## E1. Real-time event UX

The five mechanisms of `tech-stack.md` §23 have five different visual consequences. Conflating them is the most common way to build an alert firehose.

| Mechanism | Visual consequence |
|---|---|
| 1 · Data sync | **Nothing visible** except the sync-age chip updating. No badge, no toast, no sound. |
| 2 · Model sync | **Nothing visible.** Ever. |
| 3 · Insight generation | A quiet "new digest available" affordance **on the relevant screen only** — never a global badge. |
| 4 · Notification | A single, dismissible, role-appropriate notification, ranked by delivery class. |
| 5 · Escalation (L4/L5) | Full-attention treatment: persistent, undismissible until acknowledged, sound + push, simultaneous to all named recipients. |

**The rule, rendered:** a view becoming fresh is *not* an event. If the caregiver has the screen open when a state update arrives, the content updates in place with a brief, low-contrast "updated just now" — no motion, no highlight flash, no reflow that moves what they are reading.

## E2. Notification and alert UX

### E2.1 One treatment per delivery class

| Class | Treatment | Sound | Persists | Dismissible |
|---|---|---|---|---|
| `EMERGENCY` | Full screen, emergency card, all contacts simultaneously | yes | until resolved | no |
| `URGENT` | Banner + push, top of every screen | yes | until acknowledged | no |
| `ACTION_REQUIRED` | One action card on Today; one push | no | until acted or dismissed | yes |
| `REVIEW_WHEN_CONVENIENT` | Appears in the next digest / visit prep / review pack | no | until read | yes |
| `INFORMATIONAL` | Available on pull; the view updates silently | no | n/a | n/a |
| `NO_NOTIFICATION` | Nothing is rendered anywhere | no | n/a | n/a |

### E2.2 Rules

- **The person's surface has no notification system.** No badges, no counts, no inbox. Reminders arrive as spoken, contextual moments in the flow of the day, never as an alert.
- **Alerts are never stacked.** If two `ACTION_REQUIRED` items exist, the policy defers one. The interface never shows a list of alerts on the home screen.
- **Every alert carries its evidence in one tap** and its three responses (*Useful · Expected, there was a reason · Not useful*) inline.
- **Suppressed items are visible on demand**, in the digest, under a neutral heading ("Also noticed, no action needed"). Never hidden; never promoted.
- **Red is reserved.** Only `EMERGENCY` and `URGENT` use the danger tone. An `ACTION_REQUIRED` card uses the attention tone (amber), and an `INFORMATIONAL` item uses ink on paper.
- **No badge counts anywhere in the product.** A count invites completionism, which is the opposite of an attention budget.

## E3. Action-card UX

An action card is the only component that asks a human to do something.

```
┌─────────────────────────────────────────────────────────┐
│ ▲  Worth your attention                     8 Sep 14:20 │
│                                                         │
│    Activity and sleep have both been below her usual    │
│    pattern for 3 days.                                  │
│    activity · your notes      ◒ Moderate confidence     │
│                                                         │
│    Possible contributors: sleep disruption; the routine │
│    change since Monday.  ⓘ This is not a diagnosis.     │
│                                                         │
│    WHAT YOU CAN DO NOW                                  │
│    • Check comfort: pain, thirst, toilet, warmth        │
│    • Keep this evening quiet and low-light              │
│    • Call Rina before dinner — she asked 6 times today  │
│                                                         │
│    If this continues past Thursday, or worsens          │
│    suddenly, contact the AAM.                           │
│                                                         │
│  [ Why am I seeing this? ]                              │
│  [ Useful ]  [ Expected — there was a reason ]  [ Not ] │
└─────────────────────────────────────────────────────────┘
```

**Rules:** ≤3 actions, each concrete and immediately doable; a "when to escalate" line always present; feedback always attached; the card is dismissible and its dismissal is recorded, not lost.

## E4. Timeline UX

- **Time flows downward**, newest first, grouped by day then week.
- Every entry carries a source chip and, where relevant, a confidence glyph.
- **Gaps are drawn.** A period with no data renders as an explicit "no data 1–11 Sep — connectivity" band, never as a smooth line through the gap. Interpolation across a gap is banned.
- Clinician timeline supports filtering by source and by domain; caregiver timeline does not filter, it summarises.
- Annotations by a clinician appear inline at their date, visually distinct as the highest-authority entry.

## E5. Consent, Memory Firewall and privacy UX

### E5.1 Consent

- **Per-purpose, plainly named:** activities · memory · location · clinical sharing · research. Each independently revocable, each in the person's language, each with a plain sentence saying what it enables and what it does not.
- **Revocation is one action, always available, never buried, never guilt-tripped.** No "are you sure you want to lose these benefits?" dark pattern.
- **Capacity-aware:** where capacity fluctuates, scope escalations re-ask; where capacity is lost, proxy consent renders with a visible constraint ("as her proxy, you cannot widen this beyond what she previously agreed") and sensitive scope expansion requires the **two-key** flow (proxy + CHW/clinician), rendered as two named signatures, not a checkbox.
- **The person's veto is absolute and always honoured** — "don't show me this" works at every capacity level, from any screen, immediately.

### E5.2 "Why am I seeing this?"

One tap from every alert, insight and report. Shows an **evidence summary, never a reasoning transcript** — a model's internal deliberation would be both misleading and unverifiable.

```
WHY THIS ALERT

Three independent observations:
  • activity below her own 14-day pattern (3 days running)   activity
  • sleep interruptions up from ~1 to ~3 per night           your notes
  • you reported she seemed withdrawn on 6 Sep               your notes

Measurement confidence: ● good (audio and language checks passed)

Nothing here indicates an emergency.

[ This was expected — there was a reason ]  [ Useful ]  [ Not useful ]
```

### E5.3 "Who can see this?"

Available on every piece of person data, for the person and the caregiver. Renders the actual Firewall decision — role, purpose, and the guard that applies — in plain language:

> *Her life-story photos: you and Rina can see these. The health worker and the doctor cannot.*
> *Her private notes: only she can see these.*
> *Her location: nobody, unless there is an active safety event — and then it is recorded.*

### E5.4 Audit visibility

The person and a designated second family member can see the access log **in plain language**, not as a technical log: *"8 Sep, 14:20 — Anu opened today's summary."* Scope-expansion attempts appear here prominently. This is a safeguarding mechanism rendered as a product feature.

### E5.5 Privacy as a designed promise

The "what is never collected" statement appears in the product, not only on the public site: **no continuous recording, no video, no financial data, no routine location.** Stated affirmatively, in the person's and caregiver's own surfaces, once, where it is relevant.

## E6. The complete state catalogue

Every screen implements every applicable state. A screen with only a success state is unfinished.

| # | State | Treatment |
|---|---|---|
| **1** | **Loading** | Skeletons that match the final layout so nothing jumps. Never spinners on the person's surface. Never a blocking overlay. After 3 s, say what is being fetched. |
| **2** | **Empty — nothing yet** | Explains what will appear and how it gets there. Never an illustration with a joke. Person surface: an offer, not an explanation. |
| **3** | **Empty — nothing to report** | **A positive, designed state.** "Doing well. Nothing needs your attention." Same weight as an alert. Never a grey "no data" box. |
| **4** | **Insufficient data** | D4.1. Neutral, explained, with a "what would help" action. Never red. |
| **5** | **Offline** | Calm chip, not a banner. Content renders from cache with its sync age. The person's surface degrades **silently** — she is never told the network is down. CHW surface says exactly what is queued. |
| **6** | **Stale / sync age** | Always visible on caregiver, CHW and clinical views: "data as of 12 min ago" / "11 days — gaps present, interpret with care". Never hidden when fresh. |
| **7** | **Syncing** | Specific and countable ("3 of 7 records uploaded"), never an indeterminate spinner. |
| **8** | **Conflict** | Both versions, both sources, both timestamps, side by side, with "These accounts differ" and a route to human verification. **Never auto-resolved for clinical facts.** |
| **9** | **Error — recoverable** | Plain sentence, one retry, one alternative. Never a code. Never "something went wrong". |
| **10** | **Error — unrecoverable** | What failed, what still works, who to contact. On the person's surface: never shown; fall back to the last good state and offer "talk to me". |
| **11** | **Permission denied** | The destination does not exist (B2). Where the reader would expect it, a neutral one-line explanation, never a list of what is hidden. |
| **12** | **Safety — active** | L4/L5 treatment: persistent, undismissible, all named recipients, the emergency/safe-return card reachable in one tap from any screen. |
| **13** | **Escalation in progress** | Who has been told, when, what they are doing, what is expected next. Removes the caregiver's uncertainty, which is itself the harm. |
| **14** | **Human review pending** | D4.3, including "you do not need to do anything yet". |
| **15** | **Refusal** | D4.2. |
| **16** | **Withheld by consent** | "Some information is not shared for this purpose." No detail, no count, no inference about what is missing. |
| **17** | **Expired** | A projection past `valid_until` is not shown as current. It moves to history with its date, or is regenerated. |
| **18** | **Revoked** | A projection whose evidence was revoked disappears from the view; the audit persists. No tombstone that leaks the content. |

---
---

# PART F — THE DESIGN SYSTEM: BRAHMAPUTRA MIST & LIVING SILK

The design system embodies a serene, dignified, and culturally grounded sanctuary tailored for cognitive wellness, elder accessibility, and dementia-informed care in the North Eastern Region (NER). Drawing inspiration from Northeast India—the slow mist over the Brahmaputra, the structured calm of lush tea terraces, and the enduring warmth of handloomed raw silks—the visual philosophy balances clinical clarity with profound emotional safety.

```yaml
name: Brahmaputra Mist & Living Silk
colors:
  surface: '#fef9f0'
  surface-dim: '#ded9d1'
  surface-bright: '#fef9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ea'
  surface-container: '#f2ede4'
  surface-container-high: '#ece8df'
  surface-container-highest: '#e7e2d9'
  on-surface: '#1d1c16'
  on-surface-variant: '#424843'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f5f0e7'
  outline: '#727972'
  outline-variant: '#c2c8c1'
  surface-tint: '#466550'
  primary: '#032212'
  on-primary: '#ffffff'
  primary-container: '#1a3826'
  on-primary-container: '#81a28a'
  inverse-primary: '#adcfb5'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#321500'
  on-tertiary: '#ffffff'
  tertiary-container: '#4d290b'
  on-tertiary-container: '#c48f69'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8ebd1'
  primary-fixed-dim: '#adcfb5'
  on-primary-fixed: '#022111'
  on-primary-fixed-variant: '#2f4d3a'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#f5ba92'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#653d1e'
  background: '#fef9f0'
  on-background: '#1d1c16'
  surface-variant: '#e7e2d9'
typography:
  headline-xl:
    fontFamily: Merriweather
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Merriweather
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Merriweather
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.005em
  headline-lg-mobile:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: 0em
  headline-md:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Merriweather
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: 0em
  body-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 2rem
  touch-target-min: 3.5rem
```

## F1. Brand & Style Foundations

### Aesthetic Movement
- **Tactile Organic Warmth & Frosted Serenity:** Soft, warm paper/silk surfaces layered with delicate, non-disorienting translucent overlays.
- **Biophilic Clarity:** Natural earthen tones that lower cortisol, paired with deliberate contrast to ensure immediate legibility for aging eyes.
- **Elder-Centric Dignity:** Devoid of clinical sterility or condescending playfulness. Every touch target, visual signpost, and typographic cadence treats the user with timeless respect and reassuring calm.

### Primary Palette
- **Deep Tea Moss (`#1A3826` / `primary-container`):** Primary brand anchor. Used for primary interactive actions, key active boundaries, and high-emphasis serif typography. Grounding, authoritative, yet natural.
- **Valley Moss (`#2D5A3F` / `surface-tint`):** Secondary botanical green. Utilized for secondary action states, progressive indicators, and stable positive feedback states.
- **Forest Midnight (`#032212` / `primary`):** Deep grounding text and dark-surface primary tone.

### Accent & Warmth
- **Morning Amber (`#D97706` / `#904D00` / `secondary`):** Primary accent. Used sparingly for high-salience focus rings, primary highlights, milestones, and gentle prompts requiring elder attention without alarm.
- **Sunlight Gold (`#F59E0B` / `#FE932C` / `secondary-container`):** Warm morning glow. Employed in subtle gradient blends, warm badge backgrounds, and supportive celebratory moments.
- **Earthen Clay (`#8C5E3C` / `#4D290B` / `tertiary-container`):** Earth tone for secondary context markers, gentle category dividers, and auxiliary supporting graphics.

### Neutrals & Surfaces
- **Muga Silk Cream (`#FEF9F0` / `#FBF9F4` / `surface`):** Default ambient background evoking unbleached raw silk and warm handmade parchment. Eliminates the blinding glare of pure `#FFFFFF`.
- **Raw Cotton Surface (`#F8F3EA` / `#F4EFE6` / `surface-container-low`):** Primary container surface and card background, offering gentle separation from the ambient canvas.
- **River Stone Border (`#C2C8C1` / `#E3DBCF` / `outline-variant`):** Tactile outline color providing clear structural boundary definition without stark, sharp harshness.
- **Serene Night Slate (`#1D1C16` / `#0F172A` / `on-surface`):** Core text color. Deep ink slate providing >13.5:1 contrast against `#FEF9F0`, offering superior reading comfort over harsh solid black.
- **Muted Slate Ink (`#424843` / `#475569` / `on-surface-variant`):** Secondary metadata, instructions, and passive supportive labeling.

## F2. Typography

The typographic hierarchy is intentionally structured with generous proportions, generous vertical rhythm, and humanist cadence to accommodate age-related macular degeneration, presbyopia, and processing slowdowns.

- **Headings (Merriweather):** Chosen for sturdy, open letterforms, pronounced serifs, and high x-height. Conveys the grounding dignity of traditional literary forms and oral storytelling traditions.
- **Body Text (Plus Jakarta Sans):** Selected for clear humanist geometry, spacious counters, and wide character spacing, preventing letters from crowding together during sustained reading.
- **Labels & Functional Controls (Inter):** Utilitarian and unambiguous; distinguishes numbers, field tags, and directional cues clearly without visual fatigue.

## F3. Layout, Spacing & Elevation

- **Touch Targets:** Absolute minimum touch target height and width of `56px` (`3.5rem` / `touch-target-min`) for interactive buttons, radio options, and navigation elements to accommodate fine-motor tremor and joint stiffness.
- **Gutters:** `1rem` on mobile, `2rem` on desktop.

### Surface Tiers
- **Tier 0 (The Living Ground):** Muga Silk Cream (`#FEF9F0`) with a continuous micro-texture of woven fiber, establishing warmth.
- **Tier 1 (Resting Cards & Canvas Panels):** Raw Cotton (`#F8F3EA` / `#F2EDE4`) framed by a subtle, tactile outline (`1.5px` solid `#C2C8C1`). Shadows are diffused ambient blooms: `0 6px 20px -4px rgba(26, 56, 38, 0.06), 0 2px 6px -1px rgba(26, 56, 38, 0.04)`.
- **Tier 2 (Interactive Modules & Floating Headers):** Frosted Muga Glass (`rgba(254, 249, 240, 0.90)` with `backdrop-filter: blur(12px)`), bounded by `1px solid rgba(194, 200, 193, 0.8)`. Shadow: `0 12px 28px -6px rgba(29, 28, 22, 0.08)`.
- **Tier 3 (Modals & Guidance Overlays):** Solid Raw Cotton base with `0 24px 48px -12px rgba(29, 28, 22, 0.16)`. Backdrop overlay is a deep dawn-mist wash: `rgba(29, 28, 22, 0.45)` with `backdrop-filter: blur(6px)`.

## F4. Components

### 1. Buttons
- **Primary Action (Botanical Solid):**
  - **Height:** Minimum `56px`.
  - **Background:** Deep Tea Moss (`#1A3826`), transitioning on hover/press to Forest Midnight (`#032212`).
  - **Typography:** `label-lg`, pure white (`#FFFFFF`), with an accompanying clear directional icon.
  - **Focus State:** `3px` solid Morning Amber (`#D97706`) with a `2px` offset.
- **Secondary Action (Outlined Cotton):**
  - **Height:** Minimum `56px`.
  - **Surface:** Transparent or Raw Cotton (`#F8F3EA`), `2px` solid border in Deep Tea Moss (`#1A3826`).
  - **Typography:** `label-lg`, Deep Tea Moss (`#1A3826`).

### 2. Selection Cards (Radio / Checkbox Groups)
- **Role:** Central to onboarding questions (e.g., identifying relation, language preferences, cognitive baseline).
- **Structure:** Full-width card with minimum height of `64px`, featuring `16px` padding.
- **Inactive State:** Background `#F8F3EA`, border `1.5px solid #C2C8C1`, text `#1D1C16`.
- **Selected State:** Background `rgba(26, 56, 38, 0.06)`, border `2.5px solid #1A3826`. Accompanied by a large `24px` filled selection glyph containing a checkmark in Morning Amber (`#D97706`).

### 3. Text Inputs & Form Fields
- **Height:** `60px` input area with high-legibility `body-lg` text.
- **Labels:** Always permanently visible above the field set in `label-lg` Serene Night Slate (`#1D1C16`).
- **Supportive Hint Text:** Positioned below the input in `body-md` Muted Slate Ink (`#424843`).
- **Border:** `2px solid #C2C8C1`. On focus: `2.5px solid #1A3826` and soft Amber aura (`0 0 0 4px rgba(217, 119, 6, 0.15)`).

### 4. Progress Stepper (Mist & River Milestones)
- **Layout:** Horizontal indicator with generous milestone nodes (`36px` diameter).
- **Completed Nodes:** Deep Tea Moss (`#1A3826`) with solid white checkmarks.
- **Active Node:** Morning Amber (`#D97706`) surrounded by an illuminated pulse ring (`rgba(217, 119, 6, 0.25)`).
- **Connecting Lines:** `4px` thickness, filled with Valley Moss for finished milestones and `#C2C8C1` for upcoming ones.

### 5. Memory & Familiarity Anchor Cards
- **Role:** Specialized cards showcasing cultural, regional, or familial prompts to reduce disorientation.
- **Styling:** Gentle Raw Cotton (`#F8F3EA`) surface wrapped with an inner border of woven earthen clay (`#8C5E3C` at 20% opacity), paired with an audio playback button (`56px` circular) to read prompts aloud in regional vernaculars.

```
--status-ok         success #16a34a   ●  "Doing well"      — reassurance
--status-attention  warning #d97706   ▲  "Worth knowing"   — ACTION_REQUIRED
--status-urgent     danger  #dc2626   ⬤  "Needs attention today" — URGENT/EMERGENCY only
--status-neutral    stone.500         ○  "Informational"
--status-insufficient stone.400       ⊘  "Not measurable"  — never red
--status-pending    teal.600          ◐  "Waiting for review"
```

**Red is reserved for `URGENT` and `EMERGENCY`.** Nothing else in the product is red — not errors, not validation, not insufficiency, not a low score (which does not exist).

### F2.5 Confidence semantics

```
--confidence-high      ● text-primary
--confidence-moderate  ◒ text-secondary
--confidence-low       ○ text-muted        + mandatory inline reason
--confidence-none      ⊘ status-insufficient + the claim is not rendered
```

## F3. Typography

| Role | Family | Notes |
|---|---|---|
| Primary UI + content | A humanist sans with full **Devanagari, Bengali–Assamese, Latin** coverage (Noto Sans family as the baseline) | Script coverage is a hard requirement, not a preference |
| Numerals | Tabular lining figures in all data contexts | Columns must align |
| Clinical data | Same family, tabular, tighter measure | No second family; density comes from spacing, not typeface |

**Scale** (ratified from tokens): `xs 14 · sm 16 · base 18 · lg 20 · xl 24 · 2xl 30 · 3xl 36 · 4xl 48`.

| Surface | Body | Primary action | Measure |
|---|---|---|---|
| Person | `xl` 24px | `2xl` 30px | ≤ 40 characters |
| Caregiver | `base` 18px | `lg` 20px | ≤ 65 characters |
| CHW | `base` 18px | `lg` 20px | ≤ 60 characters |
| Clinician | `sm` 16px | `base` 18px | ≤ 80 characters |
| Public | `lg` 20px | `xl` 24px | ≤ 70 characters |

**Rules:** line-height 1.6 for body, 1.25 for display. Never justify. Never letterspace lowercase body. Small caps + letterspacing only for metadata labels (SOURCE, CONFIDENCE). **Weight, size and space create hierarchy — colour does not.**

## F4. Space, radius, elevation

**Space:** a 4px base scale (4·8·12·16·24·32·48·64·96). Vertical rhythm is generous on the person's surface (32–48px between blocks) and tighter on the clinical surface (16–24px). Whitespace is the primary hierarchy tool.

**Radius:** `md` (12px) for cards, `sm` (6px) for chips and inputs, `full` only for avatars and the person's circular action buttons. **No nested rounding** — a rounded card does not contain rounded cards.

**Elevation:** four levels, and shadows are *soft and warm*, never blue-black.
```
0  flat            no shadow           default; most of the product
1  raised          0 1px 2px /6%       cards
2  overlay         0 4px 12px /8%      sheets, popovers
3  modal           0 12px 32px /12%    dialogs, emergency
```
**No glassmorphism, no blur, no glow, no coloured shadows, ever.**

## F5. Motion

**Motion must aid comprehension or orientation. Otherwise it is deleted.**

| Permitted | Duration | Purpose |
|---|---|---|
| Enter/exit of a sheet or dialog | `base` 250ms | Spatial orientation — where did this come from |
| Content substitution (fade) | `fast` 150ms | Avoid a jarring swap |
| Progress within an activity | `base` | Show the shape of the task |
| Confirmation of a tap | `fast` | Feedback that the tap registered |

| Banned |
|---|
| Decorative loops, particles, blobs, parallax |
| Attention-seeking pulse, shimmer, glow |
| Layout animation that moves text the user is reading |
| Anything over 400ms |
| Any motion at all on the person's surface beyond tap feedback and simple page transitions |

`prefers-reduced-motion` is respected as an **equal-quality path**, not a degraded one: transitions become instant, nothing is lost, no functionality depends on animation. For this population, reduced motion is closer to the default than the exception.

## F6. Icons, illustration, photography

**Icons:** one set, outline, 2px stroke, 24px grid; 32px on the person's surface. **Every icon is paired with a text label** on the person's, caregiver's and CHW's surfaces — an icon alone is never an affordance for a low-literacy or cognitively-impaired user. Icons are literal (a telephone, a musical note, a photograph), never abstract or metaphorical. **No robot, no brain, no sparkle, no chip, no neural network.**

**Illustration:** used sparingly, for orientation and warmth, in a warm limited palette consistent with the token ramps. Simple, dignified, human. Never cartoonish, never infantilising, never a mascot.

**Photography:** the person's *own* photographs are the primary imagery in the product, and they are shown large, uncropped and undecorated. **No generic stock photography of "happy seniors"; no AI-generated imagery of people, ever.** Public-site photography, if any, is documentary and locally sourced with consent and attribution.

## F7. Component primitives

Built on Radix (accessible by default), styled with Tailwind against the semantic tokens. Every component ships with all applicable states from E6.

| Primitive | Notes |
|---|---|
| `Button` | variants: primary · secondary · quiet · destructive(rare). Sizes meet the target minimums per surface. Never icon-only where a person or CHW uses it. |
| `Card` | one level of nesting maximum |
| `EvidenceBlock` | **D1** — the most important component in the product |
| `SourceChip` · `ConfidenceGlyph` · `NotADiagnosis` | D2, D3 — composable, never re-implemented |
| `ActionCard` | E3 — enforces ≤3 actions and attached feedback |
| `StatusBanner` | one per screen maximum |
| `SyncAge` | mandatory on every caregiver/CHW/clinical view |
| `InsufficientData` | D4.1 |
| `RefusalPanel` | D4.2 |
| `ConflictPair` | E6.8 — never collapses to one value |
| `WhyAmISeeingThis` | E5.2 |
| `Timeline` · `GapBand` | E4 — the gap band is not optional |
| `ConsentToggle` | per-purpose, with plain-language effect, and revocation always enabled |
| `PersonAction` | the person's large circular action — fixed size and position, always labelled |
| `VisitStep` | CHW guided workflow step with time estimate |
| `DrillDown` | the clinician's five-level chain (C4.2) |

## F8. Data visualisation (clinician only)

**Charts exist only on the clinical surface, and only where a table would be harder to read.** The caregiver gets sentences; the CHW gets lines of text; the person gets nothing.

| Rule | Detail |
|---|---|
| Every chart answers a named question | Written above the chart, as its title. No question, no chart. |
| **Never fuse modalities** | Separate small multiples, one per signal, each with its own confidence and n. No composite index, ever. |
| **Baseline is the reference, not a norm** | The band is *her own* baseline. Population norms never appear. |
| **Confidence is drawn** | Low-confidence segments are dashed or lightened; the reason is in the legend. |
| **Gaps are drawn, never interpolated** | An explicit break plus a labelled band. |
| Axes | Always labelled, always with units and n. No dual axes. No truncated y-axis that exaggerates change. |
| Colour | Sequential ramps from the stone/teal tokens; **never** a rainbow, never red/green as the only distinction |
| Annotations | Confounders (medication start, caregiver absence, hearing-aid non-use) are marked **on the timeline** — this is the most clinically valuable element of the chart |
| Interaction | Hover/tap reveals the underlying observations with provenance. Every point is traceable to source. |
| Density | Small multiples over one dense chart. Sparklines in tables where the trend is secondary. |

---
---

# PART G — ACCESSIBILITY, LANGUAGE, CULTURE

## G1. Accessibility acceptance criteria (measurable, testable)

Accessibility is a **core product requirement**, not a compliance pass. Baseline **WCAG 2.2 AA**, exceeded where the population demands it. Each row below is an automated or scripted test.

| # | Criterion | Target | Applies to |
|---|---|---|---|
| A1 | Body text contrast | ≥ **7:1** (AAA) | Person surface |
| A2 | Body text contrast | ≥ 4.5:1 (AA) | All other surfaces |
| A3 | Non-text/UI contrast | ≥ 3:1 | All |
| A4 | Touch target | ≥ **72px** person · ≥ 48px caregiver/CHW · ≥ 44px clinician | All |
| A5 | Target spacing | ≥ 16px between adjacent targets | All |
| A6 | Text scaling | Usable at **200%** with no loss of content or function; no horizontal scroll | All |
| A7 | Reflow | Usable at 320 CSS px width | All |
| A8 | Colour independence | Every status conveyed by colour **+ glyph + word** | All |
| A9 | Screen reader | 100% of interactive elements labelled; every Evidence Block reads FACT → SOURCE → CONFIDENCE → HYPOTHESIS → ACTION in that order | All |
| A10 | Keyboard | Full operation; visible focus ring (3px, never removed); logical order | Caregiver/CHW/clinician |
| A11 | Reduced motion | `prefers-reduced-motion` = full functionality, zero loss | All |
| A12 | Navigation depth | ≤2 person · ≤3 caregiver/CHW · ≤5 clinician | All |
| A13 | Choices per screen | ≤5 primary on the person's surface | Person |
| A14 | Error recovery | Every error state offers a retry **and** an alternative; no dead ends | All |
| A15 | Confirmation | Every irreversible action confirms once, in plain language, safe option first | All |
| A16 | Repetition tolerance | Repeating an action or question never produces a scolding, a warning, or a different error | Person |
| A17 | Timing | **No time limits anywhere in the product.** No session timeout on the person's surface. | All |
| A18 | Audio | Every spoken output has a visible text equivalent; every visible instruction can be spoken | Person |
| A19 | Captions/alt | Every image conveying information has a text alternative in the person's language | All |
| A20 | Voice fallback | Every voice interaction has a tap equivalent, and vice versa | Person |

**Cognitive-load criteria specific to dementia**, tested with the population, not just with tooling: layout stability across sessions (A21: zero unannounced layout change, ever), one decision per screen (A22), no reliance on recall of a prior screen (A23), and no interface element whose meaning depends on remembering a previous interaction (A24).

## G2. Localisation and multilingual layout

Translation is not localisation (Blueprint §18.1). The design system supports it structurally.

| Concern | Rule |
|---|---|
| Text expansion | Every layout tolerates **+40%** string length without truncation or reflow failure. No fixed-width buttons containing text. |
| Script metrics | Devanagari and Bengali–Assamese need greater line-height and ascender/descender room: line-height **1.75** for these scripts, set per-locale, not globally |
| Numerals | Locale-appropriate numerals in person-facing copy; **Latin numerals always in clinical data** to avoid transcription error |
| Dates | Person: named day and month in their language, never numeric. Clinical: unambiguous `8 Sep 2026`, never `08/09/26`. |
| Code-mixing | Assamese–English, Nagamese–English, Mizo–English are **normal input**, never an error state. Never "I didn't understand" for a code-switch. |
| Honorifics | Selected per community (*Aitâ, Koka, Kong, Bah, Pi, Nu*), stored as person data, used in every address. Never a generic default. |
| Tier-C surfaces | Picture-first layouts with recorded human voice; **text is decorative, not load-bearing**, and every element has an audio label |
| Truncation | Banned in any element carrying meaning. Wrap, or redesign. |
| RTL | Not required for NER languages; the token/layout system uses logical properties anyway so it is not blocked. |

**Language-tier honesty in the UI:** where a capability does not exist for a language (Tier-C ASR), the interface offers the path that *does* work — picture-first plus recorded voice plus CHW mediation — and never presents a degraded version of the Tier-A experience as if it were equivalent.

## G3. Low literacy and voice-first

| Principle | Implementation |
|---|---|
| Voice → picture → text | Every person-facing action is speakable; every screen is operable without reading |
| Icons never travel alone | Icon + label, always, on person/caregiver/CHW surfaces |
| Photographs carry meaning | People are recognised by face, not by name-in-text |
| Numbers are spoken as words | "four o'clock", not "16:00" |
| Instructions are one step | Never a numbered list of five steps on the person's surface — one step, then the next |
| Voice failure is honest | "I didn't catch all of that — sorry." Then a narrower, answerable question. **Never invent an interpretation.** |
| Voice-first evolution | `MVP`: voice output everywhere, voice input Tier-A. `PHASE 2`: Tier-B constrained grammar. `PHASE 3`: broader Tier-B/C as the corpus permits. The UI shape does not change between these — only what the microphone accepts. |

## G4. Cultural adaptation

Culture is **data**, bound at render time, with a strict priority order:

```
1  PERSON-SPECIFIC   their photos, their songs, the festivals they observe, their trade
       ↓ overrides
2  COMMUNITY ONTOLOGY  co-designed per community: kinship, festivals, food, music, landmarks
       ↓ overrides
3  REGIONAL DEFAULT    state-level content — last-resort generic fallback, clearly non-personal
```

| Rule | Why |
|---|---|
| **"North East" is never one culture.** Eight states, four-plus language families, matrilineal and patrilineal societies. | A single "NER theme" is a design failure and a measurement error |
| Kinship is pluggable | Khasi, Garo and Jaintia matriliny must render correctly; a hard-coded patrilineal assumption produces factually wrong and offensive prompts |
| **Never fabricate a cultural fact** | Same rule as personal facts. A festival the person does not observe is an unfamiliar item that produces a false "failure" — a *measurement-validity* problem, not just a taste problem |
| Visual familiarity | Objects, foods, tools and places in illustration are locally real, sourced with community co-designers |
| Per-state naming | The product's own name and voice persona are co-designed per state (`P0` deliverable); the design system must accept a per-deployment wordmark and voice identity |
| Community-specific norms | Indirectness, honorific register, what is impolite to ask — encoded as interaction rules per ontology, not as global copy |

**Anti-stereotyping is architectural:** because person-specific data overrides community data, the system *cannot* substitute a regional cliché for a person whose own record contradicts it.

---
---

# PART H — PRACTICE

## H1. Web to mobile

Web is first-class **now**; Expo/React Native is the mobile future (`tech-stack.md` §7). The design system is built so mobile inherits without a redesign — and without compromising the web.

| Shared | Per-platform |
|---|---|
| Semantic tokens (`@mindmitra/ui-tokens`) | Render layer (Tailwind/shadcn vs Nativewind/RN) |
| Component **semantics** and state machines | Component implementations |
| The Evidence Block *grammar* (slot order, rules, disclaimers) | Its native layout |
| Information architecture and navigation rules | Router (App Router vs Expo Router) |
| Copy, tone, register, refusal wording | Platform affordances (haptics, native voice) |
| Accessibility criteria (G1) | Platform a11y APIs |

**The rule:** share tokens, semantics and headless logic. **Never share the render layer, and never degrade the web to enable reuse.** The person's Companion is the one surface that will genuinely benefit from being native (offline, on-device voice) — and it is also the simplest, so re-implementing it is cheap.

## H2. Responsive behaviour

Breakpoints, and what each surface is actually used on:

```
sm   < 640    CHW field phone · caregiver phone
md   640–1024 person tablet (the primary person device) · caregiver tablet
lg   1024–1440 clinician desktop · AAM facility device
xl   > 1440   clinician wide
```

| Surface | Designed for | Adapts by |
|---|---|---|
| Person | **Tablet, portrait, fixed** | Barely — the layout is deliberately stable. Phone shows the same elements, stacked, same order, same positions relative to each other. |
| Caregiver | Phone-first | Progressive disclosure becomes side-by-side at `lg` |
| CHW | Phone only | Single column always; never a desktop layout |
| Clinician | Desktop-first | Collapses to a stacked drill-down on tablet; usable, not primary |
| Public | Responsive | Standard |

**Wide content (clinical tables, charts, timelines) scrolls inside its own container.** The page body never scrolls horizontally.

## H3. UX testing methodology

Testing with this population has requirements a standard usability protocol does not meet.

| Method | Applied to | Notes |
|---|---|---|
| **Participatory design sessions** | Person + family together, in the home | With a community co-designer present. Never in a lab. |
| **Observation, not think-aloud** | Person surface | Think-aloud imposes a working-memory load that invalidates the result |
| **Proxy + person dual report** | Person surface | The caregiver's account and the observed behaviour are recorded separately and may disagree — both are kept |
| **Task-based scenario walkthrough** | Caregiver, CHW, clinician | Real scenarios from the twelve journeys, with real (synthetic-but-realistic) data |
| **Time-boxed field trial** | CHW | The **≤10 minutes per household** budget is the acceptance criterion, measured with a timer |
| **Consult simulation** | Clinician | 15-minute simulated teleconsult with the pack; measure time-to-first-decision and history-reconstruction time |
| **Red-team review** | All | Deliberate attempts to make the UI imply a diagnosis, leak out-of-scope data, or produce an alert from bad data |
| **Stratified evaluation** | All | Every result disaggregated by literacy, gender, language tier, age band and rural/urban. **No stratum may fall below 50% of the best-performing stratum** — an interface that works only for literate Assamese-speaking men in a city has failed. |

**Ethical constraints:** no A/B testing on the person's surface (layout stability is a clinical requirement); no engagement optimisation as a test objective; sessions stop immediately on any sign of distress and that stop is itself a finding.

## H4. Usability acceptance criteria

Per surface, these are ship gates.

### Person
- Completes a chosen activity **unaided** in ≥80% of attempts after one demonstration.
- **Zero** instances of a participant describing the experience as a test, an exam, or being checked on.
- **Zero** instances of visible distress attributable to the interface.
- Finds the "call" and "talk to me" actions in ≤3 seconds, in every session, across sessions (position stability).
- Voluntary initiation in ≥40% of sessions.

### Caregiver
- Answers *"How is she today? What changed? Do I need to do anything?"* in **≤10 seconds** from opening the app.
- Correctly identifies whether action is needed in ≥90% of scenarios.
- Rates ≥70% of delivered `ACTION_REQUIRED` items "Useful".
- Can reach the evidence behind any alert in **one tap**, and does so unprompted in ≥50% of scenarios.
- Reports lower, not higher, perceived information burden versus their current method.

### CHW
- Completes a household visit within **10 minutes**, measured, in ≥80% of visits.
- Correctly identifies the priority household from the caseload in ≥95% of scenarios.
- Zero data re-entry: nothing recorded in MindMitra is also written in a paper register.
- Operates fully with a stale cache and can state, unprompted, what is queued and how old the data is.

### Clinician
- Understands the longitudinal story **before** seeing any raw data, in 100% of sessions (structural — enforced by C4.2).
- Correctly states the measurement confidence and at least one confounder in ≥90% of scenarios.
- Never reports feeling directed toward a diagnostic conclusion — **zero tolerance**; any such report is a defect, not feedback.
- Reduces history-reconstruction time within the consult versus the no-pack baseline.

---

## Appendix — the design questions this document must answer

A reviewer should be able to answer all of these from this document alone. If any cannot be answered, that is a gap to fix here.

1. What does the person see when an activity ends? → C1.3, C1.7
2. What does the caregiver see for the same event? → C2.1, C2.3
3. What does the CHW see? → C3.1, C3.4
4. What does the clinician eventually see? → C4.1, C4.4
5. What is deliberately withheld from each? → B3 ("never shows" columns), A3
6. How is a fact visually distinguished from a hypothesis? → D1.1
7. How is confidence shown without a false precision? → D2.1
8. What does the product do when it cannot measure? → D4.1
9. What does it do when it refuses? → D4.2
10. What does it do when two sources disagree? → E6.8, D2.3
11. What does it do offline? → E6.5, E6.6
12. What does "nothing is wrong" look like? → E6.3, C2.1
13. Which colour means what, and what is red reserved for? → F2.4
14. Why does the person's surface never change layout? → C1.2, A21
15. How does a role's navigation get decided? → B2
16. How does this become a mobile app without a redesign? → H1
17. How do we know it works for a non-literate Khasi speaker? → G2, G3, H3, H4
