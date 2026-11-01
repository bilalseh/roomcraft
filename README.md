# Roomcraft

An AI-assisted 3D room planner. Describe a room, furnish it in 3D, ask an AI assistant for layout
ideas that it applies directly in the scene, track the budget, and share the plan.

**Live app:** https://roomcraft-planner.web.app · **API:** https://roomcraft-api.onrender.com/docs

> Work in progress. The [product spec](docs/spec.md) describes the full feature set and the build
> order.

## Repository layout

| Path      | Contents                                                                       |
| --------- | ------------------------------------------------------------------------------ |
| `web/`    | React 19 + TypeScript + Vite frontend, React Three Fiber for the 3D editor     |
| `api/`    | FastAPI backend (Python 3.12, uv), deployed to Render as a Docker image        |
| `shared/` | Contracts used by both: JSON Schema and the TypeScript types generated from it |
| `docs/`   | Product spec and [architecture decision records](docs/adr/)                    |

## Running locally

Requirements: Node 22, pnpm 10 and [uv](https://docs.astral.sh/uv/) (it installs Python 3.12 for
the API).

```sh
pnpm install
cp web/.env.example web/.env.local   # fill in the Firebase web config
pnpm dev                             # web on :5173, API on :8000
```

The Vite dev server proxies `/api` to the local API, so no CORS setup is needed in development.

## Checks

```sh
pnpm check    # format, lint, typecheck, tests, build, API checks, schema drift
```

`pnpm check` runs everything CI runs except the Docker image build, which is `pnpm api:docker`.

## Shared schema

Pydantic models in `api/` are the source of truth for every contract between the web app and the
API. `pnpm schema` exports them to `shared/schema/roomcraft.schema.json` and generates
`shared/src/generated/schema.ts`. Both files are committed, and CI fails if they are stale. See
[ADR-0002](docs/adr/0002-shared-schema.md).

## Deployment

Every push to `main` that passes CI deploys the web app to Firebase Hosting. Render deploys the
API from [`render.yaml`](render.yaml) once the same commit's checks pass (see
[ADR-0003](docs/adr/0003-api-hosting-on-render.md)). Pull requests get a Firebase Hosting preview
channel.

## License

[MIT](LICENSE)
