import enum


class InputType(str, enum.Enum):
    business_plan = "business_plan"
    pitch = "pitch"
    codebase = "codebase"
    research_paper = "research_paper"


class RunStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class PersonaId(str, enum.Enum):
    competitor = "competitor"
    investor = "investor"
    hacker = "hacker"
    customer = "customer"
    academic = "academic"


class Severity(str, enum.Enum):
    critical = "critical"
    major = "major"
    minor = "minor"


class FindingStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"
    downgraded = "downgraded"
