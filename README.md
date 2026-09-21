# CloudGuard

CloudGuard is an AWS-first permission-drift security MVP. It compares what an
identity is allowed to do with what CloudTrail shows it has actually done,
prioritises risky excess access, and gives an administrator a reviewable
least-privilege recommendation.

It deliberately **does not change AWS permissions automatically**. Every
recommendation remains a human-reviewed, dry-run action.

## What works now

- Demo mode starts with realistic IAM users and roles, so the full dashboard
  works without AWS credentials or cloud costs.
- Live mode reads AWS IAM and CloudTrail through a named AWS CLI profile. It
  uses read-only API calls only and reports incomplete data as warnings.
- The security engine identifies unused grants, wildcard/excessive grants and
  stale inactivity signals, then assigns deterministic LOW, MEDIUM, HIGH or
  CRITICAL risk scores.
- The browser dashboard shows the account summary, permission drift findings,
  recommendation queue, and approve/reject controls. Approval creates a
  remediation *plan*, never an AWS mutation.

## Quick start

CloudGuard is intentionally simple to run; no project virtual environment is
required.

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`. It opens in safe demo mode by default.

To run the test suite:

```powershell
python -m unittest discover -s tests -v
```

## Live AWS scan

1. Authenticate the AWS CLI with a least-privilege, read-only profile. The
   default profile name is `CloudGuard`; no access key belongs in this repo.
2. Copy `.env.example` to `.env` only if you need a different profile, region,
   or lookback window. Environment settings can also be set in your shell.
3. In the dashboard choose **Run live scan**, or call `POST /api/scans` with
   `{ "mode": "live" }`.

The current collector reads IAM identities, managed/inline policy action
statements where AWS authorises the read, permission-boundary metadata, and
CloudTrail lookup events. AWS policy evaluation also involves SCPs, resource
policies, conditions, and session policies; CloudGuard marks its results as
recommendations rather than claiming to calculate final effective access.

Suggested permissions for the scanning identity are AWS-managed read/audit
policies such as `SecurityAudit` plus CloudTrail read access. Never use the
root account or `AdministratorAccess` to run CloudGuard.

## API

| Route | Purpose |
| --- | --- |
| `GET /health` | Service and current scan state |
| `GET /api/summary` | Counts and risk overview |
| `GET /api/identities` | Users and roles observed in the scan |
| `GET /api/findings` | Permission-drift findings |
| `GET /api/recommendations` | Human-review recommendation queue |
| `POST /api/scans` | Run `demo` or a read-only `live` scan |
| `POST /api/recommendations/{id}/review` | Mark a recommendation approved or rejected |
| `GET /api/recommendations/{id}/remediation-plan` | View a dry-run remediation plan |

## Architecture

```text
AWS IAM + CloudTrail (read-only)
              |
              v
        Collector / normaliser
              |
              v
 Permission drift + risk engine
              |
              v
 Reviewable recommendation queue
              |
              v
 Admin approval/rejection (no automatic mutation)
```

## Project layout

```text
app/
  api.py                    FastAPI routes and review workflow
  config.py                 safe environment configuration
  demo_data.py              offline demo account
  models.py                 serialisable security domain models
  services/
    aws_scanner.py          read-only Boto3 collector
    security_engine.py      drift, risk and recommendation logic
  static/                   minimal dashboard (HTML/CSS/JavaScript)
  main.py                   application entry point
tests/                      standard-library unit tests
```

## MVP boundary and next steps

This repository is the AWS-first implementation of the CloudGuard concept.
Azure/GCP connectors, persistent storage, organisation-wide aggregation,
scheduled scans, and an explicitly authorised remediation executor are future
extensions. A real deployment should add authentication/authorisation, a
database, encrypted audit trails, rate limiting, telemetry, and an independent
security review before handling production environments.
