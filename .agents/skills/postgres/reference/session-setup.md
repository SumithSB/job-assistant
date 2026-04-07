# Session Setup & Engine Config

```python
# backend/app/db/session.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from collections.abc import AsyncGenerator

engine = create_async_engine(
    settings.DATABASE_URL,       # postgresql+asyncpg://user:pass@host:5432/dbname
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,          # validates connections on checkout
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,      # CRITICAL — prevents MissingGreenlet after await commit()
    autoflush=False,
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

**FastAPI dependency injection:**
```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session

@router.get("/jobs")
async def list_jobs(session: AsyncSession = Depends(get_session)):
    ...
```
