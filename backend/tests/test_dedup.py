"""Unit tests for job ingest de-duplication helpers (no DB)."""

from types import SimpleNamespace
from uuid import UUID

from app.services.dedup import (
    canonicalize_source_url,
    dedupe_job_rows_prefer_newest,
    ingest_text_fingerprint,
)


def test_canonicalize_strips_tracking_and_trailing_slash() -> None:
    a = canonicalize_source_url(
        "https://Example.COM/jobs/123/?utm_source=linkedin&gclid=x&sort=1",
    )
    b = canonicalize_source_url("https://example.com/jobs/123?sort=1")
    assert a == b


def test_fingerprint_stable_under_whitespace() -> None:
    assert ingest_text_fingerprint("Hello   World\n") == ingest_text_fingerprint("hello world")


def _job(
    id_hex: str,
    *,
    fp: str | None = None,
    canonical: str | None = None,
    source_url: str | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=UUID(id_hex),
        ingest_text_fingerprint=fp,
        source_url_canonical=canonical,
        source_url=source_url,
    )


def test_dedupe_list_keeps_newest_per_fingerprint() -> None:
    older = _job("00000000-0000-0000-0000-000000000001", fp="aa")
    newer = _job("00000000-0000-0000-0000-000000000002", fp="aa")
    got = dedupe_job_rows_prefer_newest([newer, older])
    assert len(got) == 1
    assert got[0].id == newer.id


def test_dedupe_list_url_canonical_fallback() -> None:
    a = _job("00000000-0000-0000-0000-000000000003", source_url="https://EXAMPLE.com/x?utm_source=1")
    b = _job("00000000-0000-0000-0000-000000000004", source_url="https://example.com/x")
    got = dedupe_job_rows_prefer_newest([b, a])
    assert len(got) == 1


def test_dedupe_collapses_same_title_company_different_fingerprint() -> None:
    """Re-ingests with slightly different body hashes still show once in library."""
    older = SimpleNamespace(
        id=UUID("00000000-0000-0000-0000-000000000020"),
        ingest_text_fingerprint="fp-old",
        source_url_canonical=None,
        source_url=None,
        title="Software Engineer II",
        company="Affirm",
    )
    newer = SimpleNamespace(
        id=UUID("00000000-0000-0000-0000-000000000021"),
        ingest_text_fingerprint="fp-new",
        source_url_canonical=None,
        source_url=None,
        title="Software Engineer II",
        company="Affirm",
    )
    got = dedupe_job_rows_prefer_newest([newer, older])
    assert len(got) == 1
    assert got[0].id == newer.id
