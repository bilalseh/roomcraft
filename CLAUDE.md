# Roomcraft

AI-assisted 3D room planner. Public portfolio piece: it must look and behave
like a real product, and the code must read like senior work (clean
architecture, strict types, tests, docs).

Product spec, architecture rules and build order: [docs/spec.md](docs/spec.md).
On 2026-11-01 the user asked to continue through all phases without stopping
for review: commit and push each phase once `pnpm check` passes, and stop only
when a phase needs a manual step from the user.

## Status

Phase 1: done (verified 2026-11-01: CI green, web on Firebase Hosting, API on
Render, live footer shows "API online").
Current phase: **2, in progress** (room setup wizard + procedural room in 3D).

### Phase 1 plan (agreed)

1. Workspace tooling: pnpm workspace (`web`, `shared`), uv project (`api`).
   Root scripts: `pnpm dev` starts web + api, `pnpm check` runs everything CI
   runs. `.gitattributes` forcing LF, EditorConfig, Prettier, ESLint flat
   config.
2. Web shell: placeholder routes for landing, `/new` (wizard), `/p/:id`
   (editor), `/s/:id` (share). Editor route lazy-loaded so three.js stays out
   of the landing bundle; renders a minimal R3F scene. `web/src/domain/` is
   the pure-logic home, with an ESLint rule blocking React/three imports.
3. API shell: FastAPI with `/health` and a `/v1` router, pydantic-settings,
   CORS limited to the hosting origins (including preview channels),
   multi-stage Dockerfile (non-root, listens on `$PORT`), `.env.example`.
4. Schema pipeline proven on one placeholder model: Pydantic →
   `shared/schema/*.json` → generated TS types; CI drift check.
5. Firebase config: Hosting serves `web/dist` with SPA rewrites and long cache
   headers on hashed assets; deny-all Firestore rules; web Firebase init from
   `VITE_FIREBASE_*` env vars.
6. CI: web job (lint, typecheck, test, build), api job (ruff, mypy, pytest,
   Docker build), schema drift check. On main: deploy web to Firebase Hosting
   (plus PR preview channels). Render deploys the API from `render.yaml`
   once the commit's checks pass.
7. Docs: README stub, ADR-0001 (monorepo layout), ADR-0002 (shared schema),
   ADR-0003 (API hosting on Render).

Done when: CI green, shell live on Firebase Hosting, API live on Render,
and the shell footer shows the API `/health` status.

## Decisions (2026-11-01)

- UI is English only: no i18n library, no RTL.
- Currency: USD.
- GitHub: https://github.com/bilalseh/roomcraft (public).
- Firebase project `roomcraft-planner` on the free Spark plan. Web app ID
  `1:562896754650:web:453e11c0d65bc083d752e3`; print its config with
  `firebase apps:sdkconfig WEB <appId> --project roomcraft-planner`.
  Hosting URL: https://roomcraft-planner.web.app
- Firestore: default database in `nam5`.
- Backend: Render free web service (Docker), service `roomcraft-api` in
  `ohio`, defined in `render.yaml`. URL https://roomcraft-api-929h.onrender.com
  (dashboard: https://dashboard.render.com/web/srv-dbjambu7bikc73et8o10).
  Sleeps after 15 minutes idle. Hugging Face Spaces was dropped: Docker Spaces
  need PRO.
- Build-time web config comes from GitHub Actions variables (`VITE_*`), not
  secrets: it is public, and committing the Firebase API key would trip
  GitHub secret scanning.
- Share links are published snapshots, not live views.
- See "Storage on the free plan" and "Backend on free hosting" in the spec.

## Tooling

- Node 22 LTS, pnpm 10, uv (installs Python 3.12; the system Python is 3.11)
- TS strict + `noUncheckedIndexedAccess`, typescript-eslint strict, Prettier
- TypeScript pinned to 6.0.x: typescript-eslint 8 supports `<6.1`, not TS 7
- ruff + mypy `--strict`, pytest
- React Router, Tailwind v4 via its Vite plugin
- MIT license
- Local Java is 8; the Firestore emulator needs a newer JDK. CI installs its
  own. Ask before installing one locally (phase 5).

## Working with the user

- The user does manual console steps. When something needs them, give the
  exact link and click-by-click steps.
- Secrets never go in chat or the repo. The user sets GitHub secrets with
  `gh secret set <NAME> --repo bilalseh/roomcraft` (paste when prompted).

## Pending manual steps

- [ ] Create the Firestore database in the console (`nam5`, production mode)
- [x] Hugging Face account + `HF_TOKEN` GitHub secret (username `BilalSeh`);
      unused since the move to Render, can be deleted
- [x] Render account (sign in with GitHub) and a Blueprint from `render.yaml`
- [x] Firebase Hosting deploy secret `FIREBASE_SERVICE_ACCOUNT_ROOMCRAFT_PLANNER`
      for GitHub Actions, via `firebase init hosting:github` (service account
      `github-action-1441323664`; the CLI also granted Auth Admin and Functions
      Developer, which can be trimmed to least privilege)
- [ ] Enable Google and Anonymous sign-in (before phase 5)
- [ ] Gemini API key from Google AI Studio as a Render env var (phase 6)
