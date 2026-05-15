"""LangGraph state machine wiring all agents together."""

import logging
from typing import Any

from langgraph.graph import StateGraph, END

from app.agents.state import AgentState
from app.agents.supervisor import create_plan, aggregate_results, route_next_agent
from app.agents.researcher import research_node
from app.agents.coder import coder_node
from app.agents.reviewer import reviewer_node

logger = logging.getLogger(__name__)


def build_agent_graph() -> StateGraph:
    """Build the LangGraph state machine for multi-agent orchestration."""

    # Create the graph with AgentState
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("planner", create_plan)
    graph.add_node("researcher", research_node)
    graph.add_node("coder", coder_node)
    graph.add_node("reviewer", reviewer_node)
    graph.add_node("aggregate", aggregate_results)

    # Set entry point
    graph.set_entry_point("planner")

    # Add conditional edges from planner
    graph.add_conditional_edges(
        "planner",
        route_next_agent,
        {
            "researcher": "researcher",
            "coder": "coder",
            "reviewer": "reviewer",
            "aggregate": "aggregate",
        },
    )

    # After researcher, route to next agent
    graph.add_conditional_edges(
        "researcher",
        route_next_agent,
        {
            "researcher": "researcher",
            "coder": "coder",
            "reviewer": "reviewer",
            "aggregate": "aggregate",
        },
    )

    # After coder, route to next agent
    graph.add_conditional_edges(
        "coder",
        route_next_agent,
        {
            "researcher": "researcher",
            "coder": "coder",
            "reviewer": "reviewer",
            "aggregate": "aggregate",
        },
    )

    # After reviewer, route to aggregate (always)
    graph.add_conditional_edges(
        "reviewer",
        route_next_agent,
        {
            "researcher": "researcher",
            "coder": "coder",
            "reviewer": "reviewer",
            "aggregate": "aggregate",
        },
    )

    # Aggregate always ends
    graph.add_edge("aggregate", END)

    return graph


def compile_graph():
    """Compile the agent graph into a runnable."""
    graph = build_agent_graph()
    return graph.compile()


def run_agent_task(task: str, callback=None) -> dict[str, Any]:
    """
    Run a task through the multi-agent pipeline.
    
    Args:
        task: The user's task description
        callback: Optional callback function called with (event_type, data) for each step
        
    Returns:
        Final state dictionary with results
    """
    logger.info(f"Running agent task: {task[:100]}...")

    compiled_graph = compile_graph()

    # Initial state
    initial_state: AgentState = {
        "messages": [],
        "task": task,
        "plan": [],
        "current_agent": "supervisor",
        "agent_outputs": {},
        "iteration_count": 0,
        "status": "planning",
        "metadata": {},
        "next_agent": "",
        "final_result": "",
    }

    # Run with step-by-step streaming
    final_state = None

    for step_output in compiled_graph.stream(initial_state):
        for node_name, node_state in step_output.items():
            logger.info(f"Completed node: {node_name}")

            if callback:
                try:
                    callback(
                        "step_update",
                        {
                            "agent_name": node_state.get("current_agent", node_name),
                            "status": node_state.get("status", "executing"),
                            "node": node_name,
                        },
                    )
                except Exception as e:
                    logger.error(f"Callback error: {e}")

            final_state = node_state

    if final_state is None:
        return {
            "status": "error",
            "final_result": "Agent pipeline produced no output",
            "agent_outputs": {},
            "metadata": {},
        }

    return {
        "status": final_state.get("status", "complete"),
        "final_result": final_state.get("final_result", ""),
        "agent_outputs": final_state.get("agent_outputs", {}),
        "metadata": final_state.get("metadata", {}),
        "plan": final_state.get("plan", []),
    }
