"""Database query tool for the Review agent."""

import logging
from typing import Any

from langchain_core.tools import tool

logger = logging.getLogger(__name__)


@tool
def query_task_history(query_type: str = "recent", limit: int = 5) -> str:
    """
    Query the task database for context. Useful for the Review agent
    to check previous task outcomes and patterns.
    
    Args:
        query_type: Type of query - 'recent', 'successful', 'failed'
        limit: Maximum number of results
    """
    # In production, this would query PostgreSQL directly
    # For now, provides structured context about task history
    
    if query_type == "recent":
        return (
            "Recent task history:\n"
            "1. Task: 'AI Trends Analysis' - Status: complete - Tokens: 3,200 - Duration: 12s\n"
            "2. Task: 'Code Review Helper' - Status: complete - Tokens: 2,800 - Duration: 8s\n"
            "3. Task: 'Market Research' - Status: complete - Tokens: 4,100 - Duration: 15s\n"
            f"Showing {min(limit, 3)} of 3 total tasks."
        )
    elif query_type == "successful":
        return (
            "Successful task patterns:\n"
            "- Research tasks: avg 3,500 tokens, 12s duration, 95% success rate\n"
            "- Code tasks: avg 2,500 tokens, 8s duration, 90% success rate\n"
            "- Combined tasks: avg 5,000 tokens, 18s duration, 85% success rate\n"
            "Key success factors: clear task description, specific requirements"
        )
    elif query_type == "failed":
        return (
            "Failed task analysis:\n"
            "- Common failure: ambiguous task descriptions (40%)\n"
            "- Common failure: token budget exceeded (30%)\n"
            "- Common failure: tool execution errors (20%)\n"
            "- Common failure: timeout (10%)\n"
            "Recommendation: Ensure tasks are specific and well-scoped"
        )
    else:
        return f"Unknown query type: {query_type}. Use 'recent', 'successful', or 'failed'."
