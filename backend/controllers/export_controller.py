from fpdf import FPDF

from models.finding import Finding
from models.project import StressTestProject
from models.run import StressTestRun

_SEVERITY_COLORS = {
    "critical": (196, 55, 43),
    "major": (217, 142, 43),
    "minor": (107, 114, 128),
}


def _clean(text: str) -> str:
    # FPDF's built-in fonts are latin-1 only; degrade unsupported characters rather than crash.
    return text.encode("latin-1", "replace").decode("latin-1")


def build_run_report_pdf(project: StressTestProject, run: StressTestRun, findings: list[Finding]) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, _clean("Devil's Advocate — Stress Test Report"), new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, _clean(project.title), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(
        0,
        6,
        _clean(f"Run status: {run.status.value} | Personas: {', '.join(run.personas_used)}"),
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(4)
    pdf.set_text_color(0, 0, 0)

    counts = {"critical": 0, "major": 0, "minor": 0}
    for f in findings:
        counts[f.severity.value] += 1

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(
        0,
        8,
        _clean(f"{counts['critical']} critical | {counts['major']} major | {counts['minor']} minor"),
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(4)

    sorted_findings = sorted(findings, key=lambda f: ["critical", "major", "minor"].index(f.severity.value))

    for finding in sorted_findings:
        color = _SEVERITY_COLORS[finding.severity.value]
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*color)
        pdf.multi_cell(0, 7, _clean(f"[{finding.severity.value.upper()}] {finding.title}"))
        pdf.set_text_color(0, 0, 0)

        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(
            0, 5, _clean(f"Persona: {finding.persona.value} | Category: {finding.category}"), new_x="LMARGIN", new_y="NEXT"
        )

        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, _clean(finding.description))
        pdf.ln(1)

        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 5, _clean("Suggested fix:"), new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, _clean(finding.suggested_fix))
        pdf.ln(5)

    if not findings:
        pdf.set_font("Helvetica", "I", 11)
        pdf.cell(0, 8, _clean("No findings for this run."), new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())
