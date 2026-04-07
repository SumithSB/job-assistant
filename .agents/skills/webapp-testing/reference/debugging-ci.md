# Debugging Flaky Tests & CI Setup

## Flaky test causes & fixes

| Cause | Symptom | Fix |
|---|---|---|
| Network race | Passes locally, fails in CI | `waitForResponse("**/api/v1/**")` instead of `waitForTimeout` |
| Locator ambiguity | "Strict mode: multiple elements" | Use `getByRole` + `name`, or add `data-testid` |
| Auth state leakage | Random auth failures across tests | Use isolated `authenticatedPage` fixture (re-creates per test) |
| Flapping CI | 30% failure rate | Add `retries: 2` in CI environment |

## Debug tools

```bash
npx playwright test --debug          # step through with DevTools
npx playwright test --trace on       # record trace for every test
npx playwright show-trace trace.zip  # inspect recorded trace
```

## CI: GitHub Actions

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npx playwright test
  env:
    CI: true

- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

## When tests fail in CI but pass locally

1. Check `CI=true` retries are set (2 is a safe number)
2. Check `baseURL` matches CI server address
3. Check `webServer.reuseExistingServer: !process.env.CI` — CI always starts fresh
4. Download the artifact HTML report for full screenshots + traces
