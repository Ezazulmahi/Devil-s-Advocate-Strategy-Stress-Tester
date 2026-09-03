import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from agents.aggregator import aggregate_findings
from agents.orchestrator import run_personas_parallel
from database import SessionLocal
from models.enums import PersonaId, RunStatus
from models.finding import Finding
from models.persona_finding import PersonaFinding
from models.project import StressTestProject
from models.run import StressTestRun
from models.user import User
from schemas.run import RunCreate

logger = logging.getLogger(__name__)


def create_run(db: Session, project: StressTestProject, payload: RunCreate) -> StressTestRun:
    run = StressTestRun(
        project_id=project.id,
        personas_used=[p.value for p in payload.personas],
        status=RunStatus.pending,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def list_runs_for_project(db: Session, project: StressTestProject) -> list[StressTestRun]:
    return (
        db.query(StressTestRun)
        .filter(StressTestRun.project_id == project.id)
        .order_by(StressTestRun.created_at)
        .all()
    )


def get_owned_run(db: Session, run_id: uuid.UUID, user: User) -> StressTestRun:
    run = (
        db.query(StressTestRun)
        .options(joinedload(StressTestRun.project))
        .filter(StressTestRun.id == run_id)
        .first()
    )
    if run is None or run.project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run


def list_findings_for_run(
    db: Session, run: StressTestRun, limit: int = 100, offset: int = 0
) -> tuple[list[Finding], int]:
    query = db.query(Finding).filter(Finding.run_id == run.id)
    total = query.count()
    items = query.order_by(Finding.created_at).limit(limit).offset(offset).all()
    return items, total


def execute_run(run_id: uuid.UUID) -> None:
    """Runs the persona critiques + aggregator for a run and persists the results.

    Called as a FastAPI background task, so it opens its own DB session — the
    request-scoped session is already closed by the time this runs.
    """
    db = SessionLocal()
    try:
        run = db.get(StressTestRun, run_id)
        if run is None:
            return
        project = run.project

        run.status = RunStatus.running
        db.commit()

        persona_ids = [PersonaId(p) for p in run.personas_used]
        persona_outputs = run_personas_parallel(project, persona_ids)

        persona_finding_by_persona: dict[str, PersonaFinding] = {}
        for persona_id, raw_output in persona_outputs.items():
            persona_finding = PersonaFinding(
                run_id=run.id, persona=persona_id, raw_output=raw_output
            )
            db.add(persona_finding)
            persona_finding_by_persona[persona_id.value] = persona_finding
        db.flush()

        aggregated = aggregate_findings(project, persona_outputs)
        for item in aggregated:
            persona_finding = persona_finding_by_persona.get(item.persona.value)
            if persona_finding is None:
                # Aggregator attributed a finding to a persona that wasn't run; skip it
                # rather than violate the persona_finding_id foreign key.
                continue
            db.add(
                Finding(
                    run_id=run.id,
                    persona_finding_id=persona_finding.id,
                    persona=item.persona,
                    severity=item.severity,
                    category=item.category,
                    title=item.title,
                    description=item.description,
                    suggested_fix=item.suggested_fix,
                )
            )

        run.status = RunStatus.completed
        run.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        logger.exception("Stress-test run %s failed", run_id)
        db.rollback()
        run = db.get(StressTestRun, run_id)
        if run is not None:
            run.status = RunStatus.failed
            db.commit()
    finally:
        db.close()
