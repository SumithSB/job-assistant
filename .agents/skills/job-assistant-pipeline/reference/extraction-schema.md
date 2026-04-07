# Extraction schema (target shape)

Use a single Pydantic model (or LLM tool/function-call JSON schema) aligned to API responses. Adjust field names to match `schemas/` in the backend; this is the **semantic** contract.

## Core fields

| Field | Type | Notes |
|--------|------|--------|
| `company` | string | Normalized name; `null` if unknown. |
| `title` | string | Role title. |
| `location` | string? | Remote/hybrid/onsite + geography if stated. |
| `employment_type` | enum? | `full_time`, `contract`, `part_time`, `intern`, `unknown`. |
| `seniority` | enum? | `intern`, `junior`, `mid`, `senior`, `staff`, `principal`, `lead`, `manager`, `unknown`. |
| `source_url` | string? | Canonical URL user supplied. |
| `summary` | string | 2–4 sentence neutral summary of the role. |
| `responsibilities` | string[] | Bullet-style lines from posting. |
| `requirements_must_have` | string[] | Hard requirements. |
| `requirements_nice_to_have` | string[] | Preferred. |
| `tech_stack` | string[] | Languages, frameworks, tools (deduped, lowercased stable tokens where helpful). |
| `domain_keywords` | string[] | Industry/domain (fintech, healthcare, etc.). |
| `compensation` | object? | `{ "text": string, "min": number?, "max": number?, "currency": string? }` only if explicitly in posting. |
| `education` | string[] | Degree/cert requirements if stated. |
| `posting_language` | string | ISO 639-1 if detectable, else `unknown`. |
| `confidence` | object | Per section or global 0–1 + `notes` for parser uncertainty. |

## Storage

- Persist **raw** normalized text and **structured** JSON on `Job` (or equivalent).
- `extraction_version` integer on row when schema/prompt changes.

## Validation

- Reject empty `title` and `company` unless user confirms “incomplete posting” flow.
- Cap list lengths in schema (e.g. max 50 bullets) to avoid abuse.
