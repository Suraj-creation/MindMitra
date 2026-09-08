# Person Web Vertical Slice — Design

## Scope

Replace the current technical-demo home page in `apps/web` with the first functional MindMitra Person Application vertical slice. The reference-only HTML prototype supplies interaction cues, but the application is built in React/Next.js against the existing FastAPI contracts.

This slice deliberately proves a real, bounded loop:

```text
person device session → My Day → governed text interaction → firewall-scoped retrieval
→ Safety Gateway response → visible, speakable answer → person chooses the next action
```

It does not invent a routine, calendar, contact directory, photo library, activity catalogue, or realtime WebRTC protocol. Those data/runtime capabilities are not currently exposed as person-facing APIs. Their absence is shown as a calm, actionable state rather than filled with prototype content.

## Product Shape

The root route becomes a stable person surface designed for portrait tablets first. It has four fixed, labelled destinations:

1. **My Day** — orientation, one current question, and a companion answer to “What is happening today?”
2. **My Life** — a grounded question about people, places, photographs, songs, or memories, answered only through the governed companion endpoint.
3. **Let’s Do Something** — a calm invitation to ask for an appropriate activity; it never presents a fake catalogue or score.
4. **Help** — a one-tap, deterministic-help request through the existing companion emergency path, plus a text/tap fallback.

The primary companion action stays in a fixed lower position. It accepts a small set of literal, large prompt choices and an optional text input. The app keeps the user on one screen at a time, never uses a clinical register, and does not surface technical terms, source metadata, or internal model state.

## Data and Authorisation

The browser calls only existing endpoints:

- `GET /v1/auth/me` establishes the authenticated person-device identity and display name.
- `POST /v1/persons/{person_id}/companion/turn` provides the already-governed answer path.
- `GET /v1/persons/{person_id}/voice/capability` determines whether the browser may offer speech input/output.

All requests carry the bearer token held in browser session storage. The client never sends an actor ID, role, consent state, or person context. On a missing or expired session, it shows a neutral shared-device entry state that directs setup by a trusted helper; it does not create a profile picker or expose a password flow to the person.

The backend remains the sole authority for identity, Memory Firewall enforcement, retrieval, deterministic emergency/medication routing, generation, Safety Gateway validation, and grounded uncertainty. No new backend endpoint is required for this initial loop.

## Voice and Failure Behaviour

The app reads `/voice/capability` before showing voice controls. It uses the browser speech-synthesis API only to read the visible companion answer aloud when output is supported. Speech input is not enabled until the deployed realtime/browser-recognition adapter has a tested client protocol; typed and prompt-button interaction remain available in every state.

Every failure has a clear recovery:

- unauthenticated: “This tablet needs to be set up by someone you trust.”
- network/API failure: show the current screen, offer Retry, and leave Help available.
- unavailable personal information: show the governed companion’s honest answer, not substitute content.
- unavailable voice: retain text and literal prompt buttons without a broken microphone affordance.

## Visual and Accessibility Contract

The supplied palette is applied as semantic tokens: warm paper background, moss primary action, clay secondary action, auburn accent/error, ink text, and ochre attention. The app uses a single calm surface hierarchy, avoids glass, gradients, dashboards, stock imagery, and scoring. Typography is editorial and high-contrast; controls meet 72px person touch targets and retain labelled icons.

The implementation supports keyboard focus, semantic landmarks, screen-reader labels and live answer announcements, `prefers-reduced-motion`, 200% text scaling, and responsive reflow from 390px phone to portrait tablet. Navigation positions and meanings do not change based on content.

## Explicit Follow-on Gaps

The current API has no person-facing routines/reminders/events, trusted-contact calling/safe-return data, media library, or validated experience-runtime endpoint. The next backend slice should expose these through separately authorised, purpose-limited projections—not direct database access—and then connect the already-established shell to them.
