# Auth Fixture

Skip UI login in every test. Hit the API directly to get a token, then inject it.

```typescript
// tests/e2e/fixtures/auth.ts
import { test as base, type Page } from "@playwright/test";

type AuthFixtures = { authenticatedPage: Page };

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const res = await page.request.post("/api/v1/auth/login", {
      data: { email: "test@example.com", password: "testpassword123" },
    });
    const { access_token } = await res.json();

    // Inject before page loads so auth state is ready immediately
    await page.addInitScript((token: string) => {
      localStorage.setItem("access_token", token);
    }, access_token);

    await use(page);
  },
});

export { expect } from "@playwright/test";
```

**Usage in tests:**

```typescript
import { test, expect } from "../fixtures/auth";

test("user sees their applications", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/applications");
  await expect(authenticatedPage.getByText("My Applications")).toBeVisible();
});
```

**Isolation:** Each test gets its own `authenticatedPage`. No state leaks between tests.
