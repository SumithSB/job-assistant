# Backend Review Checklist (Python / FastAPI)

## Correctness
- [ ] Route handlers are thin — business logic is in `services/`, not route functions
- [ ] Service methods return typed objects, not raw dicts
- [ ] Pydantic schemas have separate `Create`, `Update`, `Response` models
- [ ] All datetimes use `datetime.now(UTC)` not deprecated `datetime.utcnow()`
- [ ] UUID fields typed as `uuid.UUID`, not bare `str`

## Async Safety
- [ ] `expire_on_commit=False` on `AsyncSessionLocal`
- [ ] No lazy-loaded relationships — all accessed via `selectinload()` or `joinedload()`
- [ ] No missing `await` on async calls (silent fire-and-forget bugs)
- [ ] Session yielded via `Depends(get_session)` — never instantiated manually in routes

## Security
- [ ] Every user-data query filters: `.where(Model.user_id == current_user.id)`
- [ ] No f-strings inside `text()` SQL expressions
- [ ] No hardcoded secrets, API keys, or passwords in diff

## Performance
- [ ] No N+1: no query inside a loop — use `selectinload` or bulk queries
- [ ] pgvector queries have `LIMIT` and use the IVFFlat index
- [ ] No synchronous I/O in async routes: no `requests.get()`, `open()`, `time.sleep()`

## Maintainability
- [ ] No duplicated logic between route handlers — shared logic lives in `services/`
- [ ] Errors don't expose internal details (no raw SQLAlchemy exception messages to client)
- [ ] New env vars documented in `.env.example`
