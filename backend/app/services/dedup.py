"""Job ingest de-duplication: canonical URL + stable text fingerprint before LLM work."""

from __future__ import annotations

import hashlib
import re
from urllib.parse import parse_qs, quote, urlencode, urlparse, urlunparse

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Job

# Strip common tracking params so the "same" posting matches across campaigns.
_TRACKING_QUERY_KEYS = frozenset(
    k.lower()
    for k in (
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "gclid",
        "fbclid",
        "msclkid",
        "igshid",
        "mc_cid",
        "mc_eid",
        "_gl",
        "ref",
        "ref_src",
        "source",
    )
)

_MAX_FINGERPRINT_CHARS = 500_000


def canonicalize_source_url(url: str) -> str:
    """Normalize URL for equality (scheme/host casing, path slashes, strip tracking query)."""
    raw = url.strip()
    parsed = urlparse(raw)
    scheme = (parsed.scheme or "https").lower()
    netloc = (parsed.netloc or "").strip().lower()
    if not netloc and parsed.path:
        # Bare "example.com/path" sometimes parsed oddly — re-parse with scheme
        parsed = urlparse(f"https://{raw}")
        scheme = (parsed.scheme or "https").lower()
        netloc = (parsed.netloc or "").strip().lower()
    path = parsed.path or "/"
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    pairs = parse_qs(parsed.query, keep_blank_values=False)
    filtered: dict[str, list[str]] = {}
    for key, vals in pairs.items():
        if key.lower() in _TRACKING_QUERY_KEYS:
            continue
        filtered[key] = vals
    flat = sorted(filtered.items())
    query = urlencode(flat, doseq=True, safe="", quote_via=quote)
    return urlunparse((scheme, netloc, path, "", query, ""))


def normalize_ingest_plaintext(text: str) -> bytes:
    """Collapse whitespace and lowercases for stable hashing."""
    t = text.strip().lower()
    t = re.sub(r"\s+", " ", t)
    if len(t) > _MAX_FINGERPRINT_CHARS:
        t = t[:_MAX_FINGERPRINT_CHARS]
    return t.encode("utf-8", errors="replace")


def ingest_text_fingerprint(text: str) -> str:
    return hashlib.sha256(normalize_ingest_plaintext(text)).hexdigest()


def library_row_dedupe_keys(job: Job) -> list[str]:
    """Identifiers for list dedupe: any match with an already-kept row drops this row.

    Includes title+company so two ingests that differ only slightly in body hash still collapse
    (e.g. re-run analysis, legacy row without fingerprint).
    """
    keys: list[str] = []
    if job.ingest_text_fingerprint:
        keys.append(f"fp:{job.ingest_text_fingerprint}")
    if job.source_url_canonical:
        keys.append(f"urlc:{job.source_url_canonical}")
    if job.source_url:
        keys.append(f"url:{canonicalize_source_url(job.source_url)}")
    title = (getattr(job, "title", None) or "").strip().lower()
    company = (getattr(job, "company", None) or "").strip().lower()
    if len(title) >= 2 and len(company) >= 2:
        keys.append(f"tc:{title}|{company}")
    if not keys:
        keys.append(f"id:{job.id}")
    return keys


def dedupe_job_rows_prefer_newest(jobs: list[Job]) -> list[Job]:
    """Keep one row per overlapping dedupe key; list must be newest-first."""

    seen: set[str] = set()
    out: list[Job] = []
    for j in jobs:
        row_keys = library_row_dedupe_keys(j)
        if any(k in seen for k in row_keys):
            continue
        seen.update(row_keys)
        out.append(j)
    return out


async def find_duplicate_job_for_user(
    session: AsyncSession,
    user_id,
    *,
    source_url_canonical: str | None,
    text_fingerprint: str,
) -> Job | None:
    """Return an existing job if URL or body fingerprint already ingested for this user."""
    clauses = [Job.ingest_text_fingerprint == text_fingerprint]
    if source_url_canonical:
        clauses.append(Job.source_url_canonical == source_url_canonical)
    stmt = select(Job).where(Job.user_id == user_id, or_(*clauses)).limit(1)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
