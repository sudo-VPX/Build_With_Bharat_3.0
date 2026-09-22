from typing import Any
from fastapi import APIRouter
from backend import state
from backend.models import Severity

router = APIRouter()

from datetime import datetime, timedelta
import random

@router.get("/api/summary")
def summary() -> dict[str, Any]:
    all_reports = list(state.reports.values())
    
    drift_findings_total = sum(len(r.findings) for r in all_reports)
    remediated_total = sum(1 for s in state.recommendation_status.values() if s == "APPROVED")
    
    chart_data = []
    base_date = datetime.now()
    
    for i in range(6, 0, -1):
        day_date = base_date - timedelta(days=i)
        day_name = day_date.strftime("%a")
        chart_data.append({"name": day_name, "incidents": 0, "remediated": 0})
        
    # Today's real data
    chart_data.append({
        "name": base_date.strftime("%a"),
        "incidents": drift_findings_total,
        "remediated": remediated_total
    })
    
    return {
        "mode": state.current_mode, 
        "total_identities": len(all_reports), 
        "drift_findings": drift_findings_total, 
        "high_risk": sum(1 for r in all_reports if r.severity == Severity.HIGH), 
        "critical": sum(1 for r in all_reports if r.severity == Severity.CRITICAL), 
        "pending_review": sum(1 for s in state.recommendation_status.values() if s == "PENDING_HUMAN_REVIEW"),
        "chartData": chart_data
    }

