import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from controllers import run_controller
from database import get_db
from deps import get_current_user
from models.finding import Finding
from models.run import StressTestRun
from models.user import User
from schemas.finding import FindingOut
from schemas.run import RunOut

router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("/{run_id}", response_model=RunOut)
def get_run(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestRun:
    return run_controller.get_owned_run(db, run_id, current_user)


@router.get("/{run_id}/findings", response_model=list[FindingOut])
def list_findings(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Finding]:
    run = run_controller.get_owned_run(db, run_id, current_user)
    return run_controller.list_findings_for_run(db, run)
