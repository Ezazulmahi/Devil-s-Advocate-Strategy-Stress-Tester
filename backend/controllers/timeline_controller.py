from sqlalchemy.orm import Session

from models.enums import FindingStatus, Severity
from models.finding import Finding
from models.project import StressTestProject
from models.run import StressTestRun
from schemas.timeline import TimelineEntry


def get_timeline(db: Session, project: StressTestProject) -> list[TimelineEntry]:
    runs = (
        db.query(StressTestRun)
        .filter(StressTestRun.project_id == project.id)
        .order_by(StressTestRun.created_at)
        .all()
    )

    entries: list[TimelineEntry] = []
    for index, run in enumerate(runs, start=1):
        findings = db.query(Finding).filter(Finding.run_id == run.id).all()
        entries.append(
            TimelineEntry(
                run_id=run.id,
                run_number=index,
                status=run.status,
                created_at=run.created_at,
                completed_at=run.completed_at,
                critical_count=sum(1 for f in findings if f.severity == Severity.critical),
                major_count=sum(1 for f in findings if f.severity == Severity.major),
                minor_count=sum(1 for f in findings if f.severity == Severity.minor),
                resolved_count=sum(1 for f in findings if f.status == FindingStatus.resolved),
                downgraded_count=sum(1 for f in findings if f.status == FindingStatus.downgraded),
            )
        )
    return entries
