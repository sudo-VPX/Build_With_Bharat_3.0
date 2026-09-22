from typing import Any
from fastapi import APIRouter, HTTPException
from backend import state

router = APIRouter()

def _enrich_rec(rec_dict: dict[str, Any]) -> dict[str, Any]:
    rec_dict = dict(rec_dict)
    rec_dict["status"] = state.recommendation_status.get(rec_dict["id"], rec_dict.get("status", "PENDING_HUMAN_REVIEW"))
    return rec_dict

@router.get("/api/identities")
def list_identities() -> list[dict[str, Any]]:
    rows = [report.summary for report in state.reports.values()]
    rows.sort(key=lambda r: r["risk_score"], reverse=True)
    return rows

@router.get("/api/identities/{identity_id}")
def get_identity(identity_id: str) -> dict[str, Any]:
    report = state.reports.get(identity_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Identity '{identity_id}' not found.")
    data = report.to_dict()
    data["recommendations"] = [_enrich_rec(r) for r in data["recommendations"]]
    identity = report.identity
    used_set = set(identity.used_actions)
    permission_table = []
    for grant in identity.grants:
        if grant.effect != "allow": continue
        is_wildcard = "*" in grant.action
        status = "wildcard" if is_wildcard else ("used" if grant.action in used_set else "unused")
        permission_table.append({"action": grant.action, "resource": grant.resource, "source": grant.source, "status": status})
    data["permission_table"] = permission_table
    return data
