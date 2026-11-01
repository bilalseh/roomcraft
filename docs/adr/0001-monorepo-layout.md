# ADR-0001: Monorepo layout

- Status: Accepted
- Date: 2026-11-01

## Context

Roomcraft has a TypeScript web app and a Python API that must agree on the same data: room
geometry, furniture, and the operations the AI assistant proposes. Geometry rules exist in both
languages (live editing in the browser, validation of AI output on the server) and must not drift
apart. One person builds and maintains the project, so tooling overhead has to stay low.

## Decision

One repository with four top-level directories:

- `web/`: the frontend, a pnpm workspace package.
- `shared/`: contracts used by both sides (JSON Schema, generated TypeScript types, and later the
  furniture catalog and geometry test fixtures). A pnpm workspace package that ships TypeScript
  source; Vite compiles it as part of the web build, so it has no build step of its own.
- `api/`: the backend, a standalone uv project. It is not part of the pnpm workspace; root scripts
  call it through `uv run --directory api`.
- `docs/`: spec and ADRs.

Root scripts give one entry point for both ecosystems: `pnpm dev` starts both servers, and
`pnpm check` runs the same checks as CI.

The Docker build context is the repository root, so the image can include files from `shared/`.
The Hugging Face Space receives a copy of `api/` and `shared/` with the Dockerfile at its root,
which keeps the same paths valid in both places.

## Alternatives considered

- **Separate repositories for web and API.** Contracts would need publishing and versioning, and a
  change to the operation schema would span two pull requests. Too much overhead for one
  maintainer.
- **Turborepo or Nx.** Task caching and project graphs pay off with many packages. With two
  JavaScript packages, pnpm's `--filter` and `--recursive` are enough.

## Consequences

- One pull request can change the schema, the API and the web app together, and CI checks them
  together.
- Contributors need both Node and uv installed.
- The web and API jobs run in parallel in CI; deploys wait for both.
