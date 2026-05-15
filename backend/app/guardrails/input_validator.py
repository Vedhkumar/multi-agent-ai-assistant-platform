"""Input validation guardrails: prompt injection detection and content filtering."""

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Patterns that may indicate prompt injection attempts
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"ignore\s+(all\s+)?above\s+instructions",
    r"disregard\s+(all\s+)?previous",
    r"you\s+are\s+now\s+a",
    r"pretend\s+you\s+are",
    r"act\s+as\s+if\s+you\s+are",
    r"forget\s+everything",
    r"system\s*:\s*",
    r"<\s*system\s*>",
    r"\[INST\]",
    r"\[\/INST\]",
    r"<<SYS>>",
    r"<\|im_start\|>",
    r"ADMIN\s*OVERRIDE",
    r"jailbreak",
    r"DAN\s+mode",
]

# Compile patterns for performance
COMPILED_PATTERNS = [
    re.compile(pattern, re.IGNORECASE) for pattern in INJECTION_PATTERNS
]


class InputValidationResult:
    """Result of input validation."""

    def __init__(self, is_valid: bool, reason: str | None = None):
        self.is_valid = is_valid
        self.reason = reason


def validate_input(text: str) -> InputValidationResult:
    """
    Validate user input for safety.
    
    Checks:
    1. Length limits
    2. Prompt injection patterns
    3. Excessive special characters
    """
    # Check length
    if len(text) < 1:
        return InputValidationResult(False, "Input cannot be empty")

    if len(text) > 10000:
        return InputValidationResult(
            False, "Input exceeds maximum length of 10,000 characters"
        )

    # Check for prompt injection patterns
    for pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            logger.warning(f"Prompt injection detected: {pattern.pattern}")
            return InputValidationResult(
                False,
                "Input contains potentially unsafe content. Please rephrase your request.",
            )

    # Check for excessive special characters (potential encoding attacks)
    special_ratio = sum(1 for c in text if not c.isalnum() and not c.isspace()) / max(
        len(text), 1
    )
    if special_ratio > 0.5:
        return InputValidationResult(
            False,
            "Input contains too many special characters. Please use plain text.",
        )

    return InputValidationResult(True)
