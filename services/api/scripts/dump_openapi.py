"""Dump the FastAPI OpenAPI schema to packages/domain/openapi.json.

This is step 1 of the contract pipeline:

    Pydantic models → FastAPI OpenAPI (this script) →
    openapi-typescript → packages/domain/schema.d.ts → apps/*

Run from services/api:  python scripts/dump_openapi.py
Or via the root script:  pnpm gen:types
"""

from __future__ import annotations

import json
import pathlib
import sys

# Make `app` importable regardless of the working directory the script is run from.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402


def main() -> None:
    schema = app.openapi()
    repo_root = pathlib.Path(__file__).resolve().parents[3]
    out = repo_root / "packages" / "domain" / "openapi.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(schema, indent=2, ensure_ascii=False), encoding="utf-8")
    n_paths = len(schema.get("paths", {}))
    n_schemas = len(schema.get("components", {}).get("schemas", {}))
    print(f"Wrote OpenAPI schema -> {out}")
    print(f"  {n_paths} paths, {n_schemas} component schemas")


if __name__ == "__main__":
    main()
