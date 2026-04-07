# Environment contracts

Backend reads **`python-dotenv`** from `backend/.env` (or process env in production).

## Core

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Yes (non-mock) | HS256 secret for access tokens (local auth). |
| `JWT_EXPIRE_HOURS` | No | Default `24`. |
| `CORS_ORIGINS` | No | Comma-separated origins; default `http://localhost:5173`. |

## `AUTH_MODE`

| Value | Behavior |
|-------|----------|
| `local` (default) | Register/login via FastAPI; JWT signed with `JWT_SECRET`. |
| `supabase` | *(stub for later)* Validate Supabase JWT via JWKS; same `user_id` mapping once implemented. |

Frontend local login uses **`/api/v1/auth/register`** and **`/api/v1/auth/login`** only when `AUTH_MODE=local`.

## `STORAGE_BACKEND`

| Value | Behavior |
|-------|----------|
| `none` (default) | Resume and artifacts are **text in Postgres** only. |
| `filesystem` | *(future)* Local path for uploads. |
| `supabase` | *(future)* Supabase Storage bucket. |

Phase A does not require non-`none` storage.

## LLM

| Variable | Description |
|----------|-------------|
| `LLM_PROVIDER` | `mock` (no external API) or `chat` (OpenAI-compatible HTTP). |
| `LLM_MODEL` | Model id at the chosen server (e.g. Ollama `llama3.2`, or cloud model name). |
| `LLM_BASE_URL` | Optional; default `http://127.0.0.1:11434/v1` for local Ollama. For Gemini OpenAI-compat: `https://generativelanguage.googleapis.com/v1beta/openai/`. |
| `LLM_API_KEY` | Optional for local Ollama; set for hosted APIs (`Bearer` token). |

## Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of FastAPI, e.g. `http://localhost:8000`. |
