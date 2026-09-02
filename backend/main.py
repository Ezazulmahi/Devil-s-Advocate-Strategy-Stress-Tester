from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import auth, findings, projects, runs

app = FastAPI(title="Devil's Advocate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(runs.router)
app.include_router(findings.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
