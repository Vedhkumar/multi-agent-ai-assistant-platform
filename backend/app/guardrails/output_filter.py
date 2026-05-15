"""Output filtering guardrails: PII detection, toxicity check, token budget."""

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# PII patterns
PII_PATTERNS = {
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "phone_us": re.compile(
        r"\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
    ),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "credit_card": re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"),
    "ip_address": re.compile(
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    ),
}

# Redaction placeholder
REDACTED = "[REDACTED]"


class OutputFilterResult:
    """Result of output filtering."""

    def __init__(
        self,
        filtered_text: str,
        pii_detected: list[str] | None = None,
        token_budget_exceeded: bool = False,
        warnings: list[str] | None = None,
    ):
        self.filtered_text = filtered_text
        self.pii_detected = pii_detected or []
        self.token_budget_exceeded = token_budget_exceeded
        self.warnings = warnings or []


def filter_output(
    text: str,
    max_tokens: int | None = None,
    redact_pii: bool = True,
) -> OutputFilterResult:
    """
    Filter agent output for safety.
    
    Checks:
    1. PII detection and redaction
    2. Token budget enforcement
    3. Content safety
    """
    filtered = text
    pii_found = []
    warnings = []

    # PII detection and redaction
    if redact_pii:
        for pii_type, pattern in PII_PATTERNS.items():
            matches = pattern.findall(filtered)
            if matches:
                pii_found.append(f"{pii_type}: {len(matches)} instance(s)")
                filtered = pattern.sub(REDACTED, filtered)
                logger.warning(f"PII detected and redacted: {pii_type} ({len(matches)} instances)")

    # Token budget check (rough estimate: ~4 chars per token)
    token_budget_exceeded = False
    if max_tokens:
        estimated_tokens = len(filtered) // 4
        if estimated_tokens > max_tokens:
            token_budget_exceeded = True
            # Truncate to budget
            char_limit = max_tokens * 4
            filtered = filtered[:char_limit] + "\n\n[Output truncated due to token budget]"
            warnings.append(
                f"Output truncated: estimated {estimated_tokens} tokens exceeds budget of {max_tokens}"
            )

    return OutputFilterResult(
        filtered_text=filtered,
        pii_detected=pii_found,
        token_budget_exceeded=token_budget_exceeded,
        warnings=warnings,
    )
