import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from controllers import project_controller, run_controller, timeline_controller
from database import get_db
from deps import get_current_user
from models.project import StressTestProject
from models.run import StressTestRun
from models.user import User
from schemas.project import (
    InputTypeDetectRequest,
    InputTypeDetectResponse,
    ProjectCreate,
    ProjectFromRepoCreate,
    ProjectOut,
)
from schemas.run import RunCreate, RunOut
from schemas.timeline import TimelineEntry

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/detect-input-type", response_model=InputTypeDetectResponse)
def detect_input_type(
    payload: InputTypeDetectRequest, current_user: User = Depends(get_current_user)
) -> InputTypeDetectResponse:
    return project_controller.classify_input(payload.raw_input)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestProject:
    return project_controller.create_project(db, current_user, payload)


@router.post("/upload", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project_from_pdf(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestProject:
    file_bytes = file.file.read()
    return project_controller.create_project_from_pdf(db, current_user, title, file_bytes)


@router.post("/from-repo", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project_from_repo(
    payload: ProjectFromRepoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestProject:
    return project_controller.create_project_from_repo(db, current_user, payload.title, payload.repo_url)


@router.get("", response_model=list[ProjectOut])
def list_projects(
    response: Response,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StressTestProject]:
    items, total = project_controller.list_projects(db, current_user, limit, offset)
    response.headers["X-Total-Count"] = str(total)
    return items


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StressTestProject:
    return project_controller.get_owned_project(db, project_id, current_user)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    project = project_controller.get_owned_project(db, project_id, current_user)
    project_controller.delete_project(db, project)


@router.get("/{project_id}/runs", response_model=list[RunOut])
def list_runs(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StressTestRun]:
    project = project_controller.get_owned_project(db, project_id, current_user)
    return run_controller.list_runs_for_project(db, project)


@router.get("/{project_id}/timeline", response_model=list[TimelineEntry])
def get_timeline(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TimelineEntry]:
    project = project_controller.get_owned_project(db, project_id, current_user)
    return timeline_controller.get_timeline(db, project)


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
