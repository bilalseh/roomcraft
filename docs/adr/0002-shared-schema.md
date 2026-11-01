# ADR-0002: Shared schema

- Status: Accepted
- Date: 2026-11-01

## Context

The web app and the API exchange structured data: the room as JSON going to the API, and lists of
AI layout operations coming back. The server is the trust boundary: every operation the LLM
proposes is validated with Pydantic before it reaches the browser. The web app needs exact
TypeScript types for the same shapes, and the two must not drift.

## Decision

Pydantic models are the single source of truth.

1. Models that cross the wire are listed in `SHARED_MODELS`
   (`api/src/roomcraft_api/schemas/__init__.py`) together with their direction: `serialization`
   for responses, `validation` for request bodies.
2. `api/scripts/export_schema.py` writes them into one JSON Schema document,
   `shared/schema/roomcraft.schema.json`, with each model under `$defs`. Field titles are omitted
   and models forbid extra fields, so the schema describes the exact shape.
3. `shared/scripts/generate-types.mjs` turns every definition into one TypeScript declaration in
   `shared/src/generated/schema.ts`. References between definitions resolve by name, so each type
   is declared once.
4. `pnpm schema` runs both steps. The generated files are committed, so the web build never needs
   Python.
5. `pnpm schema:check` regenerates both files and fails if anything changed. It runs in CI and in
   `pnpm check`.

## Alternatives considered

- **TypeScript first (Zod), generating Pydantic.** Validation of untrusted LLM output happens on
  the server, and Gemini's structured output is configured from the Pydantic models. Generating
  Python from TypeScript would put the trust boundary downstream of a code generator.
- **A client generated from FastAPI's OpenAPI document.** It only covers models used by endpoints,
  while the shared models also describe data stored in Firestore and the geometry test fixtures. A
  generated client also brings more runtime code than this small API needs.
- **One schema file per model.** Readable, but nested models used by several top-level models
  would be generated more than once and clash when re-exported.

## Consequences

- Changing a contract is a two-step edit: change the Pydantic model, run `pnpm schema`, commit
  both.
- Generated TypeScript types are compile-time only. Data from outside the app (for example API
  responses) is still checked at runtime before use.
