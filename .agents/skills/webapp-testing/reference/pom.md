# Page Object Model Pattern

Always use POMs — never put locators directly in test bodies.

```typescript
// tests/e2e/pages/ApplicationsPage.ts
import { type Page, type Locator, expect } from "@playwright/test";

export class ApplicationsPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly statusFilter: Locator;
  readonly applicationCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByRole("button", { name: "Add Application" });
    this.statusFilter = page.getByRole("combobox", { name: "Status" });
    this.applicationCards = page.locator("[data-testid='application-card']");
  }

  async goto() {
    await this.page.goto("/applications");
    await expect(this.applicationCards.first()).toBeVisible();
  }

  async addApplication(data: { company: string; title: string; url: string }) {
    await this.addButton.click();
    await this.page.getByLabel("Company").fill(data.company);
    await this.page.getByLabel("Job Title").fill(data.title);
    await this.page.getByLabel("Job URL").fill(data.url);
    await this.page.getByRole("button", { name: "Save" }).click();
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForResponse("**/api/v1/applications*");
  }
}
```

## File structure

```
tests/
  e2e/
    fixtures/         # auth.ts, db-seed.ts
    pages/            # POMs — one file per page
    specs/            # *.spec.ts test files
  playwright.config.ts
```
