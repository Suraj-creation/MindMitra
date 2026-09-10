# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a person living with dementia, commonly using a shared family tablet in North East India. Their immediate jobs are to orient themselves, understand what comes next, connect with familiar people, participate in meaningful activities, and reach human help without being tested or monitored.

Caregivers, community health workers, and clinicians are separate authorised audiences of the wider MindMitra platform; they are not users of this person-facing web surface.

## Product Purpose

MindMitra is a longitudinal cognitive-care platform that helps a person preserve meaningful independence and connection in daily life. The Person Application is its calm personal environment: a projection of governed personal context that helps with the day, memories, familiar people, routine, activities, and human support.

Success is that the person can understand and act on one calm moment at a time without seeing clinical metrics, assessment language, or internal AI machinery.

## Positioning

The Person Application is not a chatbot, health dashboard, game library, or generic dementia app. It assembles safe, personalised experiences from the Personal World Model, governed retrieval, and deterministic safety boundaries while keeping that architecture invisible to the person.

## Operating Context

The web app is a Next.js 16 application in `apps/web`. It consumes the FastAPI service in `services/api`, which already provides authentication, the Memory Firewall, governed companion turns, personal-world-model access, observations, and Azure Realtime voice-session capabilities with text and browser-speech fallbacks.

The reference-only person prototype is `design-prototype/MindMitra-Person-App.html`. It supplies interaction ideas and intended states but is not an implementation source or data source. Product truth is governed by `CLAUDE.md`, `DESIGN.md`, `tech-stack.md`, and the solution documents.

## Capabilities and Constraints

- Use existing backend contracts rather than inventing or duplicating APIs in the browser.
- Personal facts must respect authorisation, consent, provenance, temporal validity, confidence, and conflict handling.
- Emergency, medication, access-control, and escalation decisions remain deterministic and outside an LLM.
- The person surface never presents scores, diagnostic claims, clinical metrics, streaks, rankings, timers, or failure framing.
- Navigation and primary action placement remain stable; person flows are at most two levels deep.
- Voice is a first-class layer, but every voice action has a visible tap/text alternative and vice versa.
- The web app must support large text, high contrast, 72px person touch targets, keyboard accessibility, screen readers, 200% text scaling, reduced motion, and portrait-tablet use.
- The first delivery is a functional, governed Person vertical slice rather than speculative platform infrastructure.

## Brand Commitments

The product is calm, premium, warm, mature, human, familiar, quiet, and trustworthy. It must read as warm printed material rather than an AI or clinical dashboard.

The user-supplied palette at `C:/Users/Govin/Downloads/colore_pal.png` is binding visual source material: background `#FBF1E3`, primary `#8FA17A`, secondary `#B77952`, accent `#6F3D35`, text `#332F29`, highlight `#D8B878`; extended UI colours include surface `#F7EADC`, card `#EEE1CC`, button primary `#5E6F4A`, button secondary `#A85E46`, accent light `#D9A98F`, error `#8E3D3D`, success `#6B8F6B`, warning `#C9A34F`, and disabled `#D9D4C6`.

## Evidence on Hand

- Product and safety requirements: `CLAUDE.md`, `DESIGN.md`, `tech-stack.md`, `MindMitra_PS26003_Solution.md`, and `MindMitra_PS26003_PartII.md`.
- Backend implementation and tests: `services/api/`.
- Current web implementation: `apps/web/`.
- Reference-only interaction prototype: `design-prototype/MindMitra-Person-App.html`.
- Reference-only colour palette: `C:/Users/Govin/Downloads/colore_pal.png`.

The current demo seed data is explicitly synthetic and must never be presented as a real person's data. The UI must render honest empty, unavailable, and insufficient-information states where the backend has no authorised data.

## Product Principles

1. Person-centred, simple, safe, grounded, reversible, and maintainable before more features or complexity.
2. One calm, useful decision at a time; assistance is minimum sufficient, never controlling.
3. Personalisation changes content, language, timing, and assistance—not the stable navigation, layout, or action meanings.
4. Uncertainty is handled honestly; missing information is an invitation to continue, never a prompt to fabricate.
5. Human connection and agency outrank AI presence or engagement metrics.

## Accessibility & Inclusion

The Person Application meets the product's WCAG 2.2 AA baseline and person-specific criteria in `DESIGN.md` G1: AAA body-text contrast where feasible, 72px touch targets with 16px separation, stable layout, text scaling to 200%, 320px reflow, meaningful screen-reader labels, reduced-motion support, and voice/tap parity. It must accommodate North East Indian language and cultural context without treating the region as a single culture.
