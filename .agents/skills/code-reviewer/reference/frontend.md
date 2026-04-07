# Frontend Review Checklist (React / TypeScript)

## Correctness
- [ ] No `any` types — every API response typed via interfaces in `api/types.ts`
- [ ] Data-fetching hooks handle loading, error, AND success states
- [ ] No `useEffect` with missing dependency array entries
- [ ] Form validation runs before the API call (not only on server error)

## Performance
- [ ] Lists > 20 items use virtualization (react-window) or pagination — not rendering all at once
- [ ] Expensive computations moved to `useMemo` / `useCallback`
- [ ] Images have explicit `width` + `height` (prevents layout shift)

## Accessibility
- [ ] All interactive elements keyboard-navigable (Tab + Enter/Space)
- [ ] Form inputs have associated `<label>` elements
- [ ] Status indicators use icon + text, not color alone
- [ ] Modal / drawer traps focus (no tabbing to elements behind overlay)

## Maintainability
- [ ] No raw `fetch` — all calls through `apiClient` wrapper
- [ ] Component props have explicit TypeScript interfaces
- [ ] Dynamic list items have `data-testid` attributes for Playwright
- [ ] Zustand store actions used for mutations — no local state that should be global
