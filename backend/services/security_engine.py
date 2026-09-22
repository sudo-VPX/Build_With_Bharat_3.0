"""Offline, explainable permission-drift and risk analysis for CloudGuard."""

from __future__ import annotations

from datetime import date, datetime
from hashlib import sha256
from typing import Iterable

from backend.models import (
    AnalysisReport, Finding, Identity, IdentityType,
    PermissionGrant, Recommendation, Severity,
)

HIGH_IMPACT_ACTIONS = frozenset({
    "ec2:terminateinstances", "iam:attachrolepolicy", "iam:attachuserpolicy",
    "iam:createaccesskey", "iam:createpolicyversion", "iam:createuser",
    "iam:passrole", "iam:putrolepolicy", "iam:putuserpolicy",
    "kms:decrypt", "rds:deletedbinstance", "s3:deletebucket",
    "secretsmanager:getsecretvalue", "sts:assumerole",
})


def severity_for_score(score: int) -> Severity:
    if score < 0:
        raise ValueError("Risk scores must be >= 0.")
    if score >= 70: return Severity.CRITICAL
    if score >= 45: return Severity.HIGH
    if score >= 20: return Severity.MEDIUM
    return Severity.LOW


def _coerce_as_of(value: date | datetime | str | None) -> date:
    if value is None: return date.today()
    if isinstance(value, datetime): return value.date()
    if isinstance(value, date): return value
    if isinstance(value, str): return date.fromisoformat(value.strip()[:10])
    raise TypeError("as_of must be a date, datetime, ISO date, or None.")


def _stable_id(*parts: str) -> str:
    material = "|".join(parts).encode("utf-8")
    return sha256(material).hexdigest()[:16]


def _wildcard_kind(action: str) -> str | None:
    if action in {"*", "*:*"}: return "administrator"
    if "*" not in action: return None
    if ":" not in action: return "broad"
    service, operation = action.split(":", 1)
    if service == "*": return "administrator"
    if operation == "*": return "service"
    return "operation"


def _allow_grants_by_action(identity: Identity) -> tuple[PermissionGrant, ...]:
    by_action: dict[str, PermissionGrant] = {}
    for grant in identity.grants:
        if grant.effect == "allow":
            by_action.setdefault(grant.action, grant)
    return tuple(by_action[action] for action in sorted(by_action))


def _recommendation(*, identity: Identity, finding: Finding, title: str, rationale: str, proposed_change: str) -> Recommendation:
    notice = "Review-only; human approval is required before any policy change."
    return Recommendation(
        id=_stable_id("recommendation", finding.id),
        identity_id=identity.id, finding_id=finding.id, title=title,
        rationale=f"{rationale} {notice}",
        proposed_change=f"{proposed_change} {notice}",
        review_only=True, human_approval_required=True,
    )


def _unused_grant_finding(identity: Identity, action: str) -> Finding:
    high_impact = action in HIGH_IMPACT_ACTIONS
    category = "UNUSED_HIGH_IMPACT_ACTION" if high_impact else "UNUSED_PERMISSION"
    impact = 45 if high_impact else 8
    return Finding(
        id=_stable_id("finding", identity.id, category, action),
        identity_id=identity.id, category=category,
        severity=Severity.HIGH if high_impact else Severity.LOW,
        score_impact=impact,
        title=(f"Unused high-impact permission: {action}" if high_impact else f"Unused permission: {action}"),
        description=(f"No exact observed use of {action} is present in the supplied activity data. This is a review signal, not evidence that the permission is safe to remove."),
        actions=(action,),
    )


def _wildcard_finding(identity: Identity, action: str, kind: str) -> Finding:
    if kind == "administrator":
        category, severity, impact = "ADMINISTRATOR_WILDCARD", Severity.CRITICAL, 75
        title = f"Administrator-scale wildcard grant: {action}"
        description = f"{action} can allow actions across AWS services and is substantially broader than a least-privilege grant."
    elif kind == "service":
        category, severity, impact = "SERVICE_WILDCARD", Severity.HIGH, 50
        title = f"Service-wide wildcard grant: {action}"
        description = f"{action} permits every operation in one AWS service and should be reviewed against the workload's documented needs."
    else:
        category, severity, impact = "OPERATION_WILDCARD", Severity.MEDIUM, 20
        title = f"Wildcard operation grant: {action}"
        description = f"{action} covers multiple operations. Review whether a smaller explicit action set can satisfy the workload."
    return Finding(id=_stable_id("finding", identity.id, category, action), identity_id=identity.id, category=category, severity=severity, score_impact=impact, title=title, description=description, actions=(action,))


def _mfa_finding(identity: Identity) -> Finding:
    return Finding(id=_stable_id("finding", identity.id, "MFA_DISABLED"), identity_id=identity.id, category="MFA_DISABLED", severity=Severity.MEDIUM, score_impact=10, title="MFA is not enabled for this user", description="The supplied user metadata reports MFA as disabled. Confirm the identity's access pattern and enrollment status with its owner.")


def _stale_activity_finding(identity: Identity, as_of: date, days_inactive: int) -> Finding:
    return Finding(id=_stable_id("finding", identity.id, "STALE_ACTIVITY", str(days_inactive)), identity_id=identity.id, category="STALE_ACTIVITY", severity=Severity.LOW, score_impact=8, title="Identity has not shown recent activity", description=(f"No activity has been observed for {days_inactive} days as of {as_of.isoformat()}. This can be normal for scheduled or break-glass access, so validate before changing access."))


class SecurityEngine:
    def __init__(self, as_of: date | datetime | str | None = None) -> None:
        self.as_of = _coerce_as_of(as_of)

    def analyze_identity(self, identity: Identity) -> AnalysisReport:
        if not isinstance(identity, Identity):
            raise TypeError("analyze_identity expects an Identity.")
        findings: list[Finding] = []
        recommendations: list[Recommendation] = []
        used_actions = set(identity.used_actions)
        for grant in _allow_grants_by_action(identity):
            wildcard_kind = _wildcard_kind(grant.action)
            if wildcard_kind is not None:
                finding = _wildcard_finding(identity, grant.action, wildcard_kind)
                findings.append(finding)
                recommendations.append(_recommendation(identity=identity, finding=finding, title=f"Review breadth of {grant.action}", rationale="The grant contains a wildcard and may exceed the documented least-privilege need.", proposed_change=f"With the workload owner, replace {grant.action} with the narrowest validated explicit actions."))
                continue
            if grant.action not in used_actions:
                finding = _unused_grant_finding(identity, grant.action)
                findings.append(finding)
                recommendations.append(_recommendation(identity=identity, finding=finding, title=f"Validate need for {grant.action}", rationale="No exact usage was observed in the supplied telemetry window; scheduled, emergency, and indirect paths may still need it.", proposed_change=f"After owner validation, consider removing or scoping down {grant.action}."))
        if identity.identity_type is IdentityType.USER and identity.mfa_enabled is False:
            finding = _mfa_finding(identity)
            findings.append(finding)
            recommendations.append(_recommendation(identity=identity, finding=finding, title="Confirm MFA enrollment", rationale="User MFA is reported as disabled in the supplied identity metadata.", proposed_change="Ask the identity owner to enroll an approved MFA factor."))
        if identity.last_activity is not None:
            days_inactive = (self.as_of - identity.last_activity).days
            if days_inactive > 90:
                finding = _stale_activity_finding(identity, self.as_of, days_inactive)
                findings.append(finding)
                recommendations.append(_recommendation(identity=identity, finding=finding, title="Validate inactive identity", rationale="The activity date is older than the configured 90-day review threshold.", proposed_change="Confirm whether the identity is still required and should retain access."))
        findings.sort(key=lambda f: (f.category, f.actions, f.id))
        rec_by_finding = {r.finding_id: r for r in recommendations}
        recommendations = [rec_by_finding[f.id] for f in findings if f.id in rec_by_finding]
        risk_score = sum(f.score_impact for f in findings)
        return AnalysisReport(identity=identity, risk_score=risk_score, severity=severity_for_score(risk_score), findings=tuple(findings), recommendations=tuple(recommendations), as_of=self.as_of)

    def analyze_identities(self, identities: Iterable[Identity]) -> tuple[AnalysisReport, ...]:
        normalized = tuple(identities)
        if not all(isinstance(i, Identity) for i in normalized):
            raise TypeError("analyze_identities expects only Identity values.")
        return tuple(self.analyze_identity(i) for i in sorted(normalized, key=lambda i: i.id))


def analyze_identity(identity: Identity, as_of: date | datetime | str | None = None) -> AnalysisReport:
    return SecurityEngine(as_of=as_of).analyze_identity(identity)


def analyze_identities(identities: Iterable[Identity], as_of: date | datetime | str | None = None) -> tuple[AnalysisReport, ...]:
    return SecurityEngine(as_of=as_of).analyze_identities(identities)
