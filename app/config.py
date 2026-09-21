"""Environment-backed runtime settings for CloudGuard.

Credentials are deliberately not read from environment variables here.  Boto3
uses the standard AWS credential chain and a named AWS CLI profile instead.
"""

from __future__ import annotations

from dataclasses import dataclass
import os


def _positive_int(value: str | None, default: int) -> int:
    try:
        parsed = int(value or default)
    except (TypeError, ValueError):
        return default
    return parsed if parsed > 0 else default


@dataclass(frozen=True, slots=True)
class Settings:
    """Runtime options that are safe to expose in local configuration."""

    aws_profile: str = "CloudGuard"
    aws_region: str = "eu-north-1"
    lookback_days: int = 90
    default_mode: str = "demo"

    @classmethod
    def from_environment(cls) -> "Settings":
        mode = os.getenv("CLOUDGUARD_DEFAULT_MODE", "demo").strip().lower()
        return cls(
            aws_profile=os.getenv("CLOUDGUARD_AWS_PROFILE", "CloudGuard").strip()
            or "CloudGuard",
            aws_region=os.getenv("CLOUDGUARD_AWS_REGION", "eu-north-1").strip()
            or "eu-north-1",
            lookback_days=_positive_int(os.getenv("CLOUDGUARD_LOOKBACK_DAYS"), 90),
            default_mode=mode if mode in {"demo", "live"} else "demo",
        )


settings = Settings.from_environment()
