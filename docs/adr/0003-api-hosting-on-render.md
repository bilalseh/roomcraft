# ADR-0003: API hosting on Render

- Status: Accepted. Replaces Hugging Face Spaces, the host in the original plan.
- Date: 2026-11-01

## Context

The API runs as a Docker container and must be hosted for free: the project uses no paid services.
The original plan was a Docker Space on Hugging Face's free CPU hardware. The first deploy failed
with HTTP 402: Hugging Face now requires a PRO subscription ($9 a month) to create Docker or Gradio
Spaces. Only static Spaces remain free.

## Decision

Host the API on Render's free web service plan, defined as code in `render.yaml`:

- Render builds `api/Dockerfile` with the repository root as the build context, the same build CI
  runs and smoke-tests.
- `autoDeployTrigger: checksPass`: Render deploys a commit on `main` only after its GitHub checks
  pass, so CI gates the deploy without holding any Render credentials.
- A build filter limits deploys to changes in `api/`, `shared/` and `render.yaml`.
- The container listens on `$PORT`, which Render sets. The image defaults to 8000.

## Alternatives considered

- **Hugging Face PRO.** $9 a month, which breaks the no-paid-services rule.
- **Google Cloud Run.** A generous free allowance and fast cold starts, but it needs a billing
  account with a card. Enabling billing on the Firebase project would also move it off the free
  Spark plan, so the API would need a separate Google Cloud project.
- **Koyeb.** Its free tier now requires a card.

## Consequences

- Free instances sleep after 15 minutes without traffic and take about a minute to wake, compared
  with roughly 48 hours of idle time on Spaces. The web app already calls `/health` on load and
  shows a waking state while it waits; the AI chat will do the same.
- A free instance has 512 MB of memory and a fraction of a CPU. That is enough for validating layout
  operations; LLM calls are I/O bound.
- Server secrets (the Gemini API key, the Firebase service account) are Render environment
  variables.
- Instances restart and sleep, so state such as AI rate-limit counters stays in Firestore, as
  already planned.
