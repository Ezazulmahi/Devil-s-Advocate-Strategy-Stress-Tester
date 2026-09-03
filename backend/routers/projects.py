import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from controllers import project_controller, run_controller
from database import get_db
from deps import get_current_user
from models.project import StressTestProject
from models.run import StressTestRun
from models.user import User
from schemas.project import ProjectCreate, ProjectOut
from schemas.run import RunCreate, RunOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestProject:
    return project_controller.create_project(db, current_user, payload)


@router.get("", response_model=list[ProjectOut])
def list_projects(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[StressTestProject]:
    return project_controller.list_projects(db, current_user)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestProject:
    return project_controller.get_owned_project(db, project_id, current_user)


@router.get("/{project_id}/runs", response_model=list[RunOut])
def list_runs(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StressTestRun]:
    project = project_controller.get_owned_project(db, project_id, current_user)
    return run_controller.list_runs_for_project(db, project)


@router.post("/{project_id}/run", response_model=RunOut, status_code=status.HTTP_201_CREATED)
def start_run(
    project_id: uuid.UUID,
    payload: RunCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestRun:
    project = project_controller.get_owned_project(db, project_id, current_user)
    run = run_controller.create_run(db, project, payload)
    background_tasks.add_task(run_controller.execute_run, run.id)
    return run
