"""Credential-free CloudGuard sample data for the dashboard and tests."""

from __future__ import annotations

from datetime import date

from backend.models import Identity, IdentityType, PermissionGrant, PermissionsBoundary


def load_demo_identities() -> tuple[Identity, ...]:
    """Return a realistic, deterministic set of identities for offline demos."""

    guardrail = PermissionsBoundary(
        name="CloudGuardDeveloperBoundary",
        policy_arn="arn:aws:iam::123456789012:policy/CloudGuardDeveloperBoundary",
        restrictive=True,
    )
    read_only_boundary = PermissionsBoundary(
        name="CloudGuardReadOnlyBoundary",
        policy_arn="arn:aws:iam::123456789012:policy/CloudGuardReadOnlyBoundary",
        restrictive=True,
    )

    return (
        # Bob — canonical hackathon demo: 2 unused permissions → HIGH risk
        Identity(
            id="usr-bob",
            name="Bob",
            identity_type=IdentityType.USER,
            grants=(
                PermissionGrant("s3:GetObject", resource="arn:aws:s3:::company-data/*"),
                PermissionGrant("ec2:StartInstances", resource="arn:aws:ec2:ap-south-1:123456789012:instance/*"),
                PermissionGrant("ec2:StopInstances", resource="arn:aws:ec2:ap-south-1:123456789012:instance/*"),
                PermissionGrant("iam:CreateUser"),
            ),
            used_actions=("s3:GetObject", "ec2:StartInstances"),
            last_activity=date(2026, 9, 15),
            mfa_enabled=False,
            permissions_boundary=None,
            account_id="123456789012",
            tags={"team": "engineering", "environment": "production"},
        ),
        Identity(
            id="usr-alex-chen",
            name="Alex Chen",
            identity_type=IdentityType.USER,
            grants=(
                PermissionGrant("s3:GetObject", resource="arn:aws:s3:::product-assets/*"),
                PermissionGrant("logs:CreateLogStream", resource="arn:aws:logs:*:*:log-group:/aws/lambda/*"),
                PermissionGrant("ec2:TerminateInstances", resource="arn:aws:ec2:ap-south-1:123456789012:instance/*"),
            ),
            used_actions=("s3:GetObject", "logs:CreateLogStream"),
            last_activity=date(2026, 9, 18),
            mfa_enabled=True,
            permissions_boundary=guardrail,
            account_id="123456789012",
            tags={"team": "platform", "environment": "production"},
        ),
        Identity(
            id="role-release-automation",
            name="release-automation",
            identity_type=IdentityType.ROLE,
            grants=(
                PermissionGrant("*", resource="*", source="legacy-release-policy"),
            ),
            used_actions=("s3:ListBucket", "codebuild:StartBuild"),
            last_activity=date(2026, 9, 20),
            mfa_enabled=None,
            permissions_boundary=None,
            account_id="123456789012",
            tags={"team": "delivery", "owner": "release-engineering"},
        ),
        Identity(
            id="usr-priya-analyst",
            name="Priya Raman",
            identity_type=IdentityType.USER,
            grants=(
                PermissionGrant("cloudwatch:GetMetricData", resource="*", source="analytics-read-only"),
                PermissionGrant("s3:ListBucket", resource="arn:aws:s3:::analytics-reports", source="analytics-read-only"),
            ),
            used_actions=("cloudwatch:GetMetricData", "s3:ListBucket"),
            last_activity=date(2026, 9, 19),
            mfa_enabled=True,
            permissions_boundary=read_only_boundary,
            account_id="123456789012",
            tags={"team": "analytics", "environment": "production"},
        ),
    )
