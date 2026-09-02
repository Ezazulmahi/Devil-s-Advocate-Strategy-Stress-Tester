import uuid

from models.finding import Finding
from models.persona_finding import PersonaFinding
from models.run import StressTestRun


def create_project(client, auth_headers):
    resp = client.post(
        "/projects",
        json={"title": "QA Deck", "input_type": "codebase", "raw_input": "def f(): pass"},
        headers=auth_headers,
    )
    return resp.json()


def seed_finding(db_session, run_id: str, **overrides) -> Finding:
    persona_finding = PersonaFinding(
        run_id=uuid.UUID(run_id), persona="hacker", raw_output="raw model output"
    )
    db_session.add(persona_finding)
    db_session.flush()

    defaults = dict(
        run_id=uuid.UUID(run_id),
        persona_finding_id=persona_finding.id,
        persona="hacker",
        severity="critical",
        category="Secrets Management",
        title="Hardcoded secret",
        description="A secret is hardcoded in source.",
        suggested_fix="Move it to an environment variable.",
    )
    defaults.update(overrides)
    finding = Finding(**defaults)
    db_session.add(finding)
    db_session.commit()
    db_session.refresh(finding)
    return finding


def test_get_finding_success(client, db_session, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["hacker"]}, headers=auth_headers
    ).json()
    finding = seed_finding(db_session, run["id"])

    resp = client.get(f"/findings/{finding.id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Hardcoded secret"
    assert body["severity"] == "critical"
    assert body["status"] == "open"


def test_get_finding_not_found(client, auth_headers):
    resp = client.get(f"/findings/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


def test_get_finding_owned_by_someone_else_is_404(client, db_session, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["hacker"]}, headers=auth_headers
    ).json()
    finding = seed_finding(db_session, run["id"])

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.get(f"/findings/{finding.id}", headers=other_headers)
    assert resp.status_code == 404


def test_run_findings_lists_seeded_finding(client, db_session, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["hacker"]}, headers=auth_headers
    ).json()
    seed_finding(db_session, run["id"])
    seed_finding(db_session, run["id"], title="Second finding", severity="minor")

    resp = client.get(f"/runs/{run['id']}/findings", headers=auth_headers)
    assert resp.status_code == 200
    titles = {f["title"] for f in resp.json()}
    assert titles == {"Hardcoded secret", "Second finding"}


def test_submit_rebuttal_success(client, db_session, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["hacker"]}, headers=auth_headers
    ).json()
    finding = seed_finding(db_session, run["id"])

    resp = client.post(
        f"/findings/{finding.id}/rebuttal",
        json={"user_response": "We rotated the secret and moved it to env vars."},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["user_response"] == "We rotated the secret and moved it to env vars."
    assert body["persona_counter_response"] is None


def test_submit_rebuttal_rejects_empty_response(client, db_session, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["hacker"]}, headers=auth_headers
    ).json()
    finding = seed_finding(db_session, run["id"])

    resp = client.post(
        f"/findings/{finding.id}/rebuttal", json={"user_response": ""}, headers=auth_headers
    )
    assert resp.status_code == 422


def test_submit_rebuttal_on_missing_finding_is_404(client, auth_headers):
    resp = client.post(
        f"/findings/{uuid.uuid4()}/rebuttal",
        json={"user_response": "defense"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


def test_list_rebuttals_ordered_by_created_at(client, db_session, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["hacker"]}, headers=auth_headers
    ).json()
    finding = seed_finding(db_session, run["id"])

    client.post(
        f"/findings/{finding.id}/rebuttal", json={"user_response": "first"}, headers=auth_headers
    )
    client.post(
        f"/findings/{finding.id}/rebuttal", json={"user_response": "second"}, headers=auth_headers
    )

    resp = client.get(f"/findings/{finding.id}/rebuttals", headers=auth_headers)
    assert resp.status_code == 200
    responses = [r["user_response"] for r in resp.json()]
    assert responses == ["first", "second"]


def test_rebuttal_on_someone_elses_finding_is_404(client, db_session, auth_headers):
    project = create_project(client, auth_headers)
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["hacker"]}, headers=auth_headers
    ).json()
    finding = seed_finding(db_session, run["id"])

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.post(
        f"/findings/{finding.id}/rebuttal",
        json={"user_response": "not yours"},
        headers=other_headers,
    )
    assert resp.status_code == 404
