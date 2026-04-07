"""OpenAI-compatible /chat/completions (Ollama, OpenAI, Gemini compat endpoint, etc.)."""

from __future__ import annotations

import json
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import Settings, get_settings
from app.schemas.pipeline import PipelineLLMResult
from app.services.llm.base import LLMService
from app.services.llm.prompts import DEFAULT_EXAMPLES, SYSTEM_INSTRUCTION, build_user_prompt

OLLAMA_DEFAULT_BASE_URL = "http://127.0.0.1:11434/v1"

_LOCAL_OLLAMA_HOSTS = frozenset(
    {"localhost", "127.0.0.1", "0.0.0.0", "::1"},
)


def _native_ollama_api_root(settings: Settings, openai_compat_base: str) -> str | None:
    """If OpenAI-compat base looks like local Ollama (.../v1), return root for /api/chat."""
    b = openai_compat_base.rstrip("/")
    if not b.endswith("/v1"):
        return None
    root = b[:-3]
    if not root:
        return None
    if settings.llm_ollama_force_native_schema:
        return root
    host = (urlparse(root).hostname or "").lower()
    if host in _LOCAL_OLLAMA_HOSTS:
        return root
    return None


class OpenAICompatibleLLMService(LLMService):
    """Any server that implements POST {base}/chat/completions like OpenAI."""

    async def run_job_pipeline(
        self,
        *,
        job_text: str,
        source_url: str | None,
        master_resume: str,
    ) -> PipelineLLMResult:
        settings = get_settings()
        base = (settings.llm_base_url or OLLAMA_DEFAULT_BASE_URL).rstrip("/")

        system_text = SYSTEM_INSTRUCTION + DEFAULT_EXAMPLES
        user_text = build_user_prompt(
            job_text=job_text,
            source_url=source_url,
            master_resume=master_resume,
        )
        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_text},
            {"role": "user", "content": user_text},
        ]

        timeout = httpx.Timeout(240.0, connect=30.0)
        native_root = _native_ollama_api_root(settings, base)

        async with httpx.AsyncClient(timeout=timeout) as client:
            if native_root:
                native_url = f"{native_root.rstrip('/')}/api/chat"
                native_body: dict[str, Any] = {
                    "model": settings.llm_model,
                    "messages": messages,
                    "stream": False,
                    "format": PipelineLLMResult.model_json_schema(),
                    "options": {"temperature": 0.3},
                }
                native_resp = await client.post(
                    native_url,
                    headers={"Content-Type": "application/json"},
                    json=native_body,
                )
                if native_resp.is_success:
                    payload = native_resp.json()
                    text = _extract_ollama_native_content(payload)
                    text = _strip_json_fence(text)
                    data = json.loads(text)
                    return PipelineLLMResult.model_validate(data)

            url = f"{base}/chat/completions"
            body: dict[str, Any] = {
                "model": settings.llm_model,
                "messages": messages,
                "temperature": 0.3,
            }
            headers: dict[str, str] = {"Content-Type": "application/json"}
            key = settings.llm_api_key
            if key:
                headers["Authorization"] = f"Bearer {key}"

            response = await client.post(url, headers=headers, json=body)

        if response.status_code >= 400:
            raise RuntimeError(
                f"LLM HTTP {response.status_code}: {response.text[:2000]!s}",
            )

        payload = response.json()
        text = _extract_message_text(payload)
        text = _strip_json_fence(text)
        data = json.loads(text)
        return PipelineLLMResult.model_validate(data)


def _extract_ollama_native_content(payload: dict[str, Any]) -> str:
    msg = payload.get("message")
    if not isinstance(msg, dict):
        raise RuntimeError(
            f"Ollama native response missing message: {repr(payload)[:500]}",
        )
    content = msg.get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError(
            f"Ollama native response missing message content: {repr(payload)[:500]}",
        )
    return content


def _extract_message_text(payload: dict[str, Any]) -> str:
    choices = payload.get("choices")
    if not choices:
        raise RuntimeError(f"LLM response missing choices: {repr(payload)[:500]}")
    msg = choices[0].get("message") if isinstance(choices[0], dict) else None
    content = msg.get("content") if isinstance(msg, dict) else None
    if not content or not isinstance(content, str):
        raise RuntimeError(
            f"LLM response missing message content: {repr(payload)[:500]}",
        )
    if not content.strip():
        raise RuntimeError("Empty message content from LLM")
    return content


def _strip_json_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        if len(lines) >= 2 and lines[0].startswith("```"):
            inner = "\n".join(lines[1:])
            if inner.rstrip().endswith("```"):
                inner = inner[: inner.rfind("```")]
            t = inner.strip()
    return t
