import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from deps import get_current_user
from models.finding import Finding
from models.rebuttal import Rebuttal
from models.run import StressTestRun
from models.user import User
from schemas.finding import FindingOut
from schemas.rebuttal import RebuttalCreate, RebuttalOut

router = APIRouter(prefix="/findings", tags=["findings"])


def _get_owned_finding(finding_id: uuid.UUID, user: User, db: Session) -> Finding:
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


@router.get("/{finding_id}", response_model=FindingOut)
def get_finding(
    finding_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Finding:
    return _get_owned_finding(finding_id, current_user, db)


@router.get("/{finding_id}/rebuttals", response_model=list[RebuttalOut])
def list_rebuttals(
    finding_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Rebuttal]:
    finding = _get_owned_finding(finding_id, current_user, db)
    return (
        db.query(Rebuttal)
        .filter(Rebuttal.finding_id == finding.id)
        .order_by(Rebuttal.created_at)
        .all()
    )


@router.post("/{finding_id}/rebuttal", response_model=RebuttalOut, status_code=status.HTTP_201_CREATED)
def submit_rebuttal(
    finding_id: uuid.UUID,
    payload: RebuttalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Rebuttal:
    finding = _get_owned_finding(finding_id, current_user, db)

    # persona_counter_response stays null until the persona/aggregator agents exist.
    rebuttal = Rebuttal(finding_id=finding.id, user_response=payload.user_response)
    db.add(rebuttal)
    db.commit()
    db.refresh(rebuttal)
    return rebuttal
