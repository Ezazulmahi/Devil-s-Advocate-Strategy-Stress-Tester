import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from controllers import finding_controller
from database import get_db
from deps import get_current_user
from models.finding import Finding
from models.rebuttal import Rebuttal
from models.user import User
from schemas.finding import FindingOut
from schemas.rebuttal import RebuttalCreate, RebuttalOut

router = APIRouter(prefix="/findings", tags=["findings"])


@router.get("/{finding_id}", response_model=FindingOut)
def get_finding(
    finding_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Finding:
    return finding_controller.get_owned_finding(db, finding_id, current_user)


@router.get("/{finding_id}/rebuttals", response_model=list[RebuttalOut])
def list_rebuttals(
    finding_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Rebuttal]:
    finding = finding_controller.get_owned_finding(db, finding_id, current_user)
    return finding_controller.list_rebuttals(db, finding)


@router.post("/{finding_id}/rebuttal", response_model=RebuttalOut, status_code=status.HTTP_201_CREATED)
def submit_rebuttal(
    finding_id: uuid.UUID,
    payload: RebuttalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Rebuttal:
    finding = finding_controller.get_owned_finding(db, finding_id, current_user)
    return finding_controller.submit_rebuttal(db, finding, payload)
