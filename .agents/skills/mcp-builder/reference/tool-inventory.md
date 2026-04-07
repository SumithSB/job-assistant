# MCP Tool Inventory

All tools for this project. Update here before implementing new ones.

## Job Tools
- `search_jobs(query, limit?, status?)` — pgvector semantic search
- `get_job(id)` — fetch single job
- `create_job(title, company, url?, description?)` — add posting
- `update_job(id, fields)` — patch job fields

## Application Tools
- `list_applications(status?, limit?, cursor?)` — paginated pipeline view
- `update_application_status(id, status, note?)` — move through pipeline
- `get_application_timeline(id)` — full status history

## Gmail tools (via configured Gmail MCP server)
- `scan_emails_for_applications()` — parse inbox for job emails
- `mark_email_processed(email_id)` — idempotency marker
- `draft_followup_email(application_id, tone?)` — generate draft

## Calendar tools (via configured Google Calendar MCP server)
- `schedule_interview(application_id, datetime, type, notes?)` — create event
- `list_upcoming_interviews(days_ahead?)` — fetch interview events
- `cancel_interview(interview_id, reason?)` — cancel + update status

## LangGraph usage pattern

```python
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode

@tool
def search_jobs(query: str, limit: int = 10) -> dict:
    """Semantic search over job listings."""
    return mcp_client.call("search_jobs", {"query": query, "limit": limit})

tool_node = ToolNode([search_jobs, update_application_status])
```
