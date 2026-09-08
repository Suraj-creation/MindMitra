# Architecture Decision Records

Short records of the load-bearing, contestable decisions. Full reasoning lives in `tech-stack.md`.

| ADR | Decision | Where |
|---|---|---|
| ADR-001 | Dedicated Next.js web instead of React-Native-Web unified; share TS domain packages, not the render layer | `tech-stack.md` §7 |
| ADR-002 | Single PostgreSQL-centric spine (Neon), no polyglot DB at MVP; graph as edge tables, temporal as plain tables, vectors via pgvector | `tech-stack.md` §9 |
| ADR-003 | LangGraph for one bounded orchestrator, with the Safety Gateway + Memory Firewall *outside* the LLM graph; emergency/medication never enter an LLM | `tech-stack.md` §14, `CLAUDE.md` §1 |
| ADR-004 | Custom deterministic Memory-Firewall authorization; library/managed authentication only | `tech-stack.md` §20, implemented in `services/api/app/firewall` |
| ADR-005 | Provenance/event log as the shared audit + offline-sync foundation (built once, dual purpose) | `tech-stack.md` §21–22 |

Standing decision principles (P-1…P-8) are in `tech-stack.md` §39 and `CLAUDE.md`.
