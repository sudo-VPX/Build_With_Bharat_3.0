from typing import Any
from fastapi import APIRouter
from backend import state

router = APIRouter()

@router.get("/api/findings")
def list_findings() -> list[dict[str, Any]]:
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    findings = [{**finding.to_dict(), "identity_name": state.reports[finding.identity_id].identity.name} for report in state.reports.values() for finding in report.findings]
    findings.sort(key=lambda f: (severity_order.get(f["severity"], 9), f["identity_id"]))
    return findings
