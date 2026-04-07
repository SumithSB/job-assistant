---
name: postgres
description: Async SQLAlchemy 2.x, pgvector semantic search, and Alembic migrations for this FastAPI/PostgreSQL stack. Activates automatically when working in backend/ or on database-related code.
paths: backend/**,tests/backend/**
---

# PostgreSQL + pgvector

Stack: async SQLAlchemy 2.x, asyncpg driver, pgvector (1536-dim IVFFlat), Alembic migrations.

## Non-negotiable rules

- `expire_on_commit=False` on `AsyncSessionLocal` — prevents `MissingGreenlet` errors after commit
- All user-data queries filter by `user_id = current_user.id` (prevents IDOR)
- No lazy loading — use `selectinload()` or `joinedload()` explicitly on every relationship
- Schema changes via Alembic only — never raw `ALTER TABLE` in application code
- Driver: `postgresql+asyncpg://` — never `psycopg2` with async code

## Reference material

- Session setup & engine config → [reference/session-setup.md](reference/session-setup.md)
- SQLAlchemy model patterns (Base, TimestampMixin, Job with Vector) → [reference/models.md](reference/models.md)
- pgvector index creation, cosine search queries → [reference/pgvector.md](reference/pgvector.md)
- Eager loading, upsert, keyset pagination → [reference/queries.md](reference/queries.md)
- Alembic migration conventions → [reference/migrations.md](reference/migrations.md)
- Common pitfalls and gotchas → [reference/pitfalls.md](reference/pitfalls.md)
