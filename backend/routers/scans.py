from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend import state

router = APIRouter()

class ScanRequest(BaseModel):
    mode: str = "demo"
    aws_profile: str | None = None
    aws_region: str | None = None

@router.post("/api/scans")
def run_scan(body: ScanRequest) -> dict[str, Any]:
    mode = body.mode.strip().lower()
    if mode not in {"demo", "live"}:
        raise HTTPException(status_code=422, detail="mode must be 'demo' or 'live'.")
    if mode == "demo":
        state.load_demo()
        return {"mode": "demo", "identities_scanned": len(state.reports), "status": "ok"}
    try:
        state.load_live(profile=body.aws_profile, region=body.aws_region)
        return {"mode": "live", "identities_scanned": len(state.reports), "status": "ok"}
    except RuntimeError as exc:
        state.scan_error = str(exc)
        raise HTTPException(status_code=503, detail=f"Live AWS scan failed: {exc}. Check your AWS CLI profile and permissions.") from exc
