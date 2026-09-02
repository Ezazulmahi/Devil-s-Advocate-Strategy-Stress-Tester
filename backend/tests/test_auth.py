from tests.conftest import unique_email


def test_register_returns_token_and_user(client):
    email = unique_email()
    resp = client.post("/auth/register", json={"email": email, "password": "Sup3rSecret!"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["user"]["email"] == email
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_register_duplicate_email_conflicts(client):
    email = unique_email()
    client.post("/auth/register", json={"email": email, "password": "Sup3rSecret!"})
    resp = client.post("/auth/register", json={"email": email, "password": "AnotherPass1!"})
    assert resp.status_code == 409


def test_register_email_is_case_insensitive_for_duplicates(client):
    email = unique_email()
    client.post("/auth/register", json={"email": email, "password": "Sup3rSecret!"})
    resp = client.post("/auth/register", json={"email": email.upper(), "password": "AnotherPass1!"})
    assert resp.status_code == 409


def test_register_rejects_invalid_email(client):
    resp = client.post("/auth/register", json={"email": "not-an-email", "password": "Sup3rSecret!"})
    assert resp.status_code == 422


def test_register_rejects_short_password(client):
    resp = client.post("/auth/register", json={"email": unique_email(), "password": "short"})
    assert resp.status_code == 422


def test_register_rejects_overlong_password(client):
    resp = client.post(
        "/auth/register", json={"email": unique_email(), "password": "x" * 200}
    )
    assert resp.status_code == 422


def test_register_rejects_password_over_72_bytes_when_multibyte(client):
    # 30 chars, well under the 72-char Pydantic max_length, but 120 bytes as UTF-8 —
    # exercises the explicit byte-length check (bcrypt itself silently truncates
    # instead of erroring, which would let two different passwords sharing a
    # 72-byte prefix authenticate identically).
    resp = client.post(
        "/auth/register", json={"email": unique_email(), "password": "🔥" * 30}
    )
    assert resp.status_code == 422


def test_login_success(client, registered_user):
    resp = client.post(
        "/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == registered_user["email"]


def test_login_is_case_insensitive_on_email(client, registered_user):
    resp = client.post(
        "/auth/login",
        json={"email": registered_user["email"].upper(), "password": registered_user["password"]},
    )
    assert resp.status_code == 200


def test_login_wrong_password_is_unauthorized(client, registered_user):
    resp = client.post(
        "/auth/login", json={"email": registered_user["email"], "password": "WrongPassword1!"}
    )
    assert resp.status_code == 401


def test_login_unknown_email_is_unauthorized(client):
    resp = client.post("/auth/login", json={"email": unique_email(), "password": "whatever123"})
    assert resp.status_code == 401


def test_login_long_but_valid_password_is_unauthorized_not_500(client, registered_user):
    resp = client.post(
        "/auth/login", json={"email": registered_user["email"], "password": "y" * 71}
    )
    assert resp.status_code == 401


def test_login_rejects_password_over_72_bytes(client, registered_user):
    resp = client.post(
        "/auth/login", json={"email": registered_user["email"], "password": "z" * 100}
    )
    assert resp.status_code == 422


def test_me_requires_auth(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client, auth_headers, registered_user):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == registered_user["email"]


def test_me_rejects_garbage_token(client):
    resp = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401
