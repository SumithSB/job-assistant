---
name: code-reviewer
description: Runs a structured code review on recent changes — correctness, security, async safety, TypeScript types, and accessibility. Invoked explicitly before QA sign-off or when reviewing a PR.
---

# Code Reviewer

Structured review for job-tracking-assistant: FastAPI backend, async SQLAlchemy, React + TypeScript, pgvector.

## Changes under review

```!
echo "=== Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null) ==="
echo "=== Changed files ==="
git diff origin/main...HEAD --name-only 2>/dev/null || git diff HEAD~1 --name-only 2>/dev/null
echo ""
echo "=== Diff summary ==="
git diff origin/main...HEAD --stat 2>/dev/null || git diff HEAD~1 --stat 2>/dev/null
```

Full diff (first 300 lines):

```!
git diff origin/main...HEAD 2>/dev/null | head -300 || git diff HEAD~1 2>/dev/null | head -300
```

## Review scope

Work through these checklists for every changed file:

- Backend (Python/FastAPI) → [reference/backend.md](reference/backend.md)
- Frontend (React/TypeScript) → [reference/frontend.md](reference/frontend.md)
- Anti-patterns with code examples → [reference/anti-patterns.md](reference/anti-patterns.md)

## Output

Use this report format:

```
Code Review — [date]
Branch: [branch name]
Files reviewed: [list]

BLOCKERS (must fix before merge):
  [file:line] — [issue]

WARNINGS (should fix, not blocking):
  [file:line] — [issue]

NOTES:
  [observation]

Verdict: APPROVED | APPROVED WITH NOTES | BLOCKED
```
