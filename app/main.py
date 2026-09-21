"""CloudGuard application entry point.

Mounts the FastAPI router and serves the static dashboard.
Run with:

    python -m uvicorn app.main:app --reload
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = FastAPI(
    title="CloudGuard",
    description=(
        "Cloud Permission Drift Detection & Remediation. "
        "CloudGuard uses its own internal risk model. "
        "No AWS resource is modified automatically."
    ),
    version="0.1.0-mvp",
)

# Mount the API router
app.include_router(router)

# Serve the frontend dashboard from app/static/
_STATIC_DIR = Path(__file__).parent / "static"


@app.get("/", include_in_schema=False)
def serve_dashboard() -> FileResponse:
    """Serve the main dashboard HTML."""
    return FileResponse(_STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")
