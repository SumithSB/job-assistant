# From repo root. Requires: Postgres up, backend/.env, `uv sync` + `alembic upgrade head` done once.
.PHONY: dev backend-dev frontend-dev

dev:
	@$(MAKE) -j2 backend-dev frontend-dev

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend-dev:
	cd frontend && npm run dev
