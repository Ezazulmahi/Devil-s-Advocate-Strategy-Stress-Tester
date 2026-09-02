import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from deps import get_current_user
from models.project import StressTestProject
from models.run import StressTestRun
from models.user import User
from schemas.project import ProjectCreate, ProjectOut
from schemas.run import RunCreate, RunOut

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_owned_project(project_id: uuid.UUID, user: User, db: Session) -> StressTestProject:
    project = db.get(StressTestProject, project_id)
    if project is None or project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestProject:
    project = StressTestProject(
        user_id=current_user.id,
        title=payload.title,
        input_type=payload.input_type,
        raw_input=payload.raw_input,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectOut])
def list_projects(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[StressTestProject]:
    return (
        db.query(StressTestProject)
        .filter(StressTestProject.user_id == current_user.id)
        .order_by(StressTestProject.created_at.desc())
        .all()
    )


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestProject:
    return _get_owned_project(project_id, current_user, db)


@router.get("/{project_id}/runs", response_model=list[RunOut])
def list_runs(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StressTestRun]:
    project = _get_owned_project(project_id, current_user, db)
    return (
        db.query(StressTestRun)
        .filter(StressTestRun.project_id == project.id)
        .order_by(StressTestRun.created_at)
        .all()
    )


@router.post("/{project_id}/run", response_model=RunOut, status_code=status.HTTP_201_CREATED)
def start_run(
    project_id: uuid.UUID,
    payload: RunCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestRun:
    project = _get_owned_project(project_id, current_user, db)

    # Persists the run as "pending" only. Persona execution (LangChain agents,
    # aggregation into findings) is wired in separately once the AI layer is built.
    run = StressTestRun(
        project_id=project.id,
        personas_used=[p.value for p in payload.personas],
        status="pending",
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run
