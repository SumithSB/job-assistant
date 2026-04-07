# Anti-patterns to Flag

## BLOCKER: IDOR (missing user scope)

```python
# BAD — any user can read any application
stmt = select(Application).where(Application.id == app_id)

# GOOD
stmt = select(Application).where(
    Application.id == app_id,
    Application.user_id == current_user.id,
)
```

## BLOCKER: SQL injection via f-string

```python
# BAD
stmt = text(f"SELECT * FROM jobs WHERE title LIKE '%{query}%'")

# GOOD
stmt = select(Job).where(Job.title.ilike(f"%{query}%"))   # ORM escapes safely
```

## WARN: N+1 query

```python
# BAD — one SELECT per application
for app in applications:
    job = await session.get(Job, app.job_id)

# GOOD — two queries total (one batched IN query for all jobs)
stmt = select(Application).options(selectinload(Application.job))
```

## WARN: Lazy load in async context

```python
# BAD — raises MissingGreenlet
application = await session.get(Application, app_id)
print(application.job.title)   # lazy load in async = crash

# GOOD
stmt = select(Application).options(joinedload(Application.job)).where(...)
```

## WARN: Untyped API response (TypeScript)

```typescript
// BAD
const data = await fetch("/api/v1/applications").then(r => r.json())
data.map(a => a.status)  // no type safety

// GOOD
const data = await apiClient.applications.list()  // returns ApplicationResponse[]
data.map(a => a.status)  // fully typed
```

## WARN: Missing error state in hook

```typescript
// BAD — no loading or error handling
const [data, setData] = useState(null)
useEffect(() => {
  fetch("/api/v1/jobs").then(r => r.json()).then(setData)
}, [])

// GOOD — use react-query
const { data, isLoading, error } = useQuery({
  queryKey: ["jobs"],
  queryFn: () => apiClient.jobs.list(),
})
```
