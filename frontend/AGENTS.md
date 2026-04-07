# Frontend context

React 18 + TypeScript + Tailwind CSS + Vite + Zustand + react-query.

## Structure

```
src/
  api/         # apiClient wrapper + TypeScript types
  components/  # Reusable UI components
  pages/       # Route-level page components (/dashboard, /jobs, /applications, /analytics)
  hooks/       # Custom React hooks (data fetching, business logic)
  store/       # Zustand global state
tests/
  e2e/         # Playwright specs, POMs, fixtures
```

## Conventions

- No raw `fetch` — all API calls via `apiClient`
- No `any` types — every API response typed in `api/types.ts`
- Mutations through Zustand store actions, not local `useState`
- Data fetching via react-query `useQuery` / `useMutation` hooks
- `data-testid` on dynamic list items (required for Playwright)

## Run commands

```bash
npm run dev       # dev server (http://localhost:5173)
npm run build     # production build
npm run test      # vitest unit tests
npx tsc --noEmit  # type check
npx playwright test  # E2E tests
```

## Active skills

Use `.agents/skills/frontend-design` and `.agents/skills/webapp-testing` when working in this package.
