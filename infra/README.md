# `infra/` — deployment & CI

Planned contents (see `tech-stack.md` §27–28):

- **Dockerfiles** for `services/api` and `services/worker` (containerise everything → portable to India-region / government cloud without a rewrite).
- **GitHub Actions** workflows: lint (ruff/eslint), typecheck (mypy/tsc), test (pytest/vitest/playwright), OpenAPI→TS contract drift gate, Turbo remote cache.
- **Neon**: branch-per-PR preview databases.
- **Vercel**: web preview deployments.

Deployment targets — demo: Vercel (web) + Railway/Render/Fly (API) + Neon + Backblaze B2. Production: India-region managed / gov-cloud for DPDP-2023 + ABDM residency.
