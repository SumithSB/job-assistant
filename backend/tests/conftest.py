import os

import pytest

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://jobtracker:jobtracker@127.0.0.1:5432/jobtracker",
)
os.environ.setdefault("JWT_SECRET", "pytest-jwt-secret-not-for-production")
os.environ.setdefault("LLM_PROVIDER", "mock")

# Integration tests require PostgreSQL; unit smoke tests skip DB calls.


@pytest.fixture(scope="session")
def database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


def pytest_configure(config):
    config.addinivalue_line("markers", "integration: needs DATABASE_URL and running Postgres")
