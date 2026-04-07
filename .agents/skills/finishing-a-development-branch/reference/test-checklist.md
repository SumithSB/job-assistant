# Final Test Checklist

All must pass. Stop on first failure — do not proceed.

```bash
# Backend unit + integration tests
cd backend && pytest tests/ --tb=short -q
# Minimum: 80% coverage on services/, 100% on api/auth/

# Frontend unit tests
cd frontend && npm run test -- --run

# E2E
npx playwright test

# Type checks
cd backend && mypy app/ --ignore-missing-imports
cd frontend && npx tsc --noEmit
```

Attach test output to PR description.
