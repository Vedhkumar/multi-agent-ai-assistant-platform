"""Supervisor agent: orchestrates the multi-agent workflow."""

import json
import logging
import time
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.agents.state import AgentState
from app.config import settings

logger = logging.getLogger(__name__)

SUPERVISOR_SYSTEM_PROMPT = """You are the Supervisor agent in a multi-agent AI system. Your role is to:

1. ANALYZE the user's task and create an execution plan
2. DECIDE which specialized agents should handle sub-tasks
3. AGGREGATE results from agents into a final response

Available agents:
- **researcher**: Searches the web for information, provides research reports with sources
- **coder**: Writes and executes Python/JavaScript code, returns code + output
- **reviewer**: Reviews outputs from other agents for quality and accuracy

Rules:
- Create a clear plan with numbered steps
- Assign each step to the most appropriate agent
- You MUST respond with a JSON object containing:
  {
    "plan": ["step 1 description", "step 2 description", ...],
    "agent_sequence": ["researcher", "coder", "reviewer"]  // order of agents to invoke
  }
- Keep plans focused: 2-4 steps maximum
- Always end with the reviewer agent for quality assurance
- If the task is simple enough for one agent, still include a review step
"""

AGGREGATION_PROMPT = """You are the Supervisor agent. All sub-agents have completed their work.

Original task: {task}

Agent outputs:
{agent_outputs}

Create a comprehensive final response that:
1. Synthesizes all agent outputs into a coherent answer
2. Highlights key findings and results
3. Includes any code, data, or sources from the agents
4. Is well-formatted with markdown

Respond with the final answer directly (no JSON wrapper).
"""


def create_plan(state: AgentState) -> AgentState:
    """Supervisor creates an execution plan for the task."""
    logger.info(f"Supervisor creating plan for task: {state['task'][:100]}...")

    start_time = time.time()

    # Deterministic routing based on task analysis
    task_lower = state["task"].lower()

    # Analyze task keywords for routing decisions
    needs_research = any(
        kw in task_lower
        for kw in [
            "research", "find", "search", "what is", "explain", "analyze",
            "compare", "trend", "latest", "news", "information", "learn",
            "tell me about", "how does", "why", "summarize", "overview",
        ]
    )

    needs_code = any(
        kw in task_lower
        for kw in [
            "code", "program", "script", "function", "algorithm", "implement",
            "build", "create a", "write a", "calculate", "compute", "solve",
            "debug", "fix", "python", "javascript", "api", "database",
        ]
    )

    # Build plan based on task analysis
    plan = []
    agent_sequence = []

    if needs_research:
        plan.append(f"Research: Gather information about the topic using web search")
        agent_sequence.append("researcher")

    if needs_code:
        plan.append(f"Code: Write and execute code to accomplish the task")
        agent_sequence.append("coder")

    # If no specific agents needed, default to researcher
    if not agent_sequence:
        plan.append("Research: Gather relevant information to address the task")
        agent_sequence.append("researcher")

    # Always add reviewer at the end
    plan.append("Review: Evaluate all outputs for quality and completeness")
    agent_sequence.append("reviewer")

    latency = int((time.time() - start_time) * 1000)

    metadata = state.get("metadata", {})
    metadata["plan_latency_ms"] = latency
    metadata["agent_sequence"] = agent_sequence

    return {
        **state,
        "plan": plan,
        "status": "planning",
        "current_agent": "supervisor",
        "next_agent": agent_sequence[0] if agent_sequence else "reviewer",
        "iteration_count": 0,
        "metadata": metadata,
        "messages": state["messages"] + [
            AIMessage(
                content=f"Plan created with {len(plan)} steps: {', '.join(agent_sequence)}",
                name="supervisor",
            )
        ],
    }


def aggregate_results(state: AgentState) -> AgentState:
    """Supervisor aggregates results from all agents into a final response."""
    logger.info("Supervisor aggregating results...")

    agent_outputs = state.get("agent_outputs", {})

    # Build a comprehensive final result
    sections = []

    if "researcher" in agent_outputs:
        sections.append(f"## 📚 Research Findings\n\n{agent_outputs['researcher']}")

    if "coder" in agent_outputs:
        sections.append(f"## 💻 Code & Results\n\n{agent_outputs['coder']}")

    if "reviewer" in agent_outputs:
        sections.append(f"## ✅ Quality Review\n\n{agent_outputs['reviewer']}")

    final_result = "\n\n---\n\n".join(sections)

    if not final_result:
        final_result = "Task completed but no agent produced output. Please try again with a more specific request."

    return {
        **state,
        "status": "complete",
        "current_agent": "supervisor",
        "final_result": final_result,
        "messages": state["messages"] + [
            AIMessage(
                content=final_result,
                name="supervisor",
            )
        ],
    }


def route_next_agent(state: AgentState) -> str:
    """Determine the next agent to route to based on the plan."""
    metadata = state.get("metadata", {})
    agent_sequence = metadata.get("agent_sequence", [])
    agent_outputs = state.get("agent_outputs", {})
    iteration_count = state.get("iteration_count", 0)

    # Safety: prevent infinite loops
    if iteration_count >= settings.max_iterations:
        logger.warning(f"Max iterations ({settings.max_iterations}) reached, forcing completion")
        return "aggregate"

    # Find the next agent that hasn't produced output yet
    for agent in agent_sequence:
        if agent not in agent_outputs:
            return agent

    # All agents have completed, aggregate results
    return "aggregate"
