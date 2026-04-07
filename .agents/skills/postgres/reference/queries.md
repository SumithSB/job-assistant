# Query Patterns

## Eager loading (avoid N+1)

```python
from sqlalchemy.orm import selectinload, joinedload

# selectinload: separate IN query per relationship — best for collections
stmt = (
    select(Application)
    .options(
        selectinload(Application.job),
        selectinload(Application.documents),
    )
    .where(Application.user_id == user_id)
    .order_by(Application.applied_at.desc())
)
result = await session.execute(stmt)
apps = result.scalars().all()

# joinedload: LEFT OUTER JOIN — best for single-object relationships
stmt = (
    select(Application)
    .options(joinedload(Application.job))
    .where(Application.id == app_id, Application.user_id == user_id)
)
```

## Upsert (PostgreSQL ON CONFLICT)

```python
from sqlalchemy.dialects.postgresql import insert

stmt = insert(Job).values(**job_data)
stmt = stmt.on_conflict_do_update(
    index_elements=["url"],       # unique constraint column
    set_={
        "title": stmt.excluded.title,
        "description": stmt.excluded.description,
        "updated_at": func.now(),
    },
)
await session.execute(stmt)
```

## Keyset pagination (not OFFSET — breaks at scale)

```python
from datetime import datetime

async def list_jobs(
    session: AsyncSession,
    user_id: uuid.UUID,
    cursor: datetime | None,
    limit: int = 20,
) -> list[Job]:
    stmt = select(Job).where(Job.user_id == user_id)

    if cursor:
        stmt = stmt.where(Job.created_at < cursor)   # keyset: page by timestamp

    stmt = stmt.order_by(Job.created_at.desc()).limit(limit)
    result = await session.execute(stmt)
    return result.scalars().all()

# Next page cursor = last item's created_at serialized as ISO string
```

## Bulk insert

```python
from sqlalchemy import insert

await session.execute(
    insert(Job),
    [{"title": j["title"], "company": j["company"], "user_id": user_id} for j in jobs],
)
```
