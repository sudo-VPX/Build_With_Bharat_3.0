"""Global in-memory state for CloudGuard."""
from datetime import date
from backend.config import settings
from backend.demo_data import load_demo_identities
from backend.services.security_engine import SecurityEngine

# In-memory scan state
reports = {}
recommendation_status = {}
current_mode = settings.default_mode
scan_error = None

def load_demo() -> None:
    global reports, recommendation_status, current_mode, scan_error
    engine = SecurityEngine(as_of=date.today())
    identities = [i for i in load_demo_identities() if i.name != "CloudGuard_Scanner"]
    reps = engine.analyze_identities(identities)
    reports = {report.identity.id: report for report in reps}
    recommendation_status = {rec.id: "PENDING_HUMAN_REVIEW" for report in reps for rec in report.recommendations}
    current_mode = "demo"
    scan_error = None

def load_live(profile: str | None, region: str | None) -> None:
    global reports, recommendation_status, current_mode, scan_error
    from backend.services.aws_scanner import collect_identities
    identities = [i for i in collect_identities(profile=profile, region=region) if i.name != "CloudGuard_Scanner"]
    engine = SecurityEngine(as_of=date.today())
    reps = engine.analyze_identities(identities)
    reports = {report.identity.id: report for report in reps}
    recommendation_status = {rec.id: "PENDING_HUMAN_REVIEW" for report in reps for rec in report.recommendations}
    current_mode = "live"
    scan_error = None

# Bootstrap demo data on startup
load_demo()
