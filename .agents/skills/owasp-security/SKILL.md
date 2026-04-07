---
name: owasp-security
description: Runs an OWASP Top 10 security review on new FastAPI endpoints and features. Invoked explicitly by security-agent before any merge. Reports blockers and issues a signed APPROVED or BLOCKED verdict.
---

# OWASP Security Review

Security audit for the job-tracking-assistant. Scope: FastAPI endpoints, SQLAlchemy queries, auth flows, React components handling tokens or PII, MCP integrations.

## How to invoke

```
/owasp-security [feature name or paths]
# e.g. /owasp-security "job import endpoint" backend/app/api/v1/jobs.py
```

## Priority checks for this app

Run the full checklist in [reference/checklist.md](reference/checklist.md), then output the verdict using the template in [reference/review-template.md](reference/review-template.md).

### Highest-risk areas (check first)

**IDOR (A01)** — grep for `select(` without `user_id` filter:
```bash
grep -rn "select(" backend/app/ | grep -v "user_id"
```

**SQL injection (A03)** — grep for f-string SQL:
```bash
grep -rn 'text(f"' backend/app/
grep -rn "text(f'" backend/app/
```

**Hardcoded secrets (A02)** — grep for secrets in code:
```bash
grep -rn "JWT_SECRET\|DATABASE_URL\|API_KEY\|_SECRET" backend/app/ --include="*.py" | grep -v "settings\.\|os\.environ\|getenv"
```

**Missing auth (A07)** — grep for routes without `Depends(get_current_user)`:
```bash
grep -rn "@router\." backend/app/api/ -A5 | grep -v "get_current_user\|health\|auth"
```

## Verdict

Output using [reference/review-template.md](reference/review-template.md). Return verdict to architect.
- **APPROVED** → qa-agent may proceed
- **BLOCKED** → list exact `file:line` for backend-agent to fix before re-review
