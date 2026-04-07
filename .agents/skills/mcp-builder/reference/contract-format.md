# MCP Tool Contract Format

Copy this template for each new tool in `/docs/mcp-contracts.md`:

```markdown
## Tool: [tool_name]

**Description**: [What this tool does, one sentence]

**Input Schema**:
| Field    | Type     | Required | Default | Description             |
|----------|----------|----------|---------|-------------------------|
| field_1  | string   | yes      | —       | Description             |
| field_2  | integer  | no       | 10      | Description (max: 50)   |

**Output Schema**:
```json
{
  "results": [
    {
      "id": "uuid-string",
      "field": "value"
    }
  ],
  "cursor": "opaque-string-or-null",
  "total": 42
}
```

**Error Cases**:
- `field_1` empty → 400 `{"error": "field_1 required"}`
- Not found → 404 `{"error": "not found"}`
- Auth failed → 401 `{"error": "unauthorized"}`

**Side Effects**: [None / Describe mutations]
**Auth Required**: Yes — user-scoped results only
**Idempotent**: [Yes / No]
```

## Example: search_jobs

```markdown
## Tool: search_jobs

**Description**: Semantic search over job listings using pgvector cosine similarity.

**Input Schema**:
| Field  | Type     | Required | Default | Description                      |
|--------|----------|----------|---------|----------------------------------|
| query  | string   | yes      | —       | Natural language search query    |
| limit  | integer  | no       | 10      | Max results (max: 50)            |
| status | string[] | no       | all     | Filter by application status     |

**Output Schema**:
```json
{
  "results": [{ "id": "uuid", "title": "string", "company": "string", "similarity": 0.92 }],
  "total": 42
}
```

**Error Cases**: query empty → 400, index unavailable → 503
**Side Effects**: None
**Auth Required**: Yes
```
