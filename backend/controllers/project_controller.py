import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.project import StressTestProject
from models.user import User
from schemas.project import ProjectCreate


def get_owned_project(db: Session, project_id: uuid.UUID, user: User) -> StressTestProject:
    project = db.get(StressTestProject, project_id)
    if project is None or project.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def create_project(db: Session, user: User, payload: ProjectCreate) -> StressTestProject:
    project = StressTestProject(
        user_id=user.id,
        title=payload.title,
        input_type=payload.input_type,
        raw_input=payload.raw_input,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session, user: User) -> list[StressTestProject]:
    return (
        db.query(StressTestProject)
        .filter(StressTestProject.user_id == user.id)
        .order_by(StressTestProject.created_at.desc())
        .all()
    )
