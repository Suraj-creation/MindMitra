# `packages/` — shared TypeScript packages

Shared across `apps/web` and the future `apps/mobile`. **Share domain logic, not the render layer** (ADR-001).

| Package | Purpose |
|---|---|
| `domain/` | TypeScript types generated from the FastAPI OpenAPI schema (`openapi-typescript`). Never hand-written. Drift fails CI. |
| `api-client/` | Typed fetch client (`openapi-fetch` / `orval`) over `domain`. |
| `core/` | Platform-agnostic business logic: provenance/consent helpers, alert-eligibility, escalation formatting. Mirrors backend rules where a client needs them. |
| `experience-runtime/` | **Headless** state machine that executes a validated Experience-Spec, plus per-platform render adapters (DOM for web, RN for mobile). The single cleanest web↔mobile reuse. |
| `ui-tokens/` | Design tokens (colour, spacing, type scale, motion) — the single source of visual truth. Consumed by Tailwind (web) and Nativewind (mobile). |
| `config/` | Shared `eslint` / `tsconfig` / `tailwind` presets. |

## Contract flow

```
Pydantic (services/api)  →  OpenAPI  →  openapi-typescript  →  packages/domain  →  packages/api-client  →  apps/*
```

The Experience-Spec schema is the one cross-language schema defined in `services/api/app/studio/spec.py`; generate its TypeScript form into `domain/` so the renderer and the backend share one contract.

> Not yet scaffolded. Create each as a workspace package (`package.json` with `name: "@mindmitra/<pkg>"`) when the web app needs it.
