---
name: job-assistant-pipeline
description: End-to-end job posting ingestion, structured extraction, explainable fit scoring, ATS-safe resume variants, per-job and cumulative learning roadmaps, and guardrails for the job-tracking-assistant product. Use when implementing or changing URL/paste ingest, LLM extraction, scoring, resume generation, roadmaps, tracking prompts, or discovery/chat boundaries.
paths: backend/**,frontend/**,.agents/agents/**
---

# Job assistant pipeline

Stack context: FastAPI, PostgreSQL + pgvector, LLM layer, React dashboard ([AGENTS.md](../../../AGENTS.md) at repo root).

## When this skill applies

- User pastes a job URL or full posting text.
- Fit score vs the user’s **master profile** (resume + structured skills).
- Generating a **job-specific, ATS-friendly** resume variant.
- Per-job **skill breakdown** and **preparation roadmap**.
- Optional **track job** → application pipeline and dashboard.
- **Cumulative roadmap** across tracked applications.
- Later: RAG chat and web-assisted job discovery (policy boundaries only here — implementation follows [ai-rag-agent](../../agents/ai-rag-agent.md)).

## Non-negotiables

1. **User scoping**: Every read/write for jobs, profiles, applications, roadmaps filters by `user_id` (see [postgres skill](../postgres/SKILL.md)).
2. **Facts**: Resume variants must only **assert facts present** in the master profile or explicit user edits. Mark inferred items as `assumptions` or omit them — no invented employers, dates, or credentials.
3. **Structured outputs**: Use tool/function calling (or equivalent) and Pydantic schemas for extraction, scores, and roadmap JSON — never free-form “JSON in prose” for persistence.
4. **Prompt safety**: Wrap untrusted posting text in XML tags (e.g. `<job_posting>...</job_posting>`). Validate types and enums before DB writes.
5. **Ingestion**: Treat URL fetch as best-effort. Many boards block bots or require login — always support **pasted full description** as fallback. Defer aggressive scraping to a later phase with robots.txt, rate limits, and legal review.

## Pipeline stages (conceptual)

1. **Ingest** — Resolve URL → `raw_html` / `fetch_error`; normalize to `clean_text` (readability-style). If fetch fails or text is thin, require pasted text.
2. **Extract** — Fill [extraction schema](reference/extraction-schema.md).
3. **Fit** — Compute [fit assessment](reference/fit-rubric.md) with evidence strings per dimension.
4. **Resume** — Generate variant per [ATS rules](reference/ats-resume.md); store as `Document` or `resume_variants` linked to `job_id` / `application_id`.
5. **Roadmap** — Per-job plan JSON (topics, order, time hints). **Aggregate** with [merge rules](reference/roadmap-merge.md).
6. **Track** — Prompt user; if yes, create `Application` with initial status (e.g. `wishlist` or `applied`).

## Embedding and hybrid scoring

- Optionally combine LLM rubric with **cosine similarity** between embeddings of `clean_text` (or title+company+reqs) and master profile text. Keep dimensions and IVFFlat settings aligned with repo convention (1536-dim, cached on `jobs`).
- Do not re-embed if normalized source text is unchanged.

## Reference material

- Field-level extraction → [reference/extraction-schema.md](reference/extraction-schema.md)
- Fit score dimensions and evidence → [reference/fit-rubric.md](reference/fit-rubric.md)
- ATS resume constraints → [reference/ats-resume.md](reference/ats-resume.md)
- Cumulative roadmap merge → [reference/roadmap-merge.md](reference/roadmap-merge.md)

## Handoff checks

- [ ] Schemas versioned (e.g. `extraction_version` on `Job`) if prompts change.
- [ ] Long LLM steps async (task queue or background) so HTTP does not time out.
- [ ] Errors return `{"error": "message", "detail": "..."}` per project convention.
