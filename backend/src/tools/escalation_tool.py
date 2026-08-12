"""Day 7 Human Escalation Tool logic, sanitization, and helper functions."""

import logging
import re

logger = logging.getLogger("agent.escalation")

# Sensitive data patterns to sanitize
SENSITIVE_PATTERNS = [
    (r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", "[CARD_NUMBER_REDACTED]"),
    (r"\b(?:cvv|cvc|security code)\s*[:=]?\s*\d{3,4}\b", "[CVV_REDACTED]"),
    (
        r"\b(?:otp|password|pin|cvv|secret|token)\b(?:\s+(?:is|code|number|val|key))?\s*[:=]?\s*\S+",
        "[SECRET_REDACTED]",
    ),
    (r"\b\d{4,6}\b(?=\s*(?:otp|pin|passcode))", "[OTP_REDACTED]"),
    (r"\b[A-Za-z0-9+/]{32,}={0,2}\b", "[TOKEN_REDACTED]"),
]


def sanitize_sensitive_text(text: str | None) -> str:
    """Strip sensitive financial and authentication credentials from text."""
    if not text:
        return ""

    clean_text = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        clean_text = re.sub(pattern, replacement, clean_text, flags=re.IGNORECASE)

    return clean_text.strip()


def determine_urgency(
    issue_type: str, issue_summary: str, current_urgency: str | None = None
) -> str:
    """
    Intelligently determine urgency level: LOW, MEDIUM, HIGH.
    Never returns 'EMERGENCY'.
    - HIGH: Payment deducted but order not confirmed/created, duplicate payment deduction.
    - MEDIUM: Wrong product received, damaged item, missing item, refund pending.
    - LOW: General order dispute, minor info inquiry.
    """
    if current_urgency and current_urgency.upper() in {"LOW", "MEDIUM", "HIGH"}:
        urgency_upper = current_urgency.upper()
        # Enforce rule: Payment deducted without confirmation is HIGH
        summary_lower = (issue_summary or "").lower()
        if "deduct" in summary_lower and (
            "not confirm" in summary_lower
            or "pending" in summary_lower
            or "failed" in summary_lower
        ):
            return "HIGH"
        return urgency_upper

    summary_lower = (issue_summary or "").lower()
    issue_type_upper = (issue_type or "").upper()

    if (
        "deduct" in summary_lower
        or "debited" in summary_lower
        or "charged twice" in summary_lower
        or "duplicate payment" in summary_lower
    ):
        return "HIGH"
    elif issue_type_upper == "PAYMENT_REFUND":
        return (
            "HIGH"
            if ("deducted" in summary_lower or "not confirmed" in summary_lower)
            else "MEDIUM"
        )
    elif issue_type_upper == "ORDER_DISPUTE":
        if (
            "damaged" in summary_lower
            or "missing" in summary_lower
            or "wrong" in summary_lower
        ):
            return "MEDIUM"
        return "LOW"

    return "MEDIUM"
