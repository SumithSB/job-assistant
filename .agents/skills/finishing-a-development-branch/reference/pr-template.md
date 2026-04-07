# PR Description Template

```markdown
## Summary
- [What does this change — 1-3 bullets, user-facing language]

## Technical Notes
- DB migrations included: yes / no
- Breaking API changes: yes / no
- [Any architecture decisions worth documenting]

## Test Coverage
- Backend pytest: PASS (X/X tests)
- Frontend vitest: PASS (X/X tests)
- Playwright E2E: PASS (X/X tests)

## Checklist
- [ ] QA sign-off: GREEN
- [ ] Security sign-off: APPROVED
- [ ] CHANGELOG updated
- [ ] No debug code or hardcoded secrets
- [ ] Alembic downgrade() implemented (if migrations)
- [ ] pip audit clean
- [ ] npm audit clean
```
