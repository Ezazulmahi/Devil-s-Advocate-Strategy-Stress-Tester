import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from agents.classifier import detect_input_type, suggested_personas
from agents.ingestion import extract_pdf_text, fetch_github_repo_text
from models.enums import InputType
from models.project import StressTestProject
from models.user import User
from schemas.project import InputTypeDetectResponse, ProjectCreate


def get_owned_project(db: Session, project_id: uuid.UUID, user: User) -> StressTestProject:
    project = db.get(StressTestProject, project_id)
    if project is None or project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _persist_project(
    db: Session, user: User, title: str, input_type: InputType | None, raw_input: str
) -> StressTestProject:
    if input_type is None:
        input_type = detect_input_type(raw_input)
    project = StressTestProject(
        user_id=user.id, title=title, input_type=input_type, raw_input=raw_input
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def create_project(db: Session, user: User, payload: ProjectCreate) -> StressTestProject:
    return _persist_project(db, user, payload.title, payload.input_type, payload.raw_input)


def create_project_from_pdf(
    db: Session, user: User, title: str, file_bytes: bytes
) -> StressTestProject:
    raw_input = extract_pdf_text(file_bytes)
    return _persist_project(db, user, title, None, raw_input)


def create_project_from_repo(
    db: Session, user: User, title: str, repo_url: str
) -> StressTestProject:
    raw_input = fetch_github_repo_text(repo_url)
    # A repo is unambiguously a codebase — skip the heuristic classifier.
    return _persist_project(db, user, title, InputType.codebase, raw_input)


def classify_input(raw_input: str) -> InputTypeDetectResponse:
    input_type = detect_input_type(raw_input)
    return InputTypeDetectResponse(
        input_type=input_type, suggested_personas=suggested_personas(input_type)
    )


def list_projects(
    db: Session, user: User, limit: int = 50, offset: int = 0
) -> tuple[list[StressTestProject], int]:
    query = db.query(StressTestProject).filter(StressTestProject.user_id == user.id)
    total = query.count()
    items = (
        query.order_by(StressTestProject.created_at.desc()).limit(limit).offset(offset).all()
    )
    return items, total


def delete_project(db: Session, project: StressTestProject) -> None:
    db.delete(project)
    db.commit()
