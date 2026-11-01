# Roomcraft: product spec

An AI-assisted 3D room planner. One person describes a room, furnishes it in
3D, asks an AI assistant for layout ideas that it applies directly in 3D,
tracks the budget, and exports a shareable plan.

Everything works for a single user. No other users, admins or shared data are
needed to try every feature.

## Core features

### 1. Room setup wizard (multi-step form)

- Steps: room type (living room, bedroom, office, studio) → dimensions and
  ceiling height → doors and windows (position on each wall, width, height)
  → style (modern, Scandinavian, industrial, classic) → budget (USD) → review
  and create
- One question per screen, progress bar, back/next without losing answers,
  inline validation (for example a window must fit on its wall), review step
- Units: metric and imperial, switchable at any time

### 2. 3D editor (the centerpiece)

- React Three Fiber + drei
- Room generated procedurally from the wizard data: floor, walls, ceiling,
  window and door openings cut into the walls
- Catalog of ~25 items in categories (seating, tables, storage, beds,
  lighting, decor), built procedurally from simple shapes or from CC0 models,
  with real-world dimensions
- Drag furniture across the floor, rotate in 15° steps, snap to walls and to
  a grid, prevent overlaps (bounding-box collision check)
- Materials and colors: floor (wood, tile, carpet), wall paint, fabric colors
- Camera modes: orbit, top-down 2D plan with measurements, first-person walk
- Day/night lighting; lamps light the room at night
- Undo/redo for every change, keyboard shortcuts
- Clearance warnings, for example "walkway narrower than 80 cm",
  "door swing blocked"

### 3. AI layout assistant (Python backend)

- Chat panel: "Make this feel bigger", "Add a reading corner under $400",
  "Arrange for 6 people to watch TV"
- The backend sends the room as JSON (dimensions, openings, furniture with
  positions) to the LLM and requires a strict structured response: a list of
  operations (add / move / rotate / remove / change material), each with a
  one-sentence reason
- Every operation is validated on the server (schema, room bounds, collisions,
  budget) before it is returned; invalid ones are rejected or repaired
- The frontend shows proposed changes as a highlighted preview the user can
  accept or reject, applied as one undoable step
- "Generate 3 layout options" mode shows thumbnails of three alternatives
- Google Gemini API free tier; the key stays on the server only

### 4. Budget and shopping list

- Every catalog item has a price range in USD; running total vs. the wizard
  budget with a visual meter
- Shopping list grouped by category, exportable as CSV

### 5. Save, share, export

- Firebase Auth (Google sign-in) plus "Try the demo": anonymous sign-in that
  opens a ready-made sample room, so a reviewer can try everything in
  10 seconds without an account
- Projects saved to Firestore with autosave and a "last saved" indicator
- Named version snapshots; restore any of them
- PDF export: top-down floor plan with measurements, 3D snapshot, shopping
  list (generated in the browser)
- Read-only share link that opens the 3D view without signing in

### 6. Polish

- English only
- Responsive: editor usable on tablets; phones get a viewer mode
- Accessible: keyboard navigation for every control, focus states,
  reduced-motion support
- Empty, loading and error states; a short onboarding tour

## Tech stack

- **Frontend:** React 19 + TypeScript (strict) + Vite, React Three Fiber,
  drei, Tailwind CSS, Zustand (state + undo/redo history), React Hook Form +
  Zod (wizard validation), Vitest + React Testing Library, Playwright (one E2E
  test of the full happy path)
- **Backend:** Python 3.12 + FastAPI, Pydantic models for every request and AI
  response, pytest, per-user rate limit (20 AI requests a day), Firebase ID
  token verification on every request, Dockerfile
- **Data:** Firestore (projects, versions, shares, rate-limit counters),
  Firebase Auth
- **Hosting (all free):** Firebase Hosting for the frontend; Hugging Face
  Spaces (Docker) for the FastAPI backend
- **CI:** GitHub Actions running lint, type check, unit tests and build for
  both frontend and backend

## Architecture rules

- Domain logic is pure, framework-free and unit tested: room geometry,
  collision detection, snapping, clearance rules, budget totals, validation of
  AI operations.
- The operation schema is shared: Pydantic models are the source of truth,
  exported as JSON Schema to `/shared/schema`, with TypeScript types generated
  from it. CI fails if generated files are stale.
- Geometry rules exist in TypeScript (live editor) and Python (server-side AI
  validation). Both run the same JSON test cases in `/shared/fixtures` so they
  cannot drift. The furniture catalog is defined once in `/shared/catalog`.
- 3D performance: instanced meshes for repeated geometry, no whole-scene
  re-render on drag, steady 60 fps on a mid-range laptop.
- Firestore security rules: a user reads and writes only their own projects;
  share links are read-only.
- No secrets in the repo. `.env.example` files document every variable. The
  LLM key lives only in the backend's environment.
- No paid services and no Cloud Functions (they need the paid Blaze plan).

## Storage on the free plan

New Firebase projects cannot create a Cloud Storage bucket on the free Spark
plan, so nothing uses Firebase Storage:

- Project and version thumbnails: small WebP images (~20-40 KB) stored in
  Firestore, in documents separate from the room data. Used on "My projects"
  cards and in version history.
- PDFs, 3D snapshots and the three AI option thumbnails are generated in the
  browser when needed and not stored.
- Share links are published snapshots in `shares/{randomId}`: readable
  without sign-in, updated or revoked by the owner.
- Link previews (WhatsApp, LinkedIn) use one static image for the whole site;
  per-project previews would need server-rendered HTML, which free Firebase
  Hosting cannot do.

## Backend on free hosting

- Space containers restart and sleep, so the AI rate-limit counters live in
  Firestore, written by the API through the Firebase Admin SDK (service
  account stored as a Space secret).
- Free Spaces sleep after about 48 hours idle. The web app calls `/health` on
  load to wake the API, and the chat shows a "waking up the assistant" state
  until it responds.

## Deliverables

- Monorepo: `/web` (frontend), `/api` (backend), `/shared` (schemas, catalog,
  fixtures), `/docs`
- README: one-paragraph pitch, live demo link, GIF of the AI assistant
  rearranging a room, feature list, architecture diagram, key decisions and
  trade-offs, running locally, deploying, and how AI output is validated
- Seed data for the demo room
- Test coverage on all domain logic

## Build order (stop after each phase for review)

1. Monorepo, tooling, CI, Firebase project config, empty deployed shell
2. Room setup wizard + procedural room generation in 3D
3. Furniture catalog, drag/rotate/snap/collision, undo/redo
4. Materials, lighting, camera modes, clearance warnings
5. Save/load, versions, demo mode, share link
6. FastAPI backend + AI assistant with validated operations and preview
7. Budget, shopping list, PDF export
8. Accessibility pass, responsive pass, onboarding
9. README, screenshots, GIF, final deploy
