import uuid

import pytest

from controllers.run_controller import execute_run
from database import SessionLocal
from models.enums import FindingStatus, InputType, PersonaId, RunStatus
from models.finding import Finding
from models.persona_finding import PersonaFinding
from models.project import StressTestProject
from models.rebuttal import Rebuttal
from models.run import StressTestRun
from models.user import User
from security import hash_password

pytestmark = pytest.mark.ai_integration


@pytest.fixture()
def real_project():
    """Creates real, committed rows on a fresh connection — execute_run opens its
    own SessionLocal() and would not see anything living only inside the rolled-back
    transaction the rest of the suite uses. Cleaned up via cascade delete afterward.
    """
    db = SessionLocal()
    user = User(
        email=f"ai-integration-{uuid.uuid4().hex[:10]}@example.com",
        hashed_password=hash_password("Sup3rSecret!"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    project = StressTestProject(
        user_id=user.id,
        title="PitchPilot — AI co-pilot for sales decks",
        input_type=InputType.pitch,
        raw_input=(
            "PitchPilot charges $49/month per seat with a $9 CAC driven entirely by a viral "
            "referral loop. We have no named competitors and believe our AI-generated slide "
            "decks are fully defensible because building this would take a competitor at "
            "least two years."
        ),
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    yield db, project

    db.delete(user)
    db.commit()
    db.close()


def test_execute_run_produces_persisted_findings(real_project):
    db, project = real_project
    run = StressTestRun(
        project_id=project.id,
        personas_used=[PersonaId.investor.value, PersonaId.competitor.value],
        status=RunStatus.pending,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    execute_run(run.id)

    db.refresh(run)
    assert run.status == RunStatus.completed
    assert run.completed_at is not None

    persona_findings = db.query(PersonaFinding).filter(PersonaFinding.run_id == run.id).all()
    assert {pf.persona for pf in persona_findings} == {PersonaId.investor, PersonaId.competitor}
    assert all(len(pf.raw_output) > 0 for pf in persona_findings)

    findings = db.query(Finding).filter(Finding.run_id == run.id).all()
    assert len(findings) > 0
    for finding in findings:
        assert finding.persona in {PersonaId.investor, PersonaId.competitor}
        assert finding.severity is not None
        assert len(finding.title) > 0
        assert len(finding.suggested_fix) > 0


def test_execute_run_marks_failed_on_error(real_project, monkeypatch):
    db, project = real_project
    run = StressTestRun(
        project_id=project.id,
        personas_used=[PersonaId.investor.value],
        status=RunStatus.pending,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    def boom(*args, **kwargs):
        raise RuntimeError("simulated LLM outage")

    monkeypatch.setattr("controllers.run_controller.run_personas_parallel", boom)

    execute_run(run.id)

    db.refresh(run)
    assert run.status == RunStatus.failed


def test_escalate_finding_via_rebuttal_endpoint(real_project):
    """Runs the real escalation chain through finding_controller.submit_rebuttal
    directly, on the same committed connection real_project set up.
    """
    from controllers.finding_controller import submit_rebuttal
    from schemas.rebuttal import RebuttalCreate

    db, project = real_project

    run = StressTestRun(
        project_id=project.id, personas_used=[PersonaId.investor.value], status=RunStatus.completed
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    persona_finding = PersonaFinding(run_id=run.id, persona=PersonaId.investor, raw_output="raw")
    db.add(persona_finding)
    db.flush()

    finding = Finding(
        run_id=run.id,
        persona_finding_id=persona_finding.id,
        persona=PersonaId.investor,
        severity="critical",
        category="Unit Economics",
        title="Unsupported $9 CAC claim",
        description="The $9 CAC has no supporting data or channel breakdown.",
        suggested_fix="Provide a cohort analysis backing the $9 figure.",
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)

    rebuttal = submit_rebuttal(
        db,
        finding,
        RebuttalCreate(
            user_response=(
                "We ran a 5,000-user referral cohort over 3 months and measured blended CAC "
                "at $9.20 including infra costs, with a full attribution breakdown by channel."
            )
        ),
    )

    assert isinstance(rebuttal, Rebuttal)
    assert len(rebuttal.persona_counter_response) > 0
    db.refresh(finding)
    assert finding.status in {FindingStatus.open, FindingStatus.resolved, FindingStatus.downgraded}
