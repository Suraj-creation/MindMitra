# Person Web Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an authenticated, accessible Person Application web shell whose day, memory, activity, help, and voice affordances use the existing governed companion APIs.

**Architecture:** A caregiver-only `/setup` route exchanges an enrolled device secret for a tablet bearer token in local storage, then a small client-side session boundary asks the existing FastAPI API who the person is. A pure presenter maps API/session state to stable person-facing UI states. The interactive shell sends only a chosen question to the governed companion endpoint and renders its visible answer, while a voice-capability read controls browser speech-output affordances.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Lucide React, Vitest, FastAPI existing contracts.

**Spec:** `docs/superpowers/specs/2026-09-08-person-web-vertical-slice-design.md`

## Global Constraints

- Use `GET /v1/auth/me`, `POST /v1/persons/{person_id}/companion/turn`, and `GET /v1/persons/{person_id}/voice/capability` exactly as defined by the FastAPI service.
- The browser carries only a bearer token; do not send actor ID, role, consent, or synthetic personal facts.
- Never render clinical metrics, diagnostics, scores, streaks, rankings, timers, raw provenance, internal API/model terminology, or technical demo navigation in the Person Application.
- Preserve 72px person touch targets, labelled icons, keyboard focus, `prefers-reduced-motion`, accessible live answers, and a visible tap/text fallback for voice.
- Use the supplied palette semantic values from `apps/web/PRODUCT.md`; do not introduce gradients, glass effects, stock/AI people imagery, or fake personal data.

---

### Task 1: Establish testable person-session state and API boundaries

**Files:**
- Create: `apps/web/lib/person-session.ts`
- Create: `apps/web/lib/person-session.test.ts`
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Consumes: a `fetch` implementation and optional browser session storage.
- Produces: `PersonSession`, `PersonSessionState`, `getStoredAccessToken()`, `setStoredAccessToken()`, `clearStoredAccessToken()`, `api.getMe(token)`, `api.sendCompanionTurn(token, personId, message)`, and `api.getVoiceCapability(token, personId)`.

- [ ] **Step 1: Write the failing session-state tests**

```ts
import { describe, expect, it } from "vitest";
import { sessionState } from "./person-session";

describe("sessionState", () => {
  it("asks a trusted helper to set up a device when no token exists", () => {
    expect(sessionState(null)).toEqual({ kind: "setup-required" });
  });

  it("keeps a known person and their token together", () => {
    expect(sessionState("token", { personId: "person:purnima", displayName: "Purnima Devi" }))
      .toEqual({ kind: "ready", token: "token", person: { personId: "person:purnima", displayName: "Purnima Devi" } });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails because the module is absent**

Run: `pnpm --filter web test -- person-session.test.ts`

Expected: FAIL with module-not-found or missing script.

- [ ] **Step 3: Add Vitest and implement the minimal pure session-state module**

```ts
export type PersonSession = { personId: string; displayName: string };
export type PersonSessionState =
  | { kind: "setup-required" }
  | { kind: "ready"; token: string; person: PersonSession };

export function sessionState(token: string | null, person?: PersonSession): PersonSessionState {
  return token && person ? { kind: "ready", token, person } : { kind: "setup-required" };
}
```

Add the `test` script as `vitest run` and use one typed `fetch` helper that sets `Authorization: Bearer <token>` only when the caller supplies a token.

- [ ] **Step 4: Run the focused test and lint**

Run: `pnpm --filter web test -- person-session.test.ts && pnpm --filter web lint`

Expected: PASS with no ESLint errors.

### Task 2: Create the accessible stable Person shell

**Files:**
- Create: `apps/web/components/person-app.tsx`
- Create: `apps/web/components/person-app.test.tsx`
- Create: `apps/web/components/person-navigation.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/components/nav-bar.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `PersonSessionState`, `api`, `CompanionTurn`, and `VoiceCapability` from Task 1.
- Produces: four stable labelled destinations (`My Day`, `My Life`, `Let’s Do Something`, `Help`), a setup-required state, loading/error states, and an `aria-live` companion answer region.

- [ ] **Step 1: Write failing UI tests for the person’s safe entry and stable labels**

```tsx
it("shows a helper setup message without a person session", () => {
  render(<PersonApp initialState={{ kind: "setup-required" }} />);
  expect(screen.getByText("This tablet needs to be set up")).toBeVisible();
});

it("keeps the four person destinations labelled", () => {
  render(<PersonApp initialState={readyState} />);
  expect(screen.getByRole("navigation", { name: "Your day" })).toHaveTextContent("My Day");
  expect(screen.getByRole("navigation", { name: "Your day" })).toHaveTextContent("My Life");
  expect(screen.getByRole("navigation", { name: "Your day" })).toHaveTextContent("Let’s Do Something");
  expect(screen.getByRole("navigation", { name: "Your day" })).toHaveTextContent("Help");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web test -- person-app.test.tsx`

Expected: FAIL because `PersonApp` is not defined.

- [ ] **Step 3: Implement the shell and semantic palette tokens**

Implement the shell as a client component with a stable `activeSection` union. Replace the technical demo navigation with no person-facing global nav. Use `<main>`, labelled `<nav>`, `aria-current`, a live region for replies, and 72px controls. Use the palette’s `#FBF1E3`, `#8FA17A`, `#B77952`, `#6F3D35`, `#332F29`, `#D8B878`, and extended semantic colours via CSS custom properties.

- [ ] **Step 4: Run UI tests, lint, and a production build**

Run: `pnpm --filter web test -- person-app.test.tsx && pnpm --filter web lint && pnpm --filter web build`

Expected: PASS.

### Task 3: Connect governed companion questions and voice output

**Files:**
- Create: `apps/web/components/companion-panel.tsx`
- Create: `apps/web/components/companion-panel.test.tsx`
- Modify: `apps/web/components/person-app.tsx`

**Interfaces:**
- Consumes: `sendCompanionTurn(token, personId, message)`, `getVoiceCapability(token, personId)`, and `SpeechSynthesis` when available.
- Produces: a readable/speakable answer, deliberate prompt choices, a Retry action after request failure, and no microphone affordance when input capability is unavailable.

- [ ] **Step 1: Write the failing companion tests**

```tsx
it("sends only the selected question and reads the governed answer", async () => {
  const sendTurn = vi.fn().mockResolvedValue({ answer: "There is nothing planned that I can see yet." });
  render(<CompanionPanel session={readySession} sendTurn={sendTurn} voice={noVoice} />);
  await userEvent.click(screen.getByRole("button", { name: "What is happening today?" }));
  expect(sendTurn).toHaveBeenCalledWith("What is happening today?");
  expect(await screen.findByText("There is nothing planned that I can see yet.")).toBeVisible();
});

it("keeps the text path available when voice is unavailable", () => {
  render(<CompanionPanel session={readySession} sendTurn={vi.fn()} voice={noVoice} />);
  expect(screen.getByRole("textbox", { name: "Tell MindMitra what you need" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Speak your question" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web test -- companion-panel.test.tsx`

Expected: FAIL because `CompanionPanel` is not defined.

- [ ] **Step 3: Implement prompt, text, retry, speech-output, and failure behaviour**

Map each stable section to one literal prompt. Call the existing companion endpoint only after an explicit press. Announce visible answers with `aria-live="polite"`; call browser speech synthesis only when the capability endpoint says output is supported and `window.speechSynthesis` exists. Render Retry and retain Help after an API failure.

- [ ] **Step 4: Run companion tests and the full web verification set**

Run: `pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build`

Expected: PASS.

### Task 4: Exercise the end-to-end surface and record its honest limits

**Files:**
- Modify: `apps/web/README.md`
- Modify: `docs/superpowers/specs/2026-09-08-person-web-vertical-slice-design.md`

**Interfaces:**
- Consumes: the running Next.js app and FastAPI service.
- Produces: documented local setup/session prerequisites, browser-verified desktop and portrait-tablet evidence, and an explicit list of follow-on API gaps.

- [ ] **Step 1: Document the person-device session prerequisite**

Document that a person session is created by the existing device-enrolment and device-login contracts, that the browser must receive a session token through an approved setup flow, and that no demo data is rendered as a real person.

- [ ] **Step 2: Start the app and inspect desktop and portrait-tablet states**

Run: `pnpm --filter web dev`

Inspect: 1440px desktop and 768px portrait tablet; setup-required, My Day, companion loading, companion failure, My Life, Let’s Do Something, Help, keyboard focus, and reduced motion.

- [ ] **Step 3: Run final static verification**

Run: `pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build`

Expected: PASS.
