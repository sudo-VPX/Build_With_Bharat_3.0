"""Unit tests for CloudGuard's credential-free security engine."""

from __future__ import annotations

import unittest
from datetime import date

from app.demo_data import load_demo_identities
from app.models import Identity, IdentityType, PermissionGrant, Severity
from app.services.security_engine import SecurityEngine, analyze_identity


class SecurityEngineTests(unittest.TestCase):
    """Exercise the explainable offline analysis contract."""

    AS_OF = date(2026, 9, 21)

    def test_unused_high_impact_action_is_flagged_for_human_review(self) -> None:
        identity = Identity(
            id="user-1",
            name="Deployment User",
            identity_type=IdentityType.USER,
            grants=(PermissionGrant("iam:PassRole"), PermissionGrant("s3:GetObject")),
            used_actions=("s3:GetObject",),
            last_activity="2026-09-20",
            mfa_enabled=True,
        )

        report = analyze_identity(identity, as_of=self.AS_OF)
        findings = [
            finding
            for finding in report.findings
            if finding.category == "UNUSED_HIGH_IMPACT_ACTION"
        ]

        self.assertEqual(1, len(findings))
        self.assertEqual(("iam:passrole",), findings[0].actions)
        self.assertEqual(Severity.HIGH, findings[0].severity)
        self.assertGreaterEqual(report.risk_score, 45)
        self.assertTrue(report.recommendations[0].review_only)
        self.assertTrue(report.recommendations[0].human_approval_required)
        self.assertIn("human approval is required", report.recommendations[0].rationale.lower())

    def test_administrator_wildcard_is_critical(self) -> None:
        identity = Identity(
            id="role-1",
            name="Legacy Automation",
            identity_type=IdentityType.ROLE,
            grants=("*",),
            used_actions=("s3:ListBucket",),
            last_activity="2026-09-20",
        )

        report = analyze_identity(identity, as_of=self.AS_OF)
        wildcard = [
            finding
            for finding in report.findings
            if finding.category == "ADMINISTRATOR_WILDCARD"
        ]

        self.assertEqual(1, len(wildcard))
        self.assertEqual(Severity.CRITICAL, wildcard[0].severity)
        self.assertEqual(Severity.CRITICAL, report.severity)
        self.assertGreaterEqual(report.risk_score, 70)

    def test_used_exact_action_is_not_called_unused(self) -> None:
        identity = Identity(
            id="user-2",
            name="Read Only User",
            identity_type="user",
            grants=("s3:GetObject", "s3:PutObject"),
            used_actions=("S3:GetObject",),
            last_activity="2026-09-20",
            mfa_enabled=True,
        )

        report = analyze_identity(identity, as_of=self.AS_OF)
        unused_actions = {
            action
            for finding in report.findings
            if finding.category.startswith("UNUSED_")
            for action in finding.actions
        }

        self.assertNotIn("s3:getobject", unused_actions)
        self.assertIn("s3:putobject", unused_actions)

    def test_score_is_bounded_and_severity_is_stable_for_same_inputs(self) -> None:
        identity = Identity(
            id="user-3",
            name="Risk Sample",
            identity_type="user",
            grants=("iam:PassRole", "ec2:Describe*"),
            used_actions=(),
            last_activity="2026-01-01",
            mfa_enabled=False,
        )

        first = SecurityEngine(as_of=self.AS_OF).analyze_identity(identity)
        second = SecurityEngine(as_of=self.AS_OF).analyze_identity(identity)

        self.assertEqual(first.risk_score, second.risk_score)
        self.assertEqual(first.severity, second.severity)
        self.assertGreaterEqual(first.risk_score, 0)
        self.assertLessEqual(first.risk_score, 100)
        self.assertIn(first.severity, set(Severity))

    def test_demo_fixture_has_risky_and_healthy_examples(self) -> None:
        identities = load_demo_identities()
        reports = SecurityEngine(as_of=self.AS_OF).analyze_identities(identities)
        by_id = {report.identity.id: report for report in reports}

        self.assertGreaterEqual(len(identities), 3)
        self.assertTrue(
            any(
                finding.category == "UNUSED_HIGH_IMPACT_ACTION"
                for report in reports
                for finding in report.findings
            )
        )
        self.assertTrue(
            any(
                finding.category == "ADMINISTRATOR_WILDCARD"
                for report in reports
                for finding in report.findings
            )
        )
        healthy = by_id["usr-priya-analyst"]
        self.assertEqual(0, healthy.risk_score)
        self.assertEqual(Severity.LOW, healthy.severity)
        self.assertEqual([], healthy.to_dict()["findings"])
        self.assertIn("summary", healthy.to_dict())


if __name__ == "__main__":
    unittest.main()
