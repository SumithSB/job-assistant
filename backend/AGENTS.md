# Backend context

FastAPI + async SQLAlchemy 2.x + pgvector. Python 3.11+.

## Structure

```
app/
  api/v1/      # Route handlers (thin — delegate to services/)
  models/      # SQLAlchemy ORM models
  schemas/     # Pydantic request/response models (separate Create/Update/Response)
  services/    # Business logic
  db/          # session.py, base.py, alembic/
tests/
  unit/        # Service layer tests (no DB)
  integration/ # Tests hitting real test DB
```

## Conventions

- Routes call services; services own business logic
- All sessions via `Depends(get_session)` — never instantiate manually
- `expire_on_commit=False` on `AsyncSessionLocal` — always
- All user-data queries: `.where(Model.user_id == current_user.id)`
- Pydantic schemas: `JobCreate`, `JobUpdate`, `JobResponse` — never reuse
- Error shape: `{"error": "message", "detail": "..."}` — consistent everywhere

## Run commands

```bash
uvicorn app.main:app --reload     # dev server
pytest tests/ -v                  # tests
alembic upgrade head              # apply migrations
alembic revision --autogenerate   # generate migration
mypy app/                         # type check
python -m ruff format .           # format
```

## Active skills

Use `.agents/skills/postgres` when working in this package.
