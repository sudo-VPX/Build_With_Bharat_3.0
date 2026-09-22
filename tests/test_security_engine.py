"""Tests for CloudGuard security engine using the backend package."""

from __future__ import annotations

import unittest
from datetime import date

from backend.demo_data import load_demo_identities
from backend.models import Identity, IdentityType, PermissionGrant, Severity
from backend.services.security_engine import SecurityEngine, severity_for_score


class SecurityEngineTests(unittest.TestCase):
    """Behavioural tests for SecurityEngine."""

    def setUp(self):
        self.engine = SecurityEngine(as_of=date(2026, 9, 21))

    def test_unused_high_impact_action_is_flagged_for_human_review(self):
        """An unused high-impact action must generate a HIGH-severity finding."""
        identity = Identity(
            id="test-user-1",
            name="Test User",
            identity_type=IdentityType.USER,
            grants=(PermissionGrant("iam:CreateUser"),),
            used_actions=(),
        )
        report = self.engine.analyze_identity(identity)
        self.assertTrue(
            any(f.category == "UNUSED_HIGH_IMPACT_ACTION" for f in report.findings),
            "Expected an UNUSED_HIGH_IMPACT_ACTION finding for unused iam:CreateUser",
        )
        high_impact_findings = [f for f in report.findings if f.category == "UNUSED_HIGH_IMPACT_ACTION"]
        self.assertTrue(
            all(f.severity == Severity.HIGH for f in high_impact_findings),
            "All UNUSED_HIGH_IMPACT_ACTION findings must be HIGH severity",
        )

    def test_administrator_wildcard_is_critical(self):
        """A wildcard grant '*:*' must produce a CRITICAL finding."""
        identity = Identity(
            id="test-role-1",
            name="Admin Role",
            identity_type=IdentityType.ROLE,
            grants=(PermissionGrant("*"),),
            used_actions=(),
        )
        report = self.engine.analyze_identity(identity)
        self.assertTrue(
            any(f.category == "ADMINISTRATOR_WILDCARD" for f in report.findings),
            "Expected an ADMINISTRATOR_WILDCARD finding for '*' grant",
        )
        self.assertEqual(
            report.severity, Severity.CRITICAL,
            "An administrator wildcard must produce a CRITICAL severity report",
        )

    def test_used_exact_action_is_not_called_unused(self):
        """An action that exactly matches a used action must not produce an UNUSED finding."""
        identity = Identity(
            id="test-user-2",
            name="Good User",
            identity_type=IdentityType.USER,
            grants=(PermissionGrant("s3:GetObject"),),
            used_actions=("s3:GetObject",),
        )
        report = self.engine.analyze_identity(identity)
        unused_findings = [
            f for f in report.findings
            if "UNUSED" in f.category and "s3:getobject" in f.actions
        ]
        self.assertEqual(
            len(unused_findings), 0,
            "A used action must not appear in any UNUSED finding",
        )

    def test_score_is_bounded_and_severity_is_stable_for_same_inputs(self):
        """Risk score must be in [0, 100] and severity must be deterministic."""
        identity = Identity(
            id="test-user-3",
            name="Boundary Test",
            identity_type=IdentityType.USER,
            grants=tuple(PermissionGrant(a) for a in (
                "iam:CreateUser", "iam:CreateAccessKey", "iam:AttachRolePolicy",
                "iam:PutRolePolicy", "s3:DeleteBucket", "kms:Decrypt",
                "sts:AssumeRole", "rds:DeleteDBInstance",
            )),
            used_actions=(),
            mfa_enabled=False,
        )
        r1 = self.engine.analyze_identity(identity)
        r2 = self.engine.analyze_identity(identity)
        self.assertGreaterEqual(r1.risk_score, 0)
        self.assertLessEqual(r1.risk_score, 100)
        self.assertEqual(r1.risk_score, r2.risk_score, "Score must be deterministic")
        self.assertEqual(r1.severity, r2.severity, "Severity must be deterministic")

    def test_demo_fixture_has_risky_and_healthy_examples(self):
        """Demo data must contain at least one HIGH/CRITICAL and one LOW identity."""
        identities = load_demo_identities()
        self.assertGreaterEqual(len(identities), 4, "Demo fixture needs at least 4 identities")
        ids_by_id = {i.id: i for i in identities}
        self.assertIn("usr-bob", ids_by_id, "Bob must be in demo data")
        self.assertIn("usr-priya-analyst", ids_by_id, "Priya must be in demo data")
        reports = self.engine.analyze_identities(identities)
        severities = {r.identity.id: r.severity for r in reports}
        risky = {s for s in severities.values() if s in (Severity.HIGH, Severity.CRITICAL)}
        self.assertTrue(len(risky) >= 1, "Demo must have at least one HIGH/CRITICAL identity")
        low = {s for s in severities.values() if s == Severity.LOW}
        self.assertTrue(len(low) >= 1, "Demo must have at least one LOW-risk identity (Priya)")


if __name__ == "__main__":
    unittest.main()
