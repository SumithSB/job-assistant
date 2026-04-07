# Roadmaps: per-job and cumulative

## Per-job roadmap JSON (target shape)

```json
{
  "job_id": "uuid",
  "horizon_weeks": 4,
  "priority_skills": [
    {
      "skill": "Kubernetes fundamentals",
      "rationale": "Listed as must-have; gap in profile.",
      "milestones": [
        { "week": 1, "objectives": ["Pods, deployments, services"], "resources": [] },
        { "week": 2, "objectives": ["Helm basics"], "resources": [] }
      ]
    }
  ],
  "interview_prep": [
    { "topic": "System design for APIs", "depth": "mid" }
  ],
  "risks": ["Heavy ops tilt vs current backend depth"]
}
```

Keep `resources` empty or generic placeholders unless curating trusted links is in scope.

## Cumulative merge (across tracked applications)

**Input**: set of per-job roadmaps (or derived gap lists) for user’s active/tracked applications, with optional weights:

- Weight ↑ for status in `applied`, `phone_screen`, `interview`.
- Weight ↓ for `wishlist` or stale postings (e.g. not updated in 60 days).

**Algorithm (deterministic + LLM summary)**:

1. **Normalize skill names** (canonical map: “K8s” → “Kubernetes”).
2. **Aggregate**: count frequency, max severity from fit `gaps`, recency-weighted score.
3. **Deduplicate** milestones: merge overlapping topics; cap top **N** themes (e.g. N=7) for UX.
4. **Ordering**: first by weighted frequency × severity, then by dependency hints if any (optional graph later).
5. Persist `aggregate_roadmaps` with `computed_at`, `source_application_ids[]`, `version`.
6. Generate a short **LLM narrative** only after structured merge — narrative must not introduce new skills not in the merged list.

## UX expectations

- Show “why this is on your list” (evidence from N jobs).
- Refresh cumulative roadmap on user action (“Recompute”) or nightly batch.
