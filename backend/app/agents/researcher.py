"""Research agent: gathers information using web search tools."""

import logging
import time
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.agents.state import AgentState
from app.tools.web_search import web_search
from app.config import settings

logger = logging.getLogger(__name__)

RESEARCHER_SYSTEM_PROMPT = """You are the Research Agent in a multi-agent AI system. Your role is to:

1. Analyze the task and identify what information needs to be gathered
2. Use the web_search tool to find relevant information
3. Synthesize findings into a structured research report

Your output should be a well-organized research report with:
- Key findings (bullet points)
- Relevant data and statistics
- Source citations with URLs
- A brief summary

Be thorough but concise. Focus on the most relevant and recent information.
"""


def research_node(state: AgentState) -> AgentState:
    """Research agent node: searches for information and creates a report."""
    logger.info("Research agent starting...")
    start_time = time.time()

    task = state["task"]
    iteration_count = state.get("iteration_count", 0) + 1

    try:
        # Use web search tool
        search_results = web_search.invoke({"query": task, "max_results": 5})

        # Check if we have OpenAI key for LLM-powered synthesis
        if settings.openai_api_key and not settings.openai_api_key.startswith("sk-your"):
            try:
                from langchain_openai import ChatOpenAI

                llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    api_key=settings.openai_api_key,
                    temperature=0.3,
                    max_tokens=2000,
                )

                messages = [
                    SystemMessage(content=RESEARCHER_SYSTEM_PROMPT),
                    HumanMessage(
                        content=f"Task: {task}\n\nSearch Results:\n{search_results}\n\n"
                        f"Create a comprehensive research report based on these findings."
                    ),
                ]

                response = llm.invoke(messages)
                research_output = response.content

                # Track token usage
                token_usage = {
                    "researcher": {
                        "prompt_tokens": response.usage_metadata.get("input_tokens", 0) if response.usage_metadata else 0,
                        "completion_tokens": response.usage_metadata.get("output_tokens", 0) if response.usage_metadata else 0,
                        "model": "gpt-4o-mini",
                    }
                }
            except Exception as e:
                logger.error(f"LLM synthesis failed: {e}")
                research_output = _format_research_report(task, search_results)
                token_usage = {}
        else:
            # No API key — format search results directly
            research_output = _format_research_report(task, search_results)
            token_usage = {}

    except Exception as e:
        logger.error(f"Research agent error: {e}")
        research_output = f"Research encountered an error: {str(e)}"
        token_usage = {}

    latency = int((time.time() - start_time) * 1000)

    # Update metadata
    metadata = state.get("metadata", {})
    metadata["researcher_latency_ms"] = latency
    existing_tokens = metadata.get("token_usage", {})
    existing_tokens.update(token_usage)
    metadata["token_usage"] = existing_tokens

    # Update agent outputs
    agent_outputs = state.get("agent_outputs", {})
    agent_outputs["researcher"] = research_output

    return {
        **state,
        "current_agent": "researcher",
        "status": "executing",
        "agent_outputs": agent_outputs,
        "iteration_count": iteration_count,
        "metadata": metadata,
        "messages": state["messages"] + [
            AIMessage(content=research_output, name="researcher")
        ],
    }


def _format_research_report(task: str, search_results: str) -> str:
    """Format search results into a structured research report."""
    return f"""# 📚 Research Report

## Task
{task}

## Key Findings

{search_results}

## Summary
Based on the search results gathered, the above information provides a comprehensive overview of the requested topic. The sources cited offer varying perspectives and data points that should be considered in the final analysis.

## Sources
All URLs are embedded in the search results above. Cross-reference multiple sources for accuracy.
"""
