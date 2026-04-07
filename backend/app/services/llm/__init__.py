from app.core.config import get_settings
from app.services.llm.base import LLMService
from app.services.llm.mock_llm import MockLLMService
from app.services.llm.openai_compatible_llm import OpenAICompatibleLLMService


def get_llm_service() -> LLMService:
    settings = get_settings()
    provider = settings.llm_provider.lower().strip()
    if provider == "mock":
        return MockLLMService()
    if provider in ("chat", "openai_compatible"):
        return OpenAICompatibleLLMService()
    if provider == "gemini":
        raise ValueError(
            "LLM_PROVIDER=gemini is removed. Use LLM_PROVIDER=chat with "
            "LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/ "
            "and LLM_API_KEY=<key> (Gemini OpenAI-compatible endpoint).",
        )
    raise ValueError(
        f"Unknown LLM_PROVIDER: {settings.llm_provider!r}. "
        "Use mock | chat (Ollama, OpenAI, Gemini compat, etc.).",
    )
