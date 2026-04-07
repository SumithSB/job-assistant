---
name: webapp-testing
description: Playwright E2E testing for this React + FastAPI app. Activates when writing browser tests, setting up test infrastructure, debugging flaky tests, or when test files are mentioned.
paths: tests/**,frontend/**,*.spec.ts,playwright.config.ts
---

# Webapp Testing (Playwright)

Framework: Playwright with TypeScript, Page Object Model, custom auth fixture.

## Quick commands

```bash
npx playwright test                  # run all
npx playwright test --ui             # interactive mode
npx playwright test --debug          # step-by-step debugger
npx playwright show-report           # HTML report
npx playwright install --with-deps chromium
```

## Selector priority (most resilient → least)

1. `getByRole("button", { name: "Submit" })` — semantic
2. `getByLabel("Email")` — form labels
3. `getByText("Welcome")` — visible text
4. `getByTestId("application-card")` — explicit test ID
5. `locator(".css-class")` — last resort

## Reference material

- Page Object Model pattern → [reference/pom.md](reference/pom.md)
- Auth fixture (skip UI login in every test) → [reference/auth-fixture.md](reference/auth-fixture.md)
- Writing test specs with examples → [reference/writing-tests.md](reference/writing-tests.md)
- playwright.config.ts setup → [reference/config.md](reference/config.md)
- Flaky test debugging + CI setup → [reference/debugging-ci.md](reference/debugging-ci.md)
