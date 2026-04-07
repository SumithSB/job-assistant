# Job Tracking Assistant

AI-powered job search companion: ingest postings, explainable fit vs your profile, ATS-style resume variants, prep roadmaps, optional pipeline tracking, and (later) cumulative roadmaps and chat.

## Local-first runbook

1. **Postgres:** `docker compose up -d` from repo root (see `docker-compose.yml`).
2. **Env:** Copy `env.example` → `backend/.env` (or copy `backend/.env.example`). Optionally copy `frontend/env.example` → `frontend/.env`. Set `DATABASE_URL`, `JWT_SECRET`, and `LLM_PROVIDER` (`mock` needs no network; `chat` uses OpenAI-compatible HTTP — e.g. Ollama locally or a cloud endpoint; see `env.example`).
3. **One terminal (API + Vite):** from repo root, after `cd backend && uv sync && uv run alembic upgrade head` and `cd frontend && npm install` once: `make dev`
4. **Or two terminals:** Backend — `cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`. Frontend — `cd frontend && npm run dev`. Open the Vite URL; `VITE_API_URL` should point at the API (default `http://localhost:8000`).

Optional **cloud** profile later: deploy SPA (e.g. Vercel), API on a Python host, `DATABASE_URL` to managed Postgres, `AUTH_MODE=supabase` with JWKS validation — see [`docs/env-contracts.md`](docs/env-contracts.md).

## Tech stack

- **Backend:** FastAPI, async SQLAlchemy 2.x, Alembic, Pydantic v2, `httpx`; LLMs via OpenAI-compatible `chat/completions` (Ollama, OpenAI, Gemini compat URL, etc.).
- **Database:** PostgreSQL 16. **Embeddings / pgvector:** deferred until similarity features; see [`docs/embedding-strategy.md`](docs/embedding-strategy.md).
- **Frontend:** React 18, TypeScript, Vite, Tailwind, react-query, Zustand; typed `api` client (see `frontend/src/api/client.ts`).
- **AI:** `LLM_PROVIDER` = `mock` | `chat` (`backend/app/services/llm/`: mock + OpenAI-compatible client).

## Domain model (Phase A+)

```
User             → id, email, hashed_password
UserProfile      → user_id, master_resume_text, structured_skills (JSON), preferences (JSON)
Job              → user_id, source_url, clean_text, extracted (JSON), fit_assessment (JSON),
                   extraction_version, title, company (denormalized for list views)
Application      → user_id, job_id, status, applied_at, notes
  status: wishlist | applied | phone_screen | interview | offer | rejected | accepted
ResumeVariant    → user_id, job_id, application_id?, content, profile_version_used
Roadmap          → user_id, job_id, plan (JSON)
AggregateRoadmap → user_id, plan (JSON), source_application_ids[], computed_at (Phase C)
Contact, Document, Interview → as extended in later milestones
```

## API conventions

- Prefix **`/api/v1/`**; **`GET /health`** and **`POST /api/v1/auth/*`** without JWT; all other routes JWT Bearer.
- Errors: `{"error": "short", "detail": "..."}`.
- Sessions: `AsyncSession`, **`expire_on_commit=False`**; all user data queries filter **`user_id`**.

## Product phases

- **A:** Auth, profile, ingest URL/text → job + extraction + fit + resume + roadmap; optional track → application.
- **B:** Dashboard polish, status updates.
- **C:** Aggregate roadmap.
- **D:** Chat / RAG.
- **E:** Discovery (policy-gated).

## Project layout

```
backend/app/     api/v1/, core/, db/, models/, schemas/, services/
frontend/src/    api/, pages/, components/, hooks/, store/
docs/            embedding-strategy.md, env-contracts.md
```

Agent prompts: `.agents/agents/`. Skills: `.agents/skills/` (use **`job-assistant-pipeline`** for pipeline semantics). Human workflow notes: [`AGENTS.md`](AGENTS.md).
