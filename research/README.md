# `research/` — separated, governed experimentation

**Conceptually and operationally separate from production** (`CLAUDE.md` §1 invariant 10, `tech-stack.md` §31).

- Data reaches here only via a **one-way, de-identified, consented** snapshot pipeline from production (Neon branch → de-identify → export). Life-story content **never** leaves the person's scope and is excluded from every export.
- Planned tooling: Python + Jupyter + MLflow/W&B (experiments) + DVC (datasets).
- Flagship asset: the **NER low-resource speech corpus** (Khasi, Garo, Mizo, Meitei, Kokborok, Nyishi, Nagamese) — community-owned, withdrawable, published as a public good where communities agree.
- **Governance gate:** no research model reaches production alerting before passing validation. The CAE ladder (rules → supervised ranking → ethics-approved bounded bandits → safe offline RL) has no shortcuts. **No unrestricted online RL on this population, ever.**

> This directory must never import from `services/api` production code paths, and production must never import from here.
