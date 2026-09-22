from __future__ import annotations

import logging
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("cloudguard")

app = FastAPI(
    title="CloudGuard",
    description="Cloud Permission Drift Detection & Remediation",
    version="1.0.0",
)

app.include_router(router)

# Serve built React app from frontend/dist/
DIST = Path(__file__).parent / "frontend" / "dist"
if DIST.exists():
    # Mount static assets (JS, CSS, images)
    assets_dir = DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        """Serve index.html for all non-API routes (client-side routing)."""
        # Don't catch API routes
        if full_path.startswith("api/") or full_path == "health":
            from fastapi import HTTPException
            raise HTTPException(status_code=404)
        index = DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return {"error": "Frontend not built. Run: cd frontend && npm install && npm run build"}
else:
    logger.warning(
        "frontend/dist/ not found — React app not built yet.\n"
        "Run:  cd frontend && npm install && npm run build\n"
        "Then restart the server."
    )

    @app.get("/", include_in_schema=False)
    def root():
        return {
            "message": "CloudGuard API is running",
            "docs": "/docs",
            "note": "Frontend not built. Run: cd frontend && npm install && npm run build",
            "api": {
                "health": "/health",
                "summary": "/api/summary",
                "identities": "/api/identities",
                "findings": "/api/findings",
                "recommendations": "/api/recommendations",
            },
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
