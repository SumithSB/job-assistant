import ipaddress
from urllib.parse import urlparse

import httpx
import trafilatura

MAX_RESPONSE_BYTES = 2_000_000


def _is_disallowed_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """True when the address is not a publicly routable unicast target.

    IPv4-mapped IPv6 is classified using the embedded IPv4 address.
    """
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        ip = ip.ipv4_mapped
    return ip.is_multicast or not ip.is_global


def _assert_safe_http_url(url: str) -> None:
    """Reject non-http(s) URLs and hosts that are not safe to fetch.

    Hostnames that are not IP literals are allowed here. The ValueError from
    ipaddress.ip_address (meaning "not a literal") must stay separate from the
    rejection of private, loopback, and link-local addresses. Nesting that
    rejection inside the same try/except lets those literals through.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http and https URLs are allowed")
    host = parsed.hostname
    if host is None:
        raise ValueError("URL missing host")
    lowered = host.lower().rstrip(".")
    if lowered == "localhost" or lowered.endswith(".localhost"):
        raise ValueError("URL host is not allowed")
    try:
        ip = ipaddress.ip_address(lowered)
    except ValueError:
        return
    if _is_disallowed_ip(ip):
        raise ValueError("URL host is not allowed")


async def _guard_outbound_request(request: httpx.Request) -> None:
    """Re-check each hop, including redirects, before the request is sent."""
    _assert_safe_http_url(str(request.url))


async def fetch_url_text(url: str) -> tuple[str, str | None, str]:
    """Return (extracted_plain_text, raw_html_snippet_or_none, final_url_after_redirects)."""
    _assert_safe_http_url(url)
    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(15.0),
        limits=httpx.Limits(max_connections=5),
        event_hooks={"request": [_guard_outbound_request]},
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
