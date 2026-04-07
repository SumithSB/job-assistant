# Writing Tests

## Full example spec

```typescript
// tests/e2e/specs/applications.spec.ts
import { test, expect } from "../fixtures/auth";
import { ApplicationsPage } from "../pages/ApplicationsPage";

test.describe("Applications pipeline", () => {
  test("user can add and track an application", async ({ authenticatedPage }) => {
    const appsPage = new ApplicationsPage(authenticatedPage);
    await appsPage.goto();

    await appsPage.addApplication({
      company: "Acme Corp",
      title: "Senior Engineer",
      url: "https://acme.com/jobs/123",
    });

    await expect(authenticatedPage.getByText("Acme Corp").first()).toBeVisible();
    await authenticatedPage.screenshot({ path: "test-results/after-add.png" });
  });

  test("status filter shows only matching applications", async ({ authenticatedPage }) => {
    const appsPage = new ApplicationsPage(authenticatedPage);
    await appsPage.goto();
    await appsPage.filterByStatus("interview");

    const cards = await appsPage.applicationCards.all();
    for (const card of cards) {
      await expect(card.locator("[data-status]")).toHaveAttribute("data-status", "interview");
    }
  });
});
```

## What to test for each feature

Every new feature needs at least:
1. **Happy path** — the primary user action works end to end
2. **Error state** — what the user sees when something fails (API 400/500)
3. **Data scoping** — user only sees their own data, not other users'

## Waiting for network correctly

```typescript
// GOOD — wait for specific API response
await page.waitForResponse("**/api/v1/applications*");

// BAD — arbitrary timeout, breaks in CI
await page.waitForTimeout(2000);
```

## `data-testid` convention

Add `data-testid` to any dynamic list items so Playwright can target them:

```tsx
// In React components
<div data-testid="application-card" data-status={application.status}>
```
