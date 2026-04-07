# pgvector Index & Search Queries

## Create the IVFFlat index (Alembic migration)

```python
def upgrade():
    op.execute("""
        CREATE INDEX CONCURRENTLY jobs_embedding_idx
        ON jobs
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    """)
    # CONCURRENTLY avoids locking in prod.
    # Requires at least ~3× lists (300+) rows to be useful.

def downgrade():
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS jobs_embedding_idx;")
```

## Semantic search query

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job import Job

async def find_similar_jobs(
    session: AsyncSession,
    query_embedding: list[float],
    user_id: uuid.UUID,
    limit: int = 10,
) -> list[Job]:
    # Tune recall/speed tradeoff at query time
    await session.execute(text("SET ivfflat.probes = 10"))

    result = await session.execute(
        select(Job)
        .where(Job.embedding.isnot(None))
        .where(Job.user_id == user_id)          # always scope to user
        .order_by(Job.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )
    return result.scalars().all()
```

## Cosine distance vs similarity

- `cosine_distance` returns 0 (identical) → 2 (opposite)
- Similarity threshold of 0.7 = distance < 0.3: `Job.embedding.cosine_distance(q) < 0.3`
- For an exact similarity score: `similarity = 1 - (distance / 2)`

## Generate embeddings

```python
# Use OpenAI text-embedding-3-small (1536-dim)
import openai

async def embed_text(text: str) -> list[float]:
    response = await openai.AsyncOpenAI().embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding
```

## Re-embed on description change (service layer)

```python
async def update_job(session: AsyncSession, job: Job, data: JobUpdate) -> Job:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    if "description" in data.model_fields_set and job.description:
        job.embedding = await embed_text(job.description)

    await session.flush()
    return job
```
