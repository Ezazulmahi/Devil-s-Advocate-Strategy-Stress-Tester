import uuid

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from controllers import export_controller, run_controller
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
    response: Response,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Finding]:
    run = run_controller.get_owned_run(db, run_id, current_user)
    items, total = run_controller.list_findings_for_run(db, run, limit, offset)
    response.headers["X-Total-Count"] = str(total)
    return items


@router.get("/{run_id}/export")
def export_run(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    run = run_controller.get_owned_run(db, run_id, current_user)
    findings, _ = run_controller.list_findings_for_run(db, run, limit=500, offset=0)
    pdf_bytes = export_controller.build_run_report_pdf(run.project, run, findings)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="stress-test-run-{run.id}.pdf"'},
    )
