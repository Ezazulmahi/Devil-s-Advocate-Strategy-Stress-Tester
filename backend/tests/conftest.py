import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from database import engine, get_db
from main import app


@pytest.fixture(autouse=True)
def stub_ai_execution(request):
    """Prevent the default test suite from triggering real Groq/web-search calls.

    execute_run runs as a FastAPI BackgroundTask, which the TestClient executes
    synchronously with its own DB session — outside the test's rolled-back
    transaction. Tests that need the real pipeline opt in via @pytest.mark.ai_integration.
    """
    if "ai_integration" in request.keywords:
        yield
        return
    with patch("controllers.run_controller.execute_run"):
        yield


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session: Session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def unique_email() -> str:
    return f"qa-{uuid.uuid4().hex[:12]}@example.com"


@pytest.fixture()
def registered_user(client: TestClient):
    email = unique_email()
    password = "Sup3rSecret!"
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 201
    body = resp.json()
    return {
        "email": email,
        "password": password,
        "token": body["access_token"],
        "user": body["user"],
    }


@pytest.fixture()
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}
