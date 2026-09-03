import io
import re

import httpx
from fastapi import HTTPException, status
from pypdf import PdfReader

MAX_PDF_BYTES = 15 * 1024 * 1024  # 15 MB
MAX_REPO_CHARS = 40_000
MAX_REPO_FILES = 25
_SOURCE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rb", ".php", ".c", ".cpp",
    ".h", ".hpp", ".cs", ".rs", ".kt", ".swift", ".scala", ".sql", ".yml", ".yaml",
    ".json", ".env.example", ".dockerfile", ".md",
}
_REPO_URL_RE = re.compile(r"github\.com[:/]([^/]+)/([^/.\s]+)")


def extract_pdf_text(file_bytes: bytes) -> str:
    if len(file_bytes) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"PDF exceeds the {MAX_PDF_BYTES // (1024 * 1024)} MB limit",
        )

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Could not read this file as a PDF",
        ) from exc

    text = "\n\n".join(p.strip() for p in pages if p.strip())
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No extractable text found in this PDF (it may be scanned images only)",
        )
    return text


def _parse_owner_repo(repo_url: str) -> tuple[str, str]:
    match = _REPO_URL_RE.search(repo_url)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="That doesn't look like a GitHub repo URL (expected github.com/owner/repo)",
        )
    return match.group(1), match.group(2)


def fetch_github_repo_text(repo_url: str) -> str:
    owner, repo = _parse_owner_repo(repo_url)

    with httpx.Client(timeout=15.0, headers={"Accept": "application/vnd.github+json"}) as http:
        repo_resp = http.get(f"https://api.github.com/repos/{owner}/{repo}")
        if repo_resp.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Repo not found — it may be private, deleted, or misspelled",
            )
        if repo_resp.status_code == 403:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="GitHub API rate limit hit — try again in a few minutes",
            )
        repo_resp.raise_for_status()
        default_branch = repo_resp.json()["default_branch"]

        tree_resp = http.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}",
            params={"recursive": "1"},
        )
        tree_resp.raise_for_status()
        tree = tree_resp.json().get("tree", [])

        candidate_paths = [
            item["path"]
            for item in tree
            if item.get("type") == "blob"
            and any(item["path"].lower().endswith(ext) for ext in _SOURCE_EXTENSIONS)
        ]
        candidate_paths.sort()

        chunks: list[str] = []
        total_chars = 0
        for path in candidate_paths[:MAX_REPO_FILES]:
            if total_chars >= MAX_REPO_CHARS:
                break
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{path}"
            file_resp = http.get(raw_url)
            if file_resp.status_code != 200:
                continue
            remaining = MAX_REPO_CHARS - total_chars
            content = file_resp.text[:remaining]
            chunks.append(f"--- {path} ---\n{content}")
            total_chars += len(content)

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No recognizable source files found in that repo",
        )
    return "\n\n".join(chunks)
