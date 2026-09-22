from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend import state
from backend.routers.identities import _enrich_rec

router = APIRouter()

class ReviewRequest(BaseModel):
    decision: str
    reviewer_note: str = ""

@router.get("/api/recommendations")
def list_recommendations() -> list[dict[str, Any]]:
    recs = [_enrich_rec({**rec.to_dict(), "identity_name": state.reports[rec.identity_id].identity.name}) for report in state.reports.values() for rec in report.recommendations]
    status_order = {"PENDING_HUMAN_REVIEW": 0, "APPROVED": 1, "REJECTED": 2}
    recs.sort(key=lambda r: status_order.get(r["status"], 9))
    return recs

@router.post("/api/recommendations/{rec_id}/review")
def review_recommendation(rec_id: str, body: ReviewRequest) -> dict[str, Any]:
    if rec_id not in state.recommendation_status:
        raise HTTPException(status_code=404, detail=f"Recommendation '{rec_id}' not found.")
    decision = body.decision.strip().lower()
    if decision not in {"approved", "rejected"}:
        raise HTTPException(status_code=422, detail="decision must be 'approved' or 'rejected'.")
    new_status = "APPROVED" if decision == "approved" else "REJECTED"
    state.recommendation_status[rec_id] = new_status
    return {
        "recommendation_id": rec_id, 
        "status": new_status, 
        "reviewer_note": body.reviewer_note, 
        "message": ("Recommendation approved. A dry-run remediation plan is now available. No AWS permission has been changed." if new_status == "APPROVED" else "Recommendation rejected. No action will be taken.")
    }

@router.get("/api/recommendations/{rec_id}/remediation-plan")
def remediation_plan(rec_id: str) -> dict[str, Any]:
    if rec_id not in state.recommendation_status:
        raise HTTPException(status_code=404, detail=f"Recommendation '{rec_id}' not found.")
    status = state.recommendation_status[rec_id]
    if status != "APPROVED":
        raise HTTPException(status_code=403, detail=f"Remediation plan only available for approved recommendations (current: {status}).")
    for report in state.reports.values():
        for rec in report.recommendations:
            if rec.id == rec_id:
                identity = report.identity
                finding = next((f for f in report.findings if f.id == rec.finding_id), None)
                actions = list(finding.actions) if finding else []
                return {
                    "recommendation_id": rec_id, 
                    "status": "APPROVED — dry-run only, no AWS change made", 
                    "identity_id": identity.id, 
                    "identity_name": identity.name, 
                    "finding_category": finding.category if finding else "unknown", 
                    "actions_under_review": actions, 
                    "proposed_change": rec.proposed_change, 
                    "rationale": rec.rationale, 
                    "dry_run_steps": [f"1. Open AWS IAM console for identity: {identity.name}", f"2. Locate the policy containing: {', '.join(actions) or 'the identified action'}", "3. Validate with the identity owner that the permission is not needed", "4. Remove or scope down only after owner confirmation", "5. Record the change in your organization's change log"], 
                    "warning": "CloudGuard does NOT execute this plan automatically. A qualified administrator must validate and manually apply any policy change."
                }
    raise HTTPException(status_code=404, detail="Recommendation not found in current scan results.")
