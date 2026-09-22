"""Read-only AWS IAM + CloudTrail collector for CloudGuard."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from backend.config import settings
from backend.models import Identity, IdentityType, PermissionGrant, PermissionsBoundary

logger = logging.getLogger(__name__)


def _boto_session(profile: str, region: str) -> Any:
    import boto3
    return boto3.Session(profile_name=profile, region_name=region)


def _safe_call(fn, *args, default=None, label: str = "", **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:
        logger.warning("AWS API call failed%s: %s", f" ({label})" if label else "", exc)
        return default


def _grants_from_policy_doc(doc: dict, source: str) -> list[PermissionGrant]:
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
                grants.append(PermissionGrant(action=action, effect=effect, resource=str(resource), source=source, condition=condition if isinstance(condition, dict) else {}))
            except (ValueError, TypeError) as exc:
                logger.debug("Skipping malformed grant %s: %s", action, exc)
    return grants


def _collect_iam_grants(iam_client, identity_name: str, identity_type: str) -> list[PermissionGrant]:
    grants: list[PermissionGrant] = []
    list_fn_name = "list_attached_user_policies" if identity_type == "user" else "list_attached_role_policies"
    id_kwargs = ({"UserName": identity_name} if identity_type == "user" else {"RoleName": identity_name})
    try:
        paginator = iam_client.get_paginator(list_fn_name)
        for page in paginator.paginate(**id_kwargs):
            for policy in page.get("AttachedPolicies", []):
                policy_arn = policy["PolicyArn"]
                version_resp = _safe_call(iam_client.get_policy, PolicyArn=policy_arn, label=f"get_policy {policy_arn}")
                if not version_resp: continue
                version_id = version_resp["Policy"]["DefaultVersionId"]
                doc_resp = _safe_call(iam_client.get_policy_version, PolicyArn=policy_arn, VersionId=version_id, label=f"get_policy_version {policy_arn}")
                if not doc_resp: continue
                doc = doc_resp.get("PolicyVersion", {}).get("Document", {})
                grants.extend(_grants_from_policy_doc(doc, source=policy_arn))
    except Exception as exc:
        logger.warning("Could not paginate managed policies for %s: %s", identity_name, exc)
    try:
        list_inline_fn = "list_user_policies" if identity_type == "user" else "list_role_policies"
        get_inline_fn = "get_user_policy" if identity_type == "user" else "get_role_policy"
        inline_paginator = iam_client.get_paginator(list_inline_fn)
        for page in inline_paginator.paginate(**id_kwargs):
            for policy_name in page.get("PolicyNames", []):
                get_kwargs = dict(id_kwargs)
                get_kwargs["PolicyName"] = policy_name
                resp = _safe_call(getattr(iam_client, get_inline_fn), label=f"get_inline_policy {policy_name}", **get_kwargs)
                if not resp: continue
                grants.extend(_grants_from_policy_doc(resp.get("PolicyDocument", {}), source=f"inline:{policy_name}"))
    except Exception as exc:
        logger.warning("Could not paginate inline policies for %s: %s", identity_name, exc)
    return grants


def _collect_used_actions(ct_client, identity_arn: str, lookback_days: int) -> tuple[str, ...]:
    start = datetime.now(tz=timezone.utc) - timedelta(days=lookback_days)
    used: set[str] = set()
    try:
        paginator = ct_client.get_paginator("lookup_events")
        pages = paginator.paginate(LookupAttributes=[{"AttributeKey": "Username", "AttributeValue": identity_arn.split("/")[-1]}], StartTime=start)
        for page in pages:
            for event in page.get("Events", []):
                event_name = event.get("EventName", "")
                event_source = event.get("EventSource", "")
                if event_name and event_source:
                    service = event_source.replace(".amazonaws.com", "").split(".")[0]
                    if service and event_name:
                        used.add(f"{service}:{event_name}")
    except Exception as exc:
        logger.warning("CloudTrail lookup failed for %s: %s", identity_arn, exc)
    return tuple(used)


def collect_identities(profile: str | None = None, region: str | None = None, lookback_days: int | None = None) -> tuple[Identity, ...]:
    profile = profile or settings.aws_profile
    region = region or settings.aws_region
    lookback_days = lookback_days or settings.lookback_days
    logger.info("Starting live AWS scan: profile=%s region=%s lookback_days=%s", profile, region, lookback_days)
    try:
        session = _boto_session(profile, region)
        iam = session.client("iam")
        ct = session.client("cloudtrail")
    except Exception as exc:
        raise RuntimeError(f"Cannot create AWS session with profile '{profile}': {exc}") from exc
    account_id: str | None = None
    try:
        sts = session.client("sts")
        account_id = sts.get_caller_identity()["Account"]
        logger.info("AWS connection verified — account: %s", account_id)
    except Exception as exc:
        logger.warning("STS identity check failed (continuing): %s", exc)
    identities: list[Identity] = []
    try:
        for page in iam.get_paginator("list_users").paginate():
            for user in page.get("Users", []):
                u_name = user["UserName"]
                u_arn = user.get("Arn", "")
                u_id = user.get("UserId", u_name)
                grants = _collect_iam_grants(iam, u_name, "user")
                used_actions = _collect_used_actions(ct, u_arn, lookback_days)
                resp = _safe_call(iam.get_user, UserName=u_name, label=f"get_user {u_name}")
                boundary_data = resp.get("User", {}).get("PermissionsBoundary") if resp else None
                boundary = None
                if boundary_data:
                    arn = boundary_data.get("PermissionsBoundaryArn", "")
                    boundary = PermissionsBoundary(name=arn.split("/")[-1] or "unknown", policy_arn=arn, restrictive=True)
                mfa_resp = _safe_call(iam.list_mfa_devices, UserName=u_name, label=f"mfa {u_name}")
                mfa = len(mfa_resp.get("MFADevices", [])) > 0 if mfa_resp else None
                tags_resp = _safe_call(iam.list_user_tags, UserName=u_name, label=f"tags {u_name}", default={"Tags": []})
                identities.append(Identity(id=u_id, name=u_name, identity_type=IdentityType.USER, grants=tuple(grants), used_actions=used_actions, last_activity=user.get("PasswordLastUsed") or user.get("CreateDate"), mfa_enabled=mfa, permissions_boundary=boundary, account_id=account_id, tags={t["Key"]: t["Value"] for t in tags_resp.get("Tags", [])}))
    except Exception as exc:
        logger.warning("Failed to enumerate IAM users: %s", exc)
    try:
        for page in iam.get_paginator("list_roles").paginate():
            for role in page.get("Roles", []):
                r_name = role["RoleName"]
                r_arn = role.get("Arn", "")
                r_id = role.get("RoleId", r_name)
                if "/aws-service-role/" in r_arn: continue
                grants = _collect_iam_grants(iam, r_name, "role")
                used_actions = _collect_used_actions(ct, r_arn, lookback_days)
                tags_resp = _safe_call(iam.list_role_tags, RoleName=r_name, label=f"role tags {r_name}", default={"Tags": []})
                identities.append(Identity(id=r_id, name=r_name, identity_type=IdentityType.ROLE, grants=tuple(grants), used_actions=used_actions, last_activity=role.get("CreateDate"), mfa_enabled=None, account_id=account_id, tags={t["Key"]: t["Value"] for t in tags_resp.get("Tags", [])}))
    except Exception as exc:
        logger.warning("Failed to enumerate IAM roles: %s", exc)
    logger.info("Live scan complete — %d identities collected", len(identities))
    return tuple(identities)
