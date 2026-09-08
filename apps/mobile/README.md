# `apps/mobile` — MindMitra mobile (Expo + React Native) — FUTURE

Deferred to a later phase (Horizon B). The person-facing companion (voice-first, picture-first, offline) is the surface that most benefits from native.

Planned stack: Expo + React Native + Expo Router + Nativewind + TypeScript. Local persistence via `expo-sqlite` + Drizzle ORM (Horizon B), sharing the same domain packages as `apps/web`.

Shares with web: `packages/domain`, `packages/api-client`, `packages/core`, `packages/experience-runtime` (headless core + RN render adapter), `packages/ui-tokens`. Does **not** share the render layer.

> Do not start this before the web app and backend are functional (see `CLAUDE.md` §7 priority order).
