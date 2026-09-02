import uuid


def create_project(client, auth_headers, **overrides):
    payload = {
        "title": "QA Test Deck",
        "input_type": "pitch",
        "raw_input": "We raise money and win.",
    }
    payload.update(overrides)
    return client.post("/projects", json=payload, headers=auth_headers)


def test_create_project_success(client, auth_headers, registered_user):
    resp = create_project(client, auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "QA Test Deck"
    assert body["input_type"] == "pitch"
    assert body["user_id"] == registered_user["user"]["id"]


def test_create_project_requires_auth(client):
    resp = client.post(
        "/projects",
        json={"title": "x", "input_type": "pitch", "raw_input": "y"},
    )
    assert resp.status_code == 401


def test_create_project_rejects_empty_title(client, auth_headers):
    resp = create_project(client, auth_headers, title="")
    assert resp.status_code == 422


def test_create_project_rejects_empty_raw_input(client, auth_headers):
    resp = create_project(client, auth_headers, raw_input="")
    assert resp.status_code == 422


def test_create_project_rejects_invalid_input_type(client, auth_headers):
    resp = create_project(client, auth_headers, input_type="not_a_real_type")
    assert resp.status_code == 422


def test_list_projects_only_returns_own_projects(client, auth_headers):
    create_project(client, auth_headers, title="Mine 1")
    create_project(client, auth_headers, title="Mine 2")

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    create_project(client, other_headers, title="Not Mine")

    resp = client.get("/projects", headers=auth_headers)
    assert resp.status_code == 200
    titles = {p["title"] for p in resp.json()}
    assert titles == {"Mine 1", "Mine 2"}


def test_get_project_success(client, auth_headers):
    created = create_project(client, auth_headers).json()
    resp = client.get(f"/projects/{created['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


def test_get_project_not_found(client, auth_headers):
    resp = client.get(f"/projects/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


def test_get_project_malformed_id_is_422(client, auth_headers):
    resp = client.get("/projects/not-a-uuid", headers=auth_headers)
    assert resp.status_code == 422


def test_get_project_owned_by_someone_else_is_404(client, auth_headers):
    created = create_project(client, auth_headers).json()

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.get(f"/projects/{created['id']}", headers=other_headers)
    assert resp.status_code == 404
