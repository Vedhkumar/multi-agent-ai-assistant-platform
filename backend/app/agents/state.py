"""Agent state definition for LangGraph."""

from typing import Annotated, Any, Literal, TypedDict

from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """Shared state passed between all agents in the graph."""

    # Message history (LangGraph managed)
    messages: Annotated[list, add_messages]

    # The original user task
    task: str

    # Execution plan created by supervisor
    plan: list[str]

    # Which agent is currently executing
    current_agent: str

    # Outputs from each agent
    agent_outputs: dict[str, Any]

    # Loop counter to prevent infinite loops
    iteration_count: int

    # Current workflow status
    status: Literal["planning", "executing", "reviewing", "complete", "error"]

    # Metadata: token counts, latencies, costs, etc.
    metadata: dict[str, Any]

    # The next agent to route to (used by conditional edges)
    next_agent: str

    # Final compiled result
    final_result: str
