import re
from dataclasses import dataclass


@dataclass
class StaticFinding:
    category: str
    pattern_name: str
    line_number: int
    snippet: str


_PATTERNS: list[tuple[str, str, re.Pattern[str]]] = [
    (
        "Secrets Management",
        "Hardcoded AWS access key",
        re.compile(r"AKIA[0-9A-Z]{16}"),
    ),
    (
        "Secrets Management",
        "Hardcoded password/API key/secret literal",
        re.compile(
            r"(?i)\b(api[_-]?key|secret|password|passwd|token)\b\s*[:=]\s*['\"][^'\"\s]{6,}['\"]"
        ),
    ),
    (
        "Injection",
        "SQL query built via string concatenation/formatting",
        re.compile(
            r"(?is)\b(select|insert|update|delete)\b[^;'\"]{0,200}['\"]?\s*(\+|%\s|\.format\(|f['\"])"
        ),
    ),
    (
        "Injection",
        "Use of eval()/exec() on dynamic input",
        re.compile(r"\b(eval|exec)\s*\("),
    ),
    (
        "Injection",
        "Shell command executed with shell=True or os.system",
        re.compile(r"os\.system\(|subprocess\.[a-zA-Z_]+\([^)]*shell\s*=\s*True"),
    ),
    (
        "Insecure Deserialization",
        "Unsafe deserialization (pickle/yaml.load)",
        re.compile(r"pickle\.loads?\(|yaml\.load\((?!.*Loader\s*=\s*yaml\.SafeLoader)"),
    ),
    (
        "Cryptography",
        "Weak hash algorithm (MD5/SHA1) used, possibly for passwords",
        re.compile(r"hashlib\.(md5|sha1)\("),
    ),
    (
        "Transport Security",
        "TLS/SSL certificate verification disabled",
        re.compile(r"verify\s*=\s*False"),
    ),
    (
        "Configuration",
        "Debug mode enabled (framework may leak stack traces in production)",
        re.compile(r"(?i)\bDEBUG\s*=\s*True\b|debug\s*=\s*True"),
    ),
    (
        "CORS Misconfiguration",
        "Wildcard CORS origin allows any site to call this API",
        re.compile(r"allow_origins\s*=\s*\[\s*['\"]\*['\"]\s*\]|Access-Control-Allow-Origin.*\*"),
    ),
    (
        "Authentication",
        "JWT/session secret has a hardcoded fallback default",
        re.compile(r"(?i)(jwt|session)[_-]?secret['\"]?\s*[,)]?\s*(or|\?\?|\|\|)\s*['\"][^'\"]{4,}['\"]"),
    ),
]


def run_static_scan(source: str) -> list[StaticFinding]:
    findings: list[StaticFinding] = []
    lines = source.splitlines()
    for line_number, line in enumerate(lines, start=1):
        for category, pattern_name, pattern in _PATTERNS:
            if pattern.search(line):
                findings.append(
                    StaticFinding(
                        category=category,
                        pattern_name=pattern_name,
                        line_number=line_number,
                        snippet=line.strip()[:200],
                    )
                )
    return findings


def format_static_findings(findings: list[StaticFinding]) -> str:
    if not findings:
        return "Static pattern scan found no matches — reason from the code itself."
    lines = [
        f"- [{f.category}] {f.pattern_name} (line {f.line_number}): {f.snippet}" for f in findings
    ]
    return "\n".join(lines)
