"""FastAPI routes for CloudGuard.

All state is held in memory — appropriate for a hackathon MVP where the server
restart resets the last scan.  No AWS resource is mutated by any route.

Recommendation approval records a human decision and exposes a dry-run
remediation plan; it does not call any AWS API.
"""

from __future__ import annotations

import logging
from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.demo_data import load_demo_identities
from app.models import AnalysisReport, Severity
from app.services.security_engine import SecurityEngine

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory scan state
# ---------------------------------------------------------------------------

_reports: dict[str, AnalysisReport] = {}        # identity_id → report
_recommendation_status: dict[str, str] = {}     # recommendation_id → status
_current_mode: str = settings.default_mode      # "demo" or "live"
_scan_error: str | None = None


def _load_demo() -> None:
    """Reset state with the built-in demo identities."""
    global _reports, _recommendation_status, _current_mode, _scan_error
    engine = SecurityEngine(as_of=date.today())
    identities = load_demo_identities()
    reports = engine.analyze_identities(identities)
    _reports = {report.identity.id: report for report in reports}
    _recommendation_status = {
        rec.id: "PENDING_HUMAN_REVIEW"
        for report in reports
        for rec in report.recommendations
    }
    _current_mode = "demo"
    _scan_error = None
    logger.info("Demo scan loaded — %d identities", len(_reports))


def _load_live(profile: str | None, region: str | None) -> None:
    """Run a live AWS scan and update state."""
    global _reports, _recommendation_status, _current_mode, _scan_error
    from app.services.aws_scanner import collect_identities

    identities = collect_identities(profile=profile, region=region)
    engine = SecurityEngine(as_of=date.today())
    reports = engine.analyze_identities(identities)
    _reports = {report.identity.id: report for report in reports}
    _recommendation_status = {
        rec.id: "PENDING_HUMAN_REVIEW"
        for report in reports
        for rec in report.recommendations
    }
    _current_mode = "live"
    _scan_error = None
    logger.info("Live scan complete — %d identities", len(_reports))


# Bootstrap with demo data on startup
_load_demo()


# ---------------------------------------------------------------------------
# Pydantic request/response models
# ---------------------------------------------------------------------------

class ScanRequest(BaseModel):
    mode: str = "demo"
    aws_profile: str | None = None
    aws_region: str | None = None


class ReviewRequest(BaseModel):
    decision: str          # "approved" | "rejected"
    reviewer_note: str = ""


# ---------------------------------------------------------------------------
# Helper: enrich a recommendation dict with current status
# ---------------------------------------------------------------------------

def _enrich_rec(rec_dict: dict[str, Any]) -> dict[str, Any]:
    rec_dict = dict(rec_dict)
    rec_dict["status"] = _recommendation_status.get(rec_dict["id"], rec_dict.get("status", "PENDING_HUMAN_REVIEW"))
    return rec_dict


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/health")
def health() -> dict[str, Any]:
    """Service liveness and current scan mode."""
    return {
        "status": "ok",
        "mode": _current_mode,
        "identities_scanned": len(_reports),
        "scan_error": _scan_error,
        "disclaimer": (
            "CloudGuard uses its own internal risk model. "
            "Results are review recommendations only — no AWS policy is changed automatically."
        ),
    }


@router.get("/api/summary")
def summary() -> dict[str, Any]:
    """Aggregate counts for dashboard header cards."""
    all_reports = list(_reports.values())
    finding_count = sum(len(r.findings) for r in all_reports)
    high_count = sum(1 for r in all_reports if r.severity == Severity.HIGH)
    critical_count = sum(1 for r in all_reports if r.severity == Severity.CRITICAL)
    pending_review = sum(
        1 for status in _recommendation_status.values()
        if status == "PENDING_HUMAN_REVIEW"
    )
    return {
        "mode": _current_mode,
        "total_identities": len(all_reports),
        "drift_findings": finding_count,
        "high_risk": high_count,
        "critical": critical_count,
        "pending_review": pending_review,
    }


@router.get("/api/identities")
def list_identities() -> list[dict[str, Any]]:
    """Summary row for every identity, ordered by descending risk score."""
    rows = [report.summary for report in _reports.values()]
    rows.sort(key=lambda r: r["risk_score"], reverse=True)
    return rows


@router.get("/api/identities/{identity_id}")
def get_identity(identity_id: str) -> dict[str, Any]:
    """Full analysis detail for a single identity."""
    report = _reports.get(identity_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Identity '{identity_id}' not found.")

    data = report.to_dict()
    # Enrich recommendation statuses
    data["recommendations"] = [_enrich_rec(r) for r in data["recommendations"]]

    # Add a per-permission usage table for the dashboard
    identity = report.identity
    used_set = set(identity.used_actions)
    permission_table = []
    for grant in identity.grants:
        if grant.effect != "allow":
            continue
        is_wildcard = "*" in grant.action
        status = "wildcard" if is_wildcard else ("used" if grant.action in used_set else "unused")
        permission_table.append({
            "action": grant.action,
            "resource": grant.resource,
            "source": grant.source,
            "status": status,
        })
    data["permission_table"] = permission_table
    return data


@router.get("/api/findings")
def list_findings() -> list[dict[str, Any]]:
    """All findings across all identities, ordered by severity impact."""
    severity_order = {
        Severity.CRITICAL: 0,
        Severity.HIGH: 1,
        Severity.MEDIUM: 2,
        Severity.LOW: 3,
    }
    findings = [
        {**finding.to_dict(), "identity_name": _reports[finding.identity_id].identity.name}
        for report in _reports.values()
        for finding in report.findings
    ]
    findings.sort(key=lambda f: (severity_order.get(f["severity"], 9), f["identity_id"]))
    return findings


@router.get("/api/recommendations")
def list_recommendations() -> list[dict[str, Any]]:
    """All recommendations with their current review status."""
    recs = [
        _enrich_rec({
            **rec.to_dict(),
            "identity_name": _reports[rec.identity_id].identity.name,
        })
        for report in _reports.values()
        for rec in report.recommendations
    ]
    status_order = {"PENDING_HUMAN_REVIEW": 0, "APPROVED": 1, "REJECTED": 2}
    recs.sort(key=lambda r: status_order.get(r["status"], 9))
    return recs


@router.post("/api/recommendations/{rec_id}/review")
def review_recommendation(rec_id: str, body: ReviewRequest) -> dict[str, Any]:
    """Record a human approve/reject decision for a recommendation.

    This NEVER calls any AWS API.  Approval only marks the record and
    makes the remediation plan available for review.
    """
    if rec_id not in _recommendation_status:
        raise HTTPException(status_code=404, detail=f"Recommendation '{rec_id}' not found.")

    decision = body.decision.strip().lower()
    if decision not in {"approved", "rejected"}:
        raise HTTPException(
            status_code=422,
            detail="decision must be 'approved' or 'rejected'.",
        )

    new_status = "APPROVED" if decision == "approved" else "REJECTED"
    _recommendation_status[rec_id] = new_status
    logger.info("Recommendation %s → %s (note: %s)", rec_id, new_status, body.reviewer_note)

    return {
        "recommendation_id": rec_id,
        "status": new_status,
        "reviewer_note": body.reviewer_note,
        "message": (
            "Recommendation approved. A dry-run remediation plan is now available. "
            "No AWS permission has been changed."
            if new_status == "APPROVED"
            else "Recommendation rejected. No action will be taken."
        ),
    }


@router.get("/api/recommendations/{rec_id}/remediation-plan")
def remediation_plan(rec_id: str) -> dict[str, Any]:
    """Return a dry-run remediation plan.  No AWS API is called.

    The plan describes *what* would change and requires the workload owner
    to validate before any human executes it manually.
    """
    if rec_id not in _recommendation_status:
        raise HTTPException(status_code=404, detail=f"Recommendation '{rec_id}' not found.")

    status = _recommendation_status[rec_id]
    if status != "APPROVED":
        raise HTTPException(
            status_code=403,
            detail=f"Remediation plan is only available for approved recommendations (current status: {status}).",
        )

    # Find the recommendation across all reports
    for report in _reports.values():
        for rec in report.recommendations:
            if rec.id == rec_id:
                identity = report.identity
                finding = next(
                    (f for f in report.findings if f.id == rec.finding_id), None
                )
                actions_to_review = list(finding.actions) if finding else []
                return {
                    "recommendation_id": rec_id,
                    "status": "APPROVED — dry-run only, no AWS change made",
                    "identity_id": identity.id,
                    "identity_name": identity.name,
                    "finding_category": finding.category if finding else "unknown",
                    "actions_under_review": actions_to_review,
                    "proposed_change": rec.proposed_change,
                    "rationale": rec.rationale,
                    "dry_run_steps": [
                        f"1. Open AWS IAM console for identity: {identity.name}",
                        f"2. Locate the policy containing: {', '.join(actions_to_review) or 'the identified action'}",
                        "3. Validate with the identity owner that the permission is not needed",
                        "4. Remove or scope down only after owner confirmation",
                        "5. Record the change in your organization's change log",
                    ],
                    "warning": (
                        "CloudGuard does NOT execute this plan automatically. "
                        "A qualified administrator must validate and manually apply any policy change."
                    ),
                }

    raise HTTPException(status_code=404, detail="Recommendation not found in current scan results.")


@router.post("/api/scans")
def run_scan(body: ScanRequest) -> dict[str, Any]:
    """Trigger a new scan in demo or live mode."""
    global _scan_error
    mode = body.mode.strip().lower()
    if mode not in {"demo", "live"}:
        raise HTTPException(status_code=422, detail="mode must be 'demo' or 'live'.")

    if mode == "demo":
        _load_demo()
        return {"mode": "demo", "identities_scanned": len(_reports), "status": "ok"}

    # Live scan
    try:
        _load_live(profile=body.aws_profile, region=body.aws_region)
        return {"mode": "live", "identities_scanned": len(_reports), "status": "ok"}
    except RuntimeError as exc:
        _scan_error = str(exc)
        raise HTTPException(
            status_code=503,
            detail=f"Live AWS scan failed: {exc}. Check your AWS CLI profile and permissions.",
        ) from exc
