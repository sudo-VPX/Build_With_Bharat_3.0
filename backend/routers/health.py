from typing import Any
from fastapi import APIRouter
from backend import state

router = APIRouter()

@router.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok", 
        "mode": state.current_mode, 
        "identities_scanned": len(state.reports), 
        "scan_error": state.scan_error, 
        "disclaimer": "CloudGuard uses its own internal risk model. Results are review recommendations only — no AWS policy is changed automatically."
    }
