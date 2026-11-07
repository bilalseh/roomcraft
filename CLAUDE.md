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
Phase 2: done. Six-step wizard (RHF + per-step Zod schemas, metric/imperial),
room rules shared with Python via `shared/fixtures/room-validation.json`,
procedural 3D room with dollhouse cutaway. Projects are saved to
localStorage until phase 5 moves them to Firestore.
Phase 3: done. 26-item catalog in `shared/catalog`, placement rules (SAT
collision, layers) shared with Python via `shared/fixtures/placement.json`,
per-editor Zustand store over pure layout operations with snapshot undo/redo,
procedural models with instanced legs, drag/snap/rotate, keyboard shortcuts.
Phase 4: done. Materials model (shared schema) with procedural floor textures,
wall paint and per-piece finishes (all undoable); day/night with lamps as
point lights; orbit, top-down plan with measurements, and first-person walk;
clearance warnings (door swing, walkways under 80 cm via grid reachability)
shared with Python via `shared/fixtures/clearance.json`.
Phase 5: done (verified 2026-11-02 against the real project: /demo, autosave,
versions, share link for a signed-out visitor, My rooms). Google sign-in has not
been exercised in a browser yet: it needs a real Google login. Firestore rules
are deployed by hand: the CI service account cannot deploy rules. Rules tests
run only in CI (local Java is 8).
Phase 6: done (verified 2026-11-02 on the live site against the real model: ask,
preview, apply, undo, three layouts). `POST /v1/assist` (Firebase ID token, 20
requests a day counted in Firestore, Gemini `gemini-3.8-flash` with
`gemini-3.5-flash-lite` fallback, operations validated in order and shared with
TS via `shared/fixtures/operations.json`). Web: assistant panel, 3D previews
(violet = added or moved, red ghosts = removed), apply as one undo step,
three-option mode with thumbnails. What the real model needed: no `maxItems` on
nested arrays (generic 400, so `plan_response_schema()` leaves array limits to
validating the answer), low thinking (medium took 167 s against the web client's
90 s limit), no sampling parameters (deprecated from 3.6). Low thinking refuses
more pieces, so plans with refusals go back to the model once and the better
version wins: three runs of three layouts left out 7 ideas in total, against 17
before, in 14 to 16 s instead of 10 to 13 s. Answers can still list ideas left out,
and summaries can mention them.
Phase 7: done. Budget meter (price range against the budget), shopping list
grouped by category with CSV, two-page PDF (vector floor plan with measurements,
3D snapshot, shopping list) built with jsPDF loaded on demand.
Phase 8: done. Phones get a read-only viewer; reduced motion turns off camera
damping; skip link; first-visit onboarding tour (remembered in localStorage);
axe-core tests on landing, wizard and editor (colour contrast checked by hand,
jsdom cannot compute it).
Phase 9: done. README, screenshots and the assistant GIF in `docs/media/`, and the
Playwright happy path (`e2e/`, `pnpm test:e2e`, Auth + Firestore emulators, web
built with `--mode e2e`). The e2e test runs fully only in CI (Firestore emulator
needs Java 21); locally the wizard half passes against the Auth emulator alone.
Docker Desktop is installed but has no WSL distro, so it does not start.
Realism pass (2026-11-07, asked for after phase 9; live and verified on the site,
photos in 10 to 16 s): rounded procedural pieces,
CC0 Poly Haven textures (grey colour maps tinted by the piece colour, UVs in
metres), skirting and opening frames (`domain/trim.ts`), a scanned CC0 plant,
RoomEnvironment lighting, PCSS shadows, and N8AO, bloom, Khronos Neutral tone
mapping and SMAA through `@react-three/postprocessing` (the canvas is `flat`). A
Photo button path traces the view with `three-gpu-pathtracer` 0.0.27, loaded on
demand. Gotchas: N8AO fails with composer multisampling and with `halfRes` on
three r187. The tracer skips instanced meshes and quantized glTF, draws invisible
meshes, cannot read a PMREM map and shows point light ranges as hard edges, so a
photo uses separate leg meshes, float geometry, a gradient sky, no outlines, and
lamps without a range. Thumbnails render through the effects with `advance()`.
Headless Edge uses the laptop's RTX GPU unless SwiftShader is forced.

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
- Render's build filter can skip a deploy: an API commit pushed with a web-only
  commit on top did not deploy (2026-11-02). Push API commits last, and check what
  is live in the GitHub deployments for the `main - roomcraft-api` environment.
- Gemini is paid, not free tier: the terms require paid use for apps open to the
  EEA, Switzerland and the UK. The key on Render belongs to an AI Studio project
  on the prepaid "My Billing Account" ($5 bought 2026-11-02, auto-reload off).
  With no credits Gemini answers 402 and the assistant says "unavailable".
- Never set up billing on `roomcraft-planner` (AI Studio offers it): that would
  move Firebase from Spark to pay-as-you-go Blaze.
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

- [x] Create the Firestore database in the console (`nam5`, production mode)
- [x] Hugging Face account + `HF_TOKEN` GitHub secret (username `BilalSeh`);
      unused since the move to Render, can be deleted
- [x] Render account (sign in with GitHub) and a Blueprint from `render.yaml`
- [x] Firebase Hosting deploy secret `FIREBASE_SERVICE_ACCOUNT_ROOMCRAFT_PLANNER`
      for GitHub Actions, via `firebase init hosting:github` (service account
      `github-action-1441323664`; the CLI also granted Auth Admin and Functions
      Developer, which can be trimmed to least privilege)
- [x] Enable Google and Anonymous sign-in
- [x] Gemini API key from Google AI Studio as a Render env var, plus the
      `roomcraft-api` service account as a secret file (phase 6)
