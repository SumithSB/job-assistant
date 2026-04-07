# Embedding strategy

**Status (Phase A):** No `embedding` column on `jobs`. Fit scoring is **LLM-only**. This keeps migrations small and matches the YAGNI guardrail in the master plan.

**When you add similarity search (“similar jobs”, hybrid fit):**

1. Pick **one** embedding model and record its **output dimension** `D`.
2. Use a Postgres image with **pgvector** (e.g. `pgvector/pgvector:pg16`) in Docker Compose.
3. Add Alembic migration: `CREATE EXTENSION IF NOT EXISTS vector;` and `jobs.embedding vector(D)` nullable + IVFFlat index (e.g. 100 lists) per repo `.agents/skills/postgres/reference/migrations.md`.
4. **Local:** optional local embedder (e.g. Ollama + nomic) or call Gemini / OpenAI embedding API from FastAPI only.
5. **Cloud:** same schema; only API keys and network path change.

**Suggested defaults when you implement:** Gemini `text-embedding-004` (768-dim) or OpenAI `text-embedding-3-small` (1536-dim) — **verify current docs** before locking `D`.
