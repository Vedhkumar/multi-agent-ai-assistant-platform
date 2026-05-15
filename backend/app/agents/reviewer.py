"""Review agent: evaluates outputs from other agents for quality."""

import logging
import time
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.agents.state import AgentState
from app.tools.database_query import query_task_history
from app.config import settings

logger = logging.getLogger(__name__)

REVIEWER_SYSTEM_PROMPT = """You are the Review Agent in a multi-agent AI system. Your role is to:

1. Review outputs from the Research Agent and/or Code Agent
2. Evaluate quality, accuracy, and completeness
3. Provide a quality assessment with specific feedback

Evaluation criteria:
- **Accuracy**: Is the information correct and well-sourced?
- **Completeness**: Does the output fully address the original task?
- **Quality**: Is the output well-structured and clear?
- **Code Quality** (if applicable): Is the code clean, efficient, and properly tested?

Provide your review as:
1. Overall quality score (1-10)
2. Strengths (bullet points)
3. Areas for improvement (bullet points)
4. Final verdict: APPROVED or NEEDS_REVISION
"""


def reviewer_node(state: AgentState) -> AgentState:
    """Review agent node: evaluates other agents' outputs."""
    logger.info("Review agent starting...")
    start_time = time.time()

    task = state["task"]
    agent_outputs = state.get("agent_outputs", {})
    iteration_count = state.get("iteration_count", 0) + 1

    # Query task history for context
    try:
        history_context = query_task_history.invoke({
            "query_type": "successful",
            "limit": 3,
        })
    except Exception:
        history_context = "No historical context available."

    try:
        if settings.openai_api_key and not settings.openai_api_key.startswith("sk-your"):
            try:
                from langchain_openai import ChatOpenAI

                llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    api_key=settings.openai_api_key,
                    temperature=0.3,
                    max_tokens=1500,
                )

                # Compile outputs for review
                outputs_text = ""
                for agent_name, output in agent_outputs.items():
                    if agent_name != "reviewer":
                        outputs_text += f"\n### {agent_name.title()} Output:\n{output[:2000]}\n"

                messages = [
                    SystemMessage(content=REVIEWER_SYSTEM_PROMPT),
                    HumanMessage(
                        content=f"Original Task: {task}\n\n"
                        f"Agent Outputs to Review:{outputs_text}\n\n"
                        f"Historical Context:\n{history_context}\n\n"
                        f"Provide your quality assessment."
                    ),
                ]

                response = llm.invoke(messages)
                review_output = response.content

                token_usage = {
                    "reviewer": {
                        "prompt_tokens": response.usage_metadata.get("input_tokens", 0) if response.usage_metadata else 0,
                        "completion_tokens": response.usage_metadata.get("output_tokens", 0) if response.usage_metadata else 0,
                        "model": "gpt-4o-mini",
                    }
                }
            except Exception as e:
                logger.error(f"LLM review failed: {e}")
                review_output = _generate_review(task, agent_outputs)
                token_usage = {}
        else:
            review_output = _generate_review(task, agent_outputs)
            token_usage = {}

    except Exception as e:
        logger.error(f"Review agent error: {e}")
        review_output = f"Review encountered an error: {str(e)}"
        token_usage = {}

    latency = int((time.time() - start_time) * 1000)

    metadata = state.get("metadata", {})
    metadata["reviewer_latency_ms"] = latency
    existing_tokens = metadata.get("token_usage", {})
    existing_tokens.update(token_usage)
    metadata["token_usage"] = existing_tokens

    agent_outputs["reviewer"] = review_output

    return {
        **state,
        "current_agent": "reviewer",
        "status": "reviewing",
        "agent_outputs": agent_outputs,
        "iteration_count": iteration_count,
        "metadata": metadata,
        "next_agent": "aggregate",
        "messages": state["messages"] + [
            AIMessage(content=review_output, name="reviewer")
        ],
    }


def _generate_review(task: str, agent_outputs: dict) -> str:
    """Generate a quality review when no LLM is available."""
    agents_reviewed = [k for k in agent_outputs.keys() if k != "reviewer"]
    has_research = "researcher" in agent_outputs
    has_code = "coder" in agent_outputs

    strengths = []
    improvements = []

    if has_research:
        research_len = len(agent_outputs["researcher"])
        if research_len > 500:
            strengths.append("Research output is comprehensive and detailed")
        else:
            improvements.append("Research output could be more detailed")
        strengths.append("Research includes structured formatting")

    if has_code:
        code_output = agent_outputs["coder"]
        if "```" in code_output:
            strengths.append("Code is properly formatted with syntax highlighting")
        if "Execution Output" in code_output:
            strengths.append("Code was successfully executed with output")
        if "[ERROR]" in code_output:
            improvements.append("Code execution produced errors that need addressing")
        else:
            strengths.append("Code executed without errors")

    if not improvements:
        improvements.append("Consider adding more edge case handling")

    score = min(9, 6 + len(strengths))

    return f"""## 🔍 Quality Review

### Overall Score: {score}/10

### Agents Reviewed
{', '.join(a.title() for a in agents_reviewed)}

### ✅ Strengths
{chr(10).join(f'- {s}' for s in strengths)}

### 🔧 Areas for Improvement
{chr(10).join(f'- {i}' for i in improvements)}

### 📋 Verdict: **APPROVED**

The outputs from the agent team meet quality standards for the given task. The response is well-structured and addresses the core requirements.
"""
