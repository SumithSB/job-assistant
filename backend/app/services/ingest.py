import ipaddress
from urllib.parse import urlparse

import httpx
import trafilatura

MAX_RESPONSE_BYTES = 2_000_000


def _assert_safe_http_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http and https URLs are allowed")
    host = parsed.hostname
    if host is None:
        raise ValueError("URL missing host")
    lowered = host.lower()
    if lowered == "localhost" or lowered.endswith(".localhost"):
        raise ValueError("URL host is not allowed")
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError("URL resolves to a disallowed network")
    except ValueError:
        # not an IP literal — hostname OK for now
        pass


async def fetch_url_text(url: str) -> tuple[str, str | None, str]:
    """Return (extracted_plain_text, raw_html_snippet_or_none, final_url_after_redirects)."""
    _assert_safe_http_url(url)
    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(15.0),
        limits=httpx.Limits(max_connections=5),
    ) as client:
        response = await client.get(url, headers={"User-Agent": "JobAssistantBot/0.1"})
        response.raise_for_status()
        final_url = str(response.url)
        raw = response.content
        if len(raw) > MAX_RESPONSE_BYTES:
            raise ValueError("Response too large")
        html = raw.decode(response.encoding or "utf-8", errors="replace")
    text = trafilatura.extract(html) or ""
    if not text.strip():
        text = trafilatura.extract(html, favor_precision=True) or ""
    return text.strip(), html[:50_000], final_url
