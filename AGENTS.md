# Job Tracking Assistant

An AI-powered job application tracker. Users manage their job search pipeline — adding postings, tracking application status, scheduling interviews, and optimizing resumes/cover letters using semantic search and LLM assistance.

## Tech Stack

- **Backend**: FastAPI (Python 3.11+), async SQLAlchemy, Alembic migrations
- **Database**: PostgreSQL 16; **pgvector** added when embedding-based similarity ships (see `docs/embedding-strategy.md`)
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Vite
- **AI**: LLM API for generation and structured extraction; pgvector 1536-dim embeddings (provider-agnostic — wire your SDK of choice)
- **Integrations**: Gmail MCP (email tracking), Google Calendar MCP (interview scheduling)
- **Testing**: Playwright (E2E), pytest + httpx (backend)
- **Infrastructure**: Docker Compose (local), AWS ECS (prod)

## Domain Model

```
Job          → company, title, url, description, requirements, salary_range, location
Application  → job_id, status, applied_at, notes, resume_version_id, cover_letter_id
Status       → wishlist | applied | phone_screen | interview | offer | rejected | accepted
Contact      → name, role, email, linkedin, job_id (recruiter/hiring manager)
Document     → type (resume|cover_letter), content, version, application_id
Interview    → application_id, scheduled_at, type, calendar_event_id, notes
```

## Agent workflow

Role prompts live under `.agents/agents/`. Typical order:

```
architect → backend-agent + ai-rag-agent + ui-agent (parallel)
                         ↓
                  security-agent
                         ↓
                    qa-agent
                         ↓
                  devops-agent
```

Reusable task prompts live under `.agents/skills/` (invoke by path or your tool’s skill mechanism).

## AI-assisted development lifecycle

Use this on **every** non-trivial change so work stays aligned with the codebase, avoids hallucinated APIs, and neither over- nor under-builds.

| Phase | What to do | Source |
| ----- | -----------| ------ |
| **Plan** | Schema/API/file impact, dependency order, risks; one clarifying question if scope is unclear | `.agents/agents/architect.md` |
| **Implement** | Follow the layer you are changing (thin routes, user scoping, prompts on disk, etc.) | `backend-agent.md` / `ui-agent.md` / `ai-rag-agent.md` |
| **Harden** | Auth, IDOR, injection, LLM prompt safety, secrets | `.agents/agents/security-agent.md` + skill `owasp-security` |
| **Verify** | Tests, types, E2E where appropriate | `.agents/agents/qa-agent.md` + skills `webapp-testing`, `postgres` |
| **Ship** | CI, changelog, branch hygiene (when merging) | `.agents/agents/devops-agent.md` |

**Anti-hallucination:** Inspect the repo (read/search) before claiming types, routes, or env vars exist; cite real paths.

**Scope:** Smallest change that meets the ask; no unrelated refactors; no new dependencies without justification; match existing patterns.

**Skills:** Pull in `.agents/skills/job-assistant-pipeline` for ingest/scoring/resume/roadmap work; `.agents/skills/mcp-builder` before new MCP-shaped APIs.

*Trivial one-file fixes* can skip a written architect plan but must still obey conventions in this file and the relevant agent prompt.

Cursor and other hosts: workspace rules `.cursor/rules/development-lifecycle.mdc` (lifecycle) and `.cursor/rules/communication-style.mdc` (default terse / “caveman” replies; switch to detailed prose only when user explicitly asks).

## Key conventions

- All API endpoints require JWT Bearer auth except `GET /health` and `POST /auth/*`
- Route prefix: `/api/v1/`
- pgvector (when enabled): `embedding vector(D)` on `jobs`; dimension `D` matches chosen embedding model; IVFFlat index, 100 lists
- Frontend routes: `/dashboard`, `/jobs`, `/applications`, `/analytics`, `/settings`
- Python env vars via `python-dotenv`; never hardcode secrets
- Database migrations via Alembic — always generate versioned migration files, never raw `ALTER TABLE`
- All async SQLAlchemy sessions use `AsyncSession` with `expire_on_commit=False`
- Error responses: `{"error": "message", "detail": "..."}` shape, consistent across all endpoints
- Frontend API calls use a typed `apiClient` wrapper — never raw `fetch`

## Project structure

```
backend/
  app/
    api/v1/          # Route handlers
    models/          # SQLAlchemy ORM models
    schemas/         # Pydantic request/response schemas
    services/        # Business logic
    db/              # Session, base, migrations
  tests/
frontend/
  src/
    components/      # Reusable UI components
    pages/           # Route-level page components
    hooks/           # Custom React hooks
    api/             # apiClient + typed endpoints
    store/           # Global state (Zustand)
.agents/
  agents/            # Role system prompts (orchestrator, backend, UI, …)
  skills/          # Focused task skills (postgres, testing, security, …)
```

## MCP integrations

- **Gmail**: Scan inbox for application confirmations, recruiter emails, rejection notices → auto-update application status
- **Google Calendar**: Create/update interview events from application data; pull scheduled interviews back into the tracker

## Security baseline

- JWT via `python-jose`, tokens expire in 24h, refresh tokens in `httponly` cookies
- CORS restricted to frontend origin
- All user-supplied strings sanitized; parameterized queries only (no raw SQL with f-strings)
- Secrets: `DATABASE_URL`, `JWT_SECRET`, LLM credentials (e.g. `LLM_API_KEY` or your vendor’s env name), `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
