---
name: finishing-a-development-branch
description: Runs the pre-merge checklist for a development branch — cleanup, tests, dependency audit, changelog, PR creation. Invoked explicitly by devops-agent after QA green and security sign-off.
---

# Finishing a Development Branch

Pre-conditions: QA verdict **GREEN** + security verdict **APPROVED**. Do not run without both.

## Current branch status

```!
git fetch origin 2>/dev/null
echo "=== Commits to merge ==="
git log --oneline origin/main..HEAD 2>/dev/null | head -20
echo "=== Behind main by ==="
git log --oneline HEAD..origin/main 2>/dev/null | wc -l
echo "=== Changed files ==="
git diff origin/main...HEAD --stat 2>/dev/null | tail -5
```

## Steps

**Step 1 — Rebase if behind main**
```bash
git fetch origin
git rebase origin/main   # rebase, never merge
```

**Step 2 — Remove debug code**
- `console.log`, `print(...)` debug statements
- `TODO: remove` comments
- Commented-out code blocks
- Hardcoded credentials or test data

**Step 3 — Run all tests** (full checklist in [reference/test-checklist.md](reference/test-checklist.md))

**Step 4 — Dependency audit**
```bash
cd backend && pip audit
cd frontend && npm audit --audit-level=high
```

**Step 5 — Update CHANGELOG.md** — append under `## [Unreleased]` (user-facing language, not tech jargon)

**Step 6 — Create PR** — use the template in [reference/pr-template.md](reference/pr-template.md)

**Step 7 — Merge + cleanup** — squash for small features, merge commit for large ones; delete branch after merge

**Step 8 — Post-merge verification**
```bash
gh run watch   # watch CI
curl -s https://staging.jobtracker.app/health | jq .
```
