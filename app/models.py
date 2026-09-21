"""Domain models for CloudGuard's offline permission-risk analysis.

The models deliberately represent *declared* IAM-style permissions instead of
trying to evaluate a live AWS account.  This keeps the demo and API useful
without credentials while making the assumptions visible to callers:

* an ``Allow`` grant is considered independently of resource and condition
  evaluation;
* actions are normalized to lower case because IAM action names are case
  insensitive;
* a used action is evidence of use only when it exactly matches a declared
  action (wildcards cannot prove that a particular capability was used).

No model in this module performs a policy mutation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Any, Iterable, Mapping


class IdentityType(str, Enum):
    """The supported IAM identity types."""

    USER = "user"
    ROLE = "role"
    SERVICE = "service"


class Severity(str, Enum):
    """Risk bands used by the deterministic scoring model."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


def normalize_action(action: str) -> str:
    """Return the canonical form of an IAM-style action.

    AWS action names are case insensitive.  Keeping a single canonical form
    makes comparisons between policy data and activity data predictable.  The
    function accepts wildcard actions such as ``iam:*`` and ``*``.
    """

    if not isinstance(action, str):
        raise TypeError("An IAM action must be a string.")
    normalized = action.strip().lower()
    if not normalized:
        raise ValueError("An IAM action cannot be blank.")
    return normalized


def _unique_actions(actions: Iterable[str]) -> tuple[str, ...]:
    """Normalize actions and preserve their first-seen order."""

    return tuple(dict.fromkeys(normalize_action(action) for action in actions))


def _coerce_date(value: date | datetime | str | None) -> date | None:
    """Coerce common serializable date values to a date, if supplied."""

    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            # The date portion of an ISO timestamp is sufficient for the
            # day-based activity checks performed by the engine.
            return date.fromisoformat(value.strip()[:10])
        except ValueError as exc:
            raise ValueError("last_activity must be an ISO-8601 date.") from exc
    raise TypeError("last_activity must be a date, datetime, ISO date, or None.")


@dataclass(frozen=True, slots=True)
class PermissionsBoundary:
    """Metadata about an optional permissions boundary attached to an identity."""

    name: str
    policy_arn: str | None = None
    restrictive: bool = True

    def __post_init__(self) -> None:
        if not self.name or not self.name.strip():
            raise ValueError("A permissions boundary needs a name.")
        object.__setattr__(self, "name", self.name.strip())
        if self.policy_arn is not None:
            object.__setattr__(self, "policy_arn", self.policy_arn.strip())

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "policy_arn": self.policy_arn,
            "restrictive": self.restrictive,
        }


@dataclass(frozen=True, slots=True)
class PermissionGrant:
    """One declared IAM-style grant.

    ``resource`` and ``condition`` are retained as metadata for a reviewer;
    the offline engine does not claim to fully evaluate AWS policy semantics.
    """

    action: str
    effect: str = "Allow"
    resource: str = "*"
    source: str = "identity-policy"
    condition: Mapping[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        object.__setattr__(self, "action", normalize_action(self.action))

        effect = self.effect.strip().lower()
        if effect not in {"allow", "deny"}:
            raise ValueError("Grant effect must be Allow or Deny.")
        object.__setattr__(self, "effect", effect)

        if not self.resource or not self.resource.strip():
            raise ValueError("Grant resource cannot be blank.")
        object.__setattr__(self, "resource", self.resource.strip())

        if not self.source or not self.source.strip():
            raise ValueError("Grant source cannot be blank.")
        object.__setattr__(self, "source", self.source.strip())
        object.__setattr__(self, "condition", dict(self.condition))

    @classmethod
    def from_value(cls, value: "PermissionGrant | str | Mapping[str, Any]") -> "PermissionGrant":
        """Build a grant from the convenient forms accepted by ``Identity``."""

        if isinstance(value, cls):
            return value
        if isinstance(value, str):
            return cls(action=value)
        if isinstance(value, Mapping):
            return cls(
                action=str(value["action"]),
                effect=str(value.get("effect", "Allow")),
                resource=str(value.get("resource", "*")),
                source=str(value.get("source", "identity-policy")),
                condition=value.get("condition", {}),
            )
        raise TypeError("A grant must be a PermissionGrant, string, or mapping.")

    def to_dict(self) -> dict[str, Any]:
        return {
            "action": self.action,
            "effect": self.effect,
            "resource": self.resource,
            "source": self.source,
            "condition": dict(self.condition),
        }


@dataclass(frozen=True, slots=True)
class Identity:
    """A normalized user, role, or service identity and its observed activity."""

    id: str
    name: str
    identity_type: IdentityType | str
    grants: tuple[PermissionGrant | str | Mapping[str, Any], ...] = ()
    used_actions: tuple[str, ...] = ()
    last_activity: date | datetime | str | None = None
    mfa_enabled: bool | None = None
    permissions_boundary: PermissionsBoundary | Mapping[str, Any] | None = None
    account_id: str | None = None
    tags: Mapping[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.id or not self.id.strip():
            raise ValueError("An identity needs an id.")
        if not self.name or not self.name.strip():
            raise ValueError("An identity needs a name.")
        object.__setattr__(self, "id", self.id.strip())
        object.__setattr__(self, "name", self.name.strip())

        try:
            identity_type = IdentityType(self.identity_type)
        except ValueError as exc:
            valid = ", ".join(member.value for member in IdentityType)
            raise ValueError(f"identity_type must be one of: {valid}.") from exc
        object.__setattr__(self, "identity_type", identity_type)

        object.__setattr__(
            self,
            "grants",
            tuple(PermissionGrant.from_value(grant) for grant in self.grants),
        )
        object.__setattr__(self, "used_actions", _unique_actions(self.used_actions))
        object.__setattr__(self, "last_activity", _coerce_date(self.last_activity))

        if self.mfa_enabled is not None and not isinstance(self.mfa_enabled, bool):
            raise TypeError("mfa_enabled must be True, False, or None.")

        boundary = self.permissions_boundary
        if isinstance(boundary, Mapping):
            boundary = PermissionsBoundary(
                name=str(boundary["name"]),
                policy_arn=boundary.get("policy_arn"),
                restrictive=bool(boundary.get("restrictive", True)),
            )
        if boundary is not None and not isinstance(boundary, PermissionsBoundary):
            raise TypeError("permissions_boundary must be a PermissionsBoundary, mapping, or None.")
        object.__setattr__(self, "permissions_boundary", boundary)

        if self.account_id is not None:
            object.__setattr__(self, "account_id", self.account_id.strip())
        object.__setattr__(self, "tags", {str(key): str(value) for key, value in self.tags.items()})

    @property
    def identity_id(self) -> str:
        """Alias for integrations that use the more explicit field name."""

        return self.id

    @property
    def granted_actions(self) -> tuple[str, ...]:
        """Unique allowed actions, in policy order, for concise API payloads."""

        return tuple(
            dict.fromkeys(grant.action for grant in self.grants if grant.effect == "allow")
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "identity_type": self.identity_type.value,
            "grants": [grant.to_dict() for grant in self.grants],
            "granted_actions": list(self.granted_actions),
            "used_actions": list(self.used_actions),
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "mfa_enabled": self.mfa_enabled,
            "permissions_boundary": (
                self.permissions_boundary.to_dict() if self.permissions_boundary else None
            ),
            "account_id": self.account_id,
            "tags": dict(self.tags),
        }


@dataclass(frozen=True, slots=True)
class Finding:
    """A single explainable risk signal generated by the offline engine."""

    id: str
    identity_id: str
    category: str
    severity: Severity
    score_impact: int
    title: str
    description: str
    actions: tuple[str, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "identity_id": self.identity_id,
            "category": self.category,
            "severity": self.severity.value,
            "score_impact": self.score_impact,
            "title": self.title,
            "description": self.description,
            "actions": list(self.actions),
        }


@dataclass(frozen=True, slots=True)
class Recommendation:
    """A proposed, never-automated policy-review action."""

    id: str
    identity_id: str
    finding_id: str
    title: str
    rationale: str
    proposed_change: str
    review_only: bool = True
    human_approval_required: bool = True
    status: str = "PENDING_HUMAN_REVIEW"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "identity_id": self.identity_id,
            "finding_id": self.finding_id,
            "title": self.title,
            "rationale": self.rationale,
            "proposed_change": self.proposed_change,
            "review_only": self.review_only,
            "human_approval_required": self.human_approval_required,
            "status": self.status,
        }


@dataclass(frozen=True, slots=True)
class AnalysisReport:
    """Serializable analysis output for one identity."""

    identity: Identity
    risk_score: int
    severity: Severity
    findings: tuple[Finding, ...] = ()
    recommendations: tuple[Recommendation, ...] = ()
    as_of: date | None = None

    @property
    def score(self) -> int:
        """A concise alias used by dashboard clients."""

        return self.risk_score

    @property
    def summary(self) -> dict[str, Any]:
        """A compact dashboard-ready representation of the analysis."""

        return {
            "identity_id": self.identity.id,
            "identity_name": self.identity.name,
            "identity_type": self.identity.identity_type.value,
            "risk_score": self.risk_score,
            "severity": self.severity.value,
            "finding_count": len(self.findings),
            "recommendation_count": len(self.recommendations),
            "requires_human_review": bool(self.recommendations),
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "identity": self.identity.to_dict(),
            "risk_score": self.risk_score,
            "severity": self.severity.value,
            "findings": [finding.to_dict() for finding in self.findings],
            "recommendations": [recommendation.to_dict() for recommendation in self.recommendations],
            "as_of": self.as_of.isoformat() if self.as_of else None,
            "summary": self.summary,
        }
