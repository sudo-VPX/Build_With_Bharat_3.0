"""Read-only AWS IAM + CloudTrail collector for CloudGuard.

This module connects to AWS using the configured CLI profile and collects
identity and activity data.  It only calls *read* APIs and never modifies
a policy, role, or user.

Returned data is normalized into the same ``Identity`` type that the
security engine already understands, so the engine is completely reused
regardless of whether data comes from this module or from ``demo_data``.

If a required API call fails (e.g. due to insufficient scanner permissions)
the collector logs a warning and continues with partial data rather than
crashing the whole scan.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import settings
from app.models import Identity, IdentityType, PermissionGrant, PermissionsBoundary

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _boto_session(profile: str, region: str) -> Any:
    """Return a boto3 Session for the given profile and region."""
    import boto3  # imported here so demo mode never requires boto3 installed

    return boto3.Session(profile_name=profile, region_name=region)


def _safe_call(fn, *args, default=None, label: str = "", **kwargs):
    """Call ``fn(*args, **kwargs)`` and return ``default`` on any exception."""
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.warning("AWS API call failed%s: %s", f" ({label})" if label else "", exc)
        return default


# ---------------------------------------------------------------------------
# IAM helpers
# ---------------------------------------------------------------------------


def _collect_iam_grants(iam_client, identity_name: str, identity_type: str) -> list[PermissionGrant]:
    """Return all Allow grants from managed and inline policies for an identity."""
    grants: list[PermissionGrant] = []

    # Managed policies
    list_fn = (
        iam_client.list_attached_user_policies
        if identity_type == "user"
        else iam_client.list_attached_role_policies
    )
    kwargs = (
        {"UserName": identity_name} if identity_type == "user" else {"RoleName": identity_name}
    )
    paginator = None
    try:
        paginator = iam_client.get_paginator(
            "list_attached_user_policies" if identity_type == "user" else "list_attached_role_policies"
        )
        pages = paginator.paginate(**kwargs)
        for page in pages:
            for policy in page.get("AttachedPolicies", []):
                policy_arn = policy["PolicyArn"]
                version_resp = _safe_call(
                    iam_client.get_policy,
                    PolicyArn=policy_arn,
                    label=f"get_policy {policy_arn}",
                )
                if not version_resp:
                    continue
                version_id = version_resp["Policy"]["DefaultVersionId"]
                doc_resp = _safe_call(
                    iam_client.get_policy_version,
                    PolicyArn=policy_arn,
                    VersionId=version_id,
                    label=f"get_policy_version {policy_arn}",
                )
                if not doc_resp:
                    continue
                doc = doc_resp.get("PolicyVersion", {}).get("Document", {})
                grants.extend(_grants_from_policy_doc(doc, source=policy_arn))
    except Exception as exc:
        logger.warning("Could not paginate managed policies for %s: %s", identity_name, exc)

    # Inline policies
    list_inline_fn = (
        "list_user_policies" if identity_type == "user" else "list_role_policies"
    )
    get_inline_fn = "get_user_policy" if identity_type == "user" else "get_role_policy"
    inline_kwargs = (
        {"UserName": identity_name} if identity_type == "user" else {"RoleName": identity_name}
    )
    try:
        inline_paginator = iam_client.get_paginator(list_inline_fn)
        for page in inline_paginator.paginate(**inline_kwargs):
            for policy_name in page.get("PolicyNames", []):
                get_kwargs = dict(inline_kwargs)
                get_kwargs["PolicyName"] = policy_name
                resp = _safe_call(
                    getattr(iam_client, get_inline_fn),
                    label=f"get_inline_policy {policy_name}",
                    **get_kwargs,
                )
                if not resp:
                    continue
                doc = resp.get("PolicyDocument", {})
                grants.extend(_grants_from_policy_doc(doc, source=f"inline:{policy_name}"))
    except Exception as exc:
        logger.warning("Could not paginate inline policies for %s: %s", identity_name, exc)

    return grants


def _grants_from_policy_doc(doc: dict, source: str) -> list[PermissionGrant]:
    """Flatten an IAM policy document into individual PermissionGrant objects."""
    grants: list[PermissionGrant] = []
    for statement in doc.get("Statement", []):
        effect = str(statement.get("Effect", "Allow"))
        resource = statement.get("Resource", "*")
        if isinstance(resource, list):
            resource = resource[0] if resource else "*"
        condition = statement.get("Condition", {})
        actions = statement.get("Action", [])
        if isinstance(actions, str):
            actions = [actions]
        for action in actions:
            try:
                grants.append(
                    PermissionGrant(
                        action=action,
                        effect=effect,
                        resource=str(resource),
                        source=source,
                        condition=condition if isinstance(condition, dict) else {},
                    )
                )
            except (ValueError, TypeError) as exc:
                logger.debug("Skipping malformed grant %s: %s", action, exc)
    return grants


def _boundary_for(iam_client, user_name: str) -> PermissionsBoundary | None:
    """Return the permissions boundary for a user, or None if there isn't one."""
    resp = _safe_call(iam_client.get_user, UserName=user_name, label=f"get_user {user_name}")
    if not resp:
        return None
    boundary = resp.get("User", {}).get("PermissionsBoundary")
    if not boundary:
        return None
    arn = boundary.get("PermissionsBoundaryArn", "")
    name = arn.split("/")[-1] if "/" in arn else arn
    return PermissionsBoundary(name=name or "unknown", policy_arn=arn, restrictive=True)


def _mfa_enabled(iam_client, user_name: str) -> bool | None:
    """Return True if any MFA device is registered for the user."""
    resp = _safe_call(
        iam_client.list_mfa_devices,
        UserName=user_name,
        label=f"list_mfa_devices {user_name}",
    )
    if resp is None:
        return None
    return len(resp.get("MFADevices", [])) > 0


# ---------------------------------------------------------------------------
# CloudTrail helpers
# ---------------------------------------------------------------------------


def _collect_used_actions(ct_client, identity_arn: str, lookback_days: int) -> tuple[str, ...]:
    """Return the set of unique IAM actions observed in CloudTrail for an identity."""
    start = datetime.now(tz=timezone.utc) - timedelta(days=lookback_days)
    used: set[str] = set()

    try:
        paginator = ct_client.get_paginator("lookup_events")
        pages = paginator.paginate(
            LookupAttributes=[{"AttributeKey": "Username", "AttributeValue": identity_arn.split("/")[-1]}],
            StartTime=start,
        )
        for page in pages:
            for event in page.get("Events", []):
                event_name = event.get("EventName", "")
                event_source = event.get("EventSource", "")
                if event_name and event_source:
                    # Convert "s3.amazonaws.com" → "s3" and combine with event
                    service = event_source.replace(".amazonaws.com", "").split(".")[0]
                    if service and event_name:
                        used.add(f"{service}:{event_name}")
    except Exception as exc:
        logger.warning("CloudTrail lookup failed for %s: %s", identity_arn, exc)

    return tuple(used)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def collect_identities(
    profile: str | None = None,
    region: str | None = None,
    lookback_days: int | None = None,
) -> tuple[Identity, ...]:
    """Return all IAM users and roles with their CloudTrail activity as Identities.

    This is a read-only operation.  No AWS resource is modified.
    Raises ``RuntimeError`` if the boto3 session cannot be established.
    """
    profile = profile or settings.aws_profile
    region = region or settings.aws_region
    lookback_days = lookback_days or settings.lookback_days

    logger.info(
        "Starting live AWS scan: profile=%s region=%s lookback_days=%s",
        profile,
        region,
        lookback_days,
    )

    try:
        session = _boto_session(profile, region)
        iam = session.client("iam")
        ct = session.client("cloudtrail")
    except Exception as exc:
        raise RuntimeError(
            f"Cannot create AWS session with profile '{profile}': {exc}"
        ) from exc

    # Verify connectivity
    account_id: str | None = None
    try:
        sts = session.client("sts")
        account_id = sts.get_caller_identity()["Account"]
        logger.info("AWS connection verified — account: %s", account_id)
    except Exception as exc:
        logger.warning("STS identity check failed (continuing): %s", exc)

    identities: list[Identity] = []

    # --- IAM Users ---
    try:
        user_paginator = iam.get_paginator("list_users")
        for page in user_paginator.paginate():
            for user in page.get("Users", []):
                u_name = user["UserName"]
                u_arn = user.get("Arn", "")
                u_id = user.get("UserId", u_name)
                last_used = user.get("PasswordLastUsed") or user.get("CreateDate")

                grants = _collect_iam_grants(iam, u_name, "user")
                used_actions = _collect_used_actions(ct, u_arn, lookback_days)
                boundary = _boundary_for(iam, u_name)
                mfa = _mfa_enabled(iam, u_name)

                identity = Identity(
                    id=u_id,
                    name=u_name,
                    identity_type=IdentityType.USER,
                    grants=tuple(grants),
                    used_actions=used_actions,
                    last_activity=last_used,
                    mfa_enabled=mfa,
                    permissions_boundary=boundary,
                    account_id=account_id,
                    tags={t["Key"]: t["Value"] for t in _safe_call(
                        iam.list_user_tags, UserName=u_name,
                        label=f"list_user_tags {u_name}", default={"Tags": []}
                    ).get("Tags", [])},
                )
                identities.append(identity)
                logger.info("Collected user: %s (%d grants)", u_name, len(grants))
    except Exception as exc:
        logger.warning("Failed to enumerate IAM users: %s", exc)

    # --- IAM Roles (skip AWS service-linked roles) ---
    try:
        role_paginator = iam.get_paginator("list_roles")
        for page in role_paginator.paginate():
            for role in page.get("Roles", []):
                r_name = role["RoleName"]
                r_arn = role.get("Arn", "")
                r_id = role.get("RoleId", r_name)

                # Skip AWS-managed service roles — they are not user-configured
                if "/aws-service-role/" in r_arn:
                    continue

                grants = _collect_iam_grants(iam, r_name, "role")
                used_actions = _collect_used_actions(ct, r_arn, lookback_days)

                identity = Identity(
                    id=r_id,
                    name=r_name,
                    identity_type=IdentityType.ROLE,
                    grants=tuple(grants),
                    used_actions=used_actions,
                    last_activity=role.get("CreateDate"),
                    mfa_enabled=None,
                    account_id=account_id,
                    tags={t["Key"]: t["Value"] for t in _safe_call(
                        iam.list_role_tags, RoleName=r_name,
                        label=f"list_role_tags {r_name}", default={"Tags": []}
                    ).get("Tags", [])},
                )
                identities.append(identity)
                logger.info("Collected role: %s (%d grants)", r_name, len(grants))
    except Exception as exc:
        logger.warning("Failed to enumerate IAM roles: %s", exc)

    logger.info("Live scan complete — %d identities collected", len(identities))
    return tuple(identities)
