import re
from pathlib import Path

from fpdf import FPDF

from models.finding import Finding
from models.project import StressTestProject
from models.run import StressTestRun

_FONT_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
_FONT_LATIN = "NotoSans"
_FONT_BENGALI = "NotoSansBengali"

_SEVERITY_COLORS = {
    "critical": (196, 55, 43),
    "major": (217, 142, 43),
    "minor": (107, 114, 128),
}

# Matches runs of Bengali script so they can be rendered with NotoSansBengali —
# NotoSans (Latin/Greek/Cyrillic) doesn't cover it, and no single bundled font
# covers both scripts well.
_BENGALI_RUN = re.compile(r"[ঀ-৿]+")


def _register_fonts(pdf: FPDF) -> None:
    # Noto Sans ships as a variable font; fpdf2 renders its default (Regular)
    # instance regardless of requested weight, so bold/italic map to the same
    # file — text stays fully Unicode-capable, just without a true bold face.
    for style in ("", "B", "I", "BI"):
        pdf.add_font(_FONT_LATIN, style, str(_FONT_DIR / "NotoSans-Regular.ttf"))
        pdf.add_font(_FONT_BENGALI, style, str(_FONT_DIR / "NotoSansBengali-Regular.ttf"))


def _split_script_runs(text: str) -> list[tuple[str, bool]]:
    """Splits text into (segment, is_bengali) runs so each can use the font that covers it."""
    runs: list[tuple[str, bool]] = []
    pos = 0
    for match in _BENGALI_RUN.finditer(text):
        if match.start() > pos:
            runs.append((text[pos : match.start()], False))
        runs.append((match.group(), True))
        pos = match.end()
    if pos < len(text):
        runs.append((text[pos:], False))
    return runs or [("", False)]


def _write_line(pdf: FPDF, text: str, size: float, style: str = "", height: float = 6) -> None:
    """Writes one wrapped, line-broken paragraph, switching fonts per script run.

    Characters unsupported by either bundled font (e.g. emoji) are dropped by
    fpdf2 with a logged warning rather than corrupting the rest of the line —
    graceful degradation instead of the old latin-1 mojibake fallback.
    """
    for segment, is_bengali in _split_script_runs(text):
        if not segment:
            continue
        pdf.set_font(_FONT_BENGALI if is_bengali else _FONT_LATIN, style, size)
        pdf.write(height, segment)
    pdf.ln(height)


def build_run_report_pdf(project: StressTestProject, run: StressTestRun, findings: list[Finding]) -> bytes:
    pdf = FPDF()
    _register_fonts(pdf)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    _write_line(pdf, "Devil's Advocate — Stress Test Report", 18, "B", height=10)

    _write_line(pdf, project.title, 12, height=8)
    pdf.set_text_color(100, 100, 100)
    _write_line(
        pdf, f"Run status: {run.status.value} | Personas: {', '.join(run.personas_used)}", 10, height=6
    )
    pdf.ln(4)
    pdf.set_text_color(0, 0, 0)

    counts = {"critical": 0, "major": 0, "minor": 0}
    for f in findings:
        counts[f.severity.value] += 1

    _write_line(
        pdf,
        f"{counts['critical']} critical | {counts['major']} major | {counts['minor']} minor",
        12,
        "B",
        height=8,
    )
    pdf.ln(4)

    sorted_findings = sorted(findings, key=lambda f: ["critical", "major", "minor"].index(f.severity.value))

    for finding in sorted_findings:
        color = _SEVERITY_COLORS[finding.severity.value]
        pdf.set_text_color(*color)
        _write_line(pdf, f"[{finding.severity.value.upper()}] {finding.title}", 12, "B", height=7)
        pdf.set_text_color(0, 0, 0)

        _write_line(pdf, f"Persona: {finding.persona.value} | Category: {finding.category}", 9, "I", height=5)

        _write_line(pdf, finding.description, 10, height=5)
        pdf.ln(1)

        _write_line(pdf, "Suggested fix:", 10, "B", height=5)
        _write_line(pdf, finding.suggested_fix, 10, height=5)
        pdf.ln(5)

    if not findings:
        _write_line(pdf, "No findings for this run.", 11, "I", height=8)

    return bytes(pdf.output())
