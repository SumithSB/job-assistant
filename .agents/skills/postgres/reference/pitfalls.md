# Common Pitfalls

## MissingGreenlet after commit

**Cause:** `expire_on_commit=True` (default) marks all attributes as expired after commit. Accessing them in async context raises `MissingGreenlet`.

**Fix:** `expire_on_commit=False` in `async_sessionmaker`.

```python
# WRONG
AsyncSessionLocal = async_sessionmaker(engine)   # expire_on_commit defaults True

# RIGHT
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
```

## Lazy loading in async context

**Cause:** SQLAlchemy ORM lazily loads relationships by default. In async, this fires a synchronous query → `MissingGreenlet`.

**Fix:** Always load relationships eagerly or explicitly.

```python
# WRONG — job.title triggers lazy load
application = await session.get(Application, app_id)
print(application.job.title)  # MissingGreenlet

# RIGHT — eager load
stmt = select(Application).options(selectinload(Application.job)).where(...)
```

## Vector dimension mismatch

**Cause:** Embedding column is `Vector(1536)` but the model outputs 768 dims (or vice versa).

**Symptom:** Silent failure or cryptic PostgreSQL error at insert time.

**Fix:** Confirm `len(embedding) == 1536` before inserting. Match column dim to model exactly.

## psycopg2 in async code

**Cause:** Using `postgresql://` (psycopg2) instead of `postgresql+asyncpg://`.

**Symptom:** `greenlet_spawn` errors, or blocking the event loop.

**Fix:** Always use `postgresql+asyncpg://` in `DATABASE_URL` for async SQLAlchemy.

## func.now() vs datetime.utcnow()

- `server_default=func.now()` → DB generates the timestamp at INSERT time (correct for audit fields)
- `default=datetime.utcnow` → Python generates at ORM flush time (fine for application logic)
- Never use `datetime.utcnow()` in `server_default` — it evaluates once at import time

## N+1 queries

**Symptom:** Logs show the same SELECT firing once per item in a loop.

**Fix:** Use `selectinload()` in the parent query instead of accessing relationships in a loop.

```python
# N+1 — one SELECT per application
for app in applications:
    name = app.job.company   # separate query each time

# 2 queries total — one for apps, one batched IN query for jobs
stmt = select(Application).options(selectinload(Application.job))
```
