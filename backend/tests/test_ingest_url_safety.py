"""Unit tests for job URL fetch guards (no network)."""

import asyncio

import httpx
import pytest

from app.services.ingest import _assert_safe_http_url, fetch_url_text


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/latest",
        "http://127.0.0.1:80/jobs",
        "https://10.0.0.5/jobs",
        "http://192.168.1.20/jobs",
        "http://172.16.0.9/a",
        "http://169.254.169.254/latest/meta-data",
        "http://0.0.0.0/",
        "http://[::1]/",
        "http://[fe80::1]/",
        "http://[::ffff:127.0.0.1]/admin",
        "http://[::ffff:169.254.169.254]/",
        "http://100.64.1.1/",
        "http://224.0.0.1/",
        "http://localhost/jobs",
        "http://foo.localhost/jobs",
        "file:///etc/passwd",
        "ftp://example.com/jobs",
    ],
)
def test_blocks_disallowed_job_urls(url: str) -> None:
    with pytest.raises(ValueError, match="not allowed|Only http"):
        _assert_safe_http_url(url)


@pytest.mark.parametrize(
    "url",
    [
        "https://example.com/jobs/123",
        "https://jobs.example.com/role",
        "http://8.8.8.8/path",
        "https://[2001:4860:4860::8888]/",
        "http://[::ffff:8.8.8.8]/jobs",
    ],
)
def test_allows_public_job_urls(url: str) -> None:
    _assert_safe_http_url(url)


def test_redirect_to_loopback_is_not_fetched(monkeypatch: pytest.MonkeyPatch) -> None:
    requested: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requested.append(str(request.url))
        if request.url.host == "example.com":
            return httpx.Response(302, headers={"Location": "http://127.0.0.1/secret"})
        return httpx.Response(200, text="secret")

    transport = httpx.MockTransport(handler)
    original = httpx.AsyncClient

    def client_factory(*args, **kwargs):
        kwargs["transport"] = transport
        return original(*args, **kwargs)

    monkeypatch.setattr("app.services.ingest.httpx.AsyncClient", client_factory)

    with pytest.raises(ValueError, match="not allowed"):
        asyncio.run(fetch_url_text("https://example.com/jobs"))

    assert requested == ["https://example.com/jobs"]
