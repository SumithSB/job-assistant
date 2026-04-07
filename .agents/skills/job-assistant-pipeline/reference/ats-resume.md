# ATS-friendly resume variant

## Goals

- Parse cleanly by common ATS parsers (text-first, predictable structure).
- Mirror **relevant** keywords from the posting **without** lying (only reuse skills/experiences present in master profile).
- One column, no tables, no text boxes, no icons in the **stored plain-text** export.

## Structure (order)

1. **Name + contact** (email, phone, location, LinkedIn/GitHub if in profile)
2. **Target title** (optional): align to posting title variant, e.g. “Backend Engineer (Platform)” — must not imply a job never held if misleading; prefer generic alignment.
3. **Professional summary** — 2–3 sentences,Posting-aligned, fact-grounded.
4. **Skills** — grouped or comma-separated lines; include posting keywords **only** if they appear in profile or are clearly equivalent (e.g. “K8s” if profile says “Kubernetes”).
5. **Experience** — reverse chronological; **same employers/dates/titles** as master unless user edited a dedicated variant. Bullets rewritten for relevance; STAR optional; quantify only with numbers from profile.
6. **Education / certifications** — as in profile only.
7. **Optional**: Projects — only if in profile.

## Avoid

- Graphics, tables, columns, headers/footers with critical text, tiny fonts (for DOCX/PDF generation later).
- Skill stuffing unrelated to profile.
- Claiming tools in “Skills” that are not substantiated in Experience or an explicit skills list in profile.

## Deliverables

- Store **canonical plain text** in DB; render/PDF is a separate export step.
- Keep `master_resume_snapshot_hash` or `profile_version_used` on the variant for auditability.
