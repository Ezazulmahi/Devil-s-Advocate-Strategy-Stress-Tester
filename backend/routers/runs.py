import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from deps import get_current_user
from models.finding import Finding
from models.run import StressTestRun
from models.user import User
from schemas.finding import FindingOut
from schemas.run import RunOut

router = APIRouter(prefix="/runs", tags=["runs"])


def _get_owned_run(run_id: uuid.UUID, user: User, db: Session) -> StressTestRun:
    run = (
        db.query(StressTestRun)
        .options(joinedload(StressTestRun.project))
        .filter(StressTestRun.id == run_id)
        .first()
    )
    if run is None or run.project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run


@router.get("/{run_id}", response_model=RunOut)
def get_run(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestRun:
    return _get_owned_run(run_id, current_user, db)


@router.get("/{run_id}/findings", response_model=list[FindingOut])
def list_findings(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Finding]:
    run = _get_owned_run(run_id, current_user, db)
    return (
        db.query(Finding)
        .filter(Finding.run_id == run.id)
        .order_by(Finding.created_at)
        .all()
    )
