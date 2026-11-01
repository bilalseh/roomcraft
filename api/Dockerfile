# syntax=docker/dockerfile:1

# The build context is the repository root: docker build -f api/Dockerfile .
# The Hugging Face Space mirrors that layout, with this file at its root.

FROM python:3.12-slim-trixie AS build
COPY --from=ghcr.io/astral-sh/uv:0.12.21 /uv /bin/uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0
WORKDIR /app

# Dependencies first, so this layer stays cached until the lockfile changes.
COPY api/pyproject.toml api/uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

COPY api/src ./src
RUN uv sync --locked --no-dev --no-editable


FROM python:3.12-slim-trixie
# Hugging Face Spaces run containers as uid 1000.
RUN useradd --create-home --uid 1000 app
COPY --from=build /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1
USER app
WORKDIR /home/app
EXPOSE 7860
CMD ["uvicorn", "roomcraft_api.main:app", "--host", "0.0.0.0", "--port", "7860"]
