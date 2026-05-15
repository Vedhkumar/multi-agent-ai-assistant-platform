"""Tests for agent graph execution."""
import pytest
from app.agents.graph import run_agent_task
from app.agents.state import AgentState
from app.agents.supervisor import create_plan, route_next_agent


def test_create_plan_research_task():
    """Test that supervisor creates a plan with researcher for research tasks."""
    state: AgentState = {
        "messages": [],
        "task": "Research the latest trends in AI",
        "plan": [],
        "current_agent": "",
        "agent_outputs": {},
        "iteration_count": 0,
        "status": "planning",
        "metadata": {},
        "next_agent": "",
        "final_result": "",
    }
    result = create_plan(state)
    assert "researcher" in result["metadata"]["agent_sequence"]
    assert result["status"] == "planning"
    assert len(result["plan"]) >= 2  # At least research + review


def test_create_plan_code_task():
    """Test that supervisor creates a plan with coder for coding tasks."""
    state: AgentState = {
        "messages": [],
        "task": "Write a Python script to calculate fibonacci numbers",
        "plan": [],
        "current_agent": "",
        "agent_outputs": {},
        "iteration_count": 0,
        "status": "planning",
        "metadata": {},
        "next_agent": "",
        "final_result": "",
    }
    result = create_plan(state)
    assert "coder" in result["metadata"]["agent_sequence"]


def test_create_plan_combined_task():
    """Test that supervisor creates a plan with both agents for combined tasks."""
    state: AgentState = {
        "messages": [],
        "task": "Research machine learning algorithms and write code to implement one",
        "plan": [],
        "current_agent": "",
        "agent_outputs": {},
        "iteration_count": 0,
        "status": "planning",
        "metadata": {},
        "next_agent": "",
        "final_result": "",
    }
    result = create_plan(state)
    seq = result["metadata"]["agent_sequence"]
    assert "researcher" in seq
    assert "coder" in seq
    assert "reviewer" in seq


def test_route_next_agent():
    """Test deterministic routing to next incomplete agent."""
    state: AgentState = {
        "messages": [],
        "task": "test",
        "plan": ["step1", "step2"],
        "current_agent": "researcher",
        "agent_outputs": {"researcher": "done"},
        "iteration_count": 1,
        "status": "executing",
        "metadata": {"agent_sequence": ["researcher", "coder", "reviewer"]},
        "next_agent": "",
        "final_result": "",
    }
    result = route_next_agent(state)
    assert result == "coder"


def test_route_to_aggregate_when_all_done():
    """Test routing to aggregate when all agents have completed."""
    state: AgentState = {
        "messages": [],
        "task": "test",
        "plan": ["step1", "step2"],
        "current_agent": "reviewer",
        "agent_outputs": {
            "researcher": "done",
            "coder": "done",
            "reviewer": "done",
        },
        "iteration_count": 3,
        "status": "reviewing",
        "metadata": {"agent_sequence": ["researcher", "coder", "reviewer"]},
        "next_agent": "",
        "final_result": "",
    }
    result = route_next_agent(state)
    assert result == "aggregate"


def test_run_agent_task_completes():
    """Integration test: run a full agent pipeline."""
    result = run_agent_task("What is machine learning?")
    assert result["status"] == "complete"
    assert result["final_result"]  # Should have some output
    assert "researcher" in result["agent_outputs"]
    assert "reviewer" in result["agent_outputs"]
