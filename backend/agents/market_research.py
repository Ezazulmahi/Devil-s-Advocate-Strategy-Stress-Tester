import logging

from ddgs import DDGS

logger = logging.getLogger(__name__)


def search_competitors(query: str, max_results: int = 5) -> str:
    """Live web search grounding the Competitor persona in real market data.

    Returns a formatted text blob, or an empty string if the search fails —
    the persona critique still runs, just without live grounding.
    """
    try:
        results = DDGS().text(query, max_results=max_results)
    except Exception:
        logger.warning("Web search failed for query %r; continuing without it", query, exc_info=True)
        return ""

    if not results:
        return ""

    lines = []
    for r in results:
        title = r.get("title", "").strip()
        body = r.get("body", "").strip()
        href = r.get("href", "").strip()
        if title or body:
            lines.append(f"- {title}: {body} ({href})")
    return "\n".join(lines)
