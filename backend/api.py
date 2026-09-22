"""FastAPI main router for CloudGuard backend."""
from fastapi import APIRouter

from backend.routers import health, summary, identities, findings, recommendations, scans

router = APIRouter()
router.include_router(health.router)
router.include_router(summary.router)
router.include_router(identities.router)
router.include_router(findings.router)
router.include_router(recommendations.router)
router.include_router(scans.router)
