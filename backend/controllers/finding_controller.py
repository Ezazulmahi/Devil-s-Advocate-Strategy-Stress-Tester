import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from agents.escalation import escalate_finding
from models.enums import FindingStatus
from models.finding import Finding
from models.rebuttal import Rebuttal
from models.run import StressTestRun
from models.user import User
from schemas.rebuttal import RebuttalCreate


def get_owned_finding(db: Session, finding_id: uuid.UUID, user: User) -> Finding:
    finding = (
        db.query(Finding)
        .join(StressTestRun, Finding.run_id == StressTestRun.id)
        .options(joinedload(Finding.run).joinedload(StressTestRun.project))
        .filter(Finding.id == finding_id)
        .first()
    )
    if finding is None or finding.run.project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
    return finding


def list_rebuttals(db: Session, finding: Finding) -> list[Rebuttal]:
    return (
        db.query(Rebuttal)
        .filter(Rebuttal.finding_id == finding.id)
        .order_by(Rebuttal.created_at)
        .all()
    )


def submit_rebuttal(db: Session, finding: Finding, payload: RebuttalCreate) -> Rebuttal:
    history = list_rebuttals(db, finding)
    result = escalate_finding(finding, history, payload.user_response)

    if result.new_severity is not None and result.new_severity != finding.severity:
        finding.severity = result.new_severity
        finding.status = FindingStatus.downgraded
    if result.verdict == "concede":
        finding.status = FindingStatus.resolved

    rebuttal = Rebuttal(
        finding_id=finding.id,
        user_response=payload.user_response,
        persona_counter_response=result.counter_response,
    )
    db.add(rebuttal)
    db.commit()
    db.refresh(rebuttal)
    return rebuttal
