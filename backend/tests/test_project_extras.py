import io
import uuid

import pytest
from pypdf import PdfWriter


def create_project(client, auth_headers, **overrides):
    payload = {
        "title": "QA Test Deck",
        "input_type": "pitch",
        "raw_input": "We raise money and win.",
    }
    payload.update(overrides)
    return client.post("/projects", json=payload, headers=auth_headers)


def test_delete_project_success(client, auth_headers):
    project = create_project(client, auth_headers).json()
    resp = client.delete(f"/projects/{project['id']}", headers=auth_headers)
    assert resp.status_code == 204

    resp = client.get(f"/projects/{project['id']}", headers=auth_headers)
    assert resp.status_code == 404


def test_delete_project_cascades_to_runs_and_findings(client, db_session, auth_headers):
    from models.finding import Finding
    from models.persona_finding import PersonaFinding

    project = create_project(client, auth_headers).json()
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()

    persona_finding = PersonaFinding(run_id=uuid.UUID(run["id"]), persona="investor", raw_output="x")
    db_session.add(persona_finding)
    db_session.flush()
    finding = Finding(
        run_id=uuid.UUID(run["id"]),
        persona_finding_id=persona_finding.id,
        persona="investor",
        severity="major",
        category="x",
        title="x",
        description="x",
        suggested_fix="x",
    )
    db_session.add(finding)
    db_session.commit()
    db_session.refresh(finding)
    finding_id = finding.id

    resp = client.delete(f"/projects/{project['id']}", headers=auth_headers)
    assert resp.status_code == 204

    assert db_session.get(Finding, finding_id) is None
    assert db_session.get(PersonaFinding, persona_finding.id) is None


def test_delete_project_requires_auth(client):
    resp = client.delete(f"/projects/{uuid.uuid4()}")
    assert resp.status_code == 401


def test_delete_someone_elses_project_is_404(client, auth_headers):
    project = create_project(client, auth_headers).json()

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.delete(f"/projects/{project['id']}", headers=other_headers)
    assert resp.status_code == 404

    resp = client.get(f"/projects/{project['id']}", headers=auth_headers)
    assert resp.status_code == 200


def test_projects_pagination_headers_and_slicing(client, auth_headers):
    for i in range(3):
        create_project(client, auth_headers, title=f"Project {i}")

    resp = client.get("/projects?limit=2&offset=0", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2
    assert resp.headers["X-Total-Count"] == "3"

    resp2 = client.get("/projects?limit=2&offset=2", headers=auth_headers)
    assert len(resp2.json()) == 1


def test_findings_pagination_headers(client, db_session, auth_headers):
    from models.finding import Finding
    from models.persona_finding import PersonaFinding

    project = create_project(client, auth_headers).json()
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()
    persona_finding = PersonaFinding(run_id=uuid.UUID(run["id"]), persona="investor", raw_output="x")
    db_session.add(persona_finding)
    db_session.flush()
    for i in range(3):
        db_session.add(
            Finding(
                run_id=uuid.UUID(run["id"]),
                persona_finding_id=persona_finding.id,
                persona="investor",
                severity="minor",
                category="x",
                title=f"Finding {i}",
                description="x",
                suggested_fix="x",
            )
        )
    db_session.commit()

    resp = client.get(f"/runs/{run['id']}/findings?limit=2&offset=0", headers=auth_headers)
    assert len(resp.json()) == 2
    assert resp.headers["X-Total-Count"] == "3"


def test_detect_input_type_codebase(client, auth_headers):
    resp = client.post(
        "/projects/detect-input-type",
        json={"raw_input": "def foo():\n    import os\n    class Bar:\n        pass\n"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["input_type"] == "codebase"
    assert "hacker" in body["suggested_personas"]


def test_detect_input_type_research_paper(client, auth_headers):
    resp = client.post(
        "/projects/detect-input-type",
        json={
            "raw_input": "Abstract: this paper presents a novel methodology. See references and "
            "related work section for the full literature review and hypothesis testing."
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["input_type"] == "research_paper"


def test_detect_input_type_requires_auth(client):
    resp = client.post("/projects/detect-input-type", json={"raw_input": "hello"})
    assert resp.status_code == 401


def test_upload_pdf_creates_project(client, auth_headers):
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    buf.seek(0)

    resp = client.post(
        "/projects/upload",
        data={"title": "Uploaded Deck"},
        files={"file": ("deck.pdf", buf, "application/pdf")},
        headers=auth_headers,
    )
    # A blank page has no extractable text, so this should be a clean 422, not a crash.
    assert resp.status_code == 422


def test_upload_non_pdf_file_is_422(client, auth_headers):
    resp = client.post(
        "/projects/upload",
        data={"title": "Not a PDF"},
        files={"file": ("notes.txt", io.BytesIO(b"just text"), "text/plain")},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_timeline_reflects_run_history(client, db_session, auth_headers):
    from models.finding import Finding
    from models.persona_finding import PersonaFinding

    project = create_project(client, auth_headers).json()
    run1 = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()
    run2 = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()

    pf = PersonaFinding(run_id=uuid.UUID(run1["id"]), persona="investor", raw_output="x")
    db_session.add(pf)
    db_session.flush()
    db_session.add(
        Finding(
            run_id=uuid.UUID(run1["id"]),
            persona_finding_id=pf.id,
            persona="investor",
            severity="critical",
            category="x",
            title="x",
            description="x",
            suggested_fix="x",
            status="resolved",
        )
    )
    db_session.commit()

    resp = client.get(f"/projects/{project['id']}/timeline", headers=auth_headers)
    assert resp.status_code == 200
    entries = resp.json()
    assert len(entries) == 2
    assert entries[0]["run_number"] == 1
    assert entries[0]["run_id"] == run1["id"]
    assert entries[0]["critical_count"] == 1
    assert entries[0]["resolved_count"] == 1
    assert entries[1]["run_number"] == 2
    assert entries[1]["run_id"] == run2["id"]
    assert entries[1]["critical_count"] == 0


def test_timeline_requires_auth(client):
    resp = client.get(f"/projects/{uuid.uuid4()}/timeline")
    assert resp.status_code == 401


def test_timeline_on_someone_elses_project_is_404(client, auth_headers):
    project = create_project(client, auth_headers).json()

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.get(f"/projects/{project['id']}/timeline", headers=other_headers)
    assert resp.status_code == 404


def test_export_run_returns_pdf(client, db_session, auth_headers):
    from models.finding import Finding
    from models.persona_finding import PersonaFinding

    project = create_project(client, auth_headers).json()
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()
    pf = PersonaFinding(run_id=uuid.UUID(run["id"]), persona="investor", raw_output="x")
    db_session.add(pf)
    db_session.flush()
    db_session.add(
        Finding(
            run_id=uuid.UUID(run["id"]),
            persona_finding_id=pf.id,
            persona="investor",
            severity="critical",
            category="Unit Economics",
            title="Unsupported CAC",
            description="No data backs the $12 CAC claim.",
            suggested_fix="Run a real pilot and report the numbers.",
        )
    )
    db_session.commit()

    resp = client.get(f"/runs/{run['id']}/export", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:4] == b"%PDF"
    assert len(resp.content) > 100


def test_export_run_renders_non_latin_script(client, db_session, auth_headers):
    import io

    from pypdf import PdfReader

    from models.finding import Finding
    from models.persona_finding import PersonaFinding

    project = create_project(client, auth_headers, title="বাংলা পিচ ডেক").json()
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()
    pf = PersonaFinding(run_id=uuid.UUID(run["id"]), persona="investor", raw_output="x")
    db_session.add(pf)
    db_session.flush()
    db_session.add(
        Finding(
            run_id=uuid.UUID(run["id"]),
            persona_finding_id=pf.id,
            persona="investor",
            severity="critical",
            category="অর্থনীতি",
            title="অবাস্তব দাবি",
            description="এই দাবিটি বাস্তবসম্মত নয়।",
            suggested_fix="প্রকৃত তথ্য দিয়ে যাচাই করুন।",
        )
    )
    db_session.commit()

    resp = client.get(f"/runs/{run['id']}/export", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.content[:4] == b"%PDF"

    # A prior version fell back to latin-1 "replace", turning non-Latin text into
    # literal "?" characters. PDF text is glyph-ID encoded inside compressed
    # streams, not raw Unicode bytes, so the only real check is a round trip:
    # extract the text back out and confirm the actual Bengali glyphs are there.
    extracted = PdfReader(io.BytesIO(resp.content)).pages[0].extract_text()
    assert "বাংলা" in extracted
    assert "অবাস্তব দাবি" in extracted


def test_export_run_owned_by_someone_else_is_404(client, auth_headers):
    project = create_project(client, auth_headers).json()
    run = client.post(
        f"/projects/{project['id']}/run", json={"personas": ["investor"]}, headers=auth_headers
    ).json()

    other_email = f"other-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": other_email, "password": "Sup3rSecret!"})
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.get(f"/runs/{run['id']}/export", headers=other_headers)
    assert resp.status_code == 404


@pytest.mark.ai_integration
def test_create_project_from_repo(client, auth_headers):
    resp = client.post(
        "/projects/from-repo",
        json={
            "title": "psf/requests",
            "repo_url": "https://github.com/psf/requests",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["input_type"] == "codebase"
    assert len(body["raw_input"]) > 0


@pytest.mark.ai_integration
def test_create_project_from_repo_not_found(client, auth_headers):
    resp = client.post(
        "/projects/from-repo",
        json={"title": "nope", "repo_url": "https://github.com/this-owner-does-not-exist-zzz/repo-zzz"},
        headers=auth_headers,
    )
    assert resp.status_code == 422
