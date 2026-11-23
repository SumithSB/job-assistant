# Frontend context

React 18 + TypeScript + Tailwind CSS + Vite + Zustand + react-query.

## Structure

```
src/
  api/         # `api` wrapper (`client.ts`) + TypeScript types
  components/  # Reusable UI components
  pages/       # `/`, `/applications`, `/jobs/:id`, `/login`, `/register`
  store/       # Zustand global state
```

## Conventions

- No raw `fetch` in pages — all API calls via `api` in `src/api/client.ts`
- No `any` types — every API response typed in `api/types.ts`
- Mutations through Zustand store actions, not local `useState`
- Data fetching via react-query `useQuery` / `useMutation` hooks
- `data-testid` on dynamic list items (required for Playwright)

## Run commands

```bash
npm run dev       # dev server (http://localhost:5173)
npm run build     # production build
npm run test      # node --test (API errors, session, job detail parsers)
npx tsc --noEmit  # type check
```

## Active skills

Use `.agents/skills/frontend-design` and `.agents/skills/webapp-testing` when working in this package.
