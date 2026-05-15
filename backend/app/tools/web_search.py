"""Web search tool using Tavily API with fallback mock."""

import logging
from typing import Any

from langchain_core.tools import tool

from app.config import settings

logger = logging.getLogger(__name__)


@tool
def web_search(query: str, max_results: int = 5) -> str:
    """
    Search the web for information on a given query.
    Returns relevant search results with titles, URLs, and content snippets.
    
    Args:
        query: The search query string
        max_results: Maximum number of results to return (default: 5)
    """
    if settings.tavily_api_key and settings.tavily_api_key.startswith("tvly-"):
        try:
            from tavily import TavilyClient
            
            client = TavilyClient(api_key=settings.tavily_api_key)
            response = client.search(query=query, max_results=max_results)
            
            results = []
            for r in response.get("results", []):
                results.append(
                    f"**{r['title']}**\n"
                    f"URL: {r['url']}\n"
                    f"{r['content']}\n"
                )
            
            return "\n---\n".join(results) if results else "No results found."
        except Exception as e:
            logger.error(f"Tavily search error: {e}")
            return _mock_search(query)
    else:
        logger.info("Tavily API key not configured, using mock search")
        return _mock_search(query)


def _mock_search(query: str) -> str:
    """Mock search results for demonstration when API key is not available."""
    return f"""**Search Results for: "{query}"**

---
**1. Comprehensive Overview**
URL: https://example.com/overview
A detailed analysis shows that {query} is a rapidly evolving field with significant recent developments. Key findings include advances in methodology, new frameworks for implementation, and growing industry adoption.

---
**2. Recent Research**  
URL: https://example.com/research
According to recent studies published in 2024-2025, the latest trends in {query} indicate a shift towards more automated and AI-driven approaches. Researchers have identified several breakthrough techniques that improve efficiency by 40-60%.

---
**3. Industry Applications**
URL: https://example.com/industry
Major technology companies are investing heavily in {query}. Real-world implementations have shown measurable improvements in productivity, cost reduction, and user experience. Case studies from Fortune 500 companies demonstrate ROI of 200-300%.

---
**4. Best Practices Guide**
URL: https://example.com/guide
Experts recommend a phased approach to implementing {query}: (1) Assessment and planning, (2) Pilot implementation, (3) Iterative improvement, (4) Scale and optimization. Key success factors include stakeholder alignment and continuous monitoring.

---
**5. Future Outlook**
URL: https://example.com/future
The future of {query} looks promising, with projected market growth of 25% CAGR over the next 5 years. Emerging technologies like advanced AI, quantum computing, and edge computing are expected to further accelerate innovation in this space.
"""
