---
name: mcp-builder
description: Writes MCP tool contracts before backend implementation. Invoked explicitly by architect when a new tool endpoint is needed. Contracts go in /docs/mcp-contracts.md and are immutable once backend-agent starts work.
---

# MCP Builder — Contract-First Workflow

Tool contracts must exist **before** backend-agent implements them. Never implement first.

## Workflow

1. **architect calls `/mcp-builder [tool-name]`** to draft a contract
2. Contract saved in `/docs/mcp-contracts.md`
3. **backend-agent implements** to match the contract exactly
4. **ai-rag-agent consumes** tools in LangGraph
5. **qa-agent verifies** tool I/O matches contract
6. Contract is **immutable** after step 3 — changes require architect re-review

## Contract format

See [reference/contract-format.md](reference/contract-format.md) for the full contract template.

## Existing tool inventory

See [reference/tool-inventory.md](reference/tool-inventory.md) for all current project tools (jobs, applications, Gmail, Calendar).

## Tool schema rules (non-negotiable)

- IDs: UUIDs (string), never sequential integers
- Pagination: `cursor` + `limit`, never `page` + `offset`
- Mutations return the updated resource, not `{"ok": true}`
- Timestamps: ISO 8601 UTC (`"2024-03-15T14:30:00Z"`)
- Nullable fields: explicit `null`, never omitted
- Errors: always include `"error"` key at top level
- MCP tool names in code: use fully qualified `ServerName:tool_name` format

## MCP servers for this project

Configure Gmail and Google Calendar MCP in your host environment; reference the **server name** and **tool name** your client exposes (names vary by IDE/agent host). In contracts, use the qualified id your stack expects (e.g. `ServerName:tool_name`).
