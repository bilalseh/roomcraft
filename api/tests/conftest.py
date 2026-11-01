import pytest
from fastapi.testclient import TestClient

from roomcraft_api.main import create_app
from roomcraft_api.settings import Settings


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app(Settings(_env_file=None)))
