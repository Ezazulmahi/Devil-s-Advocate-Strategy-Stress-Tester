import uuid


def create_project(client, auth_headers):
    resp = client.post(
        "/projects",
        json={"title": "QA Deck", "input_type": "pitch", "raw_input": "raise money"},
        headers=auth_headers,
    )
    return resp.json()


def test_start_run_success(client, auth_headers):
    project = create_project(client, auth_headers)
    resp = client.post(
        f"/projects/{project['id']}/run",
        json={"personas": ["investor", "competitor"]},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "pending"
    assert body["project_id"] == project["id"]
    assert set(body["personas_used"]) == {"investor", "competitor"}
    assert body["completed_at"] is None


def test_start_run_dedupes_personas(client, auth_headers):
    project = create_project(client, auth_headers)
    resp = client.post(
        f"/projects/{project['id']}/run",
        json={"personas": ["investor", "investor", "hacker"]},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert sorted(resp.json()["personas_used"]) == ["hacker", "investor"]


def test_start_run_rejects_empty_personas(client, auth_headers):
    project = create_project(client, auth_headers)
    resp = client.post(
        f"/projects/{project['id']}/run", json={"personas": []}, headers=auth_headers
    )
    assert resp.status_code == 422


def test_start_run_rejects_invalid_persona(client, auth_headers):
    project = create_project(client, auth_headers)
    resp = client.post(
        f"/projects/{project['id']}/run",
        json={"personas": ["not_a_persona"]},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_start_run_on_missing_project_is_404(client, auth_headers):
    resp = client.post(
        f"/projects/{uuid.uuid4()}/run", json={"personas": ["investor"]}, headers=auth_headers
    )
    assert resp.status_code == 404


def test_start_run_on_someone_elses_project_is_404(client, auth_headers):
    project = create_project(client, auth_headers)

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=other_headers
    )
    assert resp.status_code == 404


def test_list_runs_for_project(client, auth_headers):
    project = create_project(client, auth_headers)
    client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    )
    client.post(
        f"/projects/{project['id']}/run", json={"personas": ["hacker"]}, headers=auth_headers
    )

    resp = client.get(f"/projects/{project['id']}/runs", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_run_success(client, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()

    resp = client.get(f"/runs/{run['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == run["id"]


def test_get_run_not_found(client, auth_headers):
    resp = client.get(f"/runs/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


def test_get_run_owned_by_someone_else_is_404(client, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.get(f"/runs/{run['id']}", headers=other_headers)
    assert resp.status_code == 404


def test_findings_for_new_run_is_empty(client, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()

    resp = client.get(f"/runs/{run['id']}/findings", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []
