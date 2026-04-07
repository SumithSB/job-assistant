# Fit assessment (explainable score)

## Output shape

Store as JSON alongside optional human-readable summary.

```json
{
  "overall_score": 72,
  "scale_min": 0,
  "scale_max": 100,
  "dimensions": [
    {
      "id": "stack_overlap",
      "label": "Stack overlap",
      "score": 80,
      "weight": 0.25,
      "evidence": ["Posting requires Python and FastAPI; profile lists both.", "No gap for async SQLAlchemy."]
    },
    {
      "id": "seniority_fit",
      "label": "Seniority fit",
      "score": 65,
      "weight": 0.2,
      "evidence": ["Posting asks 5+ years; profile implies ~3 years backend."]
    },
    {
      "id": "domain_familiarity",
      "label": "Domain familiarity",
      "score": 70,
      "weight": 0.15,
      "evidence": []
    },
    {
      "id": "must_have_coverage",
      "label": "Must-have requirement coverage",
      "score": 75,
      "weight": 0.25,
      "evidence": ["Kubernetes listed as must-have; not in profile — gap."]
    },
    {
      "id": "impact_potential",
      "label": "Growth / impact potential",
      "score": 68,
      "weight": 0.15,
      "evidence": ["Strong match on core backend; learning edge in platform SRE topics."]
    }
  ],
  "gaps": [
    { "skill": "Kubernetes", "severity": "high", "source": "requirements_must_have" }
  ],
  "strengths": [
    "Strong alignment on Python API design and PostgreSQL."
  ],
  "redo_embedding_if_profile_changed": true
}
```

## Rules

1. **Every dimension** listed in `dimensions` must include at least one **evidence** string when score ≠ 50 (use “Insufficient data in profile/posting” only if truly missing).
2. **Weights** sum to `1.0`. `overall_score` = round(sum(dim.score × dim.weight)).
3. **`gaps`**: derive primarily from `requirements_must_have` vs profile; severity `high` | `medium` | `low`.
4. **No fabrication**: if the profile does not mention a skill, do not claim the candidate has it.
5. **Optional embedding**: cosine similarity between job and profile embeddings can inform `stack_overlap` / `must_have_coverage` but must not replace evidence strings.

## Model hint

- Extraction/classification-style steps: cheaper/faster model tier per project convention.
- Narrative summary for UI: quality tier, short paragraphs.
